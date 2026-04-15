import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DEFAULT_ANIMALS } from "@/constants/animals";
import { DEBOUNCE_SAVE_DELAY_MS } from "@/constants/config";
import { GameStateSchema } from "@/providers/gameStateSchema";
import { Animal, GameState, Player, PlayerSightings, Trip, TripPlayer } from "@/types";
import { sanitizeTextInput, validatePointValue, INPUT_LIMITS } from "@/utils/sanitize";

const STORAGE_KEY = "wildlife_spotter_data";
const ONBOARDING_KEY = "wildlife_spotter_onboarding_complete";

const defaultState: GameState = {
  players: [],
  animals: [...DEFAULT_ANIMALS],
  trips: [],
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const [GameProvider, useGame] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<GameState>(defaultState);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  const dataQuery = useQuery({
    queryKey: ["gameData"],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const onboardingDone = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (stored) {
          try {
            const raw = JSON.parse(stored);
            const result = GameStateSchema.safeParse(raw);
            if (result.success) {
              const parsed = result.data as GameState;
              if (!parsed.animals || parsed.animals.length === 0) {
                parsed.animals = [...DEFAULT_ANIMALS];
              }
              return { state: parsed, onboardingDone: onboardingDone === "true" || parsed.players.length > 0 };
            }
            console.warn('[GameProvider] Game state failed validation, resetting to defaults', result.error.issues);
            return { state: defaultState, onboardingDone: onboardingDone === "true" };
          } catch (parseError) {
            if (__DEV__) console.error('[GameProvider] Failed to parse stored data, resetting to defaults:', parseError);
            return { state: defaultState, onboardingDone: onboardingDone === "true" };
          }
        }
        return { state: defaultState, onboardingDone: onboardingDone === "true" };
      } catch (storageError) {
        if (__DEV__) console.error('[GameProvider] Failed to load from AsyncStorage, using defaults:', storageError);
        return { state: defaultState, onboardingDone: false };
      }
    },
  });

  useEffect(() => {
    if (dataQuery.data) {
      setState(dataQuery.data.state);
      setHasCompletedOnboarding(dataQuery.data.onboardingDone);
    }
  }, [dataQuery.data]);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingStateRef = useRef<GameState | null>(null);

  const flushToStorage = useCallback(async (newState: GameState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      if (__DEV__) console.log('[GameProvider] State saved to AsyncStorage');
    } catch (error) {
      if (__DEV__) console.error('[GameProvider] Failed to save state:', error);
    }
  }, []);

  const debouncedSave = useCallback((newState: GameState) => {
    pendingStateRef.current = newState;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      if (pendingStateRef.current) {
        flushToStorage(pendingStateRef.current);
        pendingStateRef.current = null;
      }
      saveTimerRef.current = null;
    }, DEBOUNCE_SAVE_DELAY_MS);
  }, [flushToStorage]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        if (pendingStateRef.current) {
          flushToStorage(pendingStateRef.current);
        }
      }
    };
  }, [flushToStorage]);

  const updateState = useCallback(
    (updater: (prev: GameState) => GameState) => {
      setState((prev) => {
        const next = updater(prev);
        debouncedSave(next);
        return next;
      });
    },
    [debouncedSave]
  );

  const addPlayer = useCallback(
    (name: string, avatar: string) => {
      const sanitized = sanitizeTextInput(name, INPUT_LIMITS.PLAYER_NAME);
      if (!sanitized) {
        if (__DEV__) console.warn('[GameProvider] addPlayer rejected: empty name after sanitization');
        return { id: '', name: '', avatar } as Player;
      }
      const player: Player = { id: generateId(), name: sanitized, avatar };
      updateState((prev) => ({ ...prev, players: [...prev.players, player] }));
      return player;
    },
    [updateState]
  );

  const updatePlayer = useCallback(
    (playerId: string, name: string, avatar: string) => {
      const sanitized = sanitizeTextInput(name, INPUT_LIMITS.PLAYER_NAME);
      if (!sanitized) {
        if (__DEV__) console.warn('[GameProvider] updatePlayer rejected: empty name after sanitization');
        return;
      }
      if (__DEV__) console.log('[GameProvider] Updating player:', playerId, 'name:', sanitized, 'avatar:', avatar);
      updateState((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.id === playerId ? { ...p, name: sanitized, avatar } : p
        ),
      }));
    },
    [updateState]
  );

  const removePlayer = useCallback(
    (playerId: string) => {
      updateState((prev) => ({
        ...prev,
        players: prev.players.filter((p) => p.id !== playerId),
        trips: prev.trips.map((trip) => {
          if (!trip.isActive) return trip;
          const hasPlayer = trip.players.some((tp) => tp.playerId === playerId);
          if (!hasPlayer) return trip;
          if (__DEV__) console.log('[GameProvider] Removing player', playerId, 'from active trip', trip.id);
          return {
            ...trip,
            players: trip.players.filter((tp) => tp.playerId !== playerId),
          };
        }),
      }));
    },
    [updateState]
  );

  const addAnimal = useCallback(
    (name: string, emoji: string, points: number) => {
      const sanitizedName = sanitizeTextInput(name, INPUT_LIMITS.ANIMAL_NAME);
      const validPoints = validatePointValue(points);
      if (!sanitizedName) {
        if (__DEV__) console.warn('[GameProvider] addAnimal rejected: empty name after sanitization');
        return;
      }
      if (validPoints === null) {
        if (__DEV__) console.warn('[GameProvider] addAnimal rejected: invalid points', points);
        return;
      }
      const animal: Animal = {
        id: generateId(),
        name: sanitizedName,
        emoji,
        points: validPoints,
        isDefault: false,
      };
      updateState((prev) => ({ ...prev, animals: [...prev.animals, animal] }));
    },
    [updateState]
  );

  const removeAnimal = useCallback(
    (animalId: string) => {
      updateState((prev) => {
        const updatedTrips = prev.trips.map((trip) => {
          const hasAnimal = (trip.animals ?? []).some((a) => a.id === animalId);
          if (!hasAnimal) return trip;
          const animalList = trip.animals ?? [];
          return {
            ...trip,
            animals: animalList.filter((a) => a.id !== animalId),
            players: trip.players.map((tp) => {
              const removedCount = tp.sightings[animalId] || 0;
              if (removedCount === 0) return tp;
              const removedAnimal = animalList.find((a) => a.id === animalId);
              const pointsToSubtract = removedCount * (removedAnimal?.points || 0);
              const newSightings = { ...tp.sightings };
              delete newSightings[animalId];
              return {
                ...tp,
                sightings: newSightings,
                totalPoints: Math.max(0, tp.totalPoints - pointsToSubtract),
              };
            }),
          };
        });
        return {
          ...prev,
          animals: prev.animals.filter((a) => a.id !== animalId),
          trips: updatedTrips,
        };
      });
    },
    [updateState]
  );

  const editAnimal = useCallback(
    (animalId: string, name: string, emoji: string, points: number) => {
      const sanitizedName = sanitizeTextInput(name, INPUT_LIMITS.ANIMAL_NAME);
      const validPoints = validatePointValue(points);
      if (!sanitizedName || validPoints === null) {
        if (__DEV__) console.warn('[GameProvider] editAnimal rejected: invalid name or points');
        return;
      }
      updateState((prev) => ({
        ...prev,
        animals: prev.animals.map((a) =>
          a.id === animalId ? { ...a, name: sanitizedName, emoji, points: validPoints } : a
        ),
      }));
    },
    [updateState]
  );

  const startTrip = useCallback(
    (name: string, playerIds: string[], tripAnimals: Animal[]) => {
      const sanitizedName = sanitizeTextInput(name, INPUT_LIMITS.TRIP_NAME);
      const tripPlayers: TripPlayer[] = playerIds.map((pid) => ({
        playerId: pid,
        sightings: {},
        totalPoints: 0,
      }));
      const trip: Trip = {
        id: generateId(),
        name: sanitizedName || `Trip ${new Date().toLocaleDateString()}`,
        startDate: new Date().toISOString(),
        endDate: null,
        isActive: true,
        players: tripPlayers,
        winnerId: null,
        animals: tripAnimals,
      };
      updateState((prev) => ({ ...prev, trips: [trip, ...prev.trips] }));
      return trip.id;
    },
    [updateState]
  );

  const recordSighting = useCallback(
    (tripId: string, playerId: string, animalId: string) => {
      updateState((prev) => ({
        ...prev,
        trips: prev.trips.map((trip) => {
          if (trip.id !== tripId) return trip;
          return {
            ...trip,
            players: trip.players.map((tp) => {
              if (tp.playerId !== playerId) return tp;
              const newSightings: PlayerSightings = {
                ...tp.sightings,
                [animalId]: (tp.sightings[animalId] || 0) + 1,
              };
              const tripAnimal = trip.animals?.find((a) => a.id === animalId);
              const animal = tripAnimal ?? prev.animals.find((a) => a.id === animalId);
              const newTotal = tp.totalPoints + (animal?.points || 0);
              return { ...tp, sightings: newSightings, totalPoints: newTotal };
            }),
          };
        },
        ),
      }));
    },
    [updateState]
  );

  const undoSighting = useCallback(
    (tripId: string, playerId: string, animalId: string) => {
      updateState((prev) => ({
        ...prev,
        trips: prev.trips.map((trip) => {
          if (trip.id !== tripId) return trip;
          return {
            ...trip,
            players: trip.players.map((tp) => {
              if (tp.playerId !== playerId) return tp;
              const currentCount = tp.sightings[animalId] || 0;
              if (currentCount <= 0) return tp;
              const newSightings: PlayerSightings = {
                ...tp.sightings,
                [animalId]: currentCount - 1,
              };
              const tripAnimal = trip.animals?.find((a) => a.id === animalId);
              const animal = tripAnimal ?? prev.animals.find((a) => a.id === animalId);
              const newTotal = Math.max(0, tp.totalPoints - (animal?.points || 0));
              return { ...tp, sightings: newSightings, totalPoints: newTotal };
            }),
          };
        }),
      }));
    },
    [updateState]
  );

  const endTrip = useCallback(
    (tripId: string, winnerId: string | null) => {
      updateState((prev) => {
        const tripToEnd = prev.trips.find((t) => t.id === tripId);
        if (tripToEnd) {
          if (__DEV__) console.log('[GameProvider] Ending trip:', tripId, 'with', tripToEnd.players.length, 'players:', tripToEnd.players.map((p) => p.playerId));
        }
        return {
          ...prev,
          trips: prev.trips.map((trip) =>
            trip.id === tripId
              ? { ...trip, isActive: false, endDate: new Date().toISOString(), winnerId }
              : trip
          ),
        };
      });
    },
    [updateState]
  );

  const activeTrips = useMemo(
    () => state.trips.filter((t) => t.isActive),
    [state.trips]
  );

  const activeTrip = useMemo(
    () => activeTrips[0] ?? null,
    [activeTrips]
  );

  const getTrip = useCallback(
    (tripId: string) => state.trips.find((t) => t.id === tripId) ?? null,
    [state.trips]
  );

  const completedTrips = useMemo(
    () => state.trips.filter((t) => !t.isActive),
    [state.trips]
  );

  const getPlayer = useCallback(
    (playerId: string) => state.players.find((p) => p.id === playerId),
    [state.players]
  );

  const getAnimal = useCallback(
    (animalId: string) => state.animals.find((a) => a.id === animalId),
    [state.animals]
  );

  const completeOnboarding = useCallback(async () => {
    setHasCompletedOnboarding(true);
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    } catch (error) {
      console.error('[GameProvider] Failed to save onboarding status:', error);
    }
  }, []);

  const getTripAnimals = useCallback(
    (tripId: string): Animal[] => {
      const trip = state.trips.find((t) => t.id === tripId);
      return trip?.animals ?? state.animals;
    },
    [state.trips, state.animals]
  );

  const updateTripAnimal = useCallback(
    (tripId: string, animalId: string, name: string, emoji: string, points: number) => {
      const sanitizedName = sanitizeTextInput(name, INPUT_LIMITS.ANIMAL_NAME);
      const validPoints = validatePointValue(points);
      if (!sanitizedName || validPoints === null) {
        if (__DEV__) console.warn('[GameProvider] updateTripAnimal rejected: invalid name or points');
        return;
      }
      updateState((prev) => ({
        ...prev,
        trips: prev.trips.map((trip) => {
          if (trip.id !== tripId) return trip;
          const tripAnimals = trip.animals ?? prev.animals;
          const oldAnimal = tripAnimals.find((a) => a.id === animalId);
          const updatedAnimals = tripAnimals.map((a) =>
            a.id === animalId ? { ...a, name: sanitizedName, emoji, points: validPoints } : a
          );
          const pointsDiff = oldAnimal ? validPoints - oldAnimal.points : 0;
          const updatedPlayers = pointsDiff !== 0
            ? trip.players.map((tp) => {
                const count = tp.sightings[animalId] || 0;
                if (count === 0) return tp;
                return { ...tp, totalPoints: Math.max(0, tp.totalPoints + count * pointsDiff) };
              })
            : trip.players;
          return {
            ...trip,
            animals: updatedAnimals,
            players: updatedPlayers,
          };
        }),
      }));
    },
    [updateState]
  );

  const addTripAnimal = useCallback(
    (tripId: string, name: string, emoji: string, points: number) => {
      const sanitizedName = sanitizeTextInput(name, INPUT_LIMITS.ANIMAL_NAME);
      const validPoints = validatePointValue(points);
      if (!sanitizedName || validPoints === null) {
        if (__DEV__) console.warn('[GameProvider] addTripAnimal rejected: invalid name or points');
        return { id: '', name: '', emoji: '', points: 0, isDefault: false } as Animal;
      }
      const animal: Animal = { id: generateId(), name: sanitizedName, emoji, points: validPoints, isDefault: false };
      updateState((prev) => ({
        ...prev,
        trips: prev.trips.map((trip) => {
          if (trip.id !== tripId) return trip;
          return { ...trip, animals: [...(trip.animals ?? prev.animals), animal] };
        }),
      }));
      return animal;
    },
    [updateState]
  );

  const addPlayerToTrip = useCallback(
    (tripId: string, playerId: string) => {
      updateState((prev) => ({
        ...prev,
        trips: prev.trips.map((trip) => {
          if (trip.id !== tripId) return trip;
          if (trip.players.some((tp) => tp.playerId === playerId)) return trip;
          const newTripPlayer: TripPlayer = { playerId, sightings: {}, totalPoints: 0 };
          return { ...trip, players: [...trip.players, newTripPlayer] };
        }),
      }));
    },
    [updateState]
  );

  const removePlayerFromTrip = useCallback(
    (tripId: string, playerId: string) => {
      if (__DEV__) console.log('[GameProvider] Removing player', playerId, 'from trip', tripId);
      updateState((prev) => ({
        ...prev,
        trips: prev.trips.map((trip) => {
          if (trip.id !== tripId) return trip;
          return {
            ...trip,
            players: trip.players.filter((tp) => tp.playerId !== playerId),
          };
        }),
      }));
    },
    [updateState]
  );

  const deleteTrip = useCallback(
    (tripId: string) => {
      if (__DEV__) console.log('[GameProvider] Deleting trip:', tripId);
      updateState((prev) => ({
        ...prev,
        trips: prev.trips.filter((t) => t.id !== tripId),
      }));
    },
    [updateState]
  );

  const updateTrip = useCallback(
    (tripId: string, updates: { name?: string; startDate?: string; endDate?: string | null }) => {
      const sanitizedUpdates = { ...updates };
      if (sanitizedUpdates.name !== undefined) {
        const sanitizedName = sanitizeTextInput(sanitizedUpdates.name, INPUT_LIMITS.TRIP_NAME);
        if (!sanitizedName) {
          if (__DEV__) console.warn('[GameProvider] updateTrip rejected: empty name after sanitization');
          return;
        }
        sanitizedUpdates.name = sanitizedName;
      }
      if (__DEV__) console.log('[GameProvider] Updating trip:', tripId, sanitizedUpdates);
      updateState((prev) => ({
        ...prev,
        trips: prev.trips.map((trip) =>
          trip.id === tripId ? { ...trip, ...sanitizedUpdates } : trip
        ),
      }));
    },
    [updateState]
  );

  const removeTripAnimal = useCallback(
    (tripId: string, animalId: string) => {
      updateState((prev) => ({
        ...prev,
        trips: prev.trips.map((trip) => {
          if (trip.id !== tripId) return trip;
          const tripAnimals = trip.animals ?? prev.animals;
          return {
            ...trip,
            animals: tripAnimals.filter((a) => a.id !== animalId),
            players: trip.players.map((tp) => {
              const removedCount = tp.sightings[animalId] || 0;
              const removedAnimal = tripAnimals.find((a) => a.id === animalId);
              const pointsToSubtract = removedCount * (removedAnimal?.points || 0);
              const newSightings = { ...tp.sightings };
              delete newSightings[animalId];
              return {
                ...tp,
                sightings: newSightings,
                totalPoints: Math.max(0, tp.totalPoints - pointsToSubtract),
              };
            }),
          };
        }),
      }));
    },
    [updateState]
  );

  return {
    ...state,
    isLoading: dataQuery.isLoading,
    hasCompletedOnboarding,
    activeTrip,
    activeTrips,
    completedTrips,
    getTrip,
    addPlayer,
    updatePlayer,
    removePlayer,
    addAnimal,
    removeAnimal,
    editAnimal,
    startTrip,
    recordSighting,
    undoSighting,
    endTrip,
    getPlayer,
    getAnimal,
    getTripAnimals,
    updateTripAnimal,
    addTripAnimal,
    removeTripAnimal,
    addPlayerToTrip,
    removePlayerFromTrip,
    deleteTrip,
    updateTrip,
    completeOnboarding,
  };
});

