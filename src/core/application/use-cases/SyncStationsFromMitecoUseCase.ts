import { GasStation } from '../../domain/models/GasStation';
import { FuelType, FUEL_TYPE_TO_DB_COLUMN } from '../../domain/models/FuelType';
import { StationRepository } from '../../domain/ports/StationRepository';
import { PriceHistoryRepository } from '../../domain/ports/PriceHistoryRepository';

/** Forma del JSON de MITECO */
interface MitecoStation {
  'IDEESS': string;
  'Rótulo': string;
  'Dirección': string;
  'C.P.': string;
  'Municipio': string;
  'Provincia': string;
  'Latitud': string;
  'Longitud (WGS84)': string;
  'Horario': string;
  'Precio Gasolina 95 E5': string;
  'Precio Gasolina 98 E5': string;
  'Precio Gasóleo A': string;
  'Precio Gasóleo Premium': string;
  'Precio Gasóleo B': string;
  'Precio Gases licuados del petróleo': string;
  'Precio Gas Natural Comprimido': string;
  'Precio Gas Natural Licuado': string;
  'Precio Hidrógeno': string;
}

interface MitecoResponse {
  ListaEESSPrecio: MitecoStation[];
}

export interface SyncResult {
  stationsSynced:  number;
  pricesRecorded:  number;
  durationMs:      number;
  status:          'ok' | 'error';
  errorMsg?:       string;
}

const MITECO_URL =
  'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/';

export class SyncStationsFromMitecoUseCase {
  constructor(
    private readonly stationRepo:      StationRepository,
    private readonly priceHistoryRepo: PriceHistoryRepository,
  ) {}

  async execute(): Promise<SyncResult> {
    const start = Date.now();
    try {
      // 1. Obtener datos de MITECO
      const res  = await fetch(MITECO_URL);
      if (!res.ok) throw new Error(`MITECO HTTP ${res.status}`);
      const data = await res.json() as MitecoResponse;

      // 2. Mapear al dominio
      const stations = data.ListaEESSPrecio.map(s => this.mapStation(s));

      // 3. Upsert masivo en D1
      const synced = await this.stationRepo.upsertMany(stations);

      // 4. Insertar historial diario de precios (INSERT OR IGNORE por unicidad fecha)
      const priceEntries: Array<{ stationId: string; fuelType: string; price: number }> = [];
      for (const station of stations) {
        for (const [fuelType, price] of Object.entries(station.prices)) {
          if (price != null) {
            priceEntries.push({ stationId: station.id, fuelType, price: price as number });
          }
        }
      }
      const recorded = priceEntries.length > 0
        ? await this.priceHistoryRepo.insertDailySnapshot(priceEntries)
        : 0;

      return {
        stationsSynced: synced,
        pricesRecorded: recorded,
        durationMs:     Date.now() - start,
        status:         'ok',
      };
    } catch (err) {
      return {
        stationsSynced: 0,
        pricesRecorded: 0,
        durationMs:     Date.now() - start,
        status:         'error',
        errorMsg:       err instanceof Error ? err.message : String(err),
      };
    }
  }

  private mapStation(s: MitecoStation): GasStation {
    const lat = parseFloat(s['Latitud'].replace(',', '.'));
    const lng = parseFloat(s['Longitud (WGS84)'].replace(',', '.'));

    const parsePrice = (v: string): number | null => {
      const n = parseFloat(v.replace(',', '.'));
      return isNaN(n) || n === 0 ? null : n;
    };

    const scheduleRaw = s['Horario'] ?? '';
    const isOpen24h   = /L-D: 00:00-24:00/i.test(scheduleRaw);

    return {
      id:       s['IDEESS'],
      name:     s['Rótulo'],
      brand:    this.normalizeBrand(s['Rótulo']),
      location: { latitude: lat, longitude: lng },
      address:  s['Dirección'],
      postalCode: s['C.P.'],
      locality:   s['Municipio'],
      province:   s['Provincia'],
      schedule: { raw: scheduleRaw, isOpen24h },
      prices: {
        [FuelType.GASOLINA_95]:     parsePrice(s['Precio Gasolina 95 E5']),
        [FuelType.GASOLINA_98]:     parsePrice(s['Precio Gasolina 98 E5']),
        [FuelType.GASOLEO_A]:       parsePrice(s['Precio Gasóleo A']),
        [FuelType.GASOLEO_PREMIUM]: parsePrice(s['Precio Gasóleo Premium']),
        [FuelType.GASOLEO_B]:       parsePrice(s['Precio Gasóleo B']),
        [FuelType.GLP]:             parsePrice(s['Precio Gases licuados del petróleo']),
        [FuelType.GNC]:             parsePrice(s['Precio Gas Natural Comprimido']),
        [FuelType.GNL]:             parsePrice(s['Precio Gas Natural Licuado']),
        [FuelType.HIDROGENO]:       parsePrice(s['Precio Hidrógeno']),
      },
      services: {
        hasCarWash:   false,
        hasStore:     false,
        hasCafe:      false,
        hasEvCharger: false,
        hasAirPump:   false,
      },
    };
  }

  private normalizeBrand(rotulo: string): string {
    const r = rotulo.toUpperCase().trim();
    if (r.includes('REPSOL'))  return 'REPSOL';
    if (r.includes('CEPSA'))   return 'CEPSA';
    if (r.includes('BP'))      return 'BP';
    if (r.includes('GALP'))    return 'GALP';
    if (r.includes('SHELL'))   return 'SHELL';
    if (r.includes('CAMPSA'))  return 'CAMPSA';
    if (r.includes('PETRONOR')) return 'PETRONOR';
    if (r.includes('DISA'))    return 'DISA';
    if (r.includes('BALLENOIL')) return 'BALLENOIL';
    if (r.includes('AVIA'))    return 'AVIA';
    if (r.includes('ESCLAT'))  return 'ESCLAT';
    if (r.includes('Q8'))      return 'Q8';
    if (r.includes('MEROIL'))  return 'MEROIL';
    if (r.includes('TAMOIL'))  return 'TAMOIL';
    if (r.includes('PLENOIL')) return 'PLENOIL';
    if (r.includes('BONPREU')) return 'BONPREU';
    if (r.includes('CARREFOUR')) return 'CARREFOUR';
    if (r.includes('ALCAMPO')) return 'ALCAMPO';
    if (r.includes('E.LECLERC')) return 'E.LECLERC';
    if (r.includes('EROSKI'))  return 'EROSKI';
    return rotulo.trim();
  }
}
