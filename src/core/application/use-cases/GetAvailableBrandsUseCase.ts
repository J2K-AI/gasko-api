import { GeoLocation, getBoundingBox } from '../../domain/models/GeoLocation';
import { MAX_RADIUS_KM } from '../../domain/models/GasStation';
import { StationRepository } from '../../domain/ports/StationRepository';

export interface GetAvailableBrandsInput {
  location: GeoLocation;
  radiusKm?: number;
}

export class GetAvailableBrandsUseCase {
  constructor(private readonly stationRepo: StationRepository) {}

  async execute(input: GetAvailableBrandsInput): Promise<string[]> {
    const radiusKm = Math.min(input.radiusKm ?? 10, MAX_RADIUS_KM);
    const bbox = getBoundingBox(input.location, radiusKm);
    return this.stationRepo.getBrandsInBoundingBox(bbox);
  }
}
