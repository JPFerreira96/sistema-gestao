import { Request, Response } from "express";
import { CreateUserUseCase } from "../../../application/usecases/CreateUserUseCase";
import { DeleteUserUseCase } from "../../../application/usecases/DeleteUserUseCase";
import { GetUserUseCase } from "../../../application/usecases/GetUserUseCase";
import { ListUsersUseCase } from "../../../application/usecases/ListUsersUseCase";
import { UpdateUserUseCase } from "../../../application/usecases/UpdateUserUseCase";
import { createUserSchema, updateUserSchema } from "../validators/schemas";

export class UserController {
  constructor(
    private createUser: CreateUserUseCase,
    private listUsers: ListUsersUseCase,
    private getUser: GetUserUseCase,
    private updateUser: UpdateUserUseCase,
    private deleteUser: DeleteUserUseCase
  ) {}

  create = async (req: Request, res: Response) => {
    const payload = createUserSchema.parse(req.body);
    const user = await this.createUser.execute({
      ...payload,
      allergyDetails: payload.allergyDetails ?? null
    });
    return res.status(201).json(user);
  };

  list = async (_req: Request, res: Response) => {
    const users = await this.listUsers.execute();
    return res.json(users);
  };

  getById = async (req: Request, res: Response) => {
    const user = await this.getUser.execute(req.params.id);
    return res.json(user);
  };

  update = async (req: Request, res: Response) => {
    const payload = updateUserSchema.parse(req.body);
    const user = await this.updateUser.execute(req.params.id, payload);
    return res.json(user);
  };

  delete = async (req: Request, res: Response) => {
    await this.deleteUser.execute(req.params.id);
    return res.status(204).send();
  };
}
