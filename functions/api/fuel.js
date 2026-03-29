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

  const odometer = Number(body?.odometer);
  const gallons = Number(body?.gallons);
  const pricePerGallon = Number(body?.pricePerGallon);
  const totalCost = Number(body?.totalCost);
  const mpg = body?.mpg == null ? null : Number(body.mpg);

  if (!Number.isFinite(odometer) || !Number.isFinite(gallons) || !Number.isFinite(pricePerGallon) || !Number.isFinite(totalCost)) {
    return json({ error: "Odometer, gallons, fuel price, and total cost are required numbers." }, { status: 400 });
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
    .bind(createdAt, odometer, gallons, pricePerGallon, totalCost, mpg)
    .run();

  const entries = await listEntries(context.env);
  return json({ entries }, { status: 201 });
}
