export function sanitizeTextInput(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function validatePointValue(value: number): number | null {
  if (!Number.isInteger(value) || value < 1 || value > 1000) {
    return null;
  }
  return value;
}

export const INPUT_LIMITS = {
  TRIP_NAME: 40,
  PLAYER_NAME: 30,
  ANIMAL_NAME: 30,
  POINTS_MIN: 1,
  POINTS_MAX: 1000,
} as const;
