export const CombatClasses = [
  "ASSAULT",
  "SNIPER",
  "SUPPRESSOR",
  "MED",
  "ENG",
  "COM"
] as const;

export type CombatClass = (typeof CombatClasses)[number];
