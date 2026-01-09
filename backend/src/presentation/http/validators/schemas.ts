import { z } from "zod";
import { BloodTypes } from "../../../domain/enums/BloodType";
import { CombatClasses } from "../../../domain/enums/CombatClass";
import { PermissionLevels } from "../../../domain/enums/PermissionLevel";

const combatClassEnum = z.enum(CombatClasses as [string, ...string[]]);
const bloodTypeEnum = z.enum(BloodTypes as [string, ...string[]]);
const permissionEnum = z.enum(PermissionLevels as [string, ...string[]]);

export const createUserSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  motherName: z.string().min(2),
  fatherName: z.string().min(2),
  combatClass: combatClassEnum,
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bloodType: bloodTypeEnum,
  hasAllergy: z.boolean(),
  allergyDetails: z.string().max(255).nullable().optional(),
  phone: z.string().min(6),
  emergencyPhone: z.string().min(6),
  emergencyContactName: z.string().min(2),
  permissionLevel: permissionEnum
});

export const updateUserSchema = createUserSchema.partial();

export const createCredentialsSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  mfaCode: z.string().min(6).max(8).optional()
});

const dateString = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Invalid date."
});

export const eventSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(1000).nullable().optional(),
  location: z.string().max(160).nullable().optional(),
  startAt: dateString,
  endAt: dateString
});

export const eventUpdateSchema = eventSchema.partial();

export const eventQuerySchema = z.object({
  start: dateString.optional(),
  end: dateString.optional()
});

export const assignmentSchema = z.object({
  userIds: z.array(z.string().uuid())
});

export const attendanceItemSchema = z.object({
  userId: z.string().uuid(),
  present: z.boolean(),
  note: z.string().max(500).optional().nullable()
});

export const attendanceSchema = z.object({
  items: z.array(attendanceItemSchema)
});

export const observationSchema = z.object({
  note: z.string().min(1).max(1000)
});

export const reportQuerySchema = z.object({
  start: dateString,
  end: dateString,
  eventId: z.string().uuid().optional()
});

export const mfaVerifySchema = z.object({
  token: z.string().min(6).max(8)
});

export const mfaSetupSchema = z.object({
  label: z.string().min(2).max(120).optional()
});
