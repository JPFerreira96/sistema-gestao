export const PermissionLevels = [
  "ALTO-COMANDO",
  "COMANDO",
  "ADMIN",
  "BASE",
  "RECRUTA"
] as const;

export type PermissionLevel = (typeof PermissionLevels)[number];
