-- Favoritos por dispositivo (autenticación anónima via deviceId)
CREATE TABLE IF NOT EXISTS favorites (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id  TEXT    NOT NULL,
  station_id TEXT    NOT NULL REFERENCES stations(id),
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(device_id, station_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_device ON favorites(device_id);