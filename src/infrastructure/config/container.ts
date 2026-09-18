import { Env } from './env';
import { D1StationRepository }      from '../adapters/outbound/D1StationRepository';
import { D1PriceHistoryRepository } from '../adapters/outbound/D1PriceHistoryRepository';
import { D1FavoritesRepository }    from '../adapters/outbound/D1FavoritesRepository';
import { D1ReportRepository }       from '../adapters/outbound/D1ReportRepository';
import { KVCacheRepository }        from '../adapters/outbound/KVCacheRepository';

import { GetNearbyStationsUseCase }      from '../../core/application/use-cases/GetNearbyStationsUseCase';
import { SearchStationsUseCase }         from '../../core/application/use-cases/SearchStationsUseCase';
import { GetAvailableBrandsUseCase }     from '../../core/application/use-cases/GetAvailableBrandsUseCase';
import { GetCheapestStationsUseCase }    from '../../core/application/use-cases/GetCheapestStationsUseCase';
import { GetStationDetailUseCase }       from '../../core/application/use-cases/GetStationDetailUseCase';
import { GetPriceHistoryUseCase }        from '../../core/application/use-cases/GetPriceHistoryUseCase';
import { SyncStationsFromMitecoUseCase } from '../../core/application/use-cases/SyncStationsFromMitecoUseCase';
import { GetFavoritesUseCase }           from '../../core/application/use-cases/GetFavoritesUseCase';
import { AddFavoriteUseCase }            from '../../core/application/use-cases/AddFavoriteUseCase';
import { RemoveFavoriteUseCase }         from '../../core/application/use-cases/RemoveFavoriteUseCase';
import { CreateReportUseCase }           from '../../core/application/use-cases/CreateReportUseCase';

/** Composición raíz — conecta puertos con adaptadores e instancia use cases */
export function buildContainer(env: Env) {
  // ── Adaptadores secundarios (outbound) ────────────────────────────────────
  const stationRepo      = new D1StationRepository(env.DB);
  const priceHistoryRepo = new D1PriceHistoryRepository(env.DB);
  const favoritesRepo    = new D1FavoritesRepository(env.DB);
  const reportRepo       = new D1ReportRepository(env.DB);
  const cache            = new KVCacheRepository(env.STATIONS_CACHE);

  // ── Casos de uso (application) ────────────────────────────────────────────
  const getNearbyStations      = new GetNearbyStationsUseCase(stationRepo);
  const searchStations         = new SearchStationsUseCase(stationRepo);
  const getAvailableBrands     = new GetAvailableBrandsUseCase(stationRepo);
  const getCheapestStations    = new GetCheapestStationsUseCase(stationRepo);
  const getStationDetail       = new GetStationDetailUseCase(stationRepo);
  const getPriceHistory        = new GetPriceHistoryUseCase(priceHistoryRepo);
  const syncStationsFromMiteco = new SyncStationsFromMitecoUseCase(stationRepo, priceHistoryRepo);
  const getFavorites           = new GetFavoritesUseCase(favoritesRepo, stationRepo);
  const addFavorite            = new AddFavoriteUseCase(favoritesRepo);
  const removeFavorite         = new RemoveFavoriteUseCase(favoritesRepo);
  const createReport           = new CreateReportUseCase(reportRepo);

  return {
    getNearbyStations,
    searchStations,
    getAvailableBrands,
    getCheapestStations,
    getStationDetail,
    getPriceHistory,
    syncStationsFromMiteco,
    getFavorites,
    addFavorite,
    removeFavorite,
    createReport,
    cache,
  };
}

export type Container = ReturnType<typeof buildContainer>;
