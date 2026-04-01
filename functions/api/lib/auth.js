const SESSION_COOKIE = "jit_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

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

function buildCookieAttributes(maxAgeSeconds) {
  return [
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ].join("; ");
}

export async function createSessionCookie(secret) {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = encodeBase64Url(JSON.stringify({ expiresAt }));
  const signature = await createSignature(payload, secret);
  const token = `${payload}.${signature}`;
  return `${SESSION_COOKIE}=${token}; ${buildCookieAttributes(SESSION_MAX_AGE_SECONDS)}`;
}

function getCookieValue(request, name) {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const cookies = cookieHeader.split(";").map((entry) => entry.trim());
  const prefix = `${name}=`;
  const match = cookies.find((cookie) => cookie.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
}

export async function isAuthenticated(request, secret) {
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

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; ${buildCookieAttributes(0)}`;
}
