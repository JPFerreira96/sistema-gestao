export const BloodTypes = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-"
] as const;

export type BloodType = (typeof BloodTypes)[number];
