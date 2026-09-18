import { Hono } from 'hono';
import { Env }  from '../../config/env';
import { buildContainer } from '../../config/container';

const internalRouter = new Hono<{ Bindings: Env }>();

/** Middleware: protege con CRON_SECRET */
internalRouter.use('*', async (c, next) => {
  const auth   = c.req.header('authorization') ?? '';
  const secret = c.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return c.json({ error: 'No autorizado' }, 401);
  }
  return next();
});

/** POST /api/v1/internal/sync-stations — disparado por el Cron Trigger */
internalRouter.post('/sync-stations', async (c) => {
  const container = buildContainer(c.env);
  const result    = await container.syncStationsFromMiteco.execute();

  // Guardar resultado en sync_log
  await c.env.DB
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

  const statusCode = result.status === 'ok' ? 200 : 500;
  return c.json(result, statusCode);
});

/** GET /api/v1/internal/sync-log — últimos 10 syncs */
internalRouter.get('/sync-log', async (c) => {
  const { results } = await c.env.DB
    .prepare('SELECT * FROM sync_log ORDER BY synced_at DESC LIMIT 10')
    .all();
  return c.json({ syncLog: results });
});

export { internalRouter };
