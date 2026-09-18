-- Estaciones de gasolina (sincronizadas desde MITECO)
CREATE TABLE IF NOT EXISTS stations (
  id                    TEXT PRIMARY KEY,
  name                  TEXT NOT NULL,
  brand                 TEXT NOT NULL,
  latitude              REAL NOT NULL,
  longitude             REAL NOT NULL,
  address               TEXT,
  postal_code           TEXT,
  locality              TEXT,
  province              TEXT,
  schedule_raw          TEXT,
  is_open_24h           INTEGER NOT NULL DEFAULT 0,
  -- Servicios (actualizados via reportes de comunidad)
  has_car_wash          INTEGER NOT NULL DEFAULT 0,
  has_store             INTEGER NOT NULL DEFAULT 0,
  has_cafe              INTEGER NOT NULL DEFAULT 0,
  has_ev_charger        INTEGER NOT NULL DEFAULT 0,
  has_air_pump          INTEGER NOT NULL DEFAULT 0,
  -- Precios actuales en €/litro (NULL = no disponible)
  price_gasolina_95     REAL,
  price_gasolina_98     REAL,
  price_gasoleo_a       REAL,
  price_gasoleo_premium REAL,
  price_gasoleo_b       REAL,
  price_glp             REAL,
  price_gnc             REAL,
  price_gnl             REAL,
  price_hidrogeno       REAL,
  last_synced           TEXT NOT NULL,
  created_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_stations_lat    ON stations(latitude);
CREATE INDEX IF NOT EXISTS idx_stations_lng    ON stations(longitude);
CREATE INDEX IF NOT EXISTS idx_stations_brand  ON stations(brand);
CREATE INDEX IF NOT EXISTS idx_stations_local  ON stations(locality);
CREATE INDEX IF NOT EXISTS idx_stations_postal ON stations(postal_code);