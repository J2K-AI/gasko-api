export type ReportType =
  | 'closed_permanently'
  | 'wrong_price'
  | 'services_correction'
  | 'other';

export type ReportStatus = 'pending' | 'reviewed' | 'applied';

export interface StationReport {
  id:         number;
  deviceId:   string;
  stationId:  string;
  reportType: ReportType;
  details?:   string;
  status:     ReportStatus;
  createdAt:  string;
}
