-- Reportes de la comunidad sobre estaciones
CREATE TABLE IF NOT EXISTS station_reports (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id    TEXT    NOT NULL,
  station_id   TEXT    NOT NULL REFERENCES stations(id),
  report_type  TEXT    NOT NULL CHECK(report_type IN (
                 'closed_permanently',
                 'wrong_price',
                 'services_correction',
                 'other'
               )),
  details      TEXT,
  status       TEXT    NOT NULL DEFAULT 'pending'
                 CHECK(status IN ('pending', 'reviewed', 'applied')),
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reports_station ON station_reports(station_id);
CREATE INDEX IF NOT EXISTS idx_reports_status  ON station_reports(status);