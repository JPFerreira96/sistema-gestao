import { AppError } from "../../shared/errors/AppError";
import { EventAssignmentRepository } from "../ports/EventAssignmentRepository";
import { EventRepository } from "../ports/EventRepository";
import { UserRepository } from "../ports/UserRepository";

export type SetAssignmentsInput = {
  eventId: string;
  userIds: string[];
  assignedBy: string;
};

export class SetEventAssignmentsUseCase {
  constructor(
    private eventRepository: EventRepository,
    private assignmentRepository: EventAssignmentRepository,
    private userRepository: UserRepository
  ) {}

  async execute(input: SetAssignmentsInput) {
    const event = await this.eventRepository.findById(input.eventId);
    if (!event) {
      throw new AppError("Event not found.", 404);
    }

    const uniqueUserIds = Array.from(new Set(input.userIds));
    if (!uniqueUserIds.length) {
      await this.assignmentRepository.setAssignments(input.eventId, [], input.assignedBy);
      return [];
    }

    const users = await this.userRepository.findByIds(uniqueUserIds);
    if (users.length !== uniqueUserIds.length) {
      throw new AppError("Some users were not found.", 400);
    }

    await this.assignmentRepository.setAssignments(
      input.eventId,
      uniqueUserIds,
      input.assignedBy
    );

    return this.assignmentRepository.listByEvent(input.eventId);
  }
}
