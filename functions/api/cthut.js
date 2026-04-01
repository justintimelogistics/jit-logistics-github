import { isAuthenticated } from "./lib/auth.js";

const CT_HUT_RATE_TABLE = [
  { min: 26000, max: 28000, rate: 0.025 },
  { min: 28001, max: 30000, rate: 0.0279 },
  { min: 30001, max: 32000, rate: 0.0308 },
  { min: 32001, max: 34000, rate: 0.0337 },
  { min: 34001, max: 36000, rate: 0.0365 },
  { min: 36001, max: 38000, rate: 0.0394 },
  { min: 38001, max: 40000, rate: 0.0423 },
  { min: 40001, max: 42000, rate: 0.0452 },
  { min: 42001, max: 44000, rate: 0.0481 },
  { min: 44001, max: 46000, rate: 0.051 },
  { min: 46001, max: 48000, rate: 0.0538 },
  { min: 48001, max: 50000, rate: 0.0567 },
  { min: 50001, max: 52000, rate: 0.0596 },
  { min: 52001, max: 54000, rate: 0.0625 },
  { min: 54001, max: 56000, rate: 0.0654 },
  { min: 56001, max: 58000, rate: 0.0683 },
  { min: 58001, max: 60000, rate: 0.0712 },
  { min: 60001, max: 62000, rate: 0.074 },
  { min: 62001, max: 64000, rate: 0.0769 },
  { min: 64001, max: 66000, rate: 0.0798 },
  { min: 66001, max: 68000, rate: 0.0827 },
  { min: 68001, max: 70000, rate: 0.0856 },
  { min: 70001, max: 72000, rate: 0.0885 },
  { min: 72001, max: 74000, rate: 0.0913 },
  { min: 74001, max: 76000, rate: 0.0942 },
  { min: 76001, max: 78000, rate: 0.0971 },
  { min: 78001, max: 80000, rate: 0.1 },
  { min: 80001, max: Number.POSITIVE_INFINITY, rate: 0.175 },
];

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...init.headers,
    },
    status: init.status ?? 200,
  });
}

async function requireAuth(request, env) {
  if (!env.AUTH_SECRET) {
    return json(
      { error: "Missing AUTH_SECRET. Add it in your Cloudflare Pages environment variables." },
      { status: 500 },
    );
  }

  const authenticated = await isAuthenticated(request, env.AUTH_SECRET);
  return authenticated ? null : json({ error: "Authentication required." }, { status: 401 });
}

function getRate(weight, isBobtail) {
  if (isBobtail) return 0;
  const match = CT_HUT_RATE_TABLE.find((entry) => weight >= entry.min && weight <= entry.max);
  return match ? match.rate : 0;
}

async function listEntries(env) {
  const result = await env.DB.prepare(`
    SELECT id, created_at, mileage, weight, is_bobtail, previous_mileage, miles_since_last, rate, charge
    FROM ct_hut_entries
    ORDER BY created_at DESC, id DESC
  `).all();

  return (result.results ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    mileage: row.mileage,
    weight: row.weight,
    isBobtail: Boolean(row.is_bobtail),
    previousMileage: row.previous_mileage,
    milesSinceLast: row.miles_since_last,
    rate: row.rate,
    charge: row.charge,
  }));
}

async function normalizeEntries(env) {
  const result = await env.DB.prepare(`
    SELECT id, mileage, weight, is_bobtail
    FROM ct_hut_entries
    ORDER BY mileage ASC, created_at ASC
  `).all();

  const rows = result.results ?? [];
  let previousMileage = null;

  for (const row of rows) {
    const mileage = Number(row.mileage);
    const isBobtail = Boolean(row.is_bobtail);
    const weight = row.weight == null ? null : Number(row.weight);
    const milesSinceLast = previousMileage == null ? 0 : mileage - previousMileage;
    const rate = getRate(weight, isBobtail);
    const charge = isBobtail ? 0 : milesSinceLast * rate;

    await env.DB.prepare(`
      UPDATE ct_hut_entries
      SET previous_mileage = ?2, miles_since_last = ?3, rate = ?4, charge = ?5
      WHERE id = ?1
    `).bind(row.id, previousMileage, milesSinceLast, rate, charge).run();

    previousMileage = mileage;
  }
}

export async function onRequestGet(context) {
  const authError = await requireAuth(context.request, context.env);
  if (authError) return authError;

  if (!context.env.DB) {
    return json({ error: "Missing DB binding. Connect your D1 database in Pages." }, { status: 500 });
  }

  const entries = await listEntries(context.env);
  return json({ entries });
}

