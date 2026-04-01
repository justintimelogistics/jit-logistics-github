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
    SELECT id, created_at, invoice_date, customer, amount, reference
    FROM revenue_entries
    ORDER BY invoice_date DESC, id DESC
  `).all();

  return (result.results ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    invoiceDate: row.invoice_date,
    customer: row.customer,
    amount: row.amount,
    reference: row.reference,
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

  const invoiceDate = String(body?.invoiceDate ?? "").trim();
  const customer = String(body?.customer ?? "").trim();
  const amount = Number(body?.amount);
  const reference = body?.reference ? String(body.reference).trim() : "";

  if (!invoiceDate) {
    return json({ error: "Invoice date is required." }, { status: 400 });
  }

  if (!customer) {
    return json({ error: "Customer is required." }, { status: 400 });
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return json({ error: "Invoice amount must be greater than zero." }, { status: 400 });
  }

  const createdAt = new Date().toISOString();

  await context.env.DB.prepare(`
    INSERT INTO revenue_entries (created_at, invoice_date, customer, amount, reference)
    VALUES (?1, ?2, ?3, ?4, ?5)
  `)
    .bind(createdAt, invoiceDate, customer, amount, reference)
    .run();

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
  const invoiceDate = String(body?.invoiceDate ?? "").trim();
  const customer = String(body?.customer ?? "").trim();
  const amount = Number(body?.amount);
  const reference = body?.reference ? String(body.reference).trim() : "";

  if (!Number.isFinite(id)) {
    return json({ error: "Revenue id is required." }, { status: 400 });
  }

  if (!invoiceDate) {
    return json({ error: "Invoice date is required." }, { status: 400 });
  }

  if (!customer) {
    return json({ error: "Customer is required." }, { status: 400 });
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return json({ error: "Invoice amount must be greater than zero." }, { status: 400 });
  }

  await context.env.DB.prepare(`
    UPDATE revenue_entries
    SET invoice_date = ?2, customer = ?3, amount = ?4, reference = ?5
    WHERE id = ?1
  `)
    .bind(id, invoiceDate, customer, amount, reference)
    .run();

  const entries = await listEntries(context.env);
  return json({ entries });
}
