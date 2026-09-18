import { GasStation } from './GasStation';

export interface Favorite {
  id:        number;
  deviceId:  string;
  stationId: string;
  station?:  GasStation;  // populated on GET
  addedAt:   string;
}
