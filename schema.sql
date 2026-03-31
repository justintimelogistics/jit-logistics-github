CREATE TABLE IF NOT EXISTS fuel_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  odometer INTEGER NOT NULL,
  gallons REAL NOT NULL,
  price_per_gallon REAL NOT NULL,
  total_cost REAL NOT NULL,
  mpg REAL
);

CREATE INDEX IF NOT EXISTS idx_fuel_entries_odometer
ON fuel_entries (odometer DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS time_clock_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  action TEXT NOT NULL,
  truck_id TEXT NOT NULL,
  destination TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_time_clock_entries_created_at
ON time_clock_entries (created_at DESC, id DESC);
