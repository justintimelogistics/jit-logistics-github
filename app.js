const STORAGE_KEY = "jit-logistics-fuel-log";
const TIME_CLOCK_STORAGE_KEY = "jit-logistics-time-clock-log";
const CT_HUT_STORAGE_KEY = "jit-logistics-ct-hut-log";
const MAINTENANCE_STORAGE_KEY = "jit-logistics-maintenance-log";
const REVENUE_STORAGE_KEY = "jit-logistics-revenue-log";
const API_BASE = "/api";
const LOCAL_PROTOCOLS = new Set(["file:"]);
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const CT_HUT_RATE_TABLE = [
  { min: 26000, max: 28000, rate: 0.025 },
  { min: 28001, max: 30000, rate: 0.0279 },
  { min: 30001, max: 32000, rate: 0.0308 },
  { min: 32001, max: 34000, rate: 0.0337 },
  { min: 34001, max: 36000, rate: 0.0365 },
  { min: 36001, max: 38000, rate: 0.0394 },
  { min: 38001, max: 40000, rate: 0.0423 },
  { min: 40001, max: 42000, rate: 0.0452 },
  { min: 42001, max: 44000, rate: 0.0481 },
  { min: 44001, max: 46000, rate: 0.051 },
  { min: 46001, max: 48000, rate: 0.0538 },
  { min: 48001, max: 50000, rate: 0.0567 },
  { min: 50001, max: 52000, rate: 0.0596 },
  { min: 52001, max: 54000, rate: 0.0625 },
  { min: 54001, max: 56000, rate: 0.0654 },
  { min: 56001, max: 58000, rate: 0.0683 },
  { min: 58001, max: 60000, rate: 0.0712 },
  { min: 60001, max: 62000, rate: 0.074 },
  { min: 62001, max: 64000, rate: 0.0769 },
  { min: 64001, max: 66000, rate: 0.0798 },
  { min: 66001, max: 68000, rate: 0.0827 },
  { min: 68001, max: 70000, rate: 0.0856 },
  { min: 70001, max: 72000, rate: 0.0885 },
  { min: 72001, max: 74000, rate: 0.0913 },
  { min: 74001, max: 76000, rate: 0.0942 },
  { min: 76001, max: 78000, rate: 0.0971 },
  { min: 78001, max: 80000, rate: 0.1 },
  { min: 80001, max: Number.POSITIVE_INFINITY, rate: 0.175 },
];

const navButtons = Array.from(document.querySelectorAll("[data-view]"));
const pages = Array.from(document.querySelectorAll("[data-page]"));
const managementTabs = Array.from(document.querySelectorAll("[data-management-view]"));
const managementPages = Array.from(document.querySelectorAll("[data-management-page]"));
const weeklyModeButtons = Array.from(document.querySelectorAll("[data-weekly-mode]"));

const dashboardAddFuelButton = document.getElementById("dashboardAddFuelButton");
const managementAddFuelButton = document.getElementById("managementAddFuelButton");
const ctHutButton = document.getElementById("ctHutButton");
const customerInvoiceButton = document.getElementById("customerInvoiceButton");
const managementRevenueButton = document.getElementById("managementRevenueButton");
const managementCtHutButton = document.getElementById("managementCtHutButton");
const downloadCtHutButton = document.getElementById("downloadCtHutButton");
const reportRangeSelect = document.getElementById("reportRangeSelect");
const reportCenterNote = document.getElementById("reportCenterNote");
const downloadFuelReportButton = document.getElementById("downloadFuelReportButton");
const downloadTimeClockReportButton = document.getElementById("downloadTimeClockReportButton");
const downloadCtHutReportCenterButton = document.getElementById("downloadCtHutReportCenterButton");
const reportFuelMeta = document.getElementById("reportFuelMeta");
const reportTimeClockMeta = document.getElementById("reportTimeClockMeta");
const reportCtHutMeta = document.getElementById("reportCtHutMeta");
const closeFuelModalButton = document.getElementById("closeFuelModal");
const cancelFuelModalButton = document.getElementById("cancelFuelModal");
const fuelModal = document.getElementById("fuelModal");
const fuelForm = document.getElementById("fuelForm");
const fuelDateInput = document.getElementById("fuelDate");
const currentMileInput = document.getElementById("currentMile");
const fuelGeotabNote = document.getElementById("fuelGeotabNote");
const formNote = document.getElementById("formNote");
const fuelTableBody = document.getElementById("fuelTableBody");
const deleteFuelEntryButton = document.getElementById("deleteFuelEntryButton");

const dutyGaugeButton = document.getElementById("dutyGaugeButton");
const dutyModal = document.getElementById("dutyModal");
const dutyForm = document.getElementById("dutyForm");
const dutyModalTitle = document.getElementById("dutyModalTitle");
const closeDutyModalButton = document.getElementById("closeDutyModal");
const cancelDutyModalButton = document.getElementById("cancelDutyModal");
const dutySubmitButton = document.getElementById("dutySubmitButton");
const dutyNote = document.getElementById("dutyNote");
const dutyWarningGate = document.getElementById("dutyWarningGate");
const dutyWarningText = document.getElementById("dutyWarningText");
const dutyAcknowledgeButton = document.getElementById("dutyAcknowledgeButton");
const dutyCancelGateButton = document.getElementById("dutyCancelGateButton");
const punchInFields = document.getElementById("punchInFields");
const punchOutFields = document.getElementById("punchOutFields");
const destinationInput = document.getElementById("destination");
const managementPunchOutButton = document.getElementById("managementPunchOutButton");
const timeClockTableBody = document.getElementById("timeClockTableBody");
const timeClockNote = document.getElementById("timeClockNote");
const timeClockStatusValue = document.getElementById("timeClockStatusValue");
const timeClockLastInValue = document.getElementById("timeClockLastInValue");
const timeClockTodayHoursValue = document.getElementById("timeClockTodayHoursValue");

const ctHutModal = document.getElementById("ctHutModal");
const ctHutForm = document.getElementById("ctHutForm");
const ctHutMileageInput = document.getElementById("ctHutMileage");
const ctHutWeightInput = document.getElementById("ctHutWeight");
const ctHutGeotabNote = document.getElementById("ctHutGeotabNote");
const ctHutNote = document.getElementById("ctHutNote");
const closeCtHutModalButton = document.getElementById("closeCtHutModal");
const cancelCtHutModalButton = document.getElementById("cancelCtHutModal");
const bobtailToggleButton = document.getElementById("bobtailToggle");
const ctHutTableBody = document.getElementById("ctHutTableBody");
const ctHutReportNote = document.getElementById("ctHutReportNote");
const ctHutMiles = document.getElementById("ctHutMiles");
const ctHutAmount = document.getElementById("ctHutAmount");
const ctHutBobtailMiles = document.getElementById("ctHutBobtailMiles");
const ctHutRangeSelect = document.getElementById("ctHutRangeSelect");
const deleteCtHutEntryButton = document.getElementById("deleteCtHutEntryButton");

const warningBar = document.getElementById("warningBar");
const warningText = document.getElementById("warningText");
const overviewMpgCard = document.getElementById("overviewMpgCard");
const overviewMpgValue = document.getElementById("overviewMpgValue");
const overviewMpgMeta = document.getElementById("overviewMpgMeta");
const overviewFuelPriceCard = document.getElementById("overviewFuelPriceCard");
const overviewFuelPriceValue = document.getElementById("overviewFuelPriceValue");
const overviewFuelPriceMeta = document.getElementById("overviewFuelPriceMeta");
const overviewPmCard = document.getElementById("overviewPmCard");
const overviewPmValue = document.getElementById("overviewPmValue");
const overviewPmMeta = document.getElementById("overviewPmMeta");
const overviewCostMonthCard = document.getElementById("overviewCostMonthCard");
const overviewCostMonthValue = document.getElementById("overviewCostMonthValue");
const overviewCostMonthMeta = document.getElementById("overviewCostMonthMeta");
const overviewCostRollingCard = document.getElementById("overviewCostRollingCard");
const overviewCostRollingValue = document.getElementById("overviewCostRollingValue");
const overviewCostRollingMeta = document.getElementById("overviewCostRollingMeta");
const overviewRevenueCard = document.getElementById("overviewRevenueCard");
const overviewRevenueValue = document.getElementById("overviewRevenueValue");
const overviewRevenueMeta = document.getElementById("overviewRevenueMeta");
const driverStatusTitle = document.getElementById("driverStatusTitle");
const driverStatusCopy = document.getElementById("driverStatusCopy");
const driverStatusNote = document.getElementById("driverStatusNote");

const dutyGauge = document.getElementById("dutyGauge");
const dutyGaugeValue = document.getElementById("dutyGaugeValue");
const dutyGaugeMeta = document.getElementById("dutyGaugeMeta");
const breakGaugeButton = document.getElementById("breakGaugeButton");
const breakGauge = document.getElementById("breakGauge");
const breakGaugeValue = document.getElementById("breakGaugeValue");
const breakGaugeMeta = document.getElementById("breakGaugeMeta");
const weeklyGaugeButton = document.getElementById("weeklyGaugeButton");
const weeklyGauge = document.getElementById("weeklyGauge");
const weeklyGaugeLabel = document.getElementById("weeklyGaugeLabel");
const weeklyGaugeValue = document.getElementById("weeklyGaugeValue");
const weeklyGaugeMeta = document.getElementById("weeklyGaugeMeta");

const loginForm = document.getElementById("loginForm");
const loginNote = document.getElementById("loginNote");
const maintenanceModal = document.getElementById("maintenanceModal");
const maintenanceForm = document.getElementById("maintenanceForm");
const maintenanceDateInput = document.getElementById("maintenanceDate");
const maintenanceOdometerInput = document.getElementById("maintenanceOdometer");
const maintenanceTypeInput = document.getElementById("maintenanceType");
const maintenanceCostInput = document.getElementById("maintenanceCost");
const maintenanceNextDueMileageInput = document.getElementById("maintenanceNextDueMileage");
const maintenanceNextDueDateInput = document.getElementById("maintenanceNextDueDate");
const maintenanceDescriptionInput = document.getElementById("maintenanceDescription");
const maintenanceDescriptionLabel = document.getElementById("maintenanceDescriptionLabel");
const maintenanceOtherWrap = document.getElementById("maintenanceOtherWrap");
const maintenanceOtherDescriptionInput = document.getElementById("maintenanceOtherDescription");
const maintenanceFormNote = document.getElementById("maintenanceFormNote");
const addMaintenanceButton = document.getElementById("addMaintenanceButton");
const closeMaintenanceModalButton = document.getElementById("closeMaintenanceModal");
const cancelMaintenanceModalButton = document.getElementById("cancelMaintenanceModal");
const maintenanceTableBody = document.getElementById("maintenanceTableBody");
const maintenanceNote = document.getElementById("maintenanceNote");
const maintenanceLastService = document.getElementById("maintenanceLastService");
const maintenanceNextPm = document.getElementById("maintenanceNextPm");
const maintenanceYtdCost = document.getElementById("maintenanceYtdCost");
const deleteMaintenanceEntryButton = document.getElementById("deleteMaintenanceEntryButton");
const revenueModal = document.getElementById("revenueModal");
const revenueForm = document.getElementById("revenueForm");
const revenueDateInput = document.getElementById("revenueDate");
const revenueCustomerInput = document.getElementById("revenueCustomer");
const revenueAmountInput = document.getElementById("revenueAmount");
const revenueReferenceInput = document.getElementById("revenueReference");
const revenueFormNote = document.getElementById("revenueFormNote");
const closeRevenueModalButton = document.getElementById("closeRevenueModal");
const cancelRevenueModalButton = document.getElementById("cancelRevenueModal");
const revenueTableBody = document.getElementById("revenueTableBody");
const revenueNote = document.getElementById("revenueNote");
const revenueLastInvoiceValue = document.getElementById("revenueLastInvoiceValue");
const revenueMonthValue = document.getElementById("revenueMonthValue");
const revenueYtdValue = document.getElementById("revenueYtdValue");
const deleteRevenueEntryButton = document.getElementById("deleteRevenueEntryButton");
const timeClockEditModal = document.getElementById("timeClockEditModal");
const timeClockEditForm = document.getElementById("timeClockEditForm");
const timeClockEditActionInput = document.getElementById("timeClockEditAction");
const timeClockEditDestinationInput = document.getElementById("timeClockEditDestination");
const timeClockEditNote = document.getElementById("timeClockEditNote");
const closeTimeClockEditModalButton = document.getElementById("closeTimeClockEditModal");
const cancelTimeClockEditModalButton = document.getElementById("cancelTimeClockEditModal");
const deleteTimeClockEntryButton = document.getElementById("deleteTimeClockEntryButton");
const weatherBand = document.getElementById("weatherBand");
const weatherBandValue = document.getElementById("weatherBandValue");
const weatherBandVisual = document.getElementById("weatherBandVisual");

const statTargets = {
  lastOdometer: document.getElementById("lastOdometer"),
  lastFuelCost: document.getElementById("lastFuelCost"),
  lastMpg: document.getElementById("lastMpg"),
  totalFuelSpend: document.getElementById("totalFuelSpend"),
};

let fuelEntries = loadStoredArray(STORAGE_KEY);
let timeClockEntries = loadStoredArray(TIME_CLOCK_STORAGE_KEY);
let ctHutEntries = loadStoredArray(CT_HUT_STORAGE_KEY);
let maintenanceEntries = loadStoredArray(MAINTENANCE_STORAGE_KEY);
let revenueEntries = loadStoredArray(REVENUE_STORAGE_KEY);
let storageMode = LOCAL_PROTOCOLS.has(window.location.protocol) ? "local" : "remote";
let weeklyMode = "70";
let ctHutRange = "quarterly";
let dutyAction = "IN";
let dashboardClockInterval = null;
let requiresBreakAcknowledgement = false;
let bobtailSelected = false;
let showThirtyFourBreakPreview = false;
let showTomorrowWeeklyPreview = false;
let editingFuelKey = null;
let editingTimeClockKey = null;
let editingCtHutKey = null;
let editingMaintenanceKey = null;
let editingRevenueKey = null;
let weatherRefreshTimer = null;
let lastWeatherCoords = null;
let reportRange = "7";
const overviewHoldState = {
  mpg: false,
  fuelPrice: false,
  pm: false,
  costMonth: false,
  costRolling: false,
  revenue: false,
};

