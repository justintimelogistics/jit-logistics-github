const STORAGE_KEY = "jit-logistics-fuel-log";
const TIME_CLOCK_STORAGE_KEY = "jit-logistics-time-clock-log";
const API_BASE = "/api";
const LOCAL_PROTOCOLS = new Set(["file:"]);
const HOUR_MS = 60 * 60 * 1000;

const navButtons = Array.from(document.querySelectorAll("[data-view]"));
const pages = Array.from(document.querySelectorAll("[data-page]"));
const managementTabs = Array.from(document.querySelectorAll("[data-management-view]"));
const managementPages = Array.from(document.querySelectorAll("[data-management-page]"));
const weeklyModeButtons = Array.from(document.querySelectorAll("[data-weekly-mode]"));

const dashboardAddFuelButton = document.getElementById("dashboardAddFuelButton");
const managementAddFuelButton = document.getElementById("managementAddFuelButton");
const ctHutButton = document.getElementById("ctHutButton");
const closeFuelModalButton = document.getElementById("closeFuelModal");
const cancelFuelModalButton = document.getElementById("cancelFuelModal");
const fuelModal = document.getElementById("fuelModal");
const fuelForm = document.getElementById("fuelForm");
const formNote = document.getElementById("formNote");
const fuelTableBody = document.getElementById("fuelTableBody");

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
const truckIdInput = document.getElementById("truckId");
const destinationInput = document.getElementById("destination");
const managementPunchOutButton = document.getElementById("managementPunchOutButton");
const timeClockTableBody = document.getElementById("timeClockTableBody");
const timeClockNote = document.getElementById("timeClockNote");

const warningBar = document.getElementById("warningBar");
const warningText = document.getElementById("warningText");
const driverStatusTitle = document.getElementById("driverStatusTitle");
const driverStatusCopy = document.getElementById("driverStatusCopy");
const driverStatusNote = document.getElementById("driverStatusNote");

const dutyGauge = document.getElementById("dutyGauge");
const dutyGaugeValue = document.getElementById("dutyGaugeValue");
const dutyGaugeMeta = document.getElementById("dutyGaugeMeta");
const breakGauge = document.getElementById("breakGauge");
const breakGaugeValue = document.getElementById("breakGaugeValue");
const breakGaugeMeta = document.getElementById("breakGaugeMeta");
const weeklyGauge = document.getElementById("weeklyGauge");
const weeklyGaugeLabel = document.getElementById("weeklyGaugeLabel");
const weeklyGaugeValue = document.getElementById("weeklyGaugeValue");
const weeklyGaugeMeta = document.getElementById("weeklyGaugeMeta");

const dashboardLastFuelCost = document.getElementById("dashboardLastFuelCost");
const dashboardLastMpg = document.getElementById("dashboardLastMpg");
const dashboardTotalFuelSpend = document.getElementById("dashboardTotalFuelSpend");

const loginForm = document.getElementById("loginForm");
const loginNote = document.getElementById("loginNote");

const statTargets = {
  lastOdometer: document.getElementById("lastOdometer"),
  lastFuelCost: document.getElementById("lastFuelCost"),
  lastMpg: document.getElementById("lastMpg"),
  totalFuelSpend: document.getElementById("totalFuelSpend"),
};

let fuelEntries = loadFuelEntries();
let timeClockEntries = loadTimeClockEntries();
let storageMode = LOCAL_PROTOCOLS.has(window.location.protocol) ? "local" : "remote";
let weeklyMode = "70";
let dutyAction = "IN";
let dashboardClockInterval = null;
let requiresBreakAcknowledgement = false;

