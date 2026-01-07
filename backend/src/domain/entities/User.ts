import { BloodType } from "../enums/BloodType";
import { CombatClass } from "../enums/CombatClass";
import { PermissionLevel } from "../enums/PermissionLevel";

export type User = {
  id: string;
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
  failedLoginAttempts: number;
  lockoutUntil: string | null;
  createdAt: string;
  updatedAt: string;
};