if (storageMode === "remote") {
  setAuthRequired(true);
}

function loadStoredArray(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveStoredArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function setAuthRequired(isRequired) {
  document.body.classList.toggle("auth-required", isRequired);
}

function setStatus(target, message, statusClass) {
  target.textContent = message;
  target.classList.remove("status-good", "status-bad", "status-info");

  if (statusClass) {
    target.classList.add(statusClass);
  }
}

function setWeatherMessage(message, visible = true) {
  if (!weatherBand || !weatherBandValue) {
    return;
  }

  weatherBand.hidden = !visible;
  weatherBandValue.textContent = message;
}

function getWeatherPresentation(weatherCode) {
  const code = Number(weatherCode);

  if (code === 0 || code === 1) {
    return { icon: "☀", className: "weather-band-clear" };
  }

  if (code === 2 || code === 3 || code === 45 || code === 48) {
    return { icon: "☁", className: "weather-band-cloudy" };
  }

  if ([95, 96, 99].includes(code)) {
    return { icon: "⛈", className: "weather-band-storm" };
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { icon: "❄", className: "weather-band-snow" };
  }

  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { icon: "🌧", className: "weather-band-rain" };
  }

  return { icon: "⛅", className: "" };
}

function applyWeatherPresentation(weatherCode) {
  if (!weatherBand || !weatherBandVisual) {
    return;
  }

  weatherBand.classList.remove(
    "weather-band-clear",
    "weather-band-cloudy",
    "weather-band-rain",
    "weather-band-storm",
    "weather-band-snow",
  );

  const presentation = getWeatherPresentation(weatherCode);
  weatherBandVisual.textContent = presentation.icon;
  if (presentation.className) {
    weatherBand.classList.add(presentation.className);
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  return { response, payload };
}

async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
  });

  const { response, payload } = await fetchJson(`${API_BASE}/weather?${params.toString()}`);

  if (response.status === 401) {
    setAuthRequired(true);
    throw new Error("Your session expired. Sign in again.");
  }

  if (!response.ok) {
    throw new Error(payload?.error ?? "Unable to load weather right now.");
  }

  return payload;
}

function formatWeatherSummary(weather) {
  const temp = Number.isFinite(Number(weather?.temperature)) ? `${Math.round(weather.temperature)}°` : "--";
  const feelsLike = Number.isFinite(Number(weather?.apparentTemperature))
    ? `Feels like ${Math.round(weather.apparentTemperature)}°`
    : null;
  const highLow = Number.isFinite(Number(weather?.high)) && Number.isFinite(Number(weather?.low))
    ? `H ${Math.round(weather.high)}° / L ${Math.round(weather.low)}°`
    : null;
  const wind = Number.isFinite(Number(weather?.windSpeed))
    ? `Wind ${Math.round(weather.windSpeed)} mph`
    : null;

  return [
    weather?.condition || "Current conditions",
    temp,
    feelsLike,
    highLow,
    wind,
  ].filter(Boolean).join(" | ");
}

async function refreshWeatherBand(forcePrompt = false) {
  if (storageMode !== "remote") {
    setWeatherMessage("Weather shows from the live cloud app once location is available.", true);
    return;
  }

  if (!navigator.geolocation) {
    applyWeatherPresentation(null);
    setWeatherMessage("This browser does not support location-based weather.", true);
    return;
  }

  if (lastWeatherCoords && !forcePrompt) {
    try {
      const weather = await fetchWeather(lastWeatherCoords.latitude, lastWeatherCoords.longitude);
      applyWeatherPresentation(weather?.weatherCode);
      setWeatherMessage(formatWeatherSummary(weather), true);
      return;
    } catch (error) {
      applyWeatherPresentation(null);
      setWeatherMessage(error.message || "Unable to load weather right now.", true);
      return;
    }
  }

  setWeatherMessage("Loading current conditions...", true);

  navigator.geolocation.getCurrentPosition(async (position) => {
    try {
      lastWeatherCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      const weather = await fetchWeather(lastWeatherCoords.latitude, lastWeatherCoords.longitude);
      applyWeatherPresentation(weather?.weatherCode);
      setWeatherMessage(formatWeatherSummary(weather), true);
    } catch (error) {
      applyWeatherPresentation(null);
      setWeatherMessage(error.message || "Unable to load weather right now.", true);
    }
  }, () => {
    applyWeatherPresentation(null);
    setWeatherMessage("Enable location to show live weather on your dashboard.", true);
  }, {
    enableHighAccuracy: false,
    maximumAge: 15 * 60 * 1000,
    timeout: 10000,
  });
}

function formatCoordinate(value) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(5) : "--";
}

function buildGeotabLocationCopy(snapshot) {
  if (!Number.isFinite(Number(snapshot?.latitude)) || !Number.isFinite(Number(snapshot?.longitude))) {
    return "Geotab location is not available right now.";
  }

  const coordinates = `${formatCoordinate(snapshot.latitude)}, ${formatCoordinate(snapshot.longitude)}`;
  const seenAt = snapshot.dateTime ? formatDateTime(snapshot.dateTime) : "latest ping";
  return `Geotab location: ${coordinates} (${seenAt}).`;
}

async function fetchGeotabSnapshot() {
  if (storageMode !== "remote") {
    return { snapshot: null, error: "Geotab prefill works from the live cloud app only." };
  }

  const { response, payload } = await fetchJson(`${API_BASE}/geotab-snapshot`);

  if (response.status === 401) {
    setAuthRequired(true);
    return { snapshot: null, error: "Your session expired. Sign in again." };
  }

  if (!response.ok) {
    return { snapshot: null, error: payload?.error ?? "Unable to reach Geotab right now." };
  }

  return { snapshot: payload, error: null };
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value) || 0);
}

function formatNumber(value, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits,
  }).format(Number(value) || 0);
}

function formatDate(isoDate) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(isoDate));
}

function formatDateTime(isoDate) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

function toDateInputValue(isoDate) {
  return isoDate ? new Date(isoDate).toISOString().slice(0, 10) : "";
}

function buildIsoFromDateInput(dateValue, fallbackIso = "") {
  if (!dateValue) {
    return fallbackIso || new Date().toISOString();
  }

  const fallbackDate = fallbackIso ? new Date(fallbackIso) : new Date();
  const [year, month, day] = dateValue.split("-").map(Number);

  return new Date(Date.UTC(
    year,
    month - 1,
    day,
    fallbackDate.getUTCHours(),
    fallbackDate.getUTCMinutes(),
    fallbackDate.getUTCSeconds(),
    fallbackDate.getUTCMilliseconds(),
  )).toISOString();
}

function formatDuration(ms) {
  const safeMs = Math.max(0, ms);
  const totalMinutes = Math.floor(safeMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

function formatDecimal(value, maximumFractionDigits = 2) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits,
  }).format(value);
}

function formatCurrencyMetric(value) {
  return Number.isFinite(value) ? formatCurrency(value) : "--";
}

function getEntryDate(entry) {
  return new Date(entry.invoiceDate ?? entry.serviceDate ?? entry.createdAt);
}

function getEntryKey(entry) {
  return String(entry?.id ?? entry?.createdAt ?? "");
}

function matchesEntryKey(entry, key) {
  return getEntryKey(entry) === String(key);
}

function getOrderedTimeEntries() {
  return [...timeClockEntries]
    .map((entry) => ({
      ...entry,
      createdAtMs: new Date(entry.createdAt).getTime(),
    }))
    .sort((a, b) => a.createdAtMs - b.createdAtMs);
}

function getLastFuelEntry() {
  return fuelEntries[0] ?? null;
}

function getLastCtHutEntry() {
  return [...ctHutEntries]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] ?? null;
}

function calculateMpg(currentOdometer, previousEntry, gallons) {
  if (!previousEntry) {
    return null;
  }

  const milesDriven = currentOdometer - previousEntry.odometer;

  if (milesDriven <= 0 || gallons <= 0) {
    return null;
  }

  return milesDriven / gallons;
}

function setActiveView(view) {
  navButtons.forEach((button) => {
    const isActive = button.dataset.view === view;
    button.classList.toggle("nav-item-active", isActive);
  });

  pages.forEach((page) => {
    const isActive = page.dataset.page === view;
    page.hidden = !isActive;
    page.classList.toggle("page-active", isActive);
  });
}

function setManagementView(view) {
  managementTabs.forEach((button) => {
    const isActive = button.dataset.managementView === view;
    button.classList.toggle("management-tab-active", isActive);
  });

  managementPages.forEach((page) => {
    const isActive = page.dataset.managementPage === view;
    page.hidden = !isActive;
    page.classList.toggle("management-page-active", isActive);
  });
}

function setWeeklyMode(mode) {
  weeklyMode = mode;
  weeklyModeButtons.forEach((button) => {
    button.classList.toggle("mode-switch-active", button.dataset.weeklyMode === mode);
  });
  refreshDashboardClocks();
}

function setCtHutRange(range) {
  ctHutRange = range;
  if (ctHutRangeSelect) {
    ctHutRangeSelect.value = range;
  }
  renderCtHutReport();
}

function setReportRange(range) {
  reportRange = range;
  if (reportRangeSelect) {
    reportRangeSelect.value = range;
  }
  renderReportCenter();
}

function updateFormNote() {
  const lastEntry = getLastFuelEntry();

  if (!lastEntry) {
    setStatus(formNote, "The first entry sets your starting point. MPG starts calculating from the second fuel stop.", "status-info");
    return;
  }

  setStatus(formNote, `Last fuel stop was at ${formatNumber(lastEntry.odometer)} miles. New MPG will calculate from that reading.`, "status-good");
}
function renderFuelStats() {
  const lastEntry = getLastFuelEntry();
  const totalFuelSpend = fuelEntries.reduce((sum, entry) => sum + entry.totalCost, 0);

  statTargets.totalFuelSpend.textContent = formatCurrency(totalFuelSpend);

  if (!lastEntry) {
    statTargets.lastOdometer.textContent = "--";
    statTargets.lastFuelCost.textContent = "--";
    statTargets.lastMpg.textContent = "--";
    return;
  }

  statTargets.lastOdometer.textContent = formatNumber(lastEntry.odometer);
  statTargets.lastFuelCost.textContent = formatCurrency(lastEntry.totalCost);
  statTargets.lastMpg.textContent = lastEntry.mpg ? formatNumber(lastEntry.mpg, 2) : "Pending";
}

