import { Favorite } from '../models/Favorite';

export interface FavoritesRepository {
  findByDevice(deviceId: string): Promise<Favorite[]>;
  add(deviceId: string, stationId: string): Promise<Favorite>;
  remove(deviceId: string, stationId: string): Promise<boolean>;
  exists(deviceId: string, stationId: string): Promise<boolean>;
}