export function usePlayerStats() {
  const { players, completedTrips, activeTrips } = useGame();

  const completedStatsMap = useMemo(() => {
    const map = new Map<string, {
      totalPoints: number;
      totalSightings: { [animalId: string]: number };
      totalDays: number;
      wins: number;
      tripCount: number;
    }>();

    players.forEach((player) => {
      let totalPoints = 0;
      let totalSightings: { [animalId: string]: number } = {};
      let totalDays = 0;
      let wins = 0;
      let tripCount = 0;

      completedTrips.forEach((trip) => {
        const tp = trip.players.find((p) => p.playerId === player.id);
        if (!tp) return;
        tripCount++;
        totalPoints += tp.totalPoints;
        Object.entries(tp.sightings).forEach(([animalId, count]) => {
          totalSightings[animalId] = (totalSightings[animalId] || 0) + count;
        });
        if (trip.winnerId === player.id) {
          wins++;
        }
        if (trip.startDate && trip.endDate) {
          const start = new Date(trip.startDate);
          const end = new Date(trip.endDate);
          const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
          const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
          const diffMs = endDay.getTime() - startDay.getTime();
          const calendarDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
          totalDays += Math.max(1, calendarDays === 0 ? 1 : calendarDays + 1);
        }
      });

      map.set(player.id, { totalPoints, totalSightings, totalDays, wins, tripCount });
    });

    return map;
  }, [players, completedTrips]);

  const stats = useMemo(() => {
    const activeTripCount = activeTrips.length;

    const playerStats = players.map((player) => {
      const completed = completedStatsMap.get(player.id) ?? {
        totalPoints: 0,
        totalSightings: {},
        totalDays: 0,
        wins: 0,
        tripCount: 0,
      };

      let activePoints = 0;
      let activeSightings: { [animalId: string]: number } = {};
      let activeDays = 0;

      activeTrips.forEach((trip) => {
        const tp = trip.players.find((p) => p.playerId === player.id);
        if (!tp) return;
        activePoints += tp.totalPoints;
        Object.entries(tp.sightings).forEach(([animalId, count]) => {
          activeSightings[animalId] = (activeSightings[animalId] || 0) + count;
        });
        if (trip.startDate) {
          const start = new Date(trip.startDate);
          const now = new Date();
          const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
          const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const diffMs = nowDay.getTime() - startDay.getTime();
          const calendarDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
          activeDays += Math.max(1, calendarDays === 0 ? 1 : calendarDays + 1);
        }
      });

      const totalPoints = completed.totalPoints + activePoints;
      const totalSightings = { ...completed.totalSightings };
      Object.entries(activeSightings).forEach(([animalId, count]) => {
        totalSightings[animalId] = (totalSightings[animalId] || 0) + count;
      });
      const totalDays = completed.totalDays + activeDays;
      const avgPerDay = totalDays > 0 ? Math.round(totalPoints / totalDays) : 0;

      return {
        player,
        totalPoints,
        totalSightings,
        avgPerDay,
        wins: completed.wins,
        tripCount: completed.tripCount,
      };
    });

    return { stats: playerStats, activeTripCount };
  }, [players, activeTrips, completedStatsMap]);

  return stats;
}
