import { StationReport, ReportType } from '../../domain/models/StationReport';

export interface CreateReportInput {
  deviceId:   string;
  stationId:  string;
  reportType: ReportType;
  details?:   string;
}

/** Puerto mínimo que necesita este use case — sin circular deps */
export interface ReportWriter {
  create(input: CreateReportInput): Promise<StationReport>;
}

export class CreateReportUseCase {
  constructor(private readonly reportWriter: ReportWriter) {}

  async execute(input: CreateReportInput): Promise<StationReport> {
    if (!input.stationId || !input.reportType) {
      throw new Error('stationId y reportType son obligatorios');
    }
    return this.reportWriter.create(input);
  }
}
