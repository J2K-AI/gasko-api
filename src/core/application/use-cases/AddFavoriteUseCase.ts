import { Favorite } from '../../domain/models/Favorite';
import { FavoritesRepository } from '../../domain/ports/FavoritesRepository';

export class AddFavoriteUseCase {
  constructor(private readonly favoritesRepo: FavoritesRepository) {}

  async execute(deviceId: string, stationId: string): Promise<Favorite> {
    const exists = await this.favoritesRepo.exists(deviceId, stationId);
    if (exists) {
      // Idempotente: si ya existe, devolvemos los favoritos actuales
      const favorites = await this.favoritesRepo.findByDevice(deviceId);
      const existing  = favorites.find(f => f.stationId === stationId);
      if (existing) return existing;
    }
    return this.favoritesRepo.add(deviceId, stationId);
  }
}
