import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Plus } from "lucide-react-native";
import React, { useCallback, useMemo } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";

import Colors from "@/constants/colors";
import { FREE_TRIP_LIMIT } from "@/constants/limits";
import { useGame } from "@/providers/GameProvider";
import { usePurchases } from "@/providers/PurchaseProvider";
import { Trip } from "@/types";

import ActiveTripsSection from "@/components/home/ActiveTripsSection";
import EmptyState from "@/components/home/EmptyState";
import HeroSection from "@/components/home/HeroSection";
import RecentTripsSection from "@/components/home/RecentTripsSection";

function formatDuration(startDate: string): string {
  const start = new Date(startDate).getTime();
  const now = Date.now();
  const diffMs = now - start;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ${diffHours % 24}h`;
}

export default function HomeScreen() {
  const { activeTrips, completedTrips, players, getPlayer, deleteTrip } = useGame();
  const { isPremium } = usePurchases();

  const derivedData = useMemo(() => {
    const lastCompletedTrip = completedTrips[0] ?? null;
    const totalTripCount = activeTrips.length + completedTrips.length;
    const recentTrips = completedTrips.slice(0, 3);

    let repeatPreview: { playerNames: string[]; animalCount: number } | null = null;
    if (lastCompletedTrip) {
      const playerNames = lastCompletedTrip.players
        .map((tp) => getPlayer(tp.playerId)?.name)
        .filter(Boolean) as string[];
      const animalCount = lastCompletedTrip.animals?.length ?? 0;
      repeatPreview = { playerNames, animalCount };
    }

    return { lastCompletedTrip, totalTripCount, recentTrips, repeatPreview };
  }, [activeTrips, completedTrips, getPlayer]);

  const { lastCompletedTrip, totalTripCount, recentTrips, repeatPreview } = derivedData;
  const hasNoTrips = completedTrips.length === 0 && activeTrips.length === 0;
  const showHero = activeTrips.length === 0;

  const handleStartTrip = useCallback(() => {
    if (players.length < 2) {
      router.push("/settings");
      return;
    }
    if (!isPremium && totalTripCount >= FREE_TRIP_LIMIT) {
      Alert.alert(
        "Trip Limit Reached",
        `Free accounts can create up to ${FREE_TRIP_LIMIT} trips. Upgrade to Pro for unlimited trips!`,
        [
          { text: "Not Now", style: "cancel" },
          { text: "Upgrade", onPress: () => router.push("/paywall") },
        ]
      );
      return;
    }
    router.push("/new-trip");
  }, [players.length, isPremium, totalTripCount]);

  const handleRepeatLastTrip = useCallback(() => {
    if (!lastCompletedTrip) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const playerIds = lastCompletedTrip.players.map((tp) => tp.playerId);
    const animalsJson = JSON.stringify(lastCompletedTrip.animals ?? []);
    router.push({
      pathname: "/new-trip",
      params: {
        repeatPlayerIds: playerIds.join(","),
        repeatAnimals: animalsJson,
      },
    });
  }, [lastCompletedTrip]);

  const handleGoToTrip = useCallback((tripId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({ pathname: "/active-trip", params: { tripId } });
  }, []);

  const handleDeleteRecentTrip = useCallback((tripId: string, tripName: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(
      "Delete Trip",
      `Are you sure you want to delete "${tripName}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteTrip(tripId),
        },
      ]
    );
  }, [deleteTrip]);

  const getLeader = useCallback((trip: Trip) => {
    const sorted = [...trip.players].sort((a, b) => b.totalPoints - a.totalPoints);
    if (sorted.length === 0 || sorted[0].totalPoints === 0) return null;
    const player = getPlayer(sorted[0].playerId);
    return player ? { ...player, points: sorted[0].totalPoints } : null;
  }, [getPlayer]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ActiveTripsSection
        activeTrips={activeTrips}
        getPlayer={getPlayer}
        getLeader={getLeader}
        formatDuration={formatDuration}
        onGoToTrip={handleGoToTrip}
      />

      <Pressable
        style={({ pressed }) => [
          styles.startButton,
          pressed && styles.startButtonPressed,
        ]}
        onPress={handleStartTrip}
        testID="start-trip-button"
        accessibilityRole="button"
        accessibilityLabel="Start new trip"
      >
        <Plus size={22} color={Colors.white} />
        <Text style={styles.startButtonText}>Start New Trip</Text>
      </Pressable>

      {players.length < 2 && (
        <Text style={styles.hintText}>
          Add at least 2 players in Settings first
        </Text>
      )}

      {showHero && (
        <HeroSection
          repeatPreview={repeatPreview}
          onRepeatLastTrip={handleRepeatLastTrip}
        />
      )}

      <RecentTripsSection
        recentTrips={recentTrips}
        getPlayer={getPlayer}
        onDeleteTrip={handleDeleteRecentTrip}
      />

      {hasNoTrips && <EmptyState />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: 20, paddingBottom: 40 },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 8,
  },
  startButtonPressed: {
    backgroundColor: Colors.primaryDark,
    transform: [{ scale: 0.96 }],
  },
  startButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "700" as const,
  },
  hintText: {
    marginTop: 6,
    fontSize: 13,
    color: Colors.brownMuted,
    fontStyle: "italic" as const,
    textAlign: "center",
  },
});
