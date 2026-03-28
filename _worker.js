const SESSION_COOKIE = "jit_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...init.headers,
    },
    status: init.status ?? 200,
  });
}

function encodeBase64Url(value) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

async function createSignature(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  const signatureBytes = Array.from(new Uint8Array(signatureBuffer));
  const signatureText = String.fromCharCode(...signatureBytes);
  return encodeBase64Url(signatureText);
}

async function createSessionCookie(secret) {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = encodeBase64Url(JSON.stringify({ expiresAt }));
  const signature = await createSignature(payload, secret);
  const token = `${payload}.${signature}`;
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function getCookieValue(request, name) {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const cookies = cookieHeader.split(";").map((entry) => entry.trim());
  const prefix = `${name}=`;
  const match = cookies.find((cookie) => cookie.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
}

async function isAuthenticated(request, secret) {
  const token = getCookieValue(request, SESSION_COOKIE);

  if (!token) {
    return false;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return false;
  }

  const expectedSignature = await createSignature(payload, secret);

  if (signature !== expectedSignature) {
    return false;
  }

  try {
    const session = JSON.parse(decodeBase64Url(payload));
    return typeof session.expiresAt === "number" && session.expiresAt > Date.now();
  } catch (error) {
    return false;
  }
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

async function handleSession(request, env) {
  if (request.method === "GET") {
    const authenticated = await isAuthenticated(request, env.AUTH_SECRET);
    return json({ authenticated });
  }

  if (request.method === "DELETE") {
    return json(
      { authenticated: false },
      {
        headers: {
          "Set-Cookie": clearSessionCookie(),
        },
      },
    );
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, { status: 405 });
  }

  if (!env.APP_PASSWORD || !env.AUTH_SECRET) {
    return json(
      { error: "Missing APP_PASSWORD or AUTH_SECRET. Add both as Pages environment variables." },
      { status: 500 },
    );
  }

  let body;

  try {
    body = await request.json();
  } catch (error) {
    return json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body?.password !== env.APP_PASSWORD) {
    return json({ error: "Incorrect password." }, { status: 401 });
  }

  return json(
    { authenticated: true },
    {
      headers: {
        "Set-Cookie": await createSessionCookie(env.AUTH_SECRET),
      },
    },
  );
}

async function handleFuel(request, env) {
  const authError = await requireAuth(request, env);

  if (authError) {
    return authError;
  }

  if (!env.DB) {
    return json({ error: "Missing DB binding. Connect your D1 database in Pages." }, { status: 500 });
  }

  if (request.method === "GET") {
    return json({ entries: await listEntries(env) });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, { status: 405 });
  }

  let body;

  try {
    body = await request.json();
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

  const latestEntry = await env.DB.prepare(`
    SELECT odometer
    FROM fuel_entries
    ORDER BY odometer DESC, created_at DESC
    LIMIT 1
  `).first();

  if (latestEntry && odometer <= Number(latestEntry.odometer)) {
    return json({ error: "Current mile must be higher than the last logged odometer." }, { status: 400 });
  }

  const createdAt = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO fuel_entries (created_at, odometer, gallons, price_per_gallon, total_cost, mpg)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6)
  `)
    .bind(createdAt, odometer, gallons, pricePerGallon, totalCost, mpg)
    .run();

  return json({ entries: await listEntries(env) }, { status: 201 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/session") {
      return handleSession(request, env);
    }

    if (url.pathname === "/api/fuel") {
      return handleFuel(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
