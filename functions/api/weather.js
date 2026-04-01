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

function getConditionLabel(code) {
  const mapping = new Map([
    [0, "Clear"],
    [1, "Mostly clear"],
    [2, "Partly cloudy"],
    [3, "Overcast"],
    [45, "Fog"],
    [48, "Fog"],
    [51, "Light drizzle"],
    [53, "Drizzle"],
    [55, "Heavy drizzle"],
    [56, "Freezing drizzle"],
    [57, "Heavy freezing drizzle"],
    [61, "Light rain"],
    [63, "Rain"],
    [65, "Heavy rain"],
    [66, "Freezing rain"],
    [67, "Heavy freezing rain"],
    [71, "Light snow"],
    [73, "Snow"],
    [75, "Heavy snow"],
    [77, "Snow grains"],
    [80, "Rain showers"],
    [81, "Heavy showers"],
    [82, "Violent showers"],
    [85, "Snow showers"],
    [86, "Heavy snow showers"],
    [95, "Thunderstorm"],
    [96, "Thunderstorm and hail"],
    [99, "Severe thunderstorm and hail"],
  ]);

  return mapping.get(Number(code)) ?? "Current conditions";
}

export async function onRequestGet(context) {
  const authError = await requireAuth(context.request, context.env);
  if (authError) return authError;

  const url = new URL(context.request.url);
  const latitude = Number(url.searchParams.get("lat"));
  const longitude = Number(url.searchParams.get("lon"));

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return json({ error: "Latitude and longitude are required." }, { status: 400 });
  }

  const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
  weatherUrl.searchParams.set("latitude", String(latitude));
  weatherUrl.searchParams.set("longitude", String(longitude));
  weatherUrl.searchParams.set("current", "temperature_2m,apparent_temperature,weather_code,wind_speed_10m");
  weatherUrl.searchParams.set("daily", "temperature_2m_max,temperature_2m_min");
  weatherUrl.searchParams.set("temperature_unit", "fahrenheit");
  weatherUrl.searchParams.set("wind_speed_unit", "mph");
  weatherUrl.searchParams.set("timezone", "auto");

  const response = await fetch(weatherUrl.toString(), {
    headers: {
      "User-Agent": "Just-In-Time-Logistics-Dashboard",
    },
  });

  if (!response.ok) {
    return json({ error: "Unable to load weather right now." }, { status: 502 });
  }

  const payload = await response.json();
  const current = payload.current ?? {};
  const daily = payload.daily ?? {};

  return json({
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature,
    windSpeed: current.wind_speed_10m,
    weatherCode: current.weather_code,
    condition: getConditionLabel(current.weather_code),
    high: Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max[0] : null,
    low: Array.isArray(daily.temperature_2m_min) ? daily.temperature_2m_min[0] : null,
  });
}
