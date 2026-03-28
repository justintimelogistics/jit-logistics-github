const STORAGE_KEY = "jit-logistics-fuel-log";
const API_BASE = "/api";
const LOCAL_PROTOCOLS = new Set(["file:"]);

const openFuelModalButton = document.getElementById("openFuelModal");
const closeFuelModalButton = document.getElementById("closeFuelModal");
const cancelFuelModalButton = document.getElementById("cancelFuelModal");
const fuelModal = document.getElementById("fuelModal");
const fuelForm = document.getElementById("fuelForm");
const formNote = document.getElementById("formNote");
const fuelTableBody = document.getElementById("fuelTableBody");
const loginForm = document.getElementById("loginForm");
const loginNote = document.getElementById("loginNote");

const statTargets = {
  lastOdometer: document.getElementById("lastOdometer"),
  lastFuelCost: document.getElementById("lastFuelCost"),
  lastMpg: document.getElementById("lastMpg"),
  totalFuelSpend: document.getElementById("totalFuelSpend"),
};

let fuelEntries = loadFuelEntries();
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

function saveFuelEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fuelEntries));
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

async function bootstrapRemoteMode() {
  try {
    const session = await loadRemoteSession();

    if (!session?.authenticated) {
      setAuthRequired(true);
      return;
    }

    setAuthRequired(false);
    await loadRemoteFuelEntries();
  } catch (error) {
    storageMode = "local";
    saveFuelEntries();
    refreshDashboard();
    setStatus(loginNote, "Cloud sync is unavailable right now. The app is running in local mode on this device.", "status-bad");
    setAuthRequired(false);
  }
}

openFuelModalButton.addEventListener("click", openFuelModal);
closeFuelModalButton.addEventListener("click", closeFuelModal);
cancelFuelModalButton.addEventListener("click", closeFuelModal);

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
  } catch (error) {
    setStatus(loginNote, "Sign-in failed. Check the password or Cloudflare setup.", "status-bad");
  }
});

fuelForm.addEventListener("submit", (event) => {
  handleFuelSubmit(event).catch((error) => {
    setStatus(formNote, error.message, "status-bad");
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

refreshDashboard();

if (storageMode === "remote") {
  bootstrapRemoteMode();
}
