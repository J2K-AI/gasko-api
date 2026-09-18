export interface PriceRecord {
  fuelType:     string;
  price:        number;
  recordedDate: string;
  recordedAt:   string;
}

export interface PriceHistoryRepository {
  /** Devuelve historial de precios de una estación */
  findByStation(
    stationId: string,
    fuelType: string | undefined,
    days: number,
  ): Promise<PriceRecord[]>;

  /**
   * Inserta precios del día actual para todas las estaciones.
   * Usa INSERT OR IGNORE para no duplicar si ya existe registro del día.
   */
  insertDailySnapshot(
    entries: Array<{ stationId: string; fuelType: string; price: number }>,
  ): Promise<number>;
}
