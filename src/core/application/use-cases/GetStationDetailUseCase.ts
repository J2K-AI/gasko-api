import { GasStation } from '../../domain/models/GasStation';
import { StationRepository } from '../../domain/ports/StationRepository';

export class GetStationDetailUseCase {
  constructor(private readonly stationRepo: StationRepository) {}

  async execute(id: string): Promise<GasStation | null> {
    return this.stationRepo.findById(id);
  }
}
