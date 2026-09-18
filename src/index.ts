import { Hono }     from 'hono';
import { cors }     from 'hono/cors';
import { logger }   from 'hono/logger';
import { Env }      from './infrastructure/config/env';
import { buildContainer }  from './infrastructure/config/container';
import { stationsRouter }  from './infrastructure/adapters/inbound/stationsRouter';
import { favoritesRouter } from './infrastructure/adapters/inbound/favoritesRouter';
import { reportsRouter }   from './infrastructure/adapters/inbound/reportsRouter';
import { internalRouter }  from './infrastructure/adapters/inbound/internalRouter';

const app = new Hono<{ Bindings: Env }>();

// ── Middleware global ────────────────────────────────────────────────────────
app.use('*', logger());
app.use('*', cors({
  origin: '*',          // En producción, limitar a tu dominio
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-Device-Id', 'Authorization'],
}));

// ── Rutas ────────────────────────────────────────────────────────────────────
app.route('/api/v1/stations', stationsRouter);
app.route('/api/v1/favorites', favoritesRouter);
app.route('/api/v1/stations', reportsRouter);   // POST /:id/reports
app.route('/api/v1/internal', internalRouter);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/', (c) => c.json({ service: 'gasko-api', version: '1.0.0', status: 'ok' }));

// ── Error handler global ──────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error('[ERROR]', err);
  return c.json({ error: 'Error interno del servidor' }, 500);
});

app.notFound((c) => c.json({ error: 'Ruta no encontrada' }, 404));

// ── Exportaciones del Worker ──────────────────────────────────────────────────
export default {
  /** Maneja peticiones HTTP */
  fetch: app.fetch,

  /**
   * Cron Trigger: se ejecuta cada 15 minutos (configurado en wrangler.toml).
   * Sincroniza las estaciones de MITECO → D1 y registra historial de precios.
   */
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      (async () => {
        console.log('[CRON] Iniciando sync de estaciones desde MITECO...');
        const container = buildContainer(env);
        const result    = await container.syncStationsFromMiteco.execute();

        // Guardar resultado en sync_log
        await env.DB
          .prepare(
            `INSERT INTO sync_log (stations_synced, prices_recorded, duration_ms, status, error_msg)
             VALUES (?, ?, ?, ?, ?)`,
          )
          .bind(
            result.stationsSynced,
            result.pricesRecorded,
            result.durationMs,
            result.status,
            result.errorMsg ?? null,
          )
          .run();

        console.log(`[CRON] Sync completado: ${JSON.stringify(result)}`);
      })(),
    );
  },
};
