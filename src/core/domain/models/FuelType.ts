export enum FuelType {
  GASOLINA_95     = 'GASOLINA_95',
  GASOLINA_98     = 'GASOLINA_98',
  GASOLEO_A       = 'GASOLEO_A',
  GASOLEO_PREMIUM = 'GASOLEO_PREMIUM',
  GASOLEO_B       = 'GASOLEO_B',
  GLP             = 'GLP',
  GNC             = 'GNC',
  GNL             = 'GNL',
  HIDROGENO       = 'HIDROGENO',
}

export const FUEL_LABELS: Record<FuelType, string> = {
  [FuelType.GASOLINA_95]:     'Gasolina 95',
  [FuelType.GASOLINA_98]:     'Gasolina 98',
  [FuelType.GASOLEO_A]:       'Diésel',
  [FuelType.GASOLEO_PREMIUM]: 'Diésel Plus',
  [FuelType.GASOLEO_B]:       'Gasóleo B',
  [FuelType.GLP]:             'GLP / Autogas',
  [FuelType.GNC]:             'GNC',
  [FuelType.GNL]:             'GNL',
  [FuelType.HIDROGENO]:       'Hidrógeno',
};

/** Precios por tipo de combustible en €/litro (null = no disponible) */
export type FuelPrices = Partial<Record<FuelType, number | null>>;

/** Columnas de precio en D1 mapeadas a FuelType */
export const FUEL_TYPE_TO_DB_COLUMN: Record<FuelType, string> = {
  [FuelType.GASOLINA_95]:     'price_gasolina_95',
  [FuelType.GASOLINA_98]:     'price_gasolina_98',
  [FuelType.GASOLEO_A]:       'price_gasoleo_a',
  [FuelType.GASOLEO_PREMIUM]: 'price_gasoleo_premium',
  [FuelType.GASOLEO_B]:       'price_gasoleo_b',
  [FuelType.GLP]:             'price_glp',
  [FuelType.GNC]:             'price_gnc',
  [FuelType.GNL]:             'price_gnl',
  [FuelType.HIDROGENO]:       'price_hidrogeno',
};
