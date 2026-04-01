const MS_PER_HOUR = 1000 * 60 * 60;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addDays(date, days) {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function addMonths(date, months) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function hoursBetween(startIso, endIso) {
  return Math.max(0, (new Date(endIso).getTime() - new Date(startIso).getTime()) / MS_PER_HOUR);
}

function formatHours(hours) {
  return `${hours.toFixed(2)} hrs`;
}

function weekdayName(dateIso) {
  return new Date(dateIso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function summarizeEntries(entries, rangeEndIso) {
  const ordered = [...entries].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const sessions = [];
  let openIn = null;

  for (const entry of ordered) {
    if (entry.action === "IN") {
      openIn = entry;
      continue;
    }

    if (entry.action === "OUT" && openIn) {
      sessions.push({
        start: openIn.created_at,
        end: entry.created_at,
        destination: openIn.destination || entry.destination || "",
      });
      openIn = null;
    }
  }

  if (openIn) {
    sessions.push({
      start: openIn.created_at,
      end: rangeEndIso,
      destination: openIn.destination || "",
    });
  }

  const daily = new Map();
  let totalHours = 0;

  for (const session of sessions) {
    const hours = hoursBetween(session.start, session.end);
    totalHours += hours;
    const dayKey = formatDateOnly(new Date(session.start));
    const current = daily.get(dayKey) ?? { date: dayKey, hours: 0, destinations: new Set(), sessions: [] };
    current.hours += hours;
    if (session.destination) {
      current.destinations.add(session.destination);
    }
    current.sessions.push(session);
    daily.set(dayKey, current);
  }

  const dailyRows = [...daily.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((row) => ({
      date: row.date,
      hours: row.hours,
      destinations: [...row.destinations],
      sessions: row.sessions,
    }));

  return { sessions, dailyRows, totalHours };
}

async function getTimeClockEntries(env, startIso, endIso) {
  const previousResult = await env.DB.prepare(`
    SELECT id, created_at, action, destination
    FROM time_clock_entries
    WHERE created_at < ?1
    ORDER BY created_at DESC, id DESC
    LIMIT 1
  `)
    .bind(startIso)
    .all();

  const result = await env.DB.prepare(`
    SELECT id, created_at, action, destination
    FROM time_clock_entries
    WHERE created_at >= ?1
      AND created_at < ?2
    ORDER BY created_at ASC, id ASC
  `)
    .bind(startIso, endIso)
    .all();

  const previous = (previousResult.results ?? []).reverse();
  return [...previous, ...(result.results ?? [])];
}

async function getWeeklyReportRecord(env, periodStart) {
  const result = await env.DB.prepare(`
    SELECT id
    FROM report_runs
    WHERE report_type = 'weekly_timeclock'
      AND period_start = ?1
    LIMIT 1
  `)
    .bind(periodStart)
    .first();

  return result ?? null;
}

async function getMonthlyReportRecord(env, periodStart) {
  const result = await env.DB.prepare(`
    SELECT id
    FROM report_runs
    WHERE report_type = 'monthly_timeclock'
      AND period_start = ?1
    LIMIT 1
  `)
    .bind(periodStart)
    .first();

  return result ?? null;
}

async function saveReportRecord(env, reportType, periodStart, periodEnd, status, details = "") {
  await env.DB.prepare(`
    INSERT INTO report_runs (created_at, report_type, period_start, period_end, status, details)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6)
  `)
    .bind(new Date().toISOString(), reportType, periodStart, periodEnd, status, details)
    .run();
}

async function getZohoAccessToken(env) {
  const tokenResponse = await fetch("https://accounts.zoho.com/oauth/v2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      refresh_token: env.ZOHO_REFRESH_TOKEN,
      client_id: env.ZOHO_CLIENT_ID,
      client_secret: env.ZOHO_CLIENT_SECRET,
      grant_type: "refresh_token",
    }).toString(),
  });

  if (!tokenResponse.ok) {
    const details = await tokenResponse.text();
    throw new Error(`Zoho token request failed: ${details}`);
  }

  const tokenPayload = await tokenResponse.json();
  if (!tokenPayload.access_token) {
    throw new Error("Zoho token response did not include an access token.");
  }

  return tokenPayload.access_token;
}

async function sendZohoEmail(env, subject, htmlContent) {
  const accessToken = await getZohoAccessToken(env);
  const response = await fetch(`https://mail.zoho.com/api/accounts/${env.ZOHO_MAIL_ACCOUNT_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fromAddress: env.ZOHO_MAIL_FROM_ADDRESS,
      toAddress: env.REPORT_EMAIL_TO,
      subject,
      content: htmlContent,
      mailFormat: "html",
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Zoho send failed: ${details}`);
  }
}

