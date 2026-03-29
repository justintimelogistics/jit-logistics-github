const STORAGE_KEY = "jit-logistics-fuel-log";
const TIME_CLOCK_STORAGE_KEY = "jit-logistics-time-clock-log";
const API_BASE = "/api";
const LOCAL_PROTOCOLS = new Set(["file:"]);

const navButtons = Array.from(document.querySelectorAll("[data-view]"));
const pages = Array.from(document.querySelectorAll("[data-page]"));
const openFuelModalButton = document.getElementById("openFuelModal");
const closeFuelModalButton = document.getElementById("closeFuelModal");
const cancelFuelModalButton = document.getElementById("cancelFuelModal");
const fuelModal = document.getElementById("fuelModal");
const fuelForm = document.getElementById("fuelForm");
const formNote = document.getElementById("formNote");
const fuelTableBody = document.getElementById("fuelTableBody");
const openPunchInModalButton = document.getElementById("openPunchInModal");
const closePunchInModalButton = document.getElementById("closePunchInModal");
const cancelPunchInModalButton = document.getElementById("cancelPunchInModal");
const punchOutButton = document.getElementById("punchOutButton");
const punchInModal = document.getElementById("punchInModal");
const punchInForm = document.getElementById("punchInForm");
const punchInNote = document.getElementById("punchInNote");
const timeClockTableBody = document.getElementById("timeClockTableBody");
const timeClockStatus = document.getElementById("timeClockStatus");
const timeClockSummary = document.getElementById("timeClockSummary");
const timeClockNote = document.getElementById("timeClockNote");
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

if (storageMode === "remote") {
  setAuthRequired(true);
}

function setAuthRequired(isRequired) {
  document.body.classList.toggle("auth-required", isRequired);
}

