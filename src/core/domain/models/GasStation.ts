import { GeoLocation } from './GeoLocation';
import { FuelPrices } from './FuelType';

export interface GasStationSchedule {
  raw: string;
  isOpen24h: boolean;
}

export interface GasStationServices {
  hasCarWash:   boolean;
  hasStore:     boolean;
  hasCafe:      boolean;
  hasEvCharger: boolean;
  hasAirPump:   boolean;
}

export interface GasStation {
  id:          string;
  name:        string;
  brand:       string;
  location:    GeoLocation;
  address:     string;
  postalCode:  string;
  locality:    string;
  province:    string;
  schedule:    GasStationSchedule;
  prices:      FuelPrices;
  services:    GasStationServices;
  /** Distancia en km desde el punto de referencia (calculada en el use case) */
  distanceKm?: number;
}

export const MAX_RADIUS_KM = 100;
