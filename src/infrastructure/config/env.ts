/** Variables de entorno y bindings del Worker */
export interface Env {
  /** Cloudflare D1 — base de datos SQLite */
  DB: D1Database;
  /** Cloudflare KV — caché de respuestas */
  STATIONS_CACHE: KVNamespace;
  /** Secret para proteger endpoints internos del cron */
  CRON_SECRET: string;
  /** Entorno: 'production' | 'development' */
  ENV?: string;
}
