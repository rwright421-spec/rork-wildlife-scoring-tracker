import { Trip, TripPlayer } from '@/types';
import {
  buildLeaderboard,
  getAnimalSightingCounts,
  aggregatePlayerStatsFromTrips,
} from '@/utils/scoring';

function makeTripPlayer(
  playerId: string,
  sightings: Record<string, number>,
  totalPoints: number
): TripPlayer {
  return { playerId, sightings, totalPoints };
}

function makeTrip(overrides: Partial<Trip> & { players: TripPlayer[] }): Trip {
  return {
    id: 'trip-1',
    name: 'Test Trip',
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-01-01T12:00:00Z',
    isActive: false,
    winnerId: null,
    animals: [],
    ...overrides,
  };
}

describe('buildLeaderboard', () => {
  it('assigns rank 1 to the player with the highest score', () => {
    const players: TripPlayer[] = [
      makeTripPlayer('p1', {}, 10),
      makeTripPlayer('p2', {}, 30),
      makeTripPlayer('p3', {}, 20),
    ];
    const board = buildLeaderboard(players);
    expect(board[0]).toEqual({ playerId: 'p2', totalPoints: 30, rank: 1 });
    expect(board[1]).toEqual({ playerId: 'p3', totalPoints: 20, rank: 2 });
    expect(board[2]).toEqual({ playerId: 'p1', totalPoints: 10, rank: 3 });
  });

  it('assigns the same rank to tied players', () => {
    const players: TripPlayer[] = [
      makeTripPlayer('p1', {}, 20),
      makeTripPlayer('p2', {}, 20),
      makeTripPlayer('p3', {}, 10),
    ];
    const board = buildLeaderboard(players);
    expect(board[0].rank).toBe(1);
    expect(board[1].rank).toBe(1);
    expect(board[2].rank).toBe(3);
  });

  it('handles all players tied at zero', () => {
    const players: TripPlayer[] = [
      makeTripPlayer('p1', {}, 0),
      makeTripPlayer('p2', {}, 0),
    ];
    const board = buildLeaderboard(players);
    expect(board[0].rank).toBe(1);
    expect(board[1].rank).toBe(1);
  });

  it('handles a single player', () => {
    const players: TripPlayer[] = [makeTripPlayer('p1', {}, 50)];
    const board = buildLeaderboard(players);
    expect(board).toHaveLength(1);
    expect(board[0]).toEqual({ playerId: 'p1', totalPoints: 50, rank: 1 });
  });

  it('handles empty players array', () => {
    const board = buildLeaderboard([]);
    expect(board).toEqual([]);
  });

  it('ranks correctly with three-way tie then different scores', () => {
    const players: TripPlayer[] = [
      makeTripPlayer('p1', {}, 15),
      makeTripPlayer('p2', {}, 15),
      makeTripPlayer('p3', {}, 15),
      makeTripPlayer('p4', {}, 5),
    ];
    const board = buildLeaderboard(players);
    expect(board[0].rank).toBe(1);
    expect(board[1].rank).toBe(1);
    expect(board[2].rank).toBe(1);
    expect(board[3].rank).toBe(4);
  });
});

describe('getAnimalSightingCounts', () => {
  it('returns counts for all sighted animals', () => {
    const sightings = { deer: 3, bear: 1 };
    const counts = getAnimalSightingCounts(sightings);
    expect(counts).toEqual(
      expect.arrayContaining([
        { animalId: 'deer', count: 3 },
        { animalId: 'bear', count: 1 },
      ])
    );
    expect(counts).toHaveLength(2);
  });

  it('excludes animals with zero count', () => {
    const sightings = { deer: 0, bear: 2 };
    const counts = getAnimalSightingCounts(sightings);
    expect(counts).toEqual([{ animalId: 'bear', count: 2 }]);
  });

  it('returns empty array for no sightings', () => {
    const counts = getAnimalSightingCounts({});
    expect(counts).toEqual([]);
  });
});

describe('aggregatePlayerStatsFromTrips', () => {
  it('accumulates points across multiple trips', () => {
    const trips: Trip[] = [
      makeTrip({
        id: 't1',
        players: [makeTripPlayer('p1', { deer: 2 }, 10)],
      }),
      makeTrip({
        id: 't2',
        players: [makeTripPlayer('p1', { bear: 1 }, 25)],
      }),
    ];
    const stats = aggregatePlayerStatsFromTrips('p1', trips);
    expect(stats.totalPoints).toBe(35);
    expect(stats.tripCount).toBe(2);
  });

  it('counts wins correctly', () => {
    const trips: Trip[] = [
      makeTrip({ id: 't1', winnerId: 'p1', players: [makeTripPlayer('p1', {}, 30)] }),
      makeTrip({ id: 't2', winnerId: 'p2', players: [makeTripPlayer('p1', {}, 10)] }),
      makeTrip({ id: 't3', winnerId: 'p1', players: [makeTripPlayer('p1', {}, 20)] }),
    ];
    const stats = aggregatePlayerStatsFromTrips('p1', trips);
    expect(stats.wins).toBe(2);
  });

  it('merges sighting counts across trips', () => {
    const trips: Trip[] = [
      makeTrip({
        id: 't1',
        players: [makeTripPlayer('p1', { deer: 3, bear: 1 }, 28)],
      }),
      makeTrip({
        id: 't2',
        players: [makeTripPlayer('p1', { deer: 2, cougar: 1 }, 52)],
      }),
    ];
    const stats = aggregatePlayerStatsFromTrips('p1', trips);
    expect(stats.totalSightings).toEqual({ deer: 5, bear: 1, cougar: 1 });
  });

  it('returns zeros for a player not in any trip', () => {
    const trips: Trip[] = [
      makeTrip({ id: 't1', players: [makeTripPlayer('p2', {}, 10)] }),
    ];
    const stats = aggregatePlayerStatsFromTrips('p1', trips);
    expect(stats.totalPoints).toBe(0);
    expect(stats.tripCount).toBe(0);
    expect(stats.wins).toBe(0);
    expect(stats.totalSightings).toEqual({});
  });

  it('returns zeros for empty trips array', () => {
    const stats = aggregatePlayerStatsFromTrips('p1', []);
    expect(stats.totalPoints).toBe(0);
    expect(stats.tripCount).toBe(0);
    expect(stats.wins).toBe(0);
    expect(stats.totalSightings).toEqual({});
  });
});
