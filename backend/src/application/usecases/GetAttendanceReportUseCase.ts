import {
  AttendanceReport,
  AttendanceReportFilters,
  ReportRepository
} from "../ports/ReportRepository";

export type AttendanceReportOutput = {
  filters: AttendanceReportFilters;
  summary: {
    totalEvents: number;
    totalAssigned: number;
    totalPresent: number;
    averageAttendance: number;
  };
  events: Array<AttendanceReport["events"][number] & { attendanceRate: number }>;
  operators: Array<
    AttendanceReport["operators"][number] & { scorePercent: number; status: string }
  >;
};

export class GetAttendanceReportUseCase {
  constructor(private reportRepository: ReportRepository) {}

  async execute(filters: AttendanceReportFilters): Promise<AttendanceReportOutput> {
    const report = await this.reportRepository.getAttendanceReport(filters);

    const events = report.events.map((event) => {
      const rate =
        event.totalAssigned === 0
          ? 0
          : Math.round((event.presentCount / event.totalAssigned) * 100);
      return { ...event, attendanceRate: rate };
    });

    const operators = report.operators.map((operator) => {
      const score =
        operator.totalAssigned === 0
          ? 0
          : Math.round((operator.presentCount / operator.totalAssigned) * 100);
      return {
        ...operator,
        scorePercent: score,
        status: operator.totalAssigned === 0 ? "SEM_EVENTOS" : "OK"
      };
    });

    const totalAssigned = report.operators.reduce(
      (sum, operator) => sum + operator.totalAssigned,
      0
    );
    const totalPresent = report.operators.reduce(
      (sum, operator) => sum + operator.presentCount,
      0
    );

    const averageAttendance =
      totalAssigned === 0 ? 0 : Math.round((totalPresent / totalAssigned) * 100);

    return {
      filters: report.filters,
      summary: {
        totalEvents: report.events.length,
        totalAssigned,
        totalPresent,
        averageAttendance
      },
      events,
      operators
    };
  }
}
