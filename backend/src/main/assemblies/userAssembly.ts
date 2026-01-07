import { UserController } from "../../presentation/http/controllers/UserController";
import { buildUserRoutes } from "../../presentation/http/routes/userRoutes";
import { CreateUserUseCase } from "../../application/usecases/CreateUserUseCase";
import { DeleteUserUseCase } from "../../application/usecases/DeleteUserUseCase";
import { GetUserUseCase } from "../../application/usecases/GetUserUseCase";
import { ListUsersUseCase } from "../../application/usecases/ListUsersUseCase";
import { UpdateUserUseCase } from "../../application/usecases/UpdateUserUseCase";
import { container } from "../../shared/di/container";

export const buildUserModule = () => {
  const createUser = new CreateUserUseCase(container.userRepository);
  const listUsers = new ListUsersUseCase(container.userRepository);
  const getUser = new GetUserUseCase(container.userRepository);
  const updateUser = new UpdateUserUseCase(container.userRepository);
  const deleteUser = new DeleteUserUseCase(container.userRepository);

  const controller = new UserController(
    createUser,
    listUsers,
    getUser,
    updateUser,
    deleteUser
  );

  return buildUserRoutes(controller, container.tokenService, container.auditLogRepository);
};
