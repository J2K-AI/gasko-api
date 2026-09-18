import { Hono } from 'hono';
import { Env }  from '../../config/env';
import { buildContainer } from '../../config/container';

const favoritesRouter = new Hono<{ Bindings: Env }>();

function getDeviceId(c: { req: { header: (h: string) => string | undefined } }): string | null {
  return c.req.header('x-device-id') ?? null;
}

/** GET /api/v1/favorites */
favoritesRouter.get('/', async (c) => {
  const deviceId = getDeviceId(c);
  if (!deviceId) return c.json({ error: 'Header X-Device-Id obligatorio' }, 401);

  const container   = buildContainer(c.env);
  const favorites   = await container.getFavorites.execute(deviceId);
  return c.json({ favorites });
});

/** POST /api/v1/favorites */
favoritesRouter.post('/', async (c) => {
  const deviceId = getDeviceId(c);
  if (!deviceId) return c.json({ error: 'Header X-Device-Id obligatorio' }, 401);

  let body: { stationId?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Body JSON inválido' }, 400);
  }

  if (!body.stationId) return c.json({ error: 'stationId es obligatorio' }, 400);

  const container = buildContainer(c.env);
  const favorite  = await container.addFavorite.execute(deviceId, body.stationId);
  return c.json({ favorite }, 201);
});

/** DELETE /api/v1/favorites/:stationId */
favoritesRouter.delete('/:stationId', async (c) => {
  const deviceId  = getDeviceId(c);
  if (!deviceId) return c.json({ error: 'Header X-Device-Id obligatorio' }, 401);

  const stationId = c.req.param('stationId');
  const container = buildContainer(c.env);
  const removed   = await container.removeFavorite.execute(deviceId, stationId);

  if (!removed) return c.json({ error: 'Favorito no encontrado' }, 404);
  return c.json({ success: true });
});

export { favoritesRouter };
