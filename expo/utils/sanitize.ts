export function sanitizeTextInput(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

import { ANIMAL_POINTS_MIN, ANIMAL_POINTS_MAX } from "@/constants/config";

export function validatePointValue(value: number): number | null {
  if (!Number.isInteger(value) || value < ANIMAL_POINTS_MIN || value > ANIMAL_POINTS_MAX) {
    return null;
  }
  return value;
}

export const INPUT_LIMITS = {
  TRIP_NAME: 40,
  PLAYER_NAME: 30,
  ANIMAL_NAME: 30,
  POINTS_MIN: ANIMAL_POINTS_MIN,
  POINTS_MAX: ANIMAL_POINTS_MAX,
} as const;