if (storageMode === "remote") {
  setAuthRequired(true);
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

function loadFuelEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function loadTimeClockEntries() {
  try {
    const raw = localStorage.getItem(TIME_CLOCK_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveFuelEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fuelEntries));
}

function saveTimeClockEntries() {
  localStorage.setItem(TIME_CLOCK_STORAGE_KEY, JSON.stringify(timeClockEntries));
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
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

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatNumber(value, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits,
  }).format(value);
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

function formatDuration(ms) {
  const safeMs = Math.max(0, ms);
  const totalMinutes = Math.floor(safeMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}`;
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
  dashboardTotalFuelSpend.textContent = formatCurrency(totalFuelSpend);

  if (!lastEntry) {
    statTargets.lastOdometer.textContent = "--";
    statTargets.lastFuelCost.textContent = "--";
    statTargets.lastMpg.textContent = "--";
    dashboardLastFuelCost.textContent = "--";
    dashboardLastMpg.textContent = "--";
    return;
  }

  statTargets.lastOdometer.textContent = formatNumber(lastEntry.odometer);
  statTargets.lastFuelCost.textContent = formatCurrency(lastEntry.totalCost);
  statTargets.lastMpg.textContent = lastEntry.mpg ? formatNumber(lastEntry.mpg, 2) : "Pending";
  dashboardLastFuelCost.textContent = formatCurrency(lastEntry.totalCost);
  dashboardLastMpg.textContent = lastEntry.mpg ? formatNumber(lastEntry.mpg, 2) : "Pending";
}

function renderFuelTable() {
  if (fuelEntries.length === 0) {
    fuelTableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="6">No fuel entries yet. Use the Add Fuel button to log the first stop.</td>
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
      </tr>
    `)
    .join("");
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
        <td>${entry.truckId || "--"}</td>
        <td>${entry.destination || "--"}</td>
      </tr>
    `)
    .join("");
}

function setGaugeState(element, progress, color) {
  const normalized = Math.min(Math.max(progress, 0), 1);
  element.style.setProperty("--gauge-progress", normalized.toString());
  element.style.setProperty("--gauge-color", color);
}

function getBlueYellowRedColor(ratioRemaining) {
  if (ratioRemaining >= 0.5) {
    return "var(--blue)";
  }

  if (ratioRemaining >= 0.2) {
    return "var(--amber)";
  }

  return "var(--red)";
}

function buildDutyIntervals(entries, nowMs) {
  const intervals = [];
  let activeStart = null;
  let activeTruckId = "";
  let activeDestination = "";

  entries.forEach((entry) => {
    if (entry.action === "IN") {
      activeStart = entry.createdAtMs;
      activeTruckId = entry.truckId;
      activeDestination = entry.destination;
      return;
    }

    if (entry.action === "OUT" && activeStart != null) {
      intervals.push({
        start: activeStart,
        end: entry.createdAtMs,
        truckId: activeTruckId,
        destination: activeDestination,
      });
      activeStart = null;
      activeTruckId = "";
      activeDestination = "";
    }
  });

  if (activeStart != null) {
    intervals.push({
      start: activeStart,
      end: nowMs,
      truckId: activeTruckId,
      destination: activeDestination,
      active: true,
    });
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

  return {
    entries,
    intervals,
    lastEntry,
    lastIn,
    lastOut,
    onDuty,
    offDutyMs,
    dutyWindowStart,
    activeDutyWindowStart,
    tenHourResetMet,
    resetBoundaryMs,
  };
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
  const weeklyWindowStart = nowMs - weeklyDays * 24 * HOUR_MS;
  const weeklyBoundary = Math.max(weeklyWindowStart, timeClockState.resetBoundaryMs ?? 0);
  const weeklyUsedMs = timeClockState.resetBoundaryMs === nowMs
    ? 0
    : sumIntervalOverlap(timeClockState.intervals, weeklyBoundary, nowMs);
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
  };
}

function refreshDashboardClocks() {
  const state = getDashboardClockState();
  const warningMessages = [];

  const dutyColor = getBlueYellowRedColor(state.dutyProgress);
  setGaugeState(dutyGauge, state.dutyProgress, dutyColor);
  dutyGaugeValue.textContent = formatDuration(state.dutyRemainingMs);
  dutyGaugeMeta.textContent = state.dutyLabel;

  const breakColor = state.breakMet ? "var(--blue)" : "var(--red)";
  setGaugeState(breakGauge, state.breakProgress, breakColor);
  breakGaugeValue.textContent = formatDuration(Math.min(state.offDutyMs, 10 * HOUR_MS));
  breakGaugeMeta.textContent = state.onDuty
    ? "Break clock resets while on duty"
    : state.breakMet
      ? "Break reset complete"
      : "Off-duty break building";

  const weeklyRatio = state.weeklyRemainingMs / (state.weeklyHours * HOUR_MS);
  const weeklyColor = getBlueYellowRedColor(weeklyRatio);
  setGaugeState(weeklyGauge, weeklyRatio, weeklyColor);
  weeklyGaugeLabel.textContent = `${state.weeklyHours} HR`;
  weeklyGaugeValue.textContent = formatDuration(state.weeklyRemainingMs);
  weeklyGaugeMeta.textContent = `${state.weeklyDays}-day window`;

  if (state.onDuty) {
    driverStatusTitle.textContent = "On duty";
    driverStatusCopy.textContent = `Current shift started ${formatDateTime(state.lastIn.createdAt)}.`;
    driverStatusNote.textContent = `Truck ${state.lastIn.truckId || "--"} heading to ${state.lastIn.destination || "--"}.`;
    setStatus(timeClockNote, "Active shift running.", "status-good");
  } else if (state.lastOut) {
    driverStatusTitle.textContent = state.breakMet ? "Reset ready" : "Off duty";
    driverStatusCopy.textContent = state.breakMet
      ? "Your 10-hour break has been met. The next punch in will start a fresh 14-hour window."
      : `Off duty since ${formatDateTime(state.lastOut.createdAt)}.`;
    driverStatusNote.textContent = state.lastOut.truckId
      ? `Last truck ${state.lastOut.truckId} for ${state.lastOut.destination}.`
      : "Last duty entry recorded.";
    setStatus(timeClockNote, state.breakMet ? "10-hour reset met." : "Off-duty break running.", state.breakMet ? "status-good" : "status-info");
  } else {
    driverStatusTitle.textContent = "Off duty";
    driverStatusCopy.textContent = "Punch in from the 14-hour clock when you are ready to start.";
    driverStatusNote.textContent = "No active truck assigned.";
    setStatus(timeClockNote, "No active shift yet.", "status-info");
  }

  if (!state.onDuty && state.lastOut && !state.breakMet) {
    warningMessages.push(`10-hour break not met yet. You still need ${formatDuration(10 * HOUR_MS - state.offDutyMs)} off duty.`);
  }

  if (state.weeklyExceeded) {
    warningMessages.push(`${state.weeklyHours}-hour weekly clock has been exceeded.`);
  }

  if (warningMessages.length > 0) {
    warningBar.hidden = false;
    warningText.textContent = warningMessages.join(" ");
  } else {
    warningBar.hidden = true;
    warningText.textContent = "";
  }

  dutyAction = state.onDuty ? "OUT" : "IN";
  return state;
}

function refreshFuelSection() {
  renderFuelStats();
  renderFuelTable();
  updateFormNote();
}

function refreshTimeClockSection() {
  renderTimeClockTable();
  refreshDashboardClocks();
}

function openFuelModal() {
  updateFormNote();
  fuelModal.showModal();
}

function closeFuelModal() {
  fuelModal.close();
  fuelForm.reset();
  updateFormNote();
}

function updateDutyGateState() {
  punchInFields.hidden = requiresBreakAcknowledgement;
  truckIdInput.disabled = requiresBreakAcknowledgement;
  destinationInput.disabled = requiresBreakAcknowledgement;
}

function openDutyModal() {
  const state = refreshDashboardClocks();
  dutyAction = state.onDuty ? "OUT" : "IN";
  const tryingToClockIn = dutyAction === "IN";
  requiresBreakAcknowledgement = Boolean(tryingToClockIn && state.lastOut && !state.breakMet);

  dutyWarningGate.hidden = !requiresBreakAcknowledgement;
  punchOutFields.hidden = tryingToClockIn;
  truckIdInput.required = tryingToClockIn;
  destinationInput.required = tryingToClockIn;

  if (tryingToClockIn) {
    dutyModalTitle.textContent = "Punch In";
    dutySubmitButton.textContent = "Save Punch In";

    if (state.weeklyExceeded) {
      setStatus(dutyNote, `${state.weeklyHours}-hour weekly clock is already exceeded. Fix before driving.`, "status-bad");
    } else if (requiresBreakAcknowledgement) {
      dutyWarningText.textContent = `Your 10-hour break is short by ${formatDuration(10 * HOUR_MS - state.offDutyMs)}. Acknowledge this before continuing.`;
      setStatus(dutyNote, "Acknowledge the short break warning before entering truck details.", "status-bad");
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
  truckIdInput.disabled = false;
  destinationInput.disabled = false;
  requiresBreakAcknowledgement = false;
  setStatus(dutyNote, "Tap save to log the next duty action.", "status-info");
}

async function loadRemoteSession() {
  const { response, payload } = await fetchJson(`${API_BASE}/session`);

  if (!response.ok) {
    throw new Error(payload?.error ?? "Unable to check session.");
  }

  return payload;
}

async function loadRemoteFuelEntries() {
  const { response, payload } = await fetchJson(`${API_BASE}/fuel`);

  if (response.status === 401) {
    setAuthRequired(true);
    return;
  }

  if (!response.ok) {
    throw new Error(payload?.error ?? "Unable to load fuel entries.");
  }

  fuelEntries = Array.isArray(payload?.entries) ? payload.entries : [];
  refreshFuelSection();
}

async function loadRemoteTimeClockEntries() {
  const { response, payload } = await fetchJson(`${API_BASE}/timeclock`);

  if (response.status === 401) {
    setAuthRequired(true);
    return;
  }

  if (!response.ok) {
    throw new Error(payload?.error ?? "Unable to load time clock entries.");
  }

  timeClockEntries = Array.isArray(payload?.entries) ? payload.entries : [];
  refreshTimeClockSection();
}

async function saveRemoteFuelEntry(entry) {
  const { response, payload } = await fetchJson(`${API_BASE}/fuel`, {
    method: "POST",
    body: JSON.stringify(entry),
  });

  if (response.status === 401) {
    setAuthRequired(true);
    throw new Error("Your session expired. Sign in again.");
  }

  if (!response.ok) {
    throw new Error(payload?.error ?? "Unable to save fuel entry.");
  }

  fuelEntries = Array.isArray(payload?.entries) ? payload.entries : fuelEntries;
  refreshFuelSection();
}

async function saveRemoteTimeClockEntry(entry) {
  const { response, payload } = await fetchJson(`${API_BASE}/timeclock`, {
    method: "POST",
    body: JSON.stringify(entry),
  });

  if (response.status === 401) {
    setAuthRequired(true);
    throw new Error("Your session expired. Sign in again.");
  }

  if (!response.ok) {
    throw new Error(payload?.error ?? "Unable to save time clock entry.");
  }

  timeClockEntries = Array.isArray(payload?.entries) ? payload.entries : timeClockEntries;
  refreshTimeClockSection();
}

async function bootstrapRemoteMode() {
  try {
    const session = await loadRemoteSession();

    if (!session?.authenticated) {
      setAuthRequired(true);
      return;
    }

    setAuthRequired(false);
    await loadRemoteFuelEntries();
    await loadRemoteTimeClockEntries();
  } catch (error) {
    storageMode = "local";
    saveFuelEntries();
    saveTimeClockEntries();
    refreshFuelSection();
    refreshTimeClockSection();
    setStatus(loginNote, "Cloud sync is unavailable right now. The app is running in local mode on this device.", "status-bad");
    setAuthRequired(false);
  }
}

async function handleFuelSubmit(event) {
  event.preventDefault();

  const odometer = Number(document.getElementById("currentMile").value);
  const gallons = Number(document.getElementById("fuelAmount").value);
  const pricePerGallon = Number(document.getElementById("fuelPrice").value);

  if (odometer <= 0 || gallons <= 0 || pricePerGallon <= 0) {
    setStatus(formNote, "All values need to be greater than zero.", "status-bad");
    return;
  }

  const previousEntry = getLastFuelEntry();

  if (previousEntry && odometer <= previousEntry.odometer) {
    setStatus(formNote, `Current mile must be higher than the last logged odometer of ${formatNumber(previousEntry.odometer)}.`, "status-bad");
    return;
  }

  const mpg = calculateMpg(odometer, previousEntry, gallons);
  const totalCost = gallons * pricePerGallon;
  const newEntry = {
    odometer,
    gallons,
    pricePerGallon,
    totalCost,
    mpg,
  };

  if (storageMode === "remote") {
    await saveRemoteFuelEntry(newEntry);
  } else {
    fuelEntries.unshift({
      createdAt: new Date().toISOString(),
      ...newEntry,
    });
    saveFuelEntries();
    refreshFuelSection();
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

    const truckId = truckIdInput.value.trim();
    const destination = destinationInput.value.trim();

    if (!truckId || !destination) {
      setStatus(dutyNote, "Truck ID and destination are both required.", "status-bad");
      return;
    }

    const newEntry = {
      action: "IN",
      truckId,
      destination,
    };

    if (storageMode === "remote") {
      await saveRemoteTimeClockEntry(newEntry);
    } else {
      timeClockEntries.unshift({
        createdAt: new Date().toISOString(),
        ...newEntry,
      });
      saveTimeClockEntries();
      refreshTimeClockSection();
    }

    closeDutyModal();
    return;
  }

  if (!state.onDuty || !state.lastIn) {
    setStatus(dutyNote, "Nobody is currently punched in.", "status-bad");
    return;
  }

  const newEntry = {
    action: "OUT",
    truckId: state.lastIn.truckId,
    destination: state.lastIn.destination,
  };

  if (storageMode === "remote") {
    await saveRemoteTimeClockEntry(newEntry);
  } else {
    timeClockEntries.unshift({
      createdAt: new Date().toISOString(),
      ...newEntry,
    });
    saveTimeClockEntries();
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

  const newEntry = {
    action: "OUT",
    truckId: state.lastIn.truckId,
    destination: state.lastIn.destination,
  };

  if (storageMode === "remote") {
    await saveRemoteTimeClockEntry(newEntry);
  } else {
    timeClockEntries.unshift({
      createdAt: new Date().toISOString(),
      ...newEntry,
    });
    saveTimeClockEntries();
    refreshTimeClockSection();
  }

  setStatus(timeClockNote, "Shift punched out successfully.", "status-good");
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveView(button.dataset.view);
  });
});

managementTabs.forEach((button) => {
  button.addEventListener("click", () => {
    setManagementView(button.dataset.managementView);
  });
});

weeklyModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setWeeklyMode(button.dataset.weeklyMode);
  });
});

dashboardAddFuelButton.addEventListener("click", openFuelModal);
managementAddFuelButton.addEventListener("click", openFuelModal);
closeFuelModalButton.addEventListener("click", closeFuelModal);
cancelFuelModalButton.addEventListener("click", closeFuelModal);
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
  handleManagementPunchOut().catch((error) => {
    setStatus(timeClockNote, error.message, "status-bad");
  });
});
ctHutButton.addEventListener("click", () => {
  warningBar.hidden = false;
  warningText.textContent = "CT Hut is parked here as the next dashboard action. We can wire the form after the timer layout is settled.";
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
    setStatus(loginNote, "Signed in. Loading your dashboard now.", "status-good");
    setAuthRequired(false);
    await loadRemoteFuelEntries();
    await loadRemoteTimeClockEntries();
  } catch (error) {
    setStatus(loginNote, "Sign-in failed. Check the password or Cloudflare setup.", "status-bad");
  }
});

fuelForm.addEventListener("submit", (event) => {
  handleFuelSubmit(event).catch((error) => {
    setStatus(formNote, error.message, "status-bad");
  });
});

dutyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveDutyAction().catch((error) => {
    setStatus(dutyNote, error.message, "status-bad");
  });
});

refreshFuelSection();
renderTimeClockTable();
setActiveView("dashboard");
setManagementView("fuel");
setWeeklyMode("70");

if (dashboardClockInterval) {
  clearInterval(dashboardClockInterval);
}

dashboardClockInterval = setInterval(() => {
  refreshDashboardClocks();
}, 30000);

refreshDashboardClocks();

if (storageMode === "remote") {
  bootstrapRemoteMode();
}
