import { Event } from "../../domain/entities/Event";

export type CreateEventInput = {
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string;
  createdBy: string;
};

export type UpdateEventInput = Partial<Omit<CreateEventInput, "createdBy">>;

export type EventFilters = {
  start?: string;
  end?: string;
};

export interface EventRepository {
  create(input: CreateEventInput): Promise<Event>;
  list(filters?: EventFilters): Promise<Event[]>;
  findById(id: string): Promise<Event | null>;
  update(id: string, input: UpdateEventInput): Promise<Event>;
  delete(id: string): Promise<void>;
}
