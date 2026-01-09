import { AppError } from "../../shared/errors/AppError";
import { EventAssignmentRepository } from "../ports/EventAssignmentRepository";
import { EventAttendanceRepository } from "../ports/EventAttendanceRepository";
import { EventObservationRepository } from "../ports/EventObservationRepository";
import { EventRepository } from "../ports/EventRepository";
import { UserRepository } from "../ports/UserRepository";

export type AttendanceOperatorOutput = {
  userId: string;
  name: string;
  present: boolean;
  markedBy: string | null;
  markedAt: string | null;
  note: string | null;
};

export type EventAttendanceOutput = {
  eventId: string;
  title: string;
  startAt: string;
  endAt: string;
  totalAssigned: number;
  presentCount: number;
  generalNote: string | null;
  operators: AttendanceOperatorOutput[];
};

export class GetEventAttendanceUseCase {
  constructor(
    private eventRepository: EventRepository,
    private assignmentRepository: EventAssignmentRepository,
    private attendanceRepository: EventAttendanceRepository,
    private observationRepository: EventObservationRepository,
    private userRepository: UserRepository
  ) {}

  async execute(eventId: string): Promise<EventAttendanceOutput> {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new AppError("Event not found.", 404);
    }

    const assignments = await this.assignmentRepository.listByEvent(eventId);
    const userIds = assignments.map((assignment) => assignment.userId);
    const users = await this.userRepository.findByIds(userIds);
    const attendance = await this.attendanceRepository.listByEvent(eventId);
    const observations = await this.observationRepository.listByEvent(eventId);

    const attendanceMap = new Map(
      attendance.map((item) => [item.userId, item])
    );
    const observationMap = new Map(
      observations
        .filter((item) => item.operatorId)
        .map((item) => [item.operatorId as string, item])
    );

    const generalNote =
      observations.find((item) => item.operatorId === null)?.note ?? null;

    const operators = users
      .map((user) => {
        const att = attendanceMap.get(user.id);
        const obs = observationMap.get(user.id);
        return {
          userId: user.id,
          name: `${user.firstName} ${user.lastName}`.trim(),
          present: att?.present ?? false,
          markedBy: att?.markedBy ?? null,
          markedAt: att?.markedAt ?? null,
          note: obs?.note ?? null
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const presentCount = operators.filter((item) => item.present).length;

    return {
      eventId: event.id,
      title: event.title,
      startAt: event.startAt,
      endAt: event.endAt,
      totalAssigned: operators.length,
      presentCount,
      generalNote,
      operators
    };
  }
}
