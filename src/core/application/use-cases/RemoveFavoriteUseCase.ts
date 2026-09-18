import { FavoritesRepository } from '../../domain/ports/FavoritesRepository';

export class RemoveFavoriteUseCase {
  constructor(private readonly favoritesRepo: FavoritesRepository) {}

  async execute(deviceId: string, stationId: string): Promise<boolean> {
    return this.favoritesRepo.remove(deviceId, stationId);
  }
}