function setStatus(target, message, statusClass) {
  target.textContent = message;
  target.classList.remove("status-good", "status-bad");

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

function getLastEntry() {
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

function getLastTimeClockEntry() {
  return timeClockEntries[0] ?? null;
}

function getCurrentShiftEntry() {
  const latestEntry = getLastTimeClockEntry();
  return latestEntry && latestEntry.action === "IN" ? latestEntry : null;
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

function updateFormNote() {
  const lastEntry = getLastEntry();

  if (!lastEntry) {
    formNote.textContent = "The first entry sets your starting point. MPG starts calculating from the second fuel stop.";
    formNote.classList.remove("status-good");
    formNote.classList.remove("status-bad");
    return;
  }

  formNote.textContent = `Last fuel stop was at ${formatNumber(lastEntry.odometer)} miles. New MPG will calculate from that reading.`;
  formNote.classList.add("status-good");
  formNote.classList.remove("status-bad");
}

function renderStats() {
  const lastEntry = getLastEntry();
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

function renderTable() {
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

function renderTimeClockStatus() {
  const currentShift = getCurrentShiftEntry();

  if (!currentShift) {
    timeClockStatus.textContent = "Ready to start the day.";
    timeClockSummary.textContent = "Punch in to log the truck and destination. Punch out when the run or shift ends.";
    timeClockNote.textContent = "No active shift yet.";
    timeClockNote.classList.remove("status-good", "status-bad");
    return;
  }

  timeClockStatus.textContent = `Clocked in on truck ${currentShift.truckId}.`;
  timeClockSummary.textContent = `Current destination: ${currentShift.destination}. Started ${formatDateTime(currentShift.createdAt)}.`;
  timeClockNote.textContent = "Active shift running. Use Punch Out when the job ends.";
  timeClockNote.classList.add("status-good");
  timeClockNote.classList.remove("status-bad");
}

function renderTimeClockTable() {
  if (timeClockEntries.length === 0) {
    timeClockTableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="4">No time clock entries yet. Punch in to start tracking.</td>
      </tr>
    `;
    return;
  }

  timeClockTableBody.innerHTML = timeClockEntries
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

function refreshTimeClock() {
  renderTimeClockStatus();
  renderTimeClockTable();
}

function refreshDashboard() {
  renderStats();
  renderTable();
  updateFormNote();
}

function openFuelModal() {
  fuelModal.showModal();
  updateFormNote();
}

function closeFuelModal() {
  fuelModal.close();
  fuelForm.reset();
  updateFormNote();
}

function openPunchInModal() {
  const currentShift = getCurrentShiftEntry();

  if (currentShift) {
    setStatus(punchInNote, `Truck ${currentShift.truckId} is already punched in. Punch out first.`, "status-bad");
    return;
  }

  setStatus(punchInNote, "Punching in starts an active shift for the latest driver using this shared app.", "");
  punchInModal.showModal();
}

function closePunchInModal() {
  punchInModal.close();
  punchInForm.reset();
  setStatus(punchInNote, "Punching in starts an active shift for the latest driver using this shared app.", "");
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
  refreshDashboard();
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
  refreshTimeClock();
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
  refreshDashboard();
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
  refreshTimeClock();
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
    refreshDashboard();
    refreshTimeClock();
    setStatus(loginNote, "Cloud sync is unavailable right now. The app is running in local mode on this device.", "status-bad");
    setAuthRequired(false);
  }
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveView(button.dataset.view);
  });
});

openFuelModalButton.addEventListener("click", openFuelModal);
closeFuelModalButton.addEventListener("click", closeFuelModal);
cancelFuelModalButton.addEventListener("click", closeFuelModal);
openPunchInModalButton.addEventListener("click", openPunchInModal);
closePunchInModalButton.addEventListener("click", closePunchInModal);
cancelPunchInModalButton.addEventListener("click", closePunchInModal);

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
    setStatus(loginNote, "Signed in. Loading your shared fuel log now.", "status-good");
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

punchInForm.addEventListener("submit", (event) => {
  handlePunchInSubmit(event).catch((error) => {
    setStatus(punchInNote, error.message, "status-bad");
  });
});

punchOutButton.addEventListener("click", () => {
  handlePunchOut().catch((error) => {
    setStatus(timeClockNote, error.message, "status-bad");
  });
});

async function handleFuelSubmit(event) {
  event.preventDefault();

  const odometer = Number(document.getElementById("currentMile").value);
  const gallons = Number(document.getElementById("fuelAmount").value);
  const pricePerGallon = Number(document.getElementById("fuelPrice").value);

  if (odometer <= 0 || gallons <= 0 || pricePerGallon <= 0) {
    setStatus(formNote, "All values need to be greater than zero.", "status-bad");
    return;
  }

  const previousEntry = getLastEntry();

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
    refreshDashboard();
  }

  closeFuelModal();
}

async function handlePunchInSubmit(event) {
  event.preventDefault();

  const truckId = document.getElementById("truckId").value.trim();
  const destination = document.getElementById("destination").value.trim();

  if (!truckId || !destination) {
    setStatus(punchInNote, "Truck ID and destination are both required.", "status-bad");
    return;
  }

  if (getCurrentShiftEntry()) {
    setStatus(punchInNote, "There is already an active shift. Punch out first.", "status-bad");
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
    refreshTimeClock();
  }

  closePunchInModal();
}

async function handlePunchOut() {
  const currentShift = getCurrentShiftEntry();

  if (!currentShift) {
    setStatus(timeClockNote, "Nobody is currently punched in.", "status-bad");
    return;
  }

  const newEntry = {
    action: "OUT",
    truckId: currentShift.truckId,
    destination: currentShift.destination,
  };

  if (storageMode === "remote") {
    await saveRemoteTimeClockEntry(newEntry);
  } else {
    timeClockEntries.unshift({
      createdAt: new Date().toISOString(),
      ...newEntry,
    });
    saveTimeClockEntries();
    refreshTimeClock();
  }

  setStatus(timeClockNote, "Shift punched out successfully.", "status-good");
}

refreshDashboard();
refreshTimeClock();
setActiveView("dashboard");

if (storageMode === "remote") {
  bootstrapRemoteMode();
}
