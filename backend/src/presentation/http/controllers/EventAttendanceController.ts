import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { attendanceSchema, assignmentSchema, observationSchema } from "../validators/schemas";
import { GetEventAttendanceUseCase } from "../../../application/usecases/GetEventAttendanceUseCase";
import { MarkEventAttendanceUseCase } from "../../../application/usecases/MarkEventAttendanceUseCase";
import { SaveEventObservationUseCase } from "../../../application/usecases/SaveEventObservationUseCase";
import { SaveOperatorObservationUseCase } from "../../../application/usecases/SaveOperatorObservationUseCase";
import { SetEventAssignmentsUseCase } from "../../../application/usecases/SetEventAssignmentsUseCase";

export class EventAttendanceController {
  constructor(
    private setAssignmentsUseCase: SetEventAssignmentsUseCase,
    private markAttendanceUseCase: MarkEventAttendanceUseCase,
    private getAttendanceUseCase: GetEventAttendanceUseCase,
    private saveEventObservationUseCase: SaveEventObservationUseCase,
    private saveOperatorObservationUseCase: SaveOperatorObservationUseCase
  ) {}

  setAssignments = async (req: AuthRequest, res: Response) => {
    const payload = assignmentSchema.parse(req.body);
    const assignedBy = req.auth?.userId;
    if (!assignedBy) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const assignments = await this.setAssignmentsUseCase.execute({
      eventId: req.params.eventId,
      userIds: payload.userIds,
      assignedBy
    });

    return res.status(201).json({ assignments });
  };

  getAttendance = async (req: Request, res: Response) => {
    const snapshot = await this.getAttendanceUseCase.execute(req.params.eventId);
    return res.json(snapshot);
  };

  markAttendance = async (req: AuthRequest, res: Response) => {
    const payload = attendanceSchema.parse(req.body);
    const markedBy = req.auth?.userId;
    if (!markedBy) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    await this.markAttendanceUseCase.execute({
      eventId: req.params.eventId,
      markedBy,
      items: payload.items
    });

    const snapshot = await this.getAttendanceUseCase.execute(req.params.eventId);
    return res.json(snapshot);
  };

  saveGeneralObservation = async (req: AuthRequest, res: Response) => {
    const payload = observationSchema.parse(req.body);
    const createdBy = req.auth?.userId;
    if (!createdBy) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    await this.saveEventObservationUseCase.execute(
      req.params.eventId,
      payload.note,
      createdBy
    );

    return res.status(204).send();
  };

  saveOperatorObservation = async (req: AuthRequest, res: Response) => {
    const payload = observationSchema.parse(req.body);
    const createdBy = req.auth?.userId;
    if (!createdBy) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    await this.saveOperatorObservationUseCase.execute(
      req.params.eventId,
      req.params.operatorId,
      payload.note,
      createdBy
    );

    return res.status(204).send();
  };
}
