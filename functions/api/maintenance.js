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
    SELECT id, created_at, service_date, odometer, service_type, cost, next_due_mileage, next_due_date, notes
    FROM maintenance_entries
    ORDER BY service_date DESC, odometer DESC, id DESC
  `).all();

  return (result.results ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    serviceDate: row.service_date,
    odometer: row.odometer,
    serviceType: row.service_type,
    cost: row.cost,
    nextDueMileage: row.next_due_mileage,
    nextDueDate: row.next_due_date,
    notes: row.notes,
  }));
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

  const serviceDate = String(body?.serviceDate ?? "").trim();
  const odometer = Number(body?.odometer);
  const serviceType = String(body?.serviceType ?? "").trim();
  const cost = Number(body?.cost);
  const nextDueMileage = body?.nextDueMileage == null || body.nextDueMileage === "" ? null : Number(body.nextDueMileage);
  const nextDueDate = body?.nextDueDate ? String(body.nextDueDate).trim() : null;
  const notes = body?.notes ? String(body.notes).trim() : "";

  if (!serviceDate) {
    return json({ error: "Service date is required." }, { status: 400 });
  }

  if (!Number.isFinite(odometer) || odometer <= 0) {
    return json({ error: "Odometer must be a valid number." }, { status: 400 });
  }

  if (!serviceType) {
    return json({ error: "Service type is required." }, { status: 400 });
  }

  if (!Number.isFinite(cost) || cost < 0) {
    return json({ error: "Cost must be zero or higher." }, { status: 400 });
  }

  if (nextDueMileage != null && (!Number.isFinite(nextDueMileage) || nextDueMileage <= odometer)) {
    return json({ error: "Next due mileage must be higher than the service odometer." }, { status: 400 });
  }

  const createdAt = new Date().toISOString();

  await context.env.DB.prepare(`
    INSERT INTO maintenance_entries (
      created_at,
      service_date,
      odometer,
      service_type,
      cost,
      next_due_mileage,
      next_due_date,
      notes
    )
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
  `)
    .bind(createdAt, serviceDate, odometer, serviceType, cost, nextDueMileage, nextDueDate, notes)
    .run();

  const entries = await listEntries(context.env);
  return json({ entries }, { status: 201 });
}
