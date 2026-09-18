import { Hono } from 'hono';
import { Env }  from '../../config/env';
import { buildContainer } from '../../config/container';
import { FuelType } from '../../../core/domain/models/FuelType';

const stationsRouter = new Hono<{ Bindings: Env }>();

/** GET /api/v1/stations/nearby */
stationsRouter.get('/nearby', async (c) => {
  const lat    = parseFloat(c.req.query('lat') ?? '');
  const lng    = parseFloat(c.req.query('lng') ?? '');
  const radius = parseInt(c.req.query('radius') ?? '10', 10);

  if (isNaN(lat) || isNaN(lng)) {
    return c.json({ error: 'Parámetros lat y lng son obligatorios' }, 400);
  }

  const fuelType    = c.req.query('fuel') as FuelType | undefined;
  const brandsParam = c.req.query('brands');
  const brands      = brandsParam ? brandsParam.split(',').map(b => b.trim()) : undefined;
  const open24h     = c.req.query('open24h') === 'true';
  const sortBy      = c.req.query('sort') === 'price' ? 'price' : 'distance';
  const limit       = parseInt(c.req.query('limit') ?? '50', 10);

  const container = buildContainer(c.env);
  const result    = await container.getNearbyStations.execute({
    location:    { latitude: lat, longitude: lng },
    radiusKm:    radius,
    fuelType,
    brands,
    onlyOpen24h: open24h || undefined,
    sortBy,
    limit,
  });

  return c.json(result);
});

/** GET /api/v1/stations/cheapest */
stationsRouter.get('/cheapest', async (c) => {
  const lat  = parseFloat(c.req.query('lat') ?? '');
  const lng  = parseFloat(c.req.query('lng') ?? '');
  const fuel = c.req.query('fuel') as FuelType | undefined;

  if (isNaN(lat) || isNaN(lng) || !fuel) {
    return c.json({ error: 'lat, lng y fuel son obligatorios' }, 400);
  }

  const container = buildContainer(c.env);
  const result    = await container.getCheapestStations.execute({
    location:  { latitude: lat, longitude: lng },
    fuelType:  fuel,
    radiusKm:  parseInt(c.req.query('radius') ?? '20', 10),
    limit:     parseInt(c.req.query('limit') ?? '10', 10),
  });

  return c.json(result);
});

/** GET /api/v1/stations/search */
stationsRouter.get('/search', async (c) => {
  const q = c.req.query('q')?.trim();
  if (!q) return c.json({ error: 'El parámetro q es obligatorio' }, 400);

  const latStr = c.req.query('lat');
  const lngStr = c.req.query('lng');
  const location = latStr && lngStr
    ? { latitude: parseFloat(latStr), longitude: parseFloat(lngStr) }
    : undefined;

  const container = buildContainer(c.env);
  const result    = await container.searchStations.execute({
    query:    q,
    location,
    radiusKm: parseInt(c.req.query('radius') ?? '100', 10),
    fuelType: c.req.query('fuel') as FuelType | undefined,
    sortBy:   c.req.query('sort') === 'price' ? 'price' : 'distance',
  });

  return c.json(result);
});

/** GET /api/v1/stations/brands */
stationsRouter.get('/brands', async (c) => {
  const lat = parseFloat(c.req.query('lat') ?? '');
  const lng = parseFloat(c.req.query('lng') ?? '');

  if (isNaN(lat) || isNaN(lng)) {
    return c.json({ error: 'lat y lng son obligatorios' }, 400);
  }

  const container = buildContainer(c.env);
  const brands    = await container.getAvailableBrands.execute({
    location:  { latitude: lat, longitude: lng },
    radiusKm:  parseInt(c.req.query('radius') ?? '10', 10),
  });

  return c.json({ brands });
});

/** GET /api/v1/stations/:id */
stationsRouter.get('/:id', async (c) => {
  const id        = c.req.param('id');
  const container = buildContainer(c.env);
  const station   = await container.getStationDetail.execute(id);

  if (!station) return c.json({ error: 'Estación no encontrada' }, 404);
  return c.json(station);
});

/** GET /api/v1/stations/:id/price-history */
stationsRouter.get('/:id/price-history', async (c) => {
  const id        = c.req.param('id');
  const fuelType  = c.req.query('fuel') as FuelType | undefined;
  const days      = parseInt(c.req.query('days') ?? '30', 10);

  const container = buildContainer(c.env);
  const result    = await container.getPriceHistory.execute({ stationId: id, fuelType, days });

  return c.json(result);
});

export { stationsRouter };
