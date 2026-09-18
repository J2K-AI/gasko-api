import { PriceRecord, PriceHistoryRepository } from '../../../core/domain/ports/PriceHistoryRepository';

interface PriceHistoryRow {
  fuel_type:     string;
  price:         number;
  recorded_date: string;
  recorded_at:   string;
}

export class D1PriceHistoryRepository implements PriceHistoryRepository {
  constructor(private readonly db: D1Database) {}

  async findByStation(
    stationId: string,
    fuelType: string | undefined,
    days: number,
  ): Promise<PriceRecord[]> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    let sql = `
      SELECT fuel_type, price, recorded_date, recorded_at
      FROM price_history
      WHERE station_id = ?
        AND recorded_date >= ?
    `;
    const params: unknown[] = [stationId, cutoff];

    if (fuelType) {
      sql += ' AND fuel_type = ?';
      params.push(fuelType);
    }
    sql += ' ORDER BY recorded_date DESC, fuel_type';

    const { results } = await this.db.prepare(sql).bind(...params).all<PriceHistoryRow>();
    return results.map(r => ({
      fuelType:     r.fuel_type,
      price:        r.price,
      recordedDate: r.recorded_date,
      recordedAt:   r.recorded_at,
    }));
  }

  async insertDailySnapshot(
    entries: Array<{ stationId: string; fuelType: string; price: number }>,
  ): Promise<number> {
    if (entries.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0]!;
    const sql = `
      INSERT OR IGNORE INTO price_history (station_id, fuel_type, price, recorded_date)
      VALUES (?, ?, ?, ?)
    `;

    const BATCH_SIZE = 100;
    let inserted = 0;

    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE);
      const stmts = batch.map(e =>
        this.db.prepare(sql).bind(e.stationId, e.fuelType, e.price, today),
      );
      const results = await this.db.batch(stmts);
      inserted += results.reduce((sum, r) => sum + (r.meta.changes ?? 0), 0);
    }

    return inserted;
  }
}
