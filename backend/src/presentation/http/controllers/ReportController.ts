import { Request, Response } from "express";
import { GetAttendanceReportUseCase } from "../../../application/usecases/GetAttendanceReportUseCase";
import { reportQuerySchema } from "../validators/schemas";

const pickQueryValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

export class ReportController {
  constructor(private attendanceReportUseCase: GetAttendanceReportUseCase) {}

  eventsAttendance = async (req: Request, res: Response) => {
    const start = pickQueryValue(req.query.start as string | string[] | undefined);
    const end = pickQueryValue(req.query.end as string | string[] | undefined);
    const eventId = pickQueryValue(req.query.eventId as string | string[] | undefined);

    const filters = reportQuerySchema.parse({ start, end, eventId });
    const report = await this.attendanceReportUseCase.execute(filters);
    return res.json(report);
  };
}
