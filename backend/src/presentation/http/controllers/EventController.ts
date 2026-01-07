import { Request, Response } from "express";
import { CreateEventUseCase } from "../../../application/usecases/CreateEventUseCase";
import { DeleteEventUseCase } from "../../../application/usecases/DeleteEventUseCase";
import { GetEventUseCase } from "../../../application/usecases/GetEventUseCase";
import { ListEventsUseCase } from "../../../application/usecases/ListEventsUseCase";
import { UpdateEventUseCase } from "../../../application/usecases/UpdateEventUseCase";
import { AuthRequest } from "../middlewares/authMiddleware";
import { eventQuerySchema, eventSchema, eventUpdateSchema } from "../validators/schemas";

const pickQueryValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

export class EventController {
  constructor(
    private createEvent: CreateEventUseCase,
    private listEvents: ListEventsUseCase,
    private getEvent: GetEventUseCase,
    private updateEvent: UpdateEventUseCase,
    private deleteEvent: DeleteEventUseCase
  ) {}

  list = async (req: Request, res: Response) => {
    const start = pickQueryValue(req.query.start as string | string[] | undefined);
    const end = pickQueryValue(req.query.end as string | string[] | undefined);

    const filters = eventQuerySchema.parse({ start, end });
    const events = await this.listEvents.execute(filters);
    return res.json(events);
  };

  getById = async (req: Request, res: Response) => {
    const event = await this.getEvent.execute(req.params.id);
    return res.json(event);
  };

  create = async (req: AuthRequest, res: Response) => {
    const payload = eventSchema.parse(req.body);
    const createdBy = req.auth?.userId;
    if (!createdBy) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    const event = await this.createEvent.execute({
      ...payload,
      description: payload.description ?? null,
      location: payload.location ?? null,
      createdBy
    });
    return res.status(201).json(event);
  };

  update = async (req: Request, res: Response) => {
    const payload = eventUpdateSchema.parse(req.body);
    const event = await this.updateEvent.execute(req.params.id, payload);
    return res.json(event);
  };

  delete = async (req: Request, res: Response) => {
    await this.deleteEvent.execute(req.params.id);
    return res.status(204).send();
  };
}
