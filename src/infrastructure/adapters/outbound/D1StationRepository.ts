import { GasStation } from '../../../core/domain/models/GasStation';
import { FuelType }    from '../../../core/domain/models/FuelType';
import { BoundingBox } from '../../../core/domain/models/GeoLocation';
import { StationRepository, StationFilters } from '../../../core/domain/ports/StationRepository';
import { Env } from '../../config/env';

interface StationRow {
  id: string;
  name: string;
  brand: string;
  latitude: number;
  longitude: number;
  address: string | null;
  postal_code: string | null;
  locality: string | null;
  province: string | null;
  schedule_raw: string | null;
  is_open_24h: number;
  has_car_wash: number;
  has_store: number;
  has_cafe: number;
  has_ev_charger: number;
  has_air_pump: number;
  price_gasolina_95: number | null;
  price_gasolina_98: number | null;
  price_gasoleo_a: number | null;
  price_gasoleo_premium: number | null;
  price_gasoleo_b: number | null;
  price_glp: number | null;
  price_gnc: number | null;
  price_gnl: number | null;
  price_hidrogeno: number | null;
  last_synced: string;
}

function rowToStation(row: StationRow): GasStation {
  return {
    id:    row.id,
    name:  row.name,
    brand: row.brand,
    location: { latitude: row.latitude, longitude: row.longitude },
    address:   row.address    ?? '',
    postalCode: row.postal_code ?? '',
    locality:  row.locality    ?? '',
    province:  row.province    ?? '',
    schedule: {
      raw: row.schedule_raw ?? '',
      isOpen24h: row.is_open_24h === 1,
    },
    prices: {
      [FuelType.GASOLINA_95]:     row.price_gasolina_95,
      [FuelType.GASOLINA_98]:     row.price_gasolina_98,
      [FuelType.GASOLEO_A]:       row.price_gasoleo_a,
      [FuelType.GASOLEO_PREMIUM]: row.price_gasoleo_premium,
      [FuelType.GASOLEO_B]:       row.price_gasoleo_b,
      [FuelType.GLP]:             row.price_glp,
      [FuelType.GNC]:             row.price_gnc,
      [FuelType.GNL]:             row.price_gnl,
      [FuelType.HIDROGENO]:       row.price_hidrogeno,
    },
    services: {
      hasCarWash:   row.has_car_wash   === 1,
      hasStore:     row.has_store      === 1,
      hasCafe:      row.has_cafe       === 1,
      hasEvCharger: row.has_ev_charger === 1,
      hasAirPump:   row.has_air_pump   === 1,
    },
  };
}

export class D1StationRepository implements StationRepository {
  constructor(private readonly db: D1Database) {}

  async findInBoundingBox(bbox: BoundingBox, filters?: StationFilters): Promise<GasStation[]> {
    const conditions: string[] = [
      'latitude  BETWEEN ? AND ?',
      'longitude BETWEEN ? AND ?',
    ];
    const params: unknown[] = [bbox.minLat, bbox.maxLat, bbox.minLng, bbox.maxLng];

    if (filters?.onlyOpen24h) {
      conditions.push('is_open_24h = 1');
    }
    if (filters?.brands && filters.brands.length > 0) {
      const placeholders = filters.brands.map(() => '?').join(', ');
      conditions.push(`brand IN (${placeholders})`);
      params.push(...filters.brands);
    }
    if (filters?.fuelType) {
      const col = fuelTypeToColumn(filters.fuelType as FuelType);
      if (col) conditions.push(`${col} IS NOT NULL`);
    }

    const sql = `SELECT * FROM stations WHERE ${conditions.join(' AND ')}`;
    const { results } = await this.db.prepare(sql).bind(...params).all<StationRow>();
    return results.map(rowToStation);
  }

