export type AttendanceReportFilters = {
  start: string;
  end: string;
  eventId?: string;
};

export type EventAttendanceSummary = {
  eventId: string;
  title: string;
  startAt: string;
  endAt: string;
  totalAssigned: number;
  presentCount: number;
};

export type OperatorAttendanceSummary = {
  userId: string;
  name: string;
  totalAssigned: number;
  presentCount: number;
};

export type AttendanceReport = {
  filters: AttendanceReportFilters;
  events: EventAttendanceSummary[];
  operators: OperatorAttendanceSummary[];
};

export interface ReportRepository {
  getAttendanceReport(filters: AttendanceReportFilters): Promise<AttendanceReport>;
}
