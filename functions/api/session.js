import { clearSessionCookie, createSessionCookie, isAuthenticated } from "./lib/auth.js";

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...init.headers,
    },
    status: init.status ?? 200,
  });
}

export async function onRequestGet(context) {
  const authenticated = await isAuthenticated(context.request, context.env.AUTH_SECRET);
  return json({ authenticated });
}

export async function onRequestPost(context) {
  if (!context.env.APP_PASSWORD || !context.env.AUTH_SECRET) {
    return json(
      { error: "Missing APP_PASSWORD or AUTH_SECRET. Add both as Pages environment variables." },
      { status: 500 },
    );
  }

  let body;

  try {
    body = await context.request.json();
  } catch (error) {
    return json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body?.password !== context.env.APP_PASSWORD) {
    return json({ error: "Incorrect password." }, { status: 401 });
  }

  return json(
    { authenticated: true },
    {
      headers: {
        "Set-Cookie": await createSessionCookie(context.env.AUTH_SECRET),
      },
    },
  );
}

export async function onRequestDelete() {
  return json(
    { authenticated: false },
    {
      headers: {
        "Set-Cookie": clearSessionCookie(),
      },
    },
  );
}
