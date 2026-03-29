import { isAuthenticated } from "./_lib/auth.js";

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

async function listEntries(env) {
  const result = await env.DB.prepare(`
    SELECT id, created_at, action, truck_id, destination
    FROM time_clock_entries
    ORDER BY created_at DESC, id DESC
  `).all();

  return (result.results ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    action: row.action,
    truckId: row.truck_id,
    destination: row.destination,
  }));
}

async function getLatestEntry(env) {
  return env.DB.prepare(`
    SELECT id, action, truck_id, destination, created_at
    FROM time_clock_entries
    ORDER BY created_at DESC, id DESC
    LIMIT 1
  `).first();
}

export async function onRequestGet(context) {
  const authError = await requireAuth(context.request, context.env);

  if (authError) {
    return authError;
  }

  if (!context.env.DB) {
    return json({ error: "Missing DB binding. Connect your D1 database in Pages." }, { status: 500 });
  }

  const entries = await listEntries(context.env);
  return json({ entries });
}

export async function onRequestPost(context) {
  const authError = await requireAuth(context.request, context.env);

  if (authError) {
    return authError;
  }

  if (!context.env.DB) {
    return json({ error: "Missing DB binding. Connect your D1 database in Pages." }, { status: 500 });
  }

  let body;

  try {
    body = await context.request.json();
  } catch (error) {
    return json({ error: "Invalid request body." }, { status: 400 });
  }

  const action = String(body?.action ?? "").toUpperCase();
  const truckId = String(body?.truckId ?? "").trim();
  const destination = String(body?.destination ?? "").trim();

  if (action !== "IN" && action !== "OUT") {
    return json({ error: "Action must be IN or OUT." }, { status: 400 });
  }

  if (!truckId || !destination) {
    return json({ error: "Truck ID and destination are required." }, { status: 400 });
  }

  const latestEntry = await getLatestEntry(context.env);

  if (action === "IN" && latestEntry && latestEntry.action === "IN") {
    return json({ error: "There is already an active shift. Punch out first." }, { status: 400 });
  }

  if (action === "OUT" && (!latestEntry || latestEntry.action !== "IN")) {
    return json({ error: "Nobody is currently punched in." }, { status: 400 });
  }

  const createdAt = new Date().toISOString();

  await context.env.DB.prepare(`
    INSERT INTO time_clock_entries (created_at, action, truck_id, destination)
    VALUES (?1, ?2, ?3, ?4)
  `)
    .bind(createdAt, action, truckId, destination)
    .run();

  const entries = await listEntries(context.env);
  return json({ entries }, { status: 201 });
}