function renderFuelTable() {
  if (fuelEntries.length === 0) {
    fuelTableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="7">No fuel entries yet. Use the Add Fuel button to log the first stop.</td>
      </tr>
    `;
    return;
  }

  fuelTableBody.innerHTML = fuelEntries
    .map((entry) => `
      <tr>
        <td>${formatDate(entry.createdAt)}</td>
        <td>${formatNumber(entry.odometer)}</td>
        <td>${formatNumber(entry.gallons, 2)}</td>
        <td>${formatCurrency(entry.pricePerGallon)}</td>
        <td>${formatCurrency(entry.totalCost)}</td>
        <td>${entry.mpg ? formatNumber(entry.mpg, 2) : "Pending"}</td>
        <td><button class="secondary-button table-action-button" data-edit-type="fuel" data-entry-key="${getEntryKey(entry)}" type="button">Edit</button></td>
      </tr>
    `)
    .join("");
}

function getFuelEntriesAscending() {
  return [...fuelEntries].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function normalizeFuelEntries(entries) {
  const ascending = [...entries]
    .map((entry) => ({
      ...entry,
      odometer: Number(entry.odometer),
      gallons: Number(entry.gallons),
      pricePerGallon: Number(entry.pricePerGallon),
    }))
    .sort((a, b) => Number(a.odometer) - Number(b.odometer) || new Date(a.createdAt) - new Date(b.createdAt));

  let previousEntry = null;
  const normalized = ascending.map((entry) => {
    const totalCost = Number(entry.gallons) * Number(entry.pricePerGallon);
    const mpg = calculateMpg(Number(entry.odometer), previousEntry, Number(entry.gallons));
    const nextEntry = {
      ...entry,
      totalCost,
      mpg,
    };
    previousEntry = nextEntry;
    return nextEntry;
  });

  return normalized.sort((a, b) => Number(b.odometer) - Number(a.odometer) || new Date(b.createdAt) - new Date(a.createdAt));
}

function getMaintenanceEntriesDescending() {
  return [...maintenanceEntries]
    .sort((a, b) => getEntryDate(b) - getEntryDate(a) || Number(b.odometer) - Number(a.odometer));
}

function getRevenueEntriesDescending() {
  return [...revenueEntries]
    .sort((a, b) => getEntryDate(b) - getEntryDate(a));
}

function normalizeCtHutEntries(entries) {
  const ascending = [...entries]
    .map((entry) => ({
      ...entry,
      mileage: Number(entry.mileage),
      weight: entry.weight == null || entry.weight === "" ? null : Number(entry.weight),
      isBobtail: Boolean(entry.isBobtail),
    }))
    .sort((a, b) => Number(a.mileage) - Number(b.mileage) || new Date(a.createdAt) - new Date(b.createdAt));

  let previousMileage = null;
  const normalized = ascending.map((entry) => {
    const milesSinceLast = previousMileage == null ? 0 : Math.max(0, Number(entry.mileage) - previousMileage);
    const rate = getCtHutRate(entry.weight, entry.isBobtail);
    const charge = entry.isBobtail ? 0 : milesSinceLast * rate;
    const nextEntry = {
      ...entry,
      previousMileage,
      milesSinceLast,
      rate,
      charge,
    };
    previousMileage = Number(entry.mileage);
    return nextEntry;
  });

  return normalized.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getRangeEntries(entries, startDate, endDate = new Date()) {
  return entries.filter((entry) => {
    const entryDate = getEntryDate(entry);
    return entryDate >= startDate && entryDate < endDate;
  });
}

function getReportRangeStart(range, now = new Date()) {
  if (range === "7") return new Date(now.getTime() - 7 * DAY_MS);
  if (range === "30") return new Date(now.getTime() - 30 * DAY_MS);
  if (range === "60") return new Date(now.getTime() - 60 * DAY_MS);
  if (range === "mtd") return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(now.getFullYear(), 0, 1);
}

function getReportRangeLabel(range) {
  if (range === "7") return "Last 7 days";
  if (range === "30") return "Last 30 days";
  if (range === "60") return "Last 60 days";
  if (range === "mtd") return "Month to date";
  return "Year to date";
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function triggerCsvDownload(filename, rows) {
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getFilteredFuelEntriesForReport() {
  const start = getReportRangeStart(reportRange);
  return [...fuelEntries]
    .filter((entry) => getEntryDate(entry) >= start)
    .sort((a, b) => getEntryDate(b) - getEntryDate(a));
}

function getFilteredTimeClockEntriesForReport() {
  const start = getReportRangeStart(reportRange);
  return [...timeClockEntries]
    .filter((entry) => getEntryDate(entry) >= start)
    .sort((a, b) => getEntryDate(b) - getEntryDate(a));
}

function getFilteredCtHutEntriesForReport() {
  const start = getReportRangeStart(reportRange);
  return [...ctHutEntries]
    .filter((entry) => getEntryDate(entry) >= start)
    .sort((a, b) => getEntryDate(b) - getEntryDate(a));
}

function renderReportCenter() {
  if (!reportCenterNote) {
    return;
  }

  const label = getReportRangeLabel(reportRange);
  reportFuelMeta.textContent = label;
  reportTimeClockMeta.textContent = label;
  reportCtHutMeta.textContent = label;
  setStatus(reportCenterNote, `Current download window: ${label}.`, "status-info");
}

function downloadFuelCsv() {
  const entries = getFilteredFuelEntriesForReport();
  if (entries.length === 0) {
    setStatus(reportCenterNote, "No fuel entries in this report window yet.", "status-bad");
    return;
  }

  const rows = [
    ["Date", "Odometer", "Gallons", "Price Per Gallon", "Total Cost", "MPG"],
    ...entries.map((entry) => [
      entry.createdAt,
      entry.odometer,
      entry.gallons,
      entry.pricePerGallon,
      entry.totalCost,
      entry.mpg ?? "",
    ]),
  ];

  triggerCsvDownload(`fuel-${reportRange}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  setStatus(reportCenterNote, "Fuel CSV downloaded.", "status-good");
}

function downloadTimeClockCsv() {
  const entries = getFilteredTimeClockEntriesForReport();
  if (entries.length === 0) {
    setStatus(reportCenterNote, "No time clock entries in this report window yet.", "status-bad");
    return;
  }

  const rows = [
    ["Date", "Action", "Destination"],
    ...entries.map((entry) => [entry.createdAt, entry.action, entry.destination]),
  ];

  triggerCsvDownload(`time-clock-${reportRange}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  setStatus(reportCenterNote, "Time clock CSV downloaded.", "status-good");
}

function downloadCtHutReportCsv() {
  const entries = getFilteredCtHutEntriesForReport();
  if (entries.length === 0) {
    setStatus(reportCenterNote, "No CT Hut entries in this report window yet.", "status-bad");
    return;
  }

  const rows = [
    ["Date", "Mileage", "Weight", "Bobtail", "Previous Mileage", "Miles Since Last", "Rate", "Charge"],
    ...entries.map((entry) => [
      entry.createdAt,
      entry.mileage,
      entry.weight ?? "",
      entry.isBobtail ? "Yes" : "No",
      entry.previousMileage ?? "",
      entry.milesSinceLast,
      entry.rate,
      entry.charge,
    ]),
  ];

  triggerCsvDownload(`ct-hut-${reportRange}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  setStatus(reportCenterNote, "CT Hut CSV downloaded.", "status-good");
}

function getPeriodMiles(entries) {
  if (entries.length < 2) {
    return 0;
  }

  return Math.max(0, Number(entries[entries.length - 1].odometer) - Number(entries[0].odometer));
}

function getPeriodGallons(entries) {
  if (entries.length < 2) {
    return 0;
  }

  return entries.slice(1).reduce((sum, entry) => sum + Number(entry.gallons || 0), 0);
}

function getPeriodFuelCost(entries) {
  return entries.reduce((sum, entry) => sum + Number(entry.totalCost || 0), 0);
}

function getPeriodMaintenanceCost(entries) {
  return entries.reduce((sum, entry) => sum + Number(entry.cost || 0), 0);
}

function getPeriodRevenue(entries) {
  return entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
}

function getAverageFuelPrice(entries) {
  const gallons = entries.reduce((sum, entry) => sum + Number(entry.gallons || 0), 0);
  const cost = getPeriodFuelCost(entries);
  return gallons > 0 ? cost / gallons : null;
}

function getAggregateMpg(entries) {
  const miles = getPeriodMiles(entries);
  const gallons = getPeriodGallons(entries);
  return miles > 0 && gallons > 0 ? miles / gallons : null;
}

function getCostPerMile(entries) {
  const miles = getPeriodMiles(entries);
  const cost = getPeriodFuelCost(entries);
  return miles > 0 && cost > 0 ? cost / miles : null;
}

function getCombinedCostPerMile(fuelWindow, maintenanceWindow) {
  const miles = getPeriodMiles(fuelWindow);
  if (miles <= 0) {
    return null;
  }

  const cost = getPeriodFuelCost(fuelWindow) + getPeriodMaintenanceCost(maintenanceWindow);
  return cost > 0 ? cost / miles : null;
}

function getStartOfMonth(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function getStartOfYear(now = new Date()) {
  return new Date(now.getFullYear(), 0, 1);
}

function getClosedThreeMonthRange(now = new Date()) {
  const startOfCurrentMonth = getStartOfMonth(now);
  const start = new Date(startOfCurrentMonth.getFullYear(), startOfCurrentMonth.getMonth() - 3, 1);
  return {
    start,
    end: startOfCurrentMonth,
  };
}

function getLatestOdometer() {
  const fuelOdometer = fuelEntries.length > 0 ? Number(fuelEntries[0].odometer) : null;
  const maintenanceLatest = getMaintenanceEntriesDescending()[0];
  const maintenanceOdometer = maintenanceLatest ? Number(maintenanceLatest.odometer) : null;

  if (Number.isFinite(fuelOdometer) && Number.isFinite(maintenanceOdometer)) {
    return Math.max(fuelOdometer, maintenanceOdometer);
  }

  return Number.isFinite(fuelOdometer) ? fuelOdometer : (Number.isFinite(maintenanceOdometer) ? maintenanceOdometer : null);
}

function isPmService(serviceType) {
  const normalized = String(serviceType ?? "").trim().toUpperCase();
  return normalized === "PM" || normalized.startsWith("PM ");
}

const MAINTENANCE_TYPE_OPTIONS = new Set(["PM", "Tires", "Brakes", "Repair", "Inspection", "Other"]);

function syncMaintenanceTypeUi() {
  const selectedType = maintenanceTypeInput.value;
  const isOther = selectedType === "Other";
  maintenanceOtherWrap.hidden = !isOther;
  maintenanceOtherDescriptionInput.required = isOther;
  maintenanceDescriptionLabel.textContent = isOther ? "Note" : "Note";
}

function getMilesToNextPm(odometer) {
  if (!Number.isFinite(odometer)) {
    return null;
  }

  const sinceLastPm = odometer % 10000;
  return sinceLastPm === 0 ? 10000 : 10000 - sinceLastPm;
}

function getNextPmCountdown(odometer) {
  const latestPmEntry = getMaintenanceEntriesDescending().find((entry) => isPmService(entry.serviceType));
  const pmOdometer = latestPmEntry ? Number(latestPmEntry.odometer) : null;

  if (Number.isFinite(pmOdometer) && Number.isFinite(odometer) && odometer >= pmOdometer) {
    return Math.max(0, pmOdometer + 10000 - odometer);
  }

  return getMilesToNextPm(odometer);
}

function getPmAlertState(now = new Date()) {
  const latestOdometer = getLatestOdometer();
  const nextPmCountdown = getNextPmCountdown(latestOdometer);
  const latestPmEntry = getMaintenanceEntriesDescending().find((entry) => isPmService(entry.serviceType));
  const nextDueDate = latestPmEntry?.nextDueDate ? new Date(latestPmEntry.nextDueDate) : null;
  const dueSoonMiles = Number.isFinite(nextPmCountdown) ? nextPmCountdown <= 1000 : false;
  const overdueMiles = Number.isFinite(nextPmCountdown) ? nextPmCountdown <= 0 : false;
  const dueSoonDate = nextDueDate ? (nextDueDate.getTime() - now.getTime()) <= 7 * DAY_MS && nextDueDate.getTime() >= now.getTime() : false;
  const overdueDate = nextDueDate ? nextDueDate.getTime() < now.getTime() : false;

  if (overdueMiles || overdueDate) {
    return {
      level: "overdue",
      nextPmCountdown,
      message: overdueMiles
        ? "PM is overdue now."
        : `PM date is overdue since ${formatDate(nextDueDate)}.`,
    };
  }

  if (dueSoonMiles || dueSoonDate) {
    return {
      level: "soon",
      nextPmCountdown,
      message: dueSoonMiles
        ? `PM due soon in ${formatNumber(nextPmCountdown)} miles.`
        : `PM due soon on ${formatDate(nextDueDate)}.`,
    };
  }

  return {
    level: "ok",
    nextPmCountdown,
    message: nextPmCountdown == null ? "No PM target set yet." : `Next PM in ${formatNumber(nextPmCountdown)} miles.`,
  };
}

function renderOverviewSection() {
  const now = new Date();
  const fuelAsc = getFuelEntriesAscending();
  const maintenanceDesc = getMaintenanceEntriesDescending();
  const revenueDesc = getRevenueEntriesDescending();
  const rollingThirtyEntries = getRangeEntries(fuelAsc, new Date(now.getTime() - 30 * DAY_MS));
  const ytdEntries = getRangeEntries(fuelAsc, getStartOfYear(now));
  const monthEntries = getRangeEntries(fuelAsc, getStartOfMonth(now));
  const rollingThirtyMaintenance = getRangeEntries(maintenanceDesc, new Date(now.getTime() - 30 * DAY_MS));
  const ytdMaintenance = getRangeEntries(maintenanceDesc, getStartOfYear(now));
  const monthMaintenance = getRangeEntries(maintenanceDesc, getStartOfMonth(now));
  const rollingThirtyRevenue = getRangeEntries(revenueDesc, new Date(now.getTime() - 30 * DAY_MS));
  const ytdRevenue = getRangeEntries(revenueDesc, getStartOfYear(now));
  const closedThreeMonths = getClosedThreeMonthRange(now);
  const closedThreeMonthEntries = getRangeEntries(fuelAsc, closedThreeMonths.start, closedThreeMonths.end);
  const closedThreeMonthMaintenance = getRangeEntries(maintenanceDesc, closedThreeMonths.start, closedThreeMonths.end);

  const rollingMpg = getAggregateMpg(rollingThirtyEntries);
  const ytdMpg = getAggregateMpg(ytdEntries);
  overviewMpgValue.textContent = overviewHoldState.mpg ? formatDecimal(ytdMpg) : formatDecimal(rollingMpg);
  overviewMpgMeta.textContent = overviewHoldState.mpg ? "YTD" : "30 DAY";

  const rollingFuelPrice = getAverageFuelPrice(rollingThirtyEntries);
  const ytdFuelPrice = getAverageFuelPrice(ytdEntries);
  overviewFuelPriceValue.textContent = overviewHoldState.fuelPrice ? formatCurrencyMetric(ytdFuelPrice) : formatCurrencyMetric(rollingFuelPrice);
  overviewFuelPriceMeta.textContent = overviewHoldState.fuelPrice ? "YTD" : "30 DAY";

  const latestOdometer = getLatestOdometer();
  const pmAlert = getPmAlertState(now);
  const pmCountdown = pmAlert.nextPmCountdown;
  const ytdMiles = getPeriodMiles(ytdEntries);
  overviewPmValue.textContent = overviewHoldState.pm ? formatNumber(ytdMiles) : (pmCountdown == null ? "--" : formatNumber(pmCountdown));
  overviewPmMeta.textContent = overviewHoldState.pm
    ? "YTD"
    : pmAlert.level === "overdue"
      ? "OVERDUE"
      : pmAlert.level === "soon"
        ? "DUE SOON"
        : "TO PM";

  const monthCostPerMile = getCombinedCostPerMile(monthEntries, monthMaintenance);
  const ytdCostPerMile = getCombinedCostPerMile(ytdEntries, ytdMaintenance);
  overviewCostMonthValue.textContent = overviewHoldState.costMonth ? formatCurrencyMetric(ytdCostPerMile) : formatCurrencyMetric(monthCostPerMile);
  overviewCostMonthMeta.textContent = overviewHoldState.costMonth ? "YTD" : "MTD";

  const rollingCostPerMile = getCombinedCostPerMile(rollingThirtyEntries, rollingThirtyMaintenance);
  const closedThreeMonthCostPerMile = getCombinedCostPerMile(closedThreeMonthEntries, closedThreeMonthMaintenance);
  overviewCostRollingValue.textContent = overviewHoldState.costRolling ? formatCurrencyMetric(closedThreeMonthCostPerMile) : formatCurrencyMetric(rollingCostPerMile);
  overviewCostRollingMeta.textContent = overviewHoldState.costRolling ? "3 CLOSED" : "30 DAY";

  const rollingRevenuePerMile = getPeriodMiles(rollingThirtyEntries) > 0 ? getPeriodRevenue(rollingThirtyRevenue) / getPeriodMiles(rollingThirtyEntries) : null;
  const ytdRevenuePerMile = getPeriodMiles(ytdEntries) > 0 ? getPeriodRevenue(ytdRevenue) / getPeriodMiles(ytdEntries) : null;
  overviewRevenueValue.textContent = formatCurrencyMetric(overviewHoldState.revenue ? ytdRevenuePerMile : rollingRevenuePerMile);
  overviewRevenueMeta.textContent = overviewHoldState.revenue ? "YTD" : "30 DAY";
}

function renderMaintenanceSection() {
  const now = new Date();
  const entries = getMaintenanceEntriesDescending();
  const latestEntry = entries[0];
  const latestOdometer = getLatestOdometer();
  const pmAlert = getPmAlertState(now);
  const nextPmCountdown = pmAlert.nextPmCountdown;
  const ytdCost = getPeriodMaintenanceCost(getRangeEntries(entries, getStartOfYear(new Date())));

  maintenanceLastService.textContent = latestEntry ? `${latestEntry.serviceType} | ${formatDate(latestEntry.serviceDate)}` : "--";
  maintenanceNextPm.textContent = nextPmCountdown == null ? "--" : (pmAlert.level === "overdue" ? "OVERDUE" : `${formatNumber(nextPmCountdown)} mi`);
  maintenanceYtdCost.textContent = formatCurrency(ytdCost);

  if (entries.length === 0) {
    maintenanceTableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="7">No maintenance entries yet. Add the first service to start tracking PM history.</td>
      </tr>
    `;
    setStatus(maintenanceNote, "Log PMs, repairs, and next-due targets here.", "status-info");
    return;
  }

  const nextDueEntry = entries.find((entry) => Number.isFinite(Number(entry.nextDueMileage)) || entry.nextDueDate);
  if (pmAlert.level === "overdue") {
    setStatus(maintenanceNote, pmAlert.message, "status-bad");
  } else if (pmAlert.level === "soon") {
    setStatus(maintenanceNote, pmAlert.message, "status-info");
  } else if (nextDueEntry) {
    const dueParts = [];
    if (Number.isFinite(Number(nextDueEntry.nextDueMileage))) {
      dueParts.push(`${formatNumber(nextDueEntry.nextDueMileage)} mi`);
    }
    if (nextDueEntry.nextDueDate) {
      dueParts.push(formatDate(nextDueEntry.nextDueDate));
    }
    setStatus(maintenanceNote, `Next scheduled service: ${dueParts.join(" | ")}.`, "status-good");
  } else {
    setStatus(maintenanceNote, "No next-due target set yet.", "status-info");
  }

  maintenanceTableBody.innerHTML = entries.map((entry) => {
    const nextDueParts = [];
    if (Number.isFinite(Number(entry.nextDueMileage))) {
      nextDueParts.push(formatNumber(entry.nextDueMileage));
    }
    if (entry.nextDueDate) {
      nextDueParts.push(formatDate(entry.nextDueDate));
    }

    return `
      <tr>
        <td>${formatDate(entry.serviceDate)}</td>
        <td>${entry.serviceType}</td>
        <td>${formatNumber(entry.odometer)}</td>
        <td>${formatCurrency(entry.cost)}</td>
        <td>${nextDueParts.length > 0 ? nextDueParts.join(" | ") : "--"}</td>
        <td>${entry.notes || "--"}</td>
        <td><button class="secondary-button table-action-button" data-edit-type="maintenance" data-entry-key="${getEntryKey(entry)}" type="button">Edit</button></td>
      </tr>
    `;
  }).join("");
}

function renderTimeClockTable() {
  if (timeClockEntries.length === 0) {
    timeClockTableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="4">No time clock entries yet. Tap the 14-hour clock to start tracking.</td>
      </tr>
    `;
    return;
  }

  timeClockTableBody.innerHTML = [...timeClockEntries]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((entry) => `
      <tr>
        <td>${formatDateTime(entry.createdAt)}</td>
        <td>${entry.action === "IN" ? "Punch In" : "Punch Out"}</td>
        <td>${entry.destination || "--"}</td>
        <td><button class="secondary-button table-action-button" data-edit-type="timeclock" data-entry-key="${getEntryKey(entry)}" type="button">Edit</button></td>
      </tr>
    `)
    .join("");
}

function getStartOfDay(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function renderTimeClockSummary() {
  const state = getDashboardClockState();
  const todayIntervals = sumIntervalOverlap(state.intervals, getStartOfDay().getTime(), Date.now());

  timeClockStatusValue.textContent = state.onDuty ? "On duty" : (state.breakMet ? "Reset ready" : "Off duty");
  timeClockLastInValue.textContent = state.lastIn ? formatDateTime(state.lastIn.createdAt) : "--";
  timeClockTodayHoursValue.textContent = formatDuration(todayIntervals);
}

function renderRevenueSection() {
  const entries = getRevenueEntriesDescending();
  const monthEntries = getRangeEntries(entries, getStartOfMonth(new Date()));
  const ytdEntries = getRangeEntries(entries, getStartOfYear(new Date()));
  const lastEntry = entries[0];

  revenueLastInvoiceValue.textContent = lastEntry ? formatCurrency(lastEntry.amount) : "--";
  revenueMonthValue.textContent = formatCurrency(getPeriodRevenue(monthEntries));
  revenueYtdValue.textContent = formatCurrency(getPeriodRevenue(ytdEntries));

  if (entries.length === 0) {
    revenueTableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="5">No customer invoices yet. Use Add Invoice to start tracking revenue.</td>
      </tr>
    `;
    setStatus(revenueNote, "Customer invoices stay separate from maintenance and fuel expenses.", "status-info");
    return;
  }

  setStatus(revenueNote, "", "status-info");
  revenueTableBody.innerHTML = entries.map((entry) => `
    <tr>
      <td>${formatDate(entry.invoiceDate)}</td>
      <td>${entry.customer}</td>
      <td>${formatCurrency(entry.amount)}</td>
      <td>${entry.reference || "--"}</td>
      <td><button class="secondary-button table-action-button" data-edit-type="revenue" data-entry-key="${getEntryKey(entry)}" type="button">Edit</button></td>
    </tr>
  `).join("");
}

function setGaugeState(element, progress, color) {
  const normalized = Math.min(Math.max(progress, 0), 1);
  element.style.setProperty("--gauge-progress", normalized.toString());
  element.style.setProperty("--gauge-color", color);
}

function getBlueYellowRedColor(ratioRemaining) {
  if (ratioRemaining >= 0.5) return "var(--blue)";
  if (ratioRemaining >= 0.2) return "var(--amber)";
  return "var(--red)";
}

function buildDutyIntervals(entries, nowMs) {
  const intervals = [];
  let activeStart = null;
  let activeDestination = "";

  entries.forEach((entry) => {
    if (entry.action === "IN") {
      activeStart = entry.createdAtMs;
      activeDestination = entry.destination;
      return;
    }

    if (entry.action === "OUT" && activeStart != null) {
      intervals.push({ start: activeStart, end: entry.createdAtMs, destination: activeDestination });
      activeStart = null;
      activeDestination = "";
    }
  });

  if (activeStart != null) {
    intervals.push({ start: activeStart, end: nowMs, destination: activeDestination, active: true });
  }

  return intervals;
}

function getTimeClockState(nowMs = Date.now()) {
  const entries = getOrderedTimeEntries();
  const intervals = buildDutyIntervals(entries, nowMs);
  const lastEntry = entries[entries.length - 1] ?? null;
  const onDuty = lastEntry?.action === "IN";
  const lastOut = [...entries].reverse().find((entry) => entry.action === "OUT") ?? null;
  const lastIn = [...entries].reverse().find((entry) => entry.action === "IN") ?? null;

  let dutyWindowStart = null;
  let previousOutMs = null;

  entries.forEach((entry) => {
    if (entry.action === "IN") {
      if (previousOutMs == null || entry.createdAtMs - previousOutMs >= 10 * HOUR_MS || dutyWindowStart == null) {
        dutyWindowStart = entry.createdAtMs;
      }
      return;
    }

    if (entry.action === "OUT") {
      previousOutMs = entry.createdAtMs;
    }
  });

  const offDutyMs = !onDuty && lastOut ? nowMs - lastOut.createdAtMs : 0;
  const tenHourResetMet = !onDuty && offDutyMs >= 10 * HOUR_MS;
  const activeDutyWindowStart = tenHourResetMet ? null : dutyWindowStart;

  let resetBoundaryMs = null;
  let previousOutForReset = null;

  entries.forEach((entry) => {
    if (entry.action === "IN") {
      if (previousOutForReset != null && entry.createdAtMs - previousOutForReset >= 34 * HOUR_MS) {
        resetBoundaryMs = entry.createdAtMs;
      }
      return;
    }

    if (entry.action === "OUT") {
      previousOutForReset = entry.createdAtMs;
    }
  });

  if (!onDuty && lastOut && nowMs - lastOut.createdAtMs >= 34 * HOUR_MS) {
    resetBoundaryMs = nowMs;
  }

  return { entries, intervals, lastEntry, lastIn, lastOut, onDuty, offDutyMs, dutyWindowStart, activeDutyWindowStart, tenHourResetMet, resetBoundaryMs };
}

function sumIntervalOverlap(intervals, rangeStart, rangeEnd) {
  return intervals.reduce((sum, interval) => {
    const overlapStart = Math.max(interval.start, rangeStart);
    const overlapEnd = Math.min(interval.end, rangeEnd);
    return overlapEnd > overlapStart ? sum + (overlapEnd - overlapStart) : sum;
  }, 0);
}

function getDashboardClockState(nowMs = Date.now()) {
  const timeClockState = getTimeClockState(nowMs);
  const weeklyHours = weeklyMode === "70" ? 70 : 60;
  const weeklyDays = weeklyMode === "70" ? 8 : 7;
  const weeklyWindowStart = nowMs - weeklyDays * DAY_MS;
  const weeklyBoundary = Math.max(weeklyWindowStart, timeClockState.resetBoundaryMs ?? 0);
  const weeklyUsedMs = timeClockState.resetBoundaryMs === nowMs ? 0 : sumIntervalOverlap(timeClockState.intervals, weeklyBoundary, nowMs);
  const weeklyRemainingMs = Math.max(0, weeklyHours * HOUR_MS - weeklyUsedMs);
  const weeklyExceeded = weeklyRemainingMs <= 0;

  let dutyRemainingMs = 14 * HOUR_MS;
  let dutyProgress = 1;
  let dutyLabel = "Waiting to clock in";

  if (timeClockState.activeDutyWindowStart != null) {
    const elapsed = nowMs - timeClockState.activeDutyWindowStart;
    dutyRemainingMs = Math.max(0, 14 * HOUR_MS - elapsed);
    dutyProgress = dutyRemainingMs / (14 * HOUR_MS);
    dutyLabel = timeClockState.onDuty ? "Window running" : "Window still active";
  } else if (timeClockState.tenHourResetMet) {
    dutyLabel = "10-hour reset met";
  }

  const breakProgress = timeClockState.onDuty ? 0 : Math.min(timeClockState.offDutyMs / (10 * HOUR_MS), 1);
  const breakMet = !timeClockState.onDuty && timeClockState.offDutyMs >= 10 * HOUR_MS;
  const tomorrowWindowAnchor = new Date(nowMs);
  tomorrowWindowAnchor.setHours(24, 0, 0, 0);
  const tomorrowMs = tomorrowWindowAnchor.getTime();
  const tomorrowWeeklyWindowStart = tomorrowMs - weeklyDays * DAY_MS;
  const tomorrowWeeklyBoundary = Math.max(tomorrowWeeklyWindowStart, timeClockState.resetBoundaryMs ?? 0);
  const tomorrowWeeklyUsedMs = timeClockState.resetBoundaryMs === nowMs
    ? 0
    : sumIntervalOverlap(timeClockState.intervals, tomorrowWeeklyBoundary, nowMs);
  const tomorrowWeeklyRemainingMs = Math.max(0, weeklyHours * HOUR_MS - tomorrowWeeklyUsedMs);

  return {
    ...timeClockState,
    weeklyHours,
    weeklyDays,
    weeklyUsedMs,
    weeklyRemainingMs,
    weeklyExceeded,
    dutyRemainingMs,
    dutyProgress,
    dutyLabel,
    breakProgress,
    breakMet,
    tomorrowWeeklyRemainingMs,
    tomorrowRecapGainMs: Math.max(0, tomorrowWeeklyRemainingMs - weeklyRemainingMs),
  };
}

function refreshDashboardClocks() {
  const state = getDashboardClockState();
  const warningMessages = [];

  setGaugeState(dutyGauge, state.dutyProgress, getBlueYellowRedColor(state.dutyProgress));
  dutyGaugeValue.textContent = formatDuration(state.dutyRemainingMs);
  dutyGaugeMeta.textContent = state.dutyLabel;

  if (showThirtyFourBreakPreview) {
    const thirtyFourProgress = state.onDuty ? 0 : Math.min(state.offDutyMs / (34 * HOUR_MS), 1);
    const thirtyFourMet = !state.onDuty && state.offDutyMs >= 34 * HOUR_MS;
    setGaugeState(breakGauge, thirtyFourProgress, thirtyFourMet ? "var(--blue)" : "var(--red)");
    breakGaugeValue.textContent = formatDuration(Math.max(0, 34 * HOUR_MS - state.offDutyMs));
    breakGaugeMeta.textContent = state.onDuty ? "34-hour reset" : thirtyFourMet ? "34-hour reset complete" : "34-hour reset";
  } else {
    setGaugeState(breakGauge, state.breakProgress, state.breakMet ? "var(--blue)" : "var(--red)");
    breakGaugeValue.textContent = formatDuration(Math.min(state.offDutyMs, 10 * HOUR_MS));
    breakGaugeMeta.textContent = state.onDuty ? "Break clock resets while on duty" : state.breakMet ? "Break reset complete" : "Off-duty break building";
  }

  const weeklyRatio = state.weeklyRemainingMs / (state.weeklyHours * HOUR_MS);
  const tomorrowWeeklyRatio = state.tomorrowWeeklyRemainingMs / (state.weeklyHours * HOUR_MS);
  setGaugeState(weeklyGauge, showTomorrowWeeklyPreview ? tomorrowWeeklyRatio : weeklyRatio, getBlueYellowRedColor(showTomorrowWeeklyPreview ? tomorrowWeeklyRatio : weeklyRatio));
  weeklyGaugeLabel.textContent = `${state.weeklyHours} HR`;
  weeklyGaugeValue.textContent = formatDuration(showTomorrowWeeklyPreview ? state.tomorrowWeeklyRemainingMs : state.weeklyRemainingMs);
  weeklyGaugeMeta.textContent = showTomorrowWeeklyPreview
    ? `Tomorrow after recap +${formatDuration(state.tomorrowRecapGainMs)}`
    : `${state.weeklyDays}-day window`;

  if (state.onDuty) {
    driverStatusTitle.textContent = "On duty";
    driverStatusCopy.textContent = `Current shift started ${formatDateTime(state.lastIn.createdAt)}.`;
    driverStatusNote.textContent = state.lastIn.destination ? state.lastIn.destination : "Destination not set.";
    setStatus(timeClockNote, "Active shift running.", "status-good");
  } else if (state.lastOut) {
    driverStatusTitle.textContent = state.breakMet ? "Reset ready" : "Off duty";
    driverStatusCopy.textContent = state.breakMet ? "Your 10-hour break has been met. The next punch in will start a fresh 14-hour window." : `Off duty since ${formatDateTime(state.lastOut.createdAt)}.`;
    driverStatusNote.textContent = state.lastOut.destination ? `Last stop: ${state.lastOut.destination}.` : "Last duty entry recorded.";
    setStatus(timeClockNote, state.breakMet ? "10-hour reset met." : "Off-duty break running.", state.breakMet ? "status-good" : "status-info");
  } else {
    driverStatusTitle.textContent = "Off duty";
    driverStatusCopy.textContent = "Punch in from the 14-hour clock when you are ready to start.";
    driverStatusNote.textContent = "No active destination.";
    setStatus(timeClockNote, "No active shift yet.", "status-info");
  }

  if (!state.onDuty && state.lastOut && !state.breakMet) {
    warningMessages.push(`10-hour break not met yet. You still need ${formatDuration(10 * HOUR_MS - state.offDutyMs)} off duty.`);
  }

  if (state.weeklyExceeded) {
    warningMessages.push(`${state.weeklyHours}-hour weekly clock has been exceeded.`);
  }

  const pmAlert = getPmAlertState();
  if (pmAlert.level === "overdue" || pmAlert.level === "soon") {
    warningMessages.push(pmAlert.message);
  }

  warningBar.hidden = warningMessages.length === 0;
  warningText.textContent = warningMessages.join(" ");

  dutyAction = state.onDuty ? "OUT" : "IN";
  return state;
}

function refreshFuelSection() {
  renderFuelStats();
  renderFuelTable();
  updateFormNote();
  renderOverviewSection();
}

function refreshTimeClockSection() {
  renderTimeClockSummary();
  renderTimeClockTable();
  refreshDashboardClocks();
  renderOverviewSection();
}

function getCtHutRate(weight, isBobtail) {
  if (isBobtail) return 0;
  const numericWeight = Number(weight);
  const bracket = CT_HUT_RATE_TABLE.find((entry) => numericWeight >= entry.min && numericWeight <= entry.max);
  return bracket ? bracket.rate : 0;
}

function buildCtHutEntry(input, previousEntry) {
  const mileage = Number(input.mileage);
  const isBobtail = Boolean(input.isBobtail);
  const weight = isBobtail ? null : Number(input.weight);
  const previousMileage = previousEntry ? Number(previousEntry.mileage) : null;
  const milesSinceLast = previousMileage == null ? 0 : Math.max(0, mileage - previousMileage);
  const rate = getCtHutRate(weight, isBobtail);
  const charge = isBobtail ? 0 : milesSinceLast * rate;

  return {
    createdAt: new Date().toISOString(),
    mileage,
    weight,
    isBobtail,
    previousMileage,
    milesSinceLast,
    rate,
    charge,
  };
}

function getCtHutRangeStart(range, now = new Date()) {
  const year = now.getFullYear();

  if (range === "30") return new Date(now.getTime() - 30 * DAY_MS);
  if (range === "60") return new Date(now.getTime() - 60 * DAY_MS);
  if (range === "current-year" || range === "ytd") return new Date(year, 0, 1);

  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
  return new Date(year, quarterStartMonth, 1);
}

function getCtHutRangeLabel(range) {
  if (range === "30") return "Last 30 days";
  if (range === "60") return "Last 60 days";
  if (range === "current-year") return "Current year";
  if (range === "ytd") return "Year to date";
  return "Current quarter";
}

function getFilteredCtHutEntries() {
  const start = getCtHutRangeStart(ctHutRange);
  return [...ctHutEntries]
    .filter((entry) => new Date(entry.createdAt) >= start)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function renderCtHutReport() {
  const entries = getFilteredCtHutEntries();
  const totalMiles = entries.reduce((sum, entry) => sum + Number(entry.milesSinceLast || 0), 0);
  const totalCharge = entries.reduce((sum, entry) => sum + Number(entry.charge || 0), 0);
  const totalBobtailMiles = entries.filter((entry) => entry.isBobtail).reduce((sum, entry) => sum + Number(entry.milesSinceLast || 0), 0);

  ctHutMiles.textContent = formatNumber(totalMiles);
  ctHutAmount.textContent = formatCurrency(totalCharge);
  ctHutBobtailMiles.textContent = formatNumber(totalBobtailMiles);
  setStatus(ctHutReportNote, `${getCtHutRangeLabel(ctHutRange)} view.`, "status-info");

  if (entries.length === 0) {
    ctHutTableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="7">No CT Hut entries in this range yet.</td>
      </tr>
    `;
    return;
  }

  ctHutTableBody.innerHTML = entries.map((entry) => `
      <tr>
        <td>${formatDate(entry.createdAt)}</td>
        <td>${formatNumber(entry.mileage)}</td>
        <td>${entry.isBobtail ? "Bobtail" : formatNumber(entry.weight)}</td>
        <td>${formatNumber(entry.milesSinceLast)}</td>
        <td>${entry.isBobtail ? "Exempt" : formatNumber(entry.rate, 4)}</td>
        <td>${formatCurrency(entry.charge)}</td>
        <td><button class="secondary-button table-action-button" data-edit-type="cthut" data-entry-key="${getEntryKey(entry)}" type="button">Edit</button></td>
      </tr>
    `).join("");
}

function downloadCtHutCsv() {
  const entries = getFilteredCtHutEntries();

  if (entries.length === 0) {
    setStatus(ctHutReportNote, "No CT Hut entries in this range to download yet.", "status-bad");
    return;
  }

  const rows = [
    ["Date", "Mileage", "Weight", "Bobtail", "Previous Mileage", "Miles Since Last", "Rate", "Charge"],
    ...entries.map((entry) => [entry.createdAt, entry.mileage, entry.weight ?? "", entry.isBobtail ? "Yes" : "No", entry.previousMileage ?? "", entry.milesSinceLast, entry.rate, entry.charge]),
  ];

  const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ct-hut-${ctHutRange}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus(ctHutReportNote, "CT Hut CSV downloaded.", "status-good");
}

function refreshCtHutSection() {
  renderCtHutReport();
  updateCtHutNote();
  renderOverviewSection();
}

function refreshMaintenanceSection() {
  renderMaintenanceSection();
  renderOverviewSection();
}

function refreshRevenueSection() {
  renderRevenueSection();
  renderOverviewSection();
}

function updateCtHutNote() {
  const lastEntry = getLastCtHutEntry();

  if (!lastEntry) {
    setStatus(ctHutNote, "Mileage between CT Hut stops will be tracked automatically for reporting.", "status-info");
    return;
  }

  setStatus(ctHutNote, `Last CT Hut stop was at ${formatNumber(lastEntry.mileage)} miles. The next save will calculate from there.`, "status-good");
}

function updateBobtailState() {
  bobtailToggleButton.setAttribute("aria-pressed", bobtailSelected ? "true" : "false");
  ctHutWeightInput.disabled = bobtailSelected;
  ctHutWeightInput.required = !bobtailSelected;
  ctHutWeightInput.placeholder = bobtailSelected ? "Bobtail exempt" : "64000";
  if (bobtailSelected) {
    ctHutWeightInput.value = "";
  }
}
async function openFuelModal() {
  editingFuelKey = null;
  updateFormNote();
  fuelDateInput.value = toDateInputValue(new Date().toISOString());
  deleteFuelEntryButton.hidden = true;
  setStatus(fuelGeotabNote, "Checking Geotab for the latest mileage and location...", "status-info");
  fuelModal.showModal();

  const { snapshot, error } = await fetchGeotabSnapshot();

  if (error) {
    setStatus(fuelGeotabNote, error, "status-bad");
    return;
  }

  if (snapshot?.odometerMiles != null) {
    currentMileInput.value = String(Math.round(snapshot.odometerMiles));
  }

  setStatus(
    fuelGeotabNote,
    `${buildGeotabLocationCopy(snapshot)}${snapshot?.odometerMiles != null ? ` Odometer synced to ${formatNumber(Math.round(snapshot.odometerMiles))} miles.` : " Odometer was not returned by Geotab."}`,
    "status-good",
  );
}

function closeFuelModal() {
  fuelModal.close();
  fuelForm.reset();
  editingFuelKey = null;
  deleteFuelEntryButton.hidden = true;
  updateFormNote();
  setStatus(fuelGeotabNote, "Open this from the live app to let Geotab prefill the latest mileage and location.", "status-info");
}

function openFuelEditModal(key) {
  const entry = fuelEntries.find((candidate) => matchesEntryKey(candidate, key));
  if (!entry) return;

  editingFuelKey = getEntryKey(entry);
  fuelForm.reset();
  fuelDateInput.value = toDateInputValue(entry.createdAt);
  currentMileInput.value = String(entry.odometer);
  document.getElementById("fuelAmount").value = String(entry.gallons);
  document.getElementById("fuelPrice").value = String(entry.pricePerGallon);
  deleteFuelEntryButton.hidden = false;
  setStatus(fuelGeotabNote, "Editing an existing fuel stop.", "status-info");
  setStatus(formNote, "Save to recalculate MPG from this stop forward.", "status-info");
  fuelModal.showModal();
}

async function openCtHutModal() {
  editingCtHutKey = null;
  bobtailSelected = false;
  updateBobtailState();
  updateCtHutNote();
  deleteCtHutEntryButton.hidden = true;
  setStatus(ctHutGeotabNote, "Checking Geotab for the latest mileage and location...", "status-info");
  ctHutModal.showModal();

  const { snapshot, error } = await fetchGeotabSnapshot();

  if (error) {
    setStatus(ctHutGeotabNote, error, "status-bad");
    return;
  }

  if (snapshot?.odometerMiles != null) {
    ctHutMileageInput.value = String(Math.round(snapshot.odometerMiles));
  }

  setStatus(
    ctHutGeotabNote,
    `${buildGeotabLocationCopy(snapshot)}${snapshot?.odometerMiles != null ? ` Odometer synced to ${formatNumber(Math.round(snapshot.odometerMiles))} miles.` : " Odometer was not returned by Geotab."}`,
    "status-good",
  );
}

function closeCtHutModal() {
  ctHutModal.close();
  ctHutForm.reset();
  editingCtHutKey = null;
  deleteCtHutEntryButton.hidden = true;
  bobtailSelected = false;
  updateBobtailState();
  updateCtHutNote();
  setStatus(ctHutGeotabNote, "Open this from the live app to let Geotab prefill the latest mileage and location.", "status-info");
}

function openCtHutEditModal(key) {
  const entry = ctHutEntries.find((candidate) => matchesEntryKey(candidate, key));
  if (!entry) return;

  editingCtHutKey = getEntryKey(entry);
  ctHutForm.reset();
  bobtailSelected = Boolean(entry.isBobtail);
  updateBobtailState();
  ctHutMileageInput.value = String(entry.mileage);
  if (!bobtailSelected && entry.weight != null) {
    ctHutWeightInput.value = String(entry.weight);
  }
  deleteCtHutEntryButton.hidden = false;
  setStatus(ctHutGeotabNote, "Editing an existing CT Hut stop.", "status-info");
  setStatus(ctHutNote, "Save to recalculate mileage and charges from this stop forward.", "status-info");
  ctHutModal.showModal();
}

function openMaintenanceModal() {
  editingMaintenanceKey = null;
  maintenanceForm.reset();
  deleteMaintenanceEntryButton.hidden = true;
  maintenanceDateInput.value = new Date().toISOString().slice(0, 10);
  maintenanceTypeInput.value = "PM";
  maintenanceOtherDescriptionInput.value = "";
  syncMaintenanceTypeUi();
  const latestOdometer = getLatestOdometer();
  if (latestOdometer != null) {
    maintenanceOdometerInput.value = String(Math.round(latestOdometer));
  }
  setStatus(maintenanceFormNote, "Use this for PMs, repairs, and scheduled service history.", "status-info");
  maintenanceModal.showModal();
}

function closeMaintenanceModal() {
  maintenanceModal.close();
  maintenanceForm.reset();
  editingMaintenanceKey = null;
  deleteMaintenanceEntryButton.hidden = true;
  maintenanceTypeInput.value = "PM";
  maintenanceOtherDescriptionInput.value = "";
  syncMaintenanceTypeUi();
  setStatus(maintenanceFormNote, "Use this for PMs, repairs, and scheduled service history.", "status-info");
}

function openMaintenanceEditModal(key) {
  const entry = maintenanceEntries.find((candidate) => matchesEntryKey(candidate, key));
  if (!entry) return;

  editingMaintenanceKey = getEntryKey(entry);
  maintenanceForm.reset();
  maintenanceDateInput.value = String(entry.serviceDate ?? "").slice(0, 10);
  maintenanceOdometerInput.value = String(entry.odometer);
  if (MAINTENANCE_TYPE_OPTIONS.has(entry.serviceType ?? "")) {
    maintenanceTypeInput.value = entry.serviceType;
    maintenanceOtherDescriptionInput.value = "";
  } else {
    maintenanceTypeInput.value = "Other";
    maintenanceOtherDescriptionInput.value = entry.serviceType ?? "";
  }
  syncMaintenanceTypeUi();
  maintenanceCostInput.value = String(entry.cost ?? "");
  maintenanceNextDueMileageInput.value = entry.nextDueMileage ?? "";
  maintenanceNextDueDateInput.value = entry.nextDueDate ? String(entry.nextDueDate).slice(0, 10) : "";
  maintenanceDescriptionInput.value = entry.notes ?? "";
  deleteMaintenanceEntryButton.hidden = false;
  setStatus(maintenanceFormNote, "Editing an existing maintenance entry.", "status-info");
  maintenanceModal.showModal();
}

function openRevenueModal() {
  editingRevenueKey = null;
  revenueForm.reset();
  deleteRevenueEntryButton.hidden = true;
  revenueDateInput.value = new Date().toISOString().slice(0, 10);
  setStatus(revenueFormNote, "Revenue stays separate from maintenance and fuel expenses.", "status-info");
  revenueModal.showModal();
}

function closeRevenueModal() {
  revenueModal.close();
  revenueForm.reset();
  editingRevenueKey = null;
  deleteRevenueEntryButton.hidden = true;
  setStatus(revenueFormNote, "Revenue stays separate from maintenance and fuel expenses.", "status-info");
}

function openRevenueEditModal(key) {
  const entry = revenueEntries.find((candidate) => matchesEntryKey(candidate, key));
  if (!entry) return;

  editingRevenueKey = getEntryKey(entry);
  revenueForm.reset();
  revenueDateInput.value = String(entry.invoiceDate ?? "").slice(0, 10);
  revenueCustomerInput.value = entry.customer ?? "";
  revenueAmountInput.value = String(entry.amount ?? "");
  revenueReferenceInput.value = entry.reference ?? "";
  deleteRevenueEntryButton.hidden = false;
  setStatus(revenueFormNote, "Editing an existing customer invoice.", "status-info");
  revenueModal.showModal();
}

function openTimeClockEditModal(key) {
  const entry = timeClockEntries.find((candidate) => matchesEntryKey(candidate, key));
  if (!entry) return;

  editingTimeClockKey = getEntryKey(entry);
  timeClockEditForm.reset();
  timeClockEditActionInput.value = String(entry.action ?? "IN").toUpperCase();
  timeClockEditDestinationInput.value = entry.destination ?? "";
  deleteTimeClockEntryButton.hidden = false;
  setStatus(timeClockEditNote, "Edit the action or destination for this time entry.", "status-info");
  timeClockEditModal.showModal();
}

function closeTimeClockEditModal() {
  timeClockEditModal.close();
  timeClockEditForm.reset();
  editingTimeClockKey = null;
  deleteTimeClockEntryButton.hidden = true;
  setStatus(timeClockEditNote, "Edit the action or destination for this time entry.", "status-info");
}

function updateDutyGateState() {
  punchInFields.hidden = requiresBreakAcknowledgement;
  destinationInput.disabled = requiresBreakAcknowledgement;
}

function openDutyModal() {
  const state = refreshDashboardClocks();
  dutyAction = state.onDuty ? "OUT" : "IN";
  const tryingToClockIn = dutyAction === "IN";
  requiresBreakAcknowledgement = Boolean(tryingToClockIn && state.lastOut && !state.breakMet);

  dutyWarningGate.hidden = !requiresBreakAcknowledgement;
  punchOutFields.hidden = tryingToClockIn;
  destinationInput.required = tryingToClockIn;

  if (tryingToClockIn) {
    dutyModalTitle.textContent = "Punch In";
    dutySubmitButton.textContent = "Save Punch In";

    if (state.weeklyExceeded) {
      setStatus(dutyNote, `${state.weeklyHours}-hour weekly clock is already exceeded. Fix before driving.`, "status-bad");
    } else if (requiresBreakAcknowledgement) {
      dutyWarningText.textContent = `10-hour break not met yet. You still need ${formatDuration(10 * HOUR_MS - state.offDutyMs)} off duty.`;
      setStatus(dutyNote, "Acknowledge the short break warning before entering your destination.", "status-bad");
    } else {
      setStatus(dutyNote, "Punch in starts the next duty segment.", "status-info");
    }
  } else {
    dutyModalTitle.textContent = "Punch Out";
    dutySubmitButton.textContent = "Save Punch Out";
    dutyWarningText.textContent = "";
    setStatus(dutyNote, "Punching out starts your off-duty break timer.", "status-info");
  }

  punchInFields.hidden = !tryingToClockIn;
  updateDutyGateState();
  dutyModal.showModal();
}

function closeDutyModal() {
  dutyModal.close();
  dutyForm.reset();
  dutyWarningGate.hidden = true;
  destinationInput.disabled = false;
  requiresBreakAcknowledgement = false;
  setStatus(dutyNote, "Tap save to log the next duty action.", "status-info");
}

async function loadRemoteSession() {
  const { response, payload } = await fetchJson(`${API_BASE}/session`);
  if (!response.ok) throw new Error(payload?.error ?? "Unable to check session.");
  return payload;
}

async function loadRemoteFuelEntries() {
  const { response, payload } = await fetchJson(`${API_BASE}/fuel`);
  if (response.status === 401) {
    setAuthRequired(true);
    return;
  }
  if (!response.ok) throw new Error(payload?.error ?? "Unable to load fuel entries.");
  fuelEntries = Array.isArray(payload?.entries) ? payload.entries : [];
  refreshFuelSection();
}

async function loadRemoteTimeClockEntries() {
  const { response, payload } = await fetchJson(`${API_BASE}/timeclock`);
  if (response.status === 401) {
    setAuthRequired(true);
    return;
  }
  if (!response.ok) throw new Error(payload?.error ?? "Unable to load time clock entries.");
  timeClockEntries = Array.isArray(payload?.entries) ? payload.entries : [];
  refreshTimeClockSection();
}

async function loadRemoteCtHutEntries() {
  const { response, payload } = await fetchJson(`${API_BASE}/cthut`);
  if (response.status === 401) {
    setAuthRequired(true);
    return;
  }
  if (!response.ok) throw new Error(payload?.error ?? "Unable to load CT Hut entries.");
  ctHutEntries = Array.isArray(payload?.entries) ? payload.entries : [];
  refreshCtHutSection();
}

async function loadRemoteMaintenanceEntries() {
  const { response, payload } = await fetchJson(`${API_BASE}/maintenance`);
  if (response.status === 401) {
    setAuthRequired(true);
    return;
  }
  if (!response.ok) throw new Error(payload?.error ?? "Unable to load maintenance entries.");
  maintenanceEntries = Array.isArray(payload?.entries) ? payload.entries : [];
  refreshMaintenanceSection();
}

async function loadRemoteRevenueEntries() {
  const { response, payload } = await fetchJson(`${API_BASE}/revenue`);
  if (response.status === 401) {
    setAuthRequired(true);
    return;
  }
  if (!response.ok) throw new Error(payload?.error ?? "Unable to load revenue entries.");
  revenueEntries = Array.isArray(payload?.entries) ? payload.entries : [];
  refreshRevenueSection();
}

async function saveRemoteFuelEntry(entry) {
  const { response, payload } = await fetchJson(`${API_BASE}/fuel`, { method: "POST", body: JSON.stringify(entry) });
  if (response.status === 401) {
    setAuthRequired(true);
    throw new Error("Your session expired. Sign in again.");
  }
  if (!response.ok) throw new Error(payload?.error ?? "Unable to save fuel entry.");
  fuelEntries = Array.isArray(payload?.entries) ? payload.entries : fuelEntries;
  refreshFuelSection();
}

async function updateRemoteFuelEntry(id, entry) {
  const { response, payload } = await fetchJson(`${API_BASE}/fuel`, { method: "PUT", body: JSON.stringify({ id, ...entry }) });
  if (response.status === 401) {
    setAuthRequired(true);
    throw new Error("Your session expired. Sign in again.");
  }
  if (!response.ok) throw new Error(payload?.error ?? "Unable to update fuel entry.");
  fuelEntries = Array.isArray(payload?.entries) ? payload.entries : fuelEntries;
  refreshFuelSection();
}

async function saveRemoteTimeClockEntry(entry) {
  const { response, payload } = await fetchJson(`${API_BASE}/timeclock`, { method: "POST", body: JSON.stringify(entry) });
  if (response.status === 401) {
    setAuthRequired(true);
    throw new Error("Your session expired. Sign in again.");
  }
  if (!response.ok) throw new Error(payload?.error ?? "Unable to save time clock entry.");
  timeClockEntries = Array.isArray(payload?.entries) ? payload.entries : timeClockEntries;
  refreshTimeClockSection();
}

async function updateRemoteTimeClockEntry(id, entry) {
  const { response, payload } = await fetchJson(`${API_BASE}/timeclock`, { method: "PUT", body: JSON.stringify({ id, ...entry }) });
  if (response.status === 401) {
    setAuthRequired(true);
    throw new Error("Your session expired. Sign in again.");
  }
  if (!response.ok) throw new Error(payload?.error ?? "Unable to update time clock entry.");
  timeClockEntries = Array.isArray(payload?.entries) ? payload.entries : timeClockEntries;
  refreshTimeClockSection();
}

async function saveRemoteCtHutEntry(entry) {
  const { response, payload } = await fetchJson(`${API_BASE}/cthut`, { method: "POST", body: JSON.stringify(entry) });
  if (response.status === 401) {
    setAuthRequired(true);
    throw new Error("Your session expired. Sign in again.");
  }
  if (!response.ok) throw new Error(payload?.error ?? "Unable to save CT Hut entry.");
  ctHutEntries = Array.isArray(payload?.entries) ? payload.entries : ctHutEntries;
  refreshCtHutSection();
}

async function updateRemoteCtHutEntry(id, entry) {
  const { response, payload } = await fetchJson(`${API_BASE}/cthut`, { method: "PUT", body: JSON.stringify({ id, ...entry }) });
  if (response.status === 401) {
    setAuthRequired(true);
    throw new Error("Your session expired. Sign in again.");
  }
  if (!response.ok) throw new Error(payload?.error ?? "Unable to update CT Hut entry.");
  ctHutEntries = Array.isArray(payload?.entries) ? payload.entries : ctHutEntries;
  refreshCtHutSection();
}

async function saveRemoteMaintenanceEntry(entry) {
  const { response, payload } = await fetchJson(`${API_BASE}/maintenance`, { method: "POST", body: JSON.stringify(entry) });
  if (response.status === 401) {
    setAuthRequired(true);
    throw new Error("Your session expired. Sign in again.");
  }
  if (!response.ok) throw new Error(payload?.error ?? "Unable to save maintenance entry.");
  maintenanceEntries = Array.isArray(payload?.entries) ? payload.entries : maintenanceEntries;
  refreshMaintenanceSection();
}

async function updateRemoteMaintenanceEntry(id, entry) {
  const { response, payload } = await fetchJson(`${API_BASE}/maintenance`, { method: "PUT", body: JSON.stringify({ id, ...entry }) });
  if (response.status === 401) {
    setAuthRequired(true);
    throw new Error("Your session expired. Sign in again.");
  }
  if (!response.ok) throw new Error(payload?.error ?? "Unable to update maintenance entry.");
  maintenanceEntries = Array.isArray(payload?.entries) ? payload.entries : maintenanceEntries;
  refreshMaintenanceSection();
}

async function saveRemoteRevenueEntry(entry) {
  const { response, payload } = await fetchJson(`${API_BASE}/revenue`, { method: "POST", body: JSON.stringify(entry) });
  if (response.status === 401) {
    setAuthRequired(true);
    throw new Error("Your session expired. Sign in again.");
  }
  if (!response.ok) throw new Error(payload?.error ?? "Unable to save customer invoice.");
  revenueEntries = Array.isArray(payload?.entries) ? payload.entries : revenueEntries;
  refreshRevenueSection();
}

async function updateRemoteRevenueEntry(id, entry) {
  const { response, payload } = await fetchJson(`${API_BASE}/revenue`, { method: "PUT", body: JSON.stringify({ id, ...entry }) });
  if (response.status === 401) {
    setAuthRequired(true);
    throw new Error("Your session expired. Sign in again.");
  }
  if (!response.ok) throw new Error(payload?.error ?? "Unable to update customer invoice.");
  revenueEntries = Array.isArray(payload?.entries) ? payload.entries : revenueEntries;
  refreshRevenueSection();
}

async function deleteRemoteEntry(endpoint, id, fallbackMessage) {
  const { response, payload } = await fetchJson(`${API_BASE}/${endpoint}`, {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
  if (response.status === 401) {
    setAuthRequired(true);
    throw new Error("Your session expired. Sign in again.");
  }
  if (!response.ok) throw new Error(payload?.error ?? fallbackMessage);
  return payload;
}

async function deleteRemoteFuelEntry(id) {
  const payload = await deleteRemoteEntry("fuel", id, "Unable to delete fuel entry.");
  fuelEntries = Array.isArray(payload?.entries) ? payload.entries : fuelEntries;
  refreshFuelSection();
}

async function deleteRemoteTimeClockEntry(id) {
  const payload = await deleteRemoteEntry("timeclock", id, "Unable to delete time clock entry.");
  timeClockEntries = Array.isArray(payload?.entries) ? payload.entries : timeClockEntries;
  refreshTimeClockSection();
}

async function deleteRemoteCtHutEntry(id) {
  const payload = await deleteRemoteEntry("cthut", id, "Unable to delete CT Hut entry.");
  ctHutEntries = Array.isArray(payload?.entries) ? payload.entries : ctHutEntries;
  refreshCtHutSection();
}

async function deleteRemoteMaintenanceEntry(id) {
  const payload = await deleteRemoteEntry("maintenance", id, "Unable to delete maintenance entry.");
  maintenanceEntries = Array.isArray(payload?.entries) ? payload.entries : maintenanceEntries;
  refreshMaintenanceSection();
}

async function deleteRemoteRevenueEntry(id) {
  const payload = await deleteRemoteEntry("revenue", id, "Unable to delete customer invoice.");
  revenueEntries = Array.isArray(payload?.entries) ? payload.entries : revenueEntries;
  refreshRevenueSection();
}

function updateLocalFuelEntry(key, entry) {
  fuelEntries = normalizeFuelEntries(fuelEntries.map((candidate) => (
    matchesEntryKey(candidate, key)
      ? { ...candidate, ...entry }
      : candidate
  )));
  saveStoredArray(STORAGE_KEY, fuelEntries);
  refreshFuelSection();
}

function updateLocalTimeClockEntry(key, entry) {
  timeClockEntries = timeClockEntries.map((candidate) => (
    matchesEntryKey(candidate, key)
      ? { ...candidate, ...entry }
      : candidate
  ));
  saveStoredArray(TIME_CLOCK_STORAGE_KEY, timeClockEntries);
  refreshTimeClockSection();
}

function updateLocalCtHutEntry(key, entry) {
  ctHutEntries = normalizeCtHutEntries(ctHutEntries.map((candidate) => (
    matchesEntryKey(candidate, key)
      ? { ...candidate, ...entry }
      : candidate
  )));
  saveStoredArray(CT_HUT_STORAGE_KEY, ctHutEntries);
  refreshCtHutSection();
}

function updateLocalMaintenanceEntry(key, entry) {
  maintenanceEntries = maintenanceEntries.map((candidate) => (
    matchesEntryKey(candidate, key)
      ? { ...candidate, ...entry }
      : candidate
  ));
  saveStoredArray(MAINTENANCE_STORAGE_KEY, maintenanceEntries);
  refreshMaintenanceSection();
}

function updateLocalRevenueEntry(key, entry) {
  revenueEntries = revenueEntries.map((candidate) => (
    matchesEntryKey(candidate, key)
      ? { ...candidate, ...entry }
      : candidate
  ));
  saveStoredArray(REVENUE_STORAGE_KEY, revenueEntries);
  refreshRevenueSection();
}

function deleteLocalFuelEntry(key) {
  fuelEntries = normalizeFuelEntries(fuelEntries.filter((candidate) => !matchesEntryKey(candidate, key)));
  saveStoredArray(STORAGE_KEY, fuelEntries);
  refreshFuelSection();
}

function deleteLocalTimeClockEntry(key) {
  timeClockEntries = timeClockEntries.filter((candidate) => !matchesEntryKey(candidate, key));
  saveStoredArray(TIME_CLOCK_STORAGE_KEY, timeClockEntries);
  refreshTimeClockSection();
}

function deleteLocalCtHutEntry(key) {
  ctHutEntries = normalizeCtHutEntries(ctHutEntries.filter((candidate) => !matchesEntryKey(candidate, key)));
  saveStoredArray(CT_HUT_STORAGE_KEY, ctHutEntries);
  refreshCtHutSection();
}

function deleteLocalMaintenanceEntry(key) {
  maintenanceEntries = maintenanceEntries.filter((candidate) => !matchesEntryKey(candidate, key));
  saveStoredArray(MAINTENANCE_STORAGE_KEY, maintenanceEntries);
  refreshMaintenanceSection();
}

function deleteLocalRevenueEntry(key) {
  revenueEntries = revenueEntries.filter((candidate) => !matchesEntryKey(candidate, key));
  saveStoredArray(REVENUE_STORAGE_KEY, revenueEntries);
  refreshRevenueSection();
}

async function loadRemoteDashboardData() {
  await loadRemoteFuelEntries();
  await loadRemoteTimeClockEntries();

  try {
    await loadRemoteCtHutEntries();
  } catch (error) {
    setStatus(ctHutReportNote, error.message, "status-bad");
  }

  try {
    await loadRemoteMaintenanceEntries();
  } catch (error) {
    setStatus(maintenanceNote, error.message, "status-bad");
  }

  try {
    await loadRemoteRevenueEntries();
  } catch (error) {
    setStatus(revenueFormNote, error.message, "status-bad");
  }
}

async function bootstrapRemoteMode() {
  try {
    const session = await loadRemoteSession();
    if (!session?.authenticated) {
      setAuthRequired(true);
      return;
    }

    setAuthRequired(false);
    await loadRemoteDashboardData();
    await refreshWeatherBand();
  } catch (error) {
    storageMode = "local";
    saveStoredArray(STORAGE_KEY, fuelEntries);
    saveStoredArray(TIME_CLOCK_STORAGE_KEY, timeClockEntries);
    saveStoredArray(CT_HUT_STORAGE_KEY, ctHutEntries);
    saveStoredArray(MAINTENANCE_STORAGE_KEY, maintenanceEntries);
    saveStoredArray(REVENUE_STORAGE_KEY, revenueEntries);
    refreshFuelSection();
    refreshTimeClockSection();
    refreshCtHutSection();
    refreshMaintenanceSection();
    setWeatherMessage("Weather will show when the live cloud app is connected.", true);
    setStatus(loginNote, "Cloud sync is unavailable right now. The app is running in local mode on this device.", "status-bad");
    setAuthRequired(false);
  }
}

function confirmDelete(label) {
  return window.confirm(`Delete this ${label}? This cannot be undone.`);
}

async function handleDeleteFuelEntry() {
  if (!editingFuelKey || !confirmDelete("fuel entry")) {
    return;
  }

  if (storageMode === "remote") {
    await deleteRemoteFuelEntry(editingFuelKey);
  } else {
    deleteLocalFuelEntry(editingFuelKey);
  }

  closeFuelModal();
}

async function handleDeleteCtHutEntry() {
  if (!editingCtHutKey || !confirmDelete("CT Hut entry")) {
    return;
  }

  if (storageMode === "remote") {
    await deleteRemoteCtHutEntry(editingCtHutKey);
  } else {
    deleteLocalCtHutEntry(editingCtHutKey);
  }

  closeCtHutModal();
}

async function handleDeleteMaintenanceEntry() {
  if (!editingMaintenanceKey || !confirmDelete("maintenance entry")) {
    return;
  }

  if (storageMode === "remote") {
    await deleteRemoteMaintenanceEntry(editingMaintenanceKey);
  } else {
    deleteLocalMaintenanceEntry(editingMaintenanceKey);
  }

  closeMaintenanceModal();
}

async function handleDeleteRevenueEntry() {
  if (!editingRevenueKey || !confirmDelete("customer invoice")) {
    return;
  }

  if (storageMode === "remote") {
    await deleteRemoteRevenueEntry(editingRevenueKey);
  } else {
    deleteLocalRevenueEntry(editingRevenueKey);
  }

  closeRevenueModal();
}

async function handleDeleteTimeClockEntry() {
  if (!editingTimeClockKey || !confirmDelete("time clock entry")) {
    return;
  }

  if (storageMode === "remote") {
    await deleteRemoteTimeClockEntry(editingTimeClockKey);
  } else {
    deleteLocalTimeClockEntry(editingTimeClockKey);
  }

  closeTimeClockEditModal();
}

async function handleFuelSubmit(event) {
  event.preventDefault();

  const fuelDate = fuelDateInput.value;
  const odometer = Number(document.getElementById("currentMile").value);
  const gallons = Number(document.getElementById("fuelAmount").value);
  const pricePerGallon = Number(document.getElementById("fuelPrice").value);

  if (odometer <= 0 || gallons <= 0 || pricePerGallon <= 0) {
    setStatus(formNote, "All values need to be greater than zero.", "status-bad");
    return;
  }

  const totalCost = gallons * pricePerGallon;
  const payload = { odometer, gallons, pricePerGallon, totalCost, mpg: null };

  if (editingFuelKey) {
    const existingEntry = fuelEntries.find((candidate) => matchesEntryKey(candidate, editingFuelKey));
    if (!existingEntry) {
      setStatus(formNote, "Fuel entry could not be found.", "status-bad");
      return;
    }
    payload.createdAt = buildIsoFromDateInput(fuelDate, existingEntry.createdAt);

    if (storageMode === "remote") {
      await updateRemoteFuelEntry(editingFuelKey, payload);
    } else {
      updateLocalFuelEntry(editingFuelKey, payload);
    }
  } else {
    const previousEntry = getLastFuelEntry();
    if (previousEntry && odometer <= previousEntry.odometer) {
      setStatus(formNote, `Current mile must be higher than the last logged odometer of ${formatNumber(previousEntry.odometer)}.`, "status-bad");
      return;
    }

    const mpg = calculateMpg(odometer, previousEntry, gallons);
    const newEntry = { odometer, gallons, pricePerGallon, totalCost, mpg };

    if (storageMode === "remote") {
      await saveRemoteFuelEntry(newEntry);
    } else {
      fuelEntries.unshift({ createdAt: buildIsoFromDateInput(fuelDate), ...newEntry });
      saveStoredArray(STORAGE_KEY, fuelEntries);
      refreshFuelSection();
    }
  }

  closeFuelModal();
}

async function saveDutyAction() {
  const state = refreshDashboardClocks();

  if (dutyAction === "IN") {
    if (requiresBreakAcknowledgement) {
      setStatus(dutyNote, "You need to acknowledge the short break warning before continuing.", "status-bad");
      return;
    }

    const destination = destinationInput.value.trim();
    if (!destination) {
      setStatus(dutyNote, "Destination is required.", "status-bad");
      return;
    }

    const newEntry = { action: "IN", destination };

    if (storageMode === "remote") {
      await saveRemoteTimeClockEntry(newEntry);
    } else {
      timeClockEntries.unshift({ createdAt: new Date().toISOString(), truckId: "", ...newEntry });
      saveStoredArray(TIME_CLOCK_STORAGE_KEY, timeClockEntries);
      refreshTimeClockSection();
    }

    closeDutyModal();
    return;
  }

  if (!state.onDuty || !state.lastIn) {
    setStatus(dutyNote, "Nobody is currently punched in.", "status-bad");
    return;
  }

  const newEntry = { action: "OUT", destination: state.lastIn.destination };

  if (storageMode === "remote") {
    await saveRemoteTimeClockEntry(newEntry);
  } else {
    timeClockEntries.unshift({ createdAt: new Date().toISOString(), truckId: "", ...newEntry });
    saveStoredArray(TIME_CLOCK_STORAGE_KEY, timeClockEntries);
    refreshTimeClockSection();
  }

  closeDutyModal();
}
async function handleManagementPunchOut() {
  const state = refreshDashboardClocks();

  if (!state.onDuty || !state.lastIn) {
    setStatus(timeClockNote, "Nobody is currently punched in.", "status-bad");
    return;
  }

  const newEntry = { action: "OUT", destination: state.lastIn.destination };

  if (storageMode === "remote") {
    await saveRemoteTimeClockEntry(newEntry);
  } else {
    timeClockEntries.unshift({ createdAt: new Date().toISOString(), truckId: "", ...newEntry });
    saveStoredArray(TIME_CLOCK_STORAGE_KEY, timeClockEntries);
    refreshTimeClockSection();
  }

  setStatus(timeClockNote, "Shift punched out successfully.", "status-good");
}

async function handleCtHutSubmit(event) {
  event.preventDefault();

  const mileage = Number(ctHutMileageInput.value);
  const weight = Number(ctHutWeightInput.value);
  const previousEntry = getLastCtHutEntry();

  if (mileage <= 0) {
    setStatus(ctHutNote, "Current mileage must be greater than zero.", "status-bad");
    return;
  }

  if (previousEntry && mileage <= Number(previousEntry.mileage)) {
    setStatus(ctHutNote, `Current mileage must be higher than the last CT Hut reading of ${formatNumber(previousEntry.mileage)}.`, "status-bad");
    return;
  }

  if (!bobtailSelected && weight < 26000) {
    setStatus(ctHutNote, "Use Bobtail for exempt entries or enter a CT Hut taxable weight of at least 26,000.", "status-bad");
    return;
  }

  const payload = { mileage, weight: bobtailSelected ? null : weight, isBobtail: bobtailSelected };

  if (editingCtHutKey) {
    if (storageMode === "remote") {
      await updateRemoteCtHutEntry(editingCtHutKey, payload);
    } else {
      updateLocalCtHutEntry(editingCtHutKey, payload);
    }
  } else {
    if (storageMode === "remote") {
      await saveRemoteCtHutEntry(payload);
    } else {
      ctHutEntries.unshift(buildCtHutEntry(payload, previousEntry));
      saveStoredArray(CT_HUT_STORAGE_KEY, ctHutEntries);
      refreshCtHutSection();
    }
  }

  closeCtHutModal();
}

async function handleMaintenanceSubmit(event) {
  event.preventDefault();

  const serviceDate = maintenanceDateInput.value;
  const odometer = Number(maintenanceOdometerInput.value);
  const selectedServiceType = maintenanceTypeInput.value.trim();
  const otherServiceType = maintenanceOtherDescriptionInput.value.trim();
  const serviceType = selectedServiceType === "Other" ? otherServiceType : selectedServiceType;
  const cost = Number(maintenanceCostInput.value);
  const nextDueMileage = maintenanceNextDueMileageInput.value ? Number(maintenanceNextDueMileageInput.value) : null;
  const nextDueDate = maintenanceNextDueDateInput.value || null;
  const notes = maintenanceDescriptionInput.value.trim();

  if (!serviceDate) {
    setStatus(maintenanceFormNote, "Service date is required.", "status-bad");
    return;
  }

  if (!Number.isFinite(odometer) || odometer <= 0) {
    setStatus(maintenanceFormNote, "Odometer must be greater than zero.", "status-bad");
    return;
  }

  if (!serviceType) {
    setStatus(maintenanceFormNote, selectedServiceType === "Other" ? "Other description is required." : "Service type is required.", "status-bad");
    return;
  }

  if (!Number.isFinite(cost) || cost < 0) {
    setStatus(maintenanceFormNote, "Cost must be zero or higher.", "status-bad");
    return;
  }

  if (nextDueMileage != null && (!Number.isFinite(nextDueMileage) || nextDueMileage <= odometer)) {
    setStatus(maintenanceFormNote, "Next due mileage must be higher than the service odometer.", "status-bad");
    return;
  }

  const payload = {
    serviceDate,
    odometer,
    serviceType,
    cost,
    nextDueMileage,
    nextDueDate,
    notes,
  };

  if (editingMaintenanceKey) {
    if (storageMode === "remote") {
      await updateRemoteMaintenanceEntry(editingMaintenanceKey, payload);
    } else {
      updateLocalMaintenanceEntry(editingMaintenanceKey, payload);
    }
  } else {
    if (storageMode === "remote") {
      await saveRemoteMaintenanceEntry(payload);
    } else {
      maintenanceEntries.unshift({ createdAt: new Date().toISOString(), ...payload });
      saveStoredArray(MAINTENANCE_STORAGE_KEY, maintenanceEntries);
      refreshMaintenanceSection();
    }
  }

  closeMaintenanceModal();
}

async function handleRevenueSubmit(event) {
  event.preventDefault();

  const invoiceDate = revenueDateInput.value;
  const customer = revenueCustomerInput.value.trim();
  const amount = Number(revenueAmountInput.value);
  const reference = revenueReferenceInput.value.trim();

  if (!invoiceDate) {
    setStatus(revenueFormNote, "Invoice date is required.", "status-bad");
    return;
  }

  if (!customer) {
    setStatus(revenueFormNote, "Customer is required.", "status-bad");
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    setStatus(revenueFormNote, "Invoice amount must be greater than zero.", "status-bad");
    return;
  }

  const payload = { invoiceDate, customer, amount, reference };

  if (editingRevenueKey) {
    if (storageMode === "remote") {
      await updateRemoteRevenueEntry(editingRevenueKey, payload);
    } else {
      updateLocalRevenueEntry(editingRevenueKey, payload);
    }
  } else {
    if (storageMode === "remote") {
      await saveRemoteRevenueEntry(payload);
    } else {
      revenueEntries.unshift({ createdAt: new Date().toISOString(), ...payload });
      saveStoredArray(REVENUE_STORAGE_KEY, revenueEntries);
      refreshRevenueSection();
    }
  }

  closeRevenueModal();
}

async function handleTimeClockEditSubmit(event) {
  event.preventDefault();

  const action = String(timeClockEditActionInput.value ?? "").toUpperCase();
  const destination = timeClockEditDestinationInput.value.trim();

  if (action !== "IN" && action !== "OUT") {
    setStatus(timeClockEditNote, "Action must be IN or OUT.", "status-bad");
    return;
  }

  if (!destination) {
    setStatus(timeClockEditNote, "Destination is required.", "status-bad");
    return;
  }

  const payload = { action, destination };

  if (storageMode === "remote") {
    await updateRemoteTimeClockEntry(editingTimeClockKey, payload);
  } else {
    updateLocalTimeClockEntry(editingTimeClockKey, payload);
  }

  closeTimeClockEditModal();
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveView(button.dataset.view));
});

managementTabs.forEach((button) => {
  button.addEventListener("click", () => setManagementView(button.dataset.managementView));
});

weeklyModeButtons.forEach((button) => {
  button.addEventListener("click", () => setWeeklyMode(button.dataset.weeklyMode));
});

ctHutRangeSelect.addEventListener("change", () => {
  setCtHutRange(ctHutRangeSelect.value);
});

reportRangeSelect.addEventListener("change", () => {
  setReportRange(reportRangeSelect.value);
});

maintenanceTypeInput.addEventListener("change", () => {
  if (maintenanceTypeInput.value !== "Other") {
    maintenanceOtherDescriptionInput.value = "";
  }
  syncMaintenanceTypeUi();
});

function showThirtyFourPreview() {
  showThirtyFourBreakPreview = true;
  refreshDashboardClocks();
}

function hideThirtyFourPreview() {
  showThirtyFourBreakPreview = false;
  refreshDashboardClocks();
}

breakGaugeButton.addEventListener("mousedown", showThirtyFourPreview);
breakGaugeButton.addEventListener("mouseup", hideThirtyFourPreview);
breakGaugeButton.addEventListener("mouseleave", hideThirtyFourPreview);
breakGaugeButton.addEventListener("touchstart", showThirtyFourPreview, { passive: true });
breakGaugeButton.addEventListener("touchend", hideThirtyFourPreview);
breakGaugeButton.addEventListener("touchcancel", hideThirtyFourPreview);

function showTomorrowWeeklyHours() {
  showTomorrowWeeklyPreview = true;
  refreshDashboardClocks();
}

function hideTomorrowWeeklyHours() {
  showTomorrowWeeklyPreview = false;
  refreshDashboardClocks();
}

weeklyGaugeButton.addEventListener("mousedown", showTomorrowWeeklyHours);
weeklyGaugeButton.addEventListener("mouseup", hideTomorrowWeeklyHours);
weeklyGaugeButton.addEventListener("mouseleave", hideTomorrowWeeklyHours);
weeklyGaugeButton.addEventListener("touchstart", showTomorrowWeeklyHours, { passive: true });
weeklyGaugeButton.addEventListener("touchend", hideTomorrowWeeklyHours);
weeklyGaugeButton.addEventListener("touchcancel", hideTomorrowWeeklyHours);

function bindOverviewHold(card, key) {
  const enable = () => {
    overviewHoldState[key] = true;
    renderOverviewSection();
  };

  const disable = () => {
    overviewHoldState[key] = false;
    renderOverviewSection();
  };

  card.addEventListener("mousedown", enable);
  card.addEventListener("mouseup", disable);
  card.addEventListener("mouseleave", disable);
  card.addEventListener("touchstart", enable, { passive: true });
  card.addEventListener("touchend", disable);
  card.addEventListener("touchcancel", disable);
}

bindOverviewHold(overviewMpgCard, "mpg");
bindOverviewHold(overviewFuelPriceCard, "fuelPrice");
bindOverviewHold(overviewPmCard, "pm");
bindOverviewHold(overviewCostMonthCard, "costMonth");
bindOverviewHold(overviewCostRollingCard, "costRolling");
bindOverviewHold(overviewRevenueCard, "revenue");

dashboardAddFuelButton.addEventListener("click", () => {
  openFuelModal().catch((error) => setStatus(fuelGeotabNote, error.message, "status-bad"));
});
managementAddFuelButton.addEventListener("click", () => {
  openFuelModal().catch((error) => setStatus(fuelGeotabNote, error.message, "status-bad"));
});
closeFuelModalButton.addEventListener("click", closeFuelModal);
cancelFuelModalButton.addEventListener("click", closeFuelModal);
deleteFuelEntryButton.addEventListener("click", () => {
  handleDeleteFuelEntry().catch((error) => setStatus(formNote, error.message, "status-bad"));
});

dutyGaugeButton.addEventListener("click", openDutyModal);
closeDutyModalButton.addEventListener("click", closeDutyModal);
cancelDutyModalButton.addEventListener("click", closeDutyModal);
dutyAcknowledgeButton.addEventListener("click", () => {
  requiresBreakAcknowledgement = false;
  dutyWarningGate.hidden = true;
  updateDutyGateState();
  setStatus(dutyNote, "Warning acknowledged. Finish the punch-in details below.", "status-info");
});
dutyCancelGateButton.addEventListener("click", closeDutyModal);
managementPunchOutButton.addEventListener("click", () => {
  handleManagementPunchOut().catch((error) => setStatus(timeClockNote, error.message, "status-bad"));
});

ctHutButton.addEventListener("click", () => {
  openCtHutModal().catch((error) => setStatus(ctHutGeotabNote, error.message, "status-bad"));
});
managementCtHutButton.addEventListener("click", () => {
  openCtHutModal().catch((error) => setStatus(ctHutGeotabNote, error.message, "status-bad"));
});
closeCtHutModalButton.addEventListener("click", closeCtHutModal);
cancelCtHutModalButton.addEventListener("click", closeCtHutModal);
deleteCtHutEntryButton.addEventListener("click", () => {
  handleDeleteCtHutEntry().catch((error) => setStatus(ctHutNote, error.message, "status-bad"));
});
bobtailToggleButton.addEventListener("click", () => {
  bobtailSelected = !bobtailSelected;
  updateBobtailState();
  setStatus(ctHutNote, bobtailSelected ? "Bobtail selected. This stop will be treated as exempt." : "Weight-based CT Hut calculation restored.", bobtailSelected ? "status-info" : "status-good");
});
downloadCtHutButton.addEventListener("click", downloadCtHutCsv);
downloadFuelReportButton.addEventListener("click", downloadFuelCsv);
downloadTimeClockReportButton.addEventListener("click", downloadTimeClockCsv);
downloadCtHutReportCenterButton.addEventListener("click", downloadCtHutReportCsv);
addMaintenanceButton.addEventListener("click", openMaintenanceModal);
closeMaintenanceModalButton.addEventListener("click", closeMaintenanceModal);
cancelMaintenanceModalButton.addEventListener("click", closeMaintenanceModal);
deleteMaintenanceEntryButton.addEventListener("click", () => {
  handleDeleteMaintenanceEntry().catch((error) => setStatus(maintenanceFormNote, error.message, "status-bad"));
});
customerInvoiceButton.addEventListener("click", openRevenueModal);
managementRevenueButton.addEventListener("click", openRevenueModal);
closeRevenueModalButton.addEventListener("click", closeRevenueModal);
cancelRevenueModalButton.addEventListener("click", closeRevenueModal);
deleteRevenueEntryButton.addEventListener("click", () => {
  handleDeleteRevenueEntry().catch((error) => setStatus(revenueFormNote, error.message, "status-bad"));
});
closeTimeClockEditModalButton.addEventListener("click", closeTimeClockEditModal);
cancelTimeClockEditModalButton.addEventListener("click", closeTimeClockEditModal);
deleteTimeClockEntryButton.addEventListener("click", () => {
  handleDeleteTimeClockEntry().catch((error) => setStatus(timeClockEditNote, error.message, "status-bad"));
});

[fuelTableBody, timeClockTableBody, revenueTableBody, ctHutTableBody, maintenanceTableBody].forEach((tableBody) => {
  tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-edit-type]");
    if (!button) return;

    const key = button.dataset.entryKey;
    const editType = button.dataset.editType;

    if (editType === "fuel") openFuelEditModal(key);
    if (editType === "timeclock") openTimeClockEditModal(key);
    if (editType === "revenue") openRevenueEditModal(key);
    if (editType === "cthut") openCtHutEditModal(key);
    if (editType === "maintenance") openMaintenanceEditModal(key);
  });
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const password = document.getElementById("password").value;

  try {
    const { response, payload } = await fetchJson(`${API_BASE}/session`, {
      method: "POST",
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      setStatus(loginNote, payload?.error ?? "Unable to sign in.", "status-bad");
      return;
    }

    loginForm.reset();
    setStatus(loginNote, "Signed in. Confirming your session now.", "status-good");

    const session = await loadRemoteSession();

    if (!session?.authenticated) {
      setAuthRequired(true);
      setStatus(loginNote, "Password was accepted, but the session cookie did not stick on this domain.", "status-bad");
      return;
    }

    setAuthRequired(false);
    await loadRemoteDashboardData();
    await refreshWeatherBand(true);
  } catch (error) {
    setStatus(loginNote, error.message || "Sign-in failed. Check the password or Cloudflare setup.", "status-bad");
  }
});

fuelForm.addEventListener("submit", (event) => {
  handleFuelSubmit(event).catch((error) => setStatus(formNote, error.message, "status-bad"));
});

dutyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveDutyAction().catch((error) => setStatus(dutyNote, error.message, "status-bad"));
});

