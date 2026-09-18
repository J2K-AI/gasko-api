-- Historial diario de precios (un registro por estacion+combustible+dia)
CREATE TABLE IF NOT EXISTS price_history (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  station_id    TEXT    NOT NULL REFERENCES stations(id),
  fuel_type     TEXT    NOT NULL,
  price         REAL    NOT NULL,
  recorded_date TEXT    NOT NULL,  -- formato YYYY-MM-DD
  recorded_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(station_id, fuel_type, recorded_date)
);

CREATE INDEX IF NOT EXISTS idx_ph_station ON price_history(station_id, fuel_type, recorded_date);