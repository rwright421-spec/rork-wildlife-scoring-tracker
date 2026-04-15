import { Animal, PlayerSightings } from '@/types';
import {
  calculatePlayerScore,
  calculateScoreAfterSighting,
  calculateScoreAfterUndo,
} from '@/utils/scoring';

const mockAnimals: Animal[] = [
  { id: 'deer', name: 'Deer', emoji: '🦌', points: 1, isDefault: true },
  { id: 'coyote', name: 'Coyote', emoji: '🐺', points: 5, isDefault: true },
  { id: 'bear', name: 'Bear', emoji: '🐻', points: 25, isDefault: true },
  { id: 'cougar', name: 'Cougar', emoji: '🦁', points: 50, isDefault: true },
];

describe('calculatePlayerScore', () => {
  it('returns 0 for a player with no sightings', () => {
    const sightings: PlayerSightings = {};
    expect(calculatePlayerScore(sightings, mockAnimals)).toBe(0);
  });

  it('returns correct score for a single sighting', () => {
    const sightings: PlayerSightings = { deer: 1 };
    expect(calculatePlayerScore(sightings, mockAnimals)).toBe(1);
  });

  it('sums points across different animals', () => {
    const sightings: PlayerSightings = { deer: 2, coyote: 1, bear: 1 };
    expect(calculatePlayerScore(sightings, mockAnimals)).toBe(2 * 1 + 1 * 5 + 1 * 25);
  });

  it('stacks multiple sightings of the same animal correctly', () => {
    const sightings: PlayerSightings = { bear: 4 };
    expect(calculatePlayerScore(sightings, mockAnimals)).toBe(4 * 25);
  });

  it('ignores sightings for unknown animal IDs', () => {
    const sightings: PlayerSightings = { deer: 1, unknown_animal: 3 };
    expect(calculatePlayerScore(sightings, mockAnimals)).toBe(1);
  });

  it('ignores sightings with zero count', () => {
    const sightings: PlayerSightings = { deer: 0, bear: 2 };
    expect(calculatePlayerScore(sightings, mockAnimals)).toBe(50);
  });

  it('handles all four default animals', () => {
    const sightings: PlayerSightings = { deer: 1, coyote: 1, bear: 1, cougar: 1 };
    expect(calculatePlayerScore(sightings, mockAnimals)).toBe(1 + 5 + 25 + 50);
  });
});

describe('calculateScoreAfterSighting', () => {
  it('adds animal points to current total', () => {
    expect(calculateScoreAfterSighting(10, 25)).toBe(35);
  });

  it('works from zero', () => {
    expect(calculateScoreAfterSighting(0, 5)).toBe(5);
  });
});

describe('calculateScoreAfterUndo', () => {
  it('subtracts animal points from current total', () => {
    expect(calculateScoreAfterUndo(30, 5)).toBe(25);
  });

  it('never goes below zero', () => {
    expect(calculateScoreAfterUndo(3, 25)).toBe(0);
  });

  it('returns zero when undoing exact total', () => {
    expect(calculateScoreAfterUndo(25, 25)).toBe(0);
  });
});
