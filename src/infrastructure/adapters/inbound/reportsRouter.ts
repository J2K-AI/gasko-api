import { Hono } from 'hono';
import { Env }  from '../../config/env';
import { buildContainer } from '../../config/container';
import { ReportType }     from '../../../core/domain/models/StationReport';

const reportsRouter = new Hono<{ Bindings: Env }>();

const VALID_TYPES: ReportType[] = [
  'closed_permanently',
  'wrong_price',
  'services_correction',
  'other',
];

/** POST /api/v1/stations/:id/reports */
reportsRouter.post('/:id/reports', async (c) => {
  const stationId = c.req.param('id');
  const deviceId  = c.req.header('x-device-id');
  if (!deviceId) return c.json({ error: 'Header X-Device-Id obligatorio' }, 401);

  let body: { reportType?: string; details?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Body JSON inválido' }, 400);
  }

  if (!body.reportType || !VALID_TYPES.includes(body.reportType as ReportType)) {
    return c.json({
      error: `reportType inválido. Válidos: ${VALID_TYPES.join(', ')}`,
    }, 400);
  }

  const container = buildContainer(c.env);
  const report    = await container.createReport.execute({
    deviceId,
    stationId,
    reportType: body.reportType as ReportType,
    details:    body.details,
  });

  return c.json({ report }, 201);
});

export { reportsRouter };