function renderWeeklyHtml(periodStartIso, periodEndIso, summary) {
  const sessionLines = summary.sessions.map((session) => {
    const start = new Date(session.start).toLocaleString("en-US", { timeZone: "America/New_York" });
    const end = new Date(session.end).toLocaleString("en-US", { timeZone: "America/New_York" });
    return `<tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;">${start}</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">${end}</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">${session.destination || "-"}</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">${formatHours(hoursBetween(session.start, session.end))}</td>
    </tr>`;
  }).join("");

  const dailyLines = summary.dailyRows.map((row) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;">${weekdayName(row.date)}</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">${row.destinations.join(", ") || "-"}</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">${formatHours(row.hours)}</td>
    </tr>
  `).join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#111;">
      <h2>7-Day Time Clock Detail</h2>
      <p><strong>Period:</strong> ${periodStartIso} through ${periodEndIso}</p>
      <p><strong>Total Hours:</strong> ${formatHours(summary.totalHours)}</p>
      <h3>Daily Totals</h3>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="padding:8px;text-align:left;border-bottom:2px solid #333;">Day</th>
            <th style="padding:8px;text-align:left;border-bottom:2px solid #333;">Destinations</th>
            <th style="padding:8px;text-align:right;border-bottom:2px solid #333;">Hours</th>
          </tr>
        </thead>
        <tbody>${dailyLines || '<tr><td colspan="3" style="padding:8px;">No punches found.</td></tr>'}</tbody>
      </table>
      <h3 style="margin-top:24px;">Punch Detail</h3>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="padding:8px;text-align:left;border-bottom:2px solid #333;">Punch In</th>
            <th style="padding:8px;text-align:left;border-bottom:2px solid #333;">Punch Out</th>
            <th style="padding:8px;text-align:left;border-bottom:2px solid #333;">Destination</th>
            <th style="padding:8px;text-align:right;border-bottom:2px solid #333;">Hours</th>
          </tr>
        </thead>
        <tbody>${sessionLines || '<tr><td colspan="4" style="padding:8px;">No punches found.</td></tr>'}</tbody>
      </table>
    </div>
  `;
}

function renderMonthlyHtml(periodStartIso, periodEndIso, summary) {
  const weeklyBuckets = new Map();

  for (const row of summary.dailyRows) {
    const date = new Date(`${row.date}T00:00:00.000Z`);
    const weekStart = startOfUtcDay(addDays(date, -date.getUTCDay() || -7));
    const key = formatDateOnly(weekStart);
    const current = weeklyBuckets.get(key) ?? 0;
    weeklyBuckets.set(key, current + row.hours);
  }

  const weeklyLines = [...weeklyBuckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([weekStart, hours]) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #ddd;">Week of ${weekStart}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">${formatHours(hours)}</td>
      </tr>
    `).join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#111;">
      <h2>Monthly Time Clock Summary</h2>
      <p><strong>Period:</strong> ${periodStartIso} through ${periodEndIso}</p>
      <p><strong>Total Hours Worked:</strong> ${formatHours(summary.totalHours)}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <thead>
          <tr>
            <th style="padding:8px;text-align:left;border-bottom:2px solid #333;">Week</th>
            <th style="padding:8px;text-align:right;border-bottom:2px solid #333;">Hours</th>
          </tr>
        </thead>
        <tbody>${weeklyLines || '<tr><td colspan="2" style="padding:8px;">No punches found.</td></tr>'}</tbody>
      </table>
    </div>
  `;
}

function validateEnv(env) {
  const required = [
    "DB",
    "ZOHO_MAIL_ACCOUNT_ID",
    "ZOHO_MAIL_FROM_ADDRESS",
    "ZOHO_CLIENT_ID",
    "ZOHO_CLIENT_SECRET",
    "ZOHO_REFRESH_TOKEN",
    "REPORT_EMAIL_TO",
  ];

  const missing = required.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(`Missing required worker bindings or vars: ${missing.join(", ")}`);
  }
}

async function sendWeeklyReport(env, now) {
  const todayStart = startOfUtcDay(now);
  const periodEnd = todayStart;
  const periodStart = addDays(periodEnd, -7);
  const periodStartIso = formatDateOnly(periodStart);
  const periodEndIso = formatDateOnly(addDays(periodEnd, -1));

  if (await getWeeklyReportRecord(env, periodStartIso)) {
    return { skipped: true, reason: "Weekly report already sent." };
  }

  const entries = await getTimeClockEntries(env, periodStart.toISOString(), periodEnd.toISOString());
  const summary = summarizeEntries(entries, periodEnd.toISOString());
  const subject = `Just In Time Logistics 7-Day Time Clock Detail (${periodStartIso} to ${periodEndIso})`;
  const html = renderWeeklyHtml(periodStartIso, periodEndIso, summary);

  await sendZohoEmail(env, subject, html);
  await saveReportRecord(env, "weekly_timeclock", periodStartIso, periodEndIso, "sent");

  return { skipped: false, periodStartIso, periodEndIso };
}

async function sendMonthlyReport(env, now) {
  const currentMonthStart = startOfUtcMonth(now);
  const periodStart = addMonths(currentMonthStart, -1);
  const periodEnd = currentMonthStart;
  const periodStartIso = formatDateOnly(periodStart);
  const periodEndIso = formatDateOnly(addDays(periodEnd, -1));

  if (await getMonthlyReportRecord(env, periodStartIso)) {
    return { skipped: true, reason: "Monthly report already sent." };
  }

  const entries = await getTimeClockEntries(env, periodStart.toISOString(), periodEnd.toISOString());
  const summary = summarizeEntries(entries, periodEnd.toISOString());
  const subject = `Just In Time Logistics Monthly Time Clock Summary (${periodStartIso} to ${periodEndIso})`;
  const html = renderMonthlyHtml(periodStartIso, periodEndIso, summary);

  await sendZohoEmail(env, subject, html);
  await saveReportRecord(env, "monthly_timeclock", periodStartIso, periodEndIso, "sent");

  return { skipped: false, periodStartIso, periodEndIso };
}

async function runScheduledReports(env, now = new Date(), forceKind = "") {
  validateEnv(env);

  const results = {};

  if (forceKind === "weekly" || forceKind === "all" || now.getUTCDay() === 1) {
    results.weekly = await sendWeeklyReport(env, now);
  }

  if (forceKind === "monthly" || forceKind === "all" || now.getUTCDate() === 1) {
    results.monthly = await sendMonthlyReport(env, now);
  }

  return results;
}

export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(runScheduledReports(env));
  },

  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }

    if (url.pathname === "/run-now" && request.method === "POST") {
      try {
        const kind = url.searchParams.get("kind") ?? "";
        const results = await runScheduledReports(env, new Date(), kind);
        return new Response(JSON.stringify({ ok: true, results }), {
          headers: { "Content-Type": "application/json; charset=utf-8" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ ok: false, error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        });
      }
    }

    return new Response("Not found", { status: 404 });
  },
};