export async function onRequestPost(context) {
  const authError = await requireAuth(context.request, context.env);
  if (authError) return authError;

  if (!context.env.DB) {
    return json({ error: "Missing DB binding. Connect your D1 database in Pages." }, { status: 500 });
  }

  let body;

  try {
    body = await context.request.json();
  } catch (error) {
    return json({ error: "Invalid request body." }, { status: 400 });
  }

  const mileage = Number(body?.mileage);
  const isBobtail = Boolean(body?.isBobtail);
  const weight = body?.weight == null ? null : Number(body.weight);

  if (!Number.isFinite(mileage) || mileage <= 0) {
    return json({ error: "Current mileage must be a valid number." }, { status: 400 });
  }

  if (!isBobtail && (!Number.isFinite(weight) || weight < 26000)) {
    return json({ error: "Enter a taxable CT Hut weight of at least 26,000 or use Bobtail." }, { status: 400 });
  }

  const previousEntry = await context.env.DB.prepare(`
    SELECT mileage
    FROM ct_hut_entries
    ORDER BY mileage DESC, created_at DESC
    LIMIT 1
  `).first();

  if (previousEntry && mileage <= Number(previousEntry.mileage)) {
    return json({ error: "Current mileage must be higher than the last CT Hut reading." }, { status: 400 });
  }

  const createdAt = new Date().toISOString();

  await context.env.DB.prepare(`
    INSERT INTO ct_hut_entries (created_at, mileage, weight, is_bobtail, previous_mileage, miles_since_last, rate, charge)
    VALUES (?1, ?2, ?3, ?4, NULL, 0, 0, 0)
  `)
    .bind(createdAt, mileage, weight, isBobtail ? 1 : 0)
    .run();

  await normalizeEntries(context.env);
  const entries = await listEntries(context.env);
  return json({ entries }, { status: 201 });
}

export async function onRequestPut(context) {
  const authError = await requireAuth(context.request, context.env);
  if (authError) return authError;

  if (!context.env.DB) {
    return json({ error: "Missing DB binding. Connect your D1 database in Pages." }, { status: 500 });
  }

  let body;

  try {
    body = await context.request.json();
  } catch (error) {
    return json({ error: "Invalid request body." }, { status: 400 });
  }

  const id = Number(body?.id);
  const mileage = Number(body?.mileage);
  const isBobtail = Boolean(body?.isBobtail);
  const weight = body?.weight == null ? null : Number(body.weight);

  if (!Number.isFinite(id) || !Number.isFinite(mileage) || mileage <= 0) {
    return json({ error: "CT Hut id and mileage are required." }, { status: 400 });
  }

  if (!isBobtail && (!Number.isFinite(weight) || weight < 26000)) {
    return json({ error: "Enter a taxable CT Hut weight of at least 26,000 or use Bobtail." }, { status: 400 });
  }

  const otherEntriesResult = await context.env.DB.prepare(`
    SELECT id, mileage, created_at
    FROM ct_hut_entries
    WHERE id != ?1
    ORDER BY mileage ASC, created_at ASC
  `).bind(id).all();

  const ordered = [...(otherEntriesResult.results ?? []), { id, mileage, created_at: new Date().toISOString() }]
    .sort((a, b) => Number(a.mileage) - Number(b.mileage) || new Date(a.created_at) - new Date(b.created_at));

  for (let index = 1; index < ordered.length; index += 1) {
    if (Number(ordered[index].mileage) <= Number(ordered[index - 1].mileage)) {
      return json({ error: "CT Hut mileage must stay in ascending order after an edit." }, { status: 400 });
    }
  }

  await context.env.DB.prepare(`
    UPDATE ct_hut_entries
    SET mileage = ?2, weight = ?3, is_bobtail = ?4
    WHERE id = ?1
  `)
    .bind(id, mileage, weight, isBobtail ? 1 : 0)
    .run();

  await normalizeEntries(context.env);
  const entries = await listEntries(context.env);
  return json({ entries });
}

export async function onRequestDelete(context) {
  const authError = await requireAuth(context.request, context.env);
  if (authError) return authError;

  if (!context.env.DB) {
    return json({ error: "Missing DB binding. Connect your D1 database in Pages." }, { status: 500 });
  }

  let body;

  try {
    body = await context.request.json();
  } catch (error) {
    return json({ error: "Invalid request body." }, { status: 400 });
  }

  const id = Number(body?.id);
  if (!Number.isFinite(id)) {
    return json({ error: "CT Hut id is required." }, { status: 400 });
  }

  await context.env.DB.prepare(`DELETE FROM ct_hut_entries WHERE id = ?1`).bind(id).run();
  await normalizeEntries(context.env);
  const entries = await listEntries(context.env);
  return json({ entries });
}
