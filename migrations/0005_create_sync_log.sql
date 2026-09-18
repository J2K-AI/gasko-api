-- Auditoría de sincronizaciones con MITECO
CREATE TABLE IF NOT EXISTS sync_log (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  stations_synced  INTEGER,
  prices_recorded  INTEGER,
  duration_ms      INTEGER,
  status           TEXT NOT NULL CHECK(status IN ('ok', 'error')),
  error_msg        TEXT,
  synced_at        TEXT NOT NULL DEFAULT (datetime('now'))
);