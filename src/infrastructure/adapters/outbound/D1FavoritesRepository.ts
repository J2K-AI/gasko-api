import { Favorite } from '../../../core/domain/models/Favorite';
import { FavoritesRepository } from '../../../core/domain/ports/FavoritesRepository';

interface FavoriteRow {
  id:         number;
  device_id:  string;
  station_id: string;
  created_at: string;
}

export class D1FavoritesRepository implements FavoritesRepository {
  constructor(private readonly db: D1Database) {}

  async findByDevice(deviceId: string): Promise<Favorite[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM favorites WHERE device_id = ? ORDER BY created_at DESC')
      .bind(deviceId)
      .all<FavoriteRow>();

    return results.map(r => ({
      id:        r.id,
      deviceId:  r.device_id,
      stationId: r.station_id,
      addedAt:   r.created_at,
    }));
  }

  async add(deviceId: string, stationId: string): Promise<Favorite> {
    await this.db
      .prepare('INSERT OR IGNORE INTO favorites (device_id, station_id) VALUES (?, ?)')
      .bind(deviceId, stationId)
      .run();

    const row = await this.db
      .prepare('SELECT * FROM favorites WHERE device_id = ? AND station_id = ?')
      .bind(deviceId, stationId)
      .first<FavoriteRow>();

    if (!row) throw new Error('Error al guardar el favorito');

    return { id: row.id, deviceId: row.device_id, stationId: row.station_id, addedAt: row.created_at };
  }

  async remove(deviceId: string, stationId: string): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM favorites WHERE device_id = ? AND station_id = ?')
      .bind(deviceId, stationId)
      .run();
    return (result.meta.changes ?? 0) > 0;
  }

  async exists(deviceId: string, stationId: string): Promise<boolean> {
    const row = await this.db
      .prepare('SELECT 1 FROM favorites WHERE device_id = ? AND station_id = ? LIMIT 1')
      .bind(deviceId, stationId)
      .first();
    return row !== null;
  }
}
