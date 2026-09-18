import { GasStation, MAX_RADIUS_KM } from '../../domain/models/GasStation';
import { GeoLocation, getBoundingBox, haversineDistanceKm } from '../../domain/models/GeoLocation';
import { FuelType } from '../../domain/models/FuelType';
import { StationRepository } from '../../domain/ports/StationRepository';

export interface GetCheapestStationsInput {
  location:  GeoLocation;
  fuelType:  FuelType;
  radiusKm?: number;
  limit?:    number;
}

export interface GetCheapestStationsOutput {
  stations: GasStation[];
  fuelType: FuelType;
  radiusKm: number;
}

export class GetCheapestStationsUseCase {
  constructor(private readonly stationRepo: StationRepository) {}

  async execute(input: GetCheapestStationsInput): Promise<GetCheapestStationsOutput> {
    const radiusKm = Math.min(input.radiusKm ?? 20, MAX_RADIUS_KM);
    const limit    = Math.min(input.limit ?? 10, 50);

    const bbox = getBoundingBox(input.location, radiusKm);
    const candidates = await this.stationRepo.findInBoundingBox(bbox, {
      fuelType: input.fuelType,
    });

    const withDistance = candidates
      .map(s => ({ ...s, distanceKm: haversineDistanceKm(input.location, s.location) }))
      .filter(s => s.distanceKm <= radiusKm && s.prices[input.fuelType] != null)
      .sort((a, b) => {
        const pa = a.prices[input.fuelType] ?? Infinity;
        const pb = b.prices[input.fuelType] ?? Infinity;
        return pa - pb;
      })
      .slice(0, limit);

    return { stations: withDistance, fuelType: input.fuelType, radiusKm };
  }
}
