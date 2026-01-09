import { AppError } from "../../shared/errors/AppError";
import { EventAttendanceRepository } from "../ports/EventAttendanceRepository";
import { EventAssignmentRepository } from "../ports/EventAssignmentRepository";
import { EventObservationRepository } from "../ports/EventObservationRepository";
import { EventRepository } from "../ports/EventRepository";

export type AttendanceMarkItem = {
  userId: string;
  present: boolean;
  note?: string | null;
};

export type MarkAttendanceInput = {
  eventId: string;
  markedBy: string;
  items: AttendanceMarkItem[];
};

export class MarkEventAttendanceUseCase {
  constructor(
    private eventRepository: EventRepository,
    private assignmentRepository: EventAssignmentRepository,
    private attendanceRepository: EventAttendanceRepository,
    private observationRepository: EventObservationRepository
  ) {}

  async execute(input: MarkAttendanceInput): Promise<void> {
    const event = await this.eventRepository.findById(input.eventId);
    if (!event) {
      throw new AppError("Event not found.", 404);
    }

    const assignments = await this.assignmentRepository.listByEvent(input.eventId);
    const assignedUserIds = new Set(assignments.map((assignment) => assignment.userId));

    const invalid = input.items.find((item) => !assignedUserIds.has(item.userId));
    if (invalid) {
      throw new AppError("Operator not assigned to this event.", 400);
    }

    const attendanceItems = input.items.map((item) => ({
      userId: item.userId,
      present: item.present
    }));

    if (attendanceItems.length) {
      await this.attendanceRepository.upsertBatch(
        input.eventId,
        attendanceItems,
        input.markedBy
      );
    }

    const notes = input.items.filter((item) => item.note && item.note.trim().length > 0);
    for (const item of notes) {
      await this.observationRepository.upsertOperator(
        input.eventId,
        item.userId,
        item.note?.trim() ?? "",
        input.markedBy
      );
    }
  }
}
