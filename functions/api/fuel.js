import { isAuthenticated } from "./lib/auth.js";

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
    SELECT id, created_at, odometer, gallons, price_per_gallon, total_cost, mpg
    FROM fuel_entries
    ORDER BY odometer DESC, created_at DESC
  `).all();

  return (result.results ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    odometer: row.odometer,
    gallons: row.gallons,
    pricePerGallon: row.price_per_gallon,
    totalCost: row.total_cost,
    mpg: row.mpg,
  }));
}

async function normalizeEntries(env) {
  const result = await env.DB.prepare(`
    SELECT id, created_at, odometer, gallons, price_per_gallon
    FROM fuel_entries
    ORDER BY odometer ASC, created_at ASC
  `).all();

  const rows = result.results ?? [];
  let previousOdometer = null;

  for (const row of rows) {
    const odometer = Number(row.odometer);
    const gallons = Number(row.gallons);
    const pricePerGallon = Number(row.price_per_gallon);
    const totalCost = gallons * pricePerGallon;
    const mpg = previousOdometer == null || gallons <= 0 || odometer <= previousOdometer ? null : (odometer - previousOdometer) / gallons;

    await env.DB.prepare(`
      UPDATE fuel_entries
      SET total_cost = ?2, mpg = ?3
      WHERE id = ?1
    `).bind(row.id, totalCost, mpg).run();

    previousOdometer = odometer;
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

  const odometer = Number(body?.odometer);
  const gallons = Number(body?.gallons);
  const pricePerGallon = Number(body?.pricePerGallon);

  if (!Number.isFinite(odometer) || !Number.isFinite(gallons) || !Number.isFinite(pricePerGallon)) {
    return json({ error: "Odometer, gallons, and fuel price are required numbers." }, { status: 400 });
  }

  const latestEntry = await context.env.DB.prepare(`
    SELECT odometer
    FROM fuel_entries
    ORDER BY odometer DESC, created_at DESC
    LIMIT 1
  `).first();

  if (latestEntry && odometer <= Number(latestEntry.odometer)) {
    return json({ error: "Current mile must be higher than the last logged odometer." }, { status: 400 });
  }

  const createdAt = new Date().toISOString();

  await context.env.DB.prepare(`
    INSERT INTO fuel_entries (created_at, odometer, gallons, price_per_gallon, total_cost, mpg)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6)
  `)
    .bind(createdAt, odometer, gallons, pricePerGallon, gallons * pricePerGallon, null)
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
  const odometer = Number(body?.odometer);
  const gallons = Number(body?.gallons);
  const pricePerGallon = Number(body?.pricePerGallon);

  if (!Number.isFinite(id) || !Number.isFinite(odometer) || !Number.isFinite(gallons) || !Number.isFinite(pricePerGallon)) {
    return json({ error: "Fuel id, odometer, gallons, and fuel price are required numbers." }, { status: 400 });
  }

  const existing = await context.env.DB.prepare(`SELECT id FROM fuel_entries WHERE id = ?1`).bind(id).first();
  if (!existing) {
    return json({ error: "Fuel entry not found." }, { status: 404 });
  }

  const otherEntriesResult = await context.env.DB.prepare(`
    SELECT id, odometer, created_at
    FROM fuel_entries
    WHERE id != ?1
    ORDER BY odometer ASC, created_at ASC
  `).bind(id).all();

  const ordered = [...(otherEntriesResult.results ?? []), { id, odometer, created_at: new Date().toISOString() }]
    .sort((a, b) => Number(a.odometer) - Number(b.odometer) || new Date(a.created_at) - new Date(b.created_at));

  for (let index = 1; index < ordered.length; index += 1) {
    if (Number(ordered[index].odometer) <= Number(ordered[index - 1].odometer)) {
      return json({ error: "Fuel odometers must stay in ascending order after an edit." }, { status: 400 });
    }
  }

  await context.env.DB.prepare(`
    UPDATE fuel_entries
    SET odometer = ?2, gallons = ?3, price_per_gallon = ?4, total_cost = ?5, mpg = NULL
    WHERE id = ?1
  `)
    .bind(id, odometer, gallons, pricePerGallon, gallons * pricePerGallon)
    .run();

  await normalizeEntries(context.env);
  const entries = await listEntries(context.env);
  return json({ entries });
}
