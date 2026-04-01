import { isAuthenticated } from "./lib/auth.js";

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

function normalizeServer(server) {
  if (!server) return "";
  const value = String(server).trim();
  return value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;
}

async function geotabCall(baseUrl, method, params) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/apiv1`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      method,
      params,
      id: 1,
      jsonrpc: "2.0",
    }),
  });

  const payload = await response.json();

  if (!response.ok || payload?.error) {
    throw new Error(payload?.error?.message || `Geotab ${method} request failed.`);
  }

  return payload?.result;
}

async function authenticate(env) {
  const baseUrl = normalizeServer(env.GEOTAB_SERVER);
  const result = await geotabCall(baseUrl, "Authenticate", {
    database: env.GEOTAB_DATABASE,
    userName: env.GEOTAB_USERNAME,
    password: env.GEOTAB_PASSWORD,
  });

  return {
    baseUrl: result?.path && result.path !== "ThisServer" ? normalizeServer(result.path) : baseUrl,
    credentials: result?.credentials ?? {
      database: env.GEOTAB_DATABASE,
      userName: env.GEOTAB_USERNAME,
      sessionId: result?.sessionId,
    },
  };
}

async function getLatestDeviceStatus(baseUrl, credentials, deviceId, diagnosticId) {
  const search = {
    deviceSearch: {
      id: deviceId,
    },
  };

  if (diagnosticId) {
    search.diagnostics = [{ id: diagnosticId }];
  }

  const result = await geotabCall(baseUrl, "Get", {
    typeName: "DeviceStatusInfo",
    search,
    credentials,
  });

  return Array.isArray(result) ? result[0] ?? null : null;
}

function getOdometerMiles(deviceStatus) {
  const statusData = Array.isArray(deviceStatus?.statusData) ? deviceStatus.statusData[0] : null;
  const meters = Number(statusData?.data ?? statusData?.value);

  if (!Number.isFinite(meters)) {
    return null;
  }

  return meters * 0.000621371;
}

export async function onRequestGet(context) {
  const authError = await requireAuth(context.request, context.env);
  if (authError) return authError;

  const requiredVars = [
    "GEOTAB_SERVER",
    "GEOTAB_DATABASE",
    "GEOTAB_USERNAME",
    "GEOTAB_PASSWORD",
    "GEOTAB_DEVICE_ID",
  ];

  const missing = requiredVars.filter((key) => !context.env[key]);

  if (missing.length > 0) {
    return json(
      { error: `Missing Geotab setup: ${missing.join(", ")}. Add them as Pages environment variables.` },
      { status: 503 },
    );
  }

  try {
    const { baseUrl, credentials } = await authenticate(context.env);
    const deviceStatus = await getLatestDeviceStatus(
      baseUrl,
      credentials,
      context.env.GEOTAB_DEVICE_ID,
      context.env.GEOTAB_ODOMETER_DIAGNOSTIC_ID,
    );

    return json({
      latitude: deviceStatus?.latitude ?? null,
      longitude: deviceStatus?.longitude ?? null,
      dateTime: deviceStatus?.dateTime ?? null,
      odometerMiles: getOdometerMiles(deviceStatus),
    });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Unable to pull data from Geotab right now." },
      { status: 502 },
    );
  }
}
