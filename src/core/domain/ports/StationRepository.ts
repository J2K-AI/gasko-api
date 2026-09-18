import { GasStation }  from '../models/GasStation';
import { BoundingBox } from '../models/GeoLocation';

export interface StationFilters {
  brands?:      string[];
  onlyOpen24h?: boolean;
  fuelType?:    string;
}

export interface StationRepository {
  /** Busca estaciones dentro del bounding box (pre-filtro SQL) */
  findInBoundingBox(bbox: BoundingBox, filters?: StationFilters): Promise<GasStation[]>;

  /** Búsqueda por texto en municipio, CP, dirección y marca */
  searchByText(query: string): Promise<GasStation[]>;

  /** Obtiene una estación por ID */
  findById(id: string): Promise<GasStation | null>;

  /** Lista de marcas disponibles en el bounding box */
  getBrandsInBoundingBox(bbox: BoundingBox): Promise<string[]>;

  /** Upsert masivo durante el sync con MITECO */
  upsertMany(stations: GasStation[]): Promise<number>;
}
