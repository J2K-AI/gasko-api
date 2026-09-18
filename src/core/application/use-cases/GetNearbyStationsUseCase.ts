import { GasStation, MAX_RADIUS_KM } from '../../domain/models/GasStation';
import { GeoLocation, getBoundingBox, haversineDistanceKm } from '../../domain/models/GeoLocation';
import { FuelType } from '../../domain/models/FuelType';
import { StationRepository, StationFilters } from '../../domain/ports/StationRepository';

export interface GetNearbyStationsInput {
  location:    GeoLocation;
  radiusKm?:   number;
  fuelType?:   FuelType;
  brands?:     string[];
  onlyOpen24h?: boolean;
  sortBy?:     'distance' | 'price';
  limit?:      number;
}

export interface GetNearbyStationsOutput {
  stations: GasStation[];
  total:    number;
  radiusKm: number;
  center:   GeoLocation;
}

export class GetNearbyStationsUseCase {
  constructor(private readonly stationRepo: StationRepository) {}

  async execute(input: GetNearbyStationsInput): Promise<GetNearbyStationsOutput> {
    const radiusKm  = Math.min(input.radiusKm ?? 10, MAX_RADIUS_KM);
    const limit     = Math.min(input.limit ?? 50, 200);
    const sortBy    = input.sortBy ?? 'distance';

    const bbox = getBoundingBox(input.location, radiusKm);
    const filters: StationFilters = {
      brands:      input.brands,
      onlyOpen24h: input.onlyOpen24h,
      fuelType:    input.fuelType,
    };

    // Paso 1: Pre-filtro SQL con bounding box (rápido)
    const candidates = await this.stationRepo.findInBoundingBox(bbox, filters);

    // Paso 2: Filtro preciso con Haversine
    const withDistance = candidates
      .map(s => ({
        ...s,
        distanceKm: haversineDistanceKm(input.location, s.location),
      }))
      .filter(s => s.distanceKm <= radiusKm);

    // Paso 3: Filtro por precio disponible si se ordena por precio
    const withPrice = sortBy === 'price' && input.fuelType
      ? withDistance.filter(s => s.prices[input.fuelType!] != null)
      : withDistance;

    // Paso 4: Ordenar
    const sorted = withPrice.sort((a, b) => {
      if (sortBy === 'price' && input.fuelType) {
        const pa = a.prices[input.fuelType] ?? Infinity;
        const pb = b.prices[input.fuelType] ?? Infinity;
        return pa - pb;
      }
      return (a.distanceKm ?? 0) - (b.distanceKm ?? 0);
    });

    const stations = sorted.slice(0, limit);

    return {
      stations,
      total: sorted.length,
      radiusKm,
      center: input.location,
    };
  }
}
