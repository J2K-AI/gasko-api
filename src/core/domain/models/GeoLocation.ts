export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/** Fórmula de Haversine: distancia en kilómetros entre dos puntos */
export function haversineDistanceKm(a: GeoLocation, b: GeoLocation): number {
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const c =
    sinDLat * sinDLat +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinDLon * sinDLon;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

/** Calcula un bounding box aproximado para pre-filtrar en SQL */
export function getBoundingBox(center: GeoLocation, radiusKm: number): BoundingBox {
  const R = 6371;
  const deltaLat = (radiusKm / R) * (180 / Math.PI);
  const deltaLng = deltaLat / Math.cos(center.latitude * Math.PI / 180);
  return {
    minLat: center.latitude  - deltaLat,
    maxLat: center.latitude  + deltaLat,
    minLng: center.longitude - deltaLng,
    maxLng: center.longitude + deltaLng,
  };
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