ctHutForm.addEventListener("submit", (event) => {
  handleCtHutSubmit(event).catch((error) => setStatus(ctHutNote, error.message, "status-bad"));
});

maintenanceForm.addEventListener("submit", (event) => {
  handleMaintenanceSubmit(event).catch((error) => setStatus(maintenanceFormNote, error.message, "status-bad"));
});

revenueForm.addEventListener("submit", (event) => {
  handleRevenueSubmit(event).catch((error) => setStatus(revenueFormNote, error.message, "status-bad"));
});

timeClockEditForm.addEventListener("submit", (event) => {
  handleTimeClockEditSubmit(event).catch((error) => setStatus(timeClockEditNote, error.message, "status-bad"));
});

refreshFuelSection();
refreshTimeClockSection();
refreshCtHutSection();
refreshMaintenanceSection();
refreshRevenueSection();
setActiveView("dashboard");
setManagementView("overview");
setWeeklyMode("70");
setCtHutRange("quarterly");
setReportRange("7");
updateBobtailState();
renderOverviewSection();

if (dashboardClockInterval) {
  clearInterval(dashboardClockInterval);
}

dashboardClockInterval = setInterval(() => {
  refreshDashboardClocks();
}, 30000);

refreshDashboardClocks();

if (storageMode === "remote") {
  bootstrapRemoteMode();
} else {
  setWeatherMessage("Weather shows from the live cloud app once location is available.", true);
}

if (weatherRefreshTimer) {
  clearInterval(weatherRefreshTimer);
}

weatherRefreshTimer = setInterval(() => {
  if (storageMode === "remote" && !document.body.classList.contains("auth-required")) {
    refreshWeatherBand().catch(() => {});
  }
}, 15 * 60 * 1000);







