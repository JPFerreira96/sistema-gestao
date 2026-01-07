import { User } from "../../domain/entities/User";
import { BloodType } from "../../domain/enums/BloodType";
import { CombatClass } from "../../domain/enums/CombatClass";
import { PermissionLevel } from "../../domain/enums/PermissionLevel";

export type CreateUserInput = {
  firstName: string;
  lastName: string;
  motherName: string;
  fatherName: string;
  combatClass: CombatClass;
  birthDate: string;
  bloodType: BloodType;
  hasAllergy: boolean;
  allergyDetails: string | null;
  phone: string;
  emergencyPhone: string;
  emergencyContactName: string;
  permissionLevel: PermissionLevel;
};

export type UpdateUserInput = Partial<CreateUserInput>;

export interface UserRepository {
  create(input: CreateUserInput): Promise<User>;
  list(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  update(id: string, input: UpdateUserInput): Promise<User>;
  delete(id: string): Promise<void>;
  recordLoginFailure(userId: string, attempts: number, lockoutUntil: Date | null): Promise<void>;
  resetLoginFailures(userId: string): Promise<void>;
}
