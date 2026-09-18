import { StationReport, ReportType } from '../../../core/domain/models/StationReport';
import { CreateReportInput, ReportWriter } from '../../../core/application/use-cases/CreateReportUseCase';

interface ReportRow {
  id:          number;
  device_id:   string;
  station_id:  string;
  report_type: string;
  details:     string | null;
  status:      string;
  created_at:  string;
}

export class D1ReportRepository implements ReportWriter {
  constructor(private readonly db: D1Database) {}

  async create(input: CreateReportInput): Promise<StationReport> {
    const { meta } = await this.db
      .prepare(
        'INSERT INTO station_reports (device_id, station_id, report_type, details) VALUES (?, ?, ?, ?)',
      )
      .bind(input.deviceId, input.stationId, input.reportType, input.details ?? null)
      .run();

    const row = await this.db
      .prepare('SELECT * FROM station_reports WHERE id = ?')
      .bind(meta.last_row_id)
      .first<ReportRow>();

    if (!row) throw new Error('Error al guardar el reporte');

    return {
      id:         row.id,
      deviceId:   row.device_id,
      stationId:  row.station_id,
      reportType: row.report_type as ReportType,
      details:    row.details ?? undefined,
      status:     row.status as 'pending',
      createdAt:  row.created_at,
    };
  }
}