  async searchByText(query: string): Promise<GasStation[]> {
    const like = `%${query}%`;
    const sql = `
      SELECT * FROM stations
      WHERE locality LIKE ?
         OR postal_code LIKE ?
         OR address LIKE ?
         OR brand LIKE ?
         OR name LIKE ?
      LIMIT 500
    `;
    const { results } = await this.db.prepare(sql).bind(like, like, like, like, like).all<StationRow>();
    return results.map(rowToStation);
  }

  async findById(id: string): Promise<GasStation | null> {
    const row = await this.db.prepare('SELECT * FROM stations WHERE id = ?').bind(id).first<StationRow>();
    return row ? rowToStation(row) : null;
  }

  async getBrandsInBoundingBox(bbox: BoundingBox): Promise<string[]> {
    const sql = `
      SELECT DISTINCT brand FROM stations
      WHERE latitude  BETWEEN ? AND ?
        AND longitude BETWEEN ? AND ?
      ORDER BY brand
    `;
    const { results } = await this.db
      .prepare(sql)
      .bind(bbox.minLat, bbox.maxLat, bbox.minLng, bbox.maxLng)
      .all<{ brand: string }>();
    return results.map(r => r.brand);
  }

  async upsertMany(stations: GasStation[]): Promise<number> {
    const now = new Date().toISOString();
    const sql = `
      INSERT OR REPLACE INTO stations (
        id, name, brand, latitude, longitude, address, postal_code, locality, province,
        schedule_raw, is_open_24h,
        has_car_wash, has_store, has_cafe, has_ev_charger, has_air_pump,
        price_gasolina_95, price_gasolina_98, price_gasoleo_a, price_gasoleo_premium,
        price_gasoleo_b, price_glp, price_gnc, price_gnl, price_hidrogeno,
        last_synced
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const BATCH_SIZE = 100;
    let totalInserted = 0;

    for (let i = 0; i < stations.length; i += BATCH_SIZE) {
      const batch = stations.slice(i, i + BATCH_SIZE);
      const stmts = batch.map(s =>
        this.db.prepare(sql).bind(
          s.id, s.name, s.brand,
          s.location.latitude, s.location.longitude,
          s.address, s.postalCode, s.locality, s.province,
          s.schedule.raw, s.schedule.isOpen24h ? 1 : 0,
          s.services.hasCarWash   ? 1 : 0,
          s.services.hasStore     ? 1 : 0,
          s.services.hasCafe      ? 1 : 0,
          s.services.hasEvCharger ? 1 : 0,
          s.services.hasAirPump   ? 1 : 0,
          s.prices[FuelType.GASOLINA_95]     ?? null,
          s.prices[FuelType.GASOLINA_98]     ?? null,
          s.prices[FuelType.GASOLEO_A]       ?? null,
          s.prices[FuelType.GASOLEO_PREMIUM] ?? null,
          s.prices[FuelType.GASOLEO_B]       ?? null,
          s.prices[FuelType.GLP]             ?? null,
          s.prices[FuelType.GNC]             ?? null,
          s.prices[FuelType.GNL]             ?? null,
          s.prices[FuelType.HIDROGENO]       ?? null,
          now,
        ),
      );
      await this.db.batch(stmts);
      totalInserted += batch.length;
    }

    return totalInserted;
  }
}

function fuelTypeToColumn(fuel: FuelType): string | null {
  const map: Partial<Record<FuelType, string>> = {
    [FuelType.GASOLINA_95]:     'price_gasolina_95',
    [FuelType.GASOLINA_98]:     'price_gasolina_98',
    [FuelType.GASOLEO_A]:       'price_gasoleo_a',
    [FuelType.GASOLEO_PREMIUM]: 'price_gasoleo_premium',
    [FuelType.GASOLEO_B]:       'price_gasoleo_b',
    [FuelType.GLP]:             'price_glp',
    [FuelType.GNC]:             'price_gnc',
    [FuelType.GNL]:             'price_gnl',
    [FuelType.HIDROGENO]:       'price_hidrogeno',
  };
  return map[fuel] ?? null;
}
