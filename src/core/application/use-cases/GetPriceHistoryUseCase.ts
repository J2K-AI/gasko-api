import { PriceRecord, PriceHistoryRepository } from '../../domain/ports/PriceHistoryRepository';
import { FuelType } from '../../domain/models/FuelType';

export interface GetPriceHistoryInput {
  stationId: string;
  fuelType?: FuelType;
  days?: number;
}

export interface GetPriceHistoryOutput {
  stationId: string;
  history:   PriceRecord[];
}

export class GetPriceHistoryUseCase {
  constructor(private readonly priceHistoryRepo: PriceHistoryRepository) {}

  async execute(input: GetPriceHistoryInput): Promise<GetPriceHistoryOutput> {
    const days = Math.min(input.days ?? 30, 90);
    const history = await this.priceHistoryRepo.findByStation(
      input.stationId,
      input.fuelType,
      days,
    );
    return { stationId: input.stationId, history };
  }
}
