import { Favorite } from '../../domain/models/Favorite';
import { FavoritesRepository } from '../../domain/ports/FavoritesRepository';
import { StationRepository } from '../../domain/ports/StationRepository';

export class GetFavoritesUseCase {
  constructor(
    private readonly favoritesRepo: FavoritesRepository,
    private readonly stationRepo: StationRepository,
  ) {}

  async execute(deviceId: string): Promise<Favorite[]> {
    const favorites = await this.favoritesRepo.findByDevice(deviceId);

    // Enriquecer con datos actuales de precios (consultas en paralelo)
    const enriched = await Promise.all(
      favorites.map(async (fav) => {
        const station = await this.stationRepo.findById(fav.stationId);
        return { ...fav, station: station ?? undefined };
      }),
    );

    return enriched;
  }
}
