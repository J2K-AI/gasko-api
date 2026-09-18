import { GasStation, MAX_RADIUS_KM } from '../../domain/models/GasStation';
import { GeoLocation, getBoundingBox, haversineDistanceKm } from '../../domain/models/GeoLocation';
import { FuelType } from '../../domain/models/FuelType';
import { StationRepository } from '../../domain/ports/StationRepository';

export interface SearchStationsInput {
  query:       string;
  location?:   GeoLocation;
  radiusKm?:   number;
  fuelType?:   FuelType;
  sortBy?:     'distance' | 'price';
}

export interface SearchStationsOutput {
  stations: GasStation[];
  total:    number;
}

export class SearchStationsUseCase {
  constructor(private readonly stationRepo: StationRepository) {}

  async execute(input: SearchStationsInput): Promise<SearchStationsOutput> {
    const candidates = await this.stationRepo.searchByText(input.query.trim());

    let results = candidates;

    // Aplicar filtro de radio si hay ubicación
    if (input.location) {
      const radiusKm = Math.min(input.radiusKm ?? MAX_RADIUS_KM, MAX_RADIUS_KM);
      const bbox = getBoundingBox(input.location, radiusKm);

      results = candidates
        .map(s => ({
          ...s,
          distanceKm: haversineDistanceKm(input.location!, s.location),
        }))
        .filter(s => {
          // Bounding box check (quick)
          const { latitude: lat, longitude: lng } = s.location;
          return (
            lat >= bbox.minLat && lat <= bbox.maxLat &&
            lng >= bbox.minLng && lng <= bbox.maxLng &&
            (s.distanceKm ?? 0) <= radiusKm
          );
        });
    }

    // Ordenar
    if (input.sortBy === 'price' && input.fuelType) {
      results = results.sort((a, b) => {
        const pa = a.prices[input.fuelType!] ?? Infinity;
        const pb = b.prices[input.fuelType!] ?? Infinity;
        return pa - pb;
      });
    } else if (input.location) {
      results = results.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    }

    return { stations: results, total: results.length };
  }
}
