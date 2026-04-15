import { Animal, PlayerSightings, TripPlayer, Trip } from "@/types";

export function calculatePlayerScore(
  sightings: PlayerSightings,
  animals: Animal[]
): number {
  let total = 0;
  for (const [animalId, count] of Object.entries(sightings)) {
    const animal = animals.find((a) => a.id === animalId);
    if (animal && count > 0) {
      total += animal.points * count;
    }
  }
  return total;
}

export function calculateScoreAfterSighting(
  currentTotal: number,
  animalPoints: number
): number {
  return currentTotal + animalPoints;
}

export function calculateScoreAfterUndo(
  currentTotal: number,
  animalPoints: number
): number {
  return Math.max(0, currentTotal - animalPoints);
}

export interface LeaderboardEntry {
  playerId: string;
  totalPoints: number;
  rank: number;
}

export function buildLeaderboard(tripPlayers: TripPlayer[]): LeaderboardEntry[] {
  const sorted = [...tripPlayers].sort((a, b) => b.totalPoints - a.totalPoints);

  const entries: LeaderboardEntry[] = [];
  let currentRank = 1;

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].totalPoints < sorted[i - 1].totalPoints) {
      currentRank = i + 1;
    }
    entries.push({
      playerId: sorted[i].playerId,
      totalPoints: sorted[i].totalPoints,
      rank: currentRank,
    });
  }

  return entries;
}

export function getAnimalSightingCounts(
  sightings: PlayerSightings
): { animalId: string; count: number }[] {
  return Object.entries(sightings)
    .filter(([, count]) => count > 0)
    .map(([animalId, count]) => ({ animalId, count }));
}

export interface AggregatedPlayerStats {
  totalPoints: number;
  totalSightings: { [animalId: string]: number };
  wins: number;
  tripCount: number;
}

export function aggregatePlayerStatsFromTrips(
  playerId: string,
  trips: Trip[]
): AggregatedPlayerStats {
  let totalPoints = 0;
  const totalSightings: { [animalId: string]: number } = {};
  let wins = 0;
  let tripCount = 0;

  for (const trip of trips) {
    const tp = trip.players.find((p) => p.playerId === playerId);
    if (!tp) continue;

    tripCount++;
    totalPoints += tp.totalPoints;

    for (const [animalId, count] of Object.entries(tp.sightings)) {
      totalSightings[animalId] = (totalSightings[animalId] || 0) + count;
    }

    if (trip.winnerId === playerId) {
      wins++;
    }
  }

  return { totalPoints, totalSightings, wins, tripCount };
}
