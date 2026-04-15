import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Clock, MapPin, Play, Plus, Repeat, Trash2, Trophy } from "lucide-react-native";
import React, { useCallback, useMemo } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Colors from "@/constants/colors";
import { FREE_TRIP_LIMIT } from "@/constants/limits";
import { useGame } from "@/providers/GameProvider";
import { usePurchases } from "@/providers/PurchaseProvider";
import { Trip } from "@/types";
import PlayerAvatar from "@/components/PlayerAvatar";

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

  const lastCompletedTrip = useMemo(() => completedTrips[0] ?? null, [completedTrips]);

  const repeatPreview = useMemo(() => {
    if (!lastCompletedTrip) return null;
    const playerNames = lastCompletedTrip.players
      .map((tp) => getPlayer(tp.playerId)?.name)
      .filter(Boolean);
    const animalCount = lastCompletedTrip.animals?.length ?? 0;
    return { playerNames, animalCount };
  }, [lastCompletedTrip, getPlayer]);

  const totalTripCount = useMemo(() => activeTrips.length + completedTrips.length, [activeTrips, completedTrips]);

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

  const recentTrips = completedTrips.slice(0, 3);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {activeTrips.length > 0 && (
        <View style={styles.activeSection}>
          <View style={styles.activeSectionHeader}>
            <View style={styles.activeBadgeRow}>
              <View style={styles.liveDot} />
              <Text style={styles.activeSectionTitle}>
                Active Trip{activeTrips.length > 1 ? "s" : ""}
              </Text>
            </View>
            <Text style={styles.activeCount}>{activeTrips.length}</Text>
          </View>

          {activeTrips.map((trip) => {
            const leader = getLeader(trip);
            const duration = formatDuration(trip.startDate);
            return (
              <Pressable
                key={trip.id}
                style={({ pressed }) => [
                  styles.activeTripCard,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => handleGoToTrip(trip.id)}
                testID={`active-trip-card-${trip.id}`}
              >
                <View style={styles.activeTripTop}>
                  <View style={styles.activeTripInfo}>
                    <Text style={styles.activeTripName} numberOfLines={1}>
                      {trip.name}
                    </Text>
                    <View style={styles.durationRow}>
                      <Clock size={12} color={Colors.accentLight} />
                      <Text style={styles.durationText}>{duration}</Text>
                    </View>
                  </View>
                  <View style={styles.livePill}>
                    <View style={styles.livePillDot} />
                    <Text style={styles.livePillText}>LIVE</Text>
                  </View>
                </View>

                <View style={styles.activeTripBottom}>
                  {leader ? (
                    <View style={styles.leaderRow}>
                      <Text style={styles.leaderEmoji}>👑</Text>
                      <PlayerAvatar avatar={leader.avatar} size={24} fontSize={16} />
                      <Text style={styles.leaderName} numberOfLines={1}>
                        {leader.name}
                      </Text>
                      <Text style={styles.leaderPoints}>
                        {leader.points} pts
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.noScoresText}>No scores yet</Text>
                  )}
                  <View style={styles.playerAvatars}>
                    {trip.players.slice(0, 5).map((tp) => {
                      const p = getPlayer(tp.playerId);
                      return (
                        <View key={tp.playerId} style={styles.miniAvatarWrap}>
                          <Text style={styles.miniAvatarText}>
                            {p?.avatar ?? "?"}
                          </Text>
                        </View>
                      );
                    })}
                    {trip.players.length > 5 && (
                      <View style={styles.miniAvatarWrap}>
                        <Text style={styles.miniAvatarMore}>
                          +{trip.players.length - 5}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.tapHint}>
                  <Play size={12} color={Colors.cream} />
                  <Text style={styles.tapHintText}>Tap to score</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.startButton,
          pressed && styles.startButtonPressed,
        ]}
        onPress={handleStartTrip}
        testID="start-trip-button"
      >
        <Plus size={22} color={Colors.white} />
        <Text style={styles.startButtonText}>Start New Trip</Text>
      </Pressable>

      {players.length < 2 && (
        <Text style={styles.hintText}>
          Add at least 2 players in Settings first
        </Text>
      )}

      {activeTrips.length === 0 && (
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroEmoji}>🦌</Text>
          </View>
          <Text style={styles.heroTitle}>Ready for an Adventure?</Text>
          <Text style={styles.heroSubtitle}>
            Start a new trip and spot some wildlife with your family!
          </Text>
        </View>
      )}

      {repeatPreview && activeTrips.length === 0 && (
        <Pressable
          style={({ pressed }) => [
            styles.repeatCard,
            pressed && styles.repeatCardPressed,
          ]}
          onPress={handleRepeatLastTrip}
          testID="repeat-trip-button"
        >
          <View style={styles.repeatHeader}>
            <View style={styles.repeatIconWrap}>
              <Repeat size={16} color={Colors.primary} />
            </View>
            <Text style={styles.repeatTitle}>Repeat Last Trip</Text>
          </View>
          <Text style={styles.repeatPreview} numberOfLines={2}>
            Same players: {repeatPreview.playerNames.join(", ")} ·{" "}
            {repeatPreview.animalCount} animal
            {repeatPreview.animalCount !== 1 ? "s" : ""}
          </Text>
        </Pressable>
      )}

      {recentTrips.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Trips</Text>
          {recentTrips.map((trip) => {
            const winner = trip.winnerId ? getPlayer(trip.winnerId) : null;
            return (
              <Pressable
                key={trip.id}
                style={({ pressed }) => [
                  styles.recentTripCard,
                  pressed && styles.cardPressed,
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/trip-detail",
                    params: { id: trip.id },
                  })
                }
              >
                <View style={styles.recentTripHeader}>
                  <MapPin size={16} color={Colors.primary} />
                  <Text style={styles.recentTripName}>{trip.name}</Text>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteRecentTrip(trip.id, trip.name);
                    }}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.deleteBtn,
                      pressed && styles.deleteBtnPressed,
                    ]}
                    testID={`delete-recent-trip-${trip.id}`}
                  >
                    <Trash2 size={15} color={Colors.danger} />
                  </Pressable>
                </View>
                <Text style={styles.recentTripDate}>
                  {new Date(trip.startDate).toLocaleDateString()}
                </Text>
                {winner && (
                  <View style={styles.winnerRow}>
                    <Trophy size={14} color={Colors.gold} />
                    <PlayerAvatar avatar={winner.avatar} size={18} fontSize={13} />
                    <Text style={styles.winnerText}>
                      {winner.name}
                    </Text>
                  </View>
                )}
                <View style={styles.recentScores}>
                  {trip.players.map((tp) => {
                    const p = getPlayer(tp.playerId);
                    return (
                      <View key={tp.playerId} style={styles.miniScore}>
                        <PlayerAvatar avatar={p?.avatar ?? "?"} size={18} fontSize={13} />
                        <Text style={styles.miniScorePoints}>
                          {tp.totalPoints}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {completedTrips.length === 0 && activeTrips.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌲</Text>
          <Text style={styles.emptyText}>
            Your trip history will appear here
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: 20, paddingBottom: 40 },
  activeSection: { marginBottom: 20 },
  activeSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  activeBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4ADE80",
  },
  activeSectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.brown,
  },
  activeCount: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.white,
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    textAlign: "center",
    lineHeight: 28,
    overflow: "hidden",
  },
  activeTripCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
  },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  activeTripTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  activeTripInfo: { flex: 1, marginRight: 12 },
  activeTripName: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.white,
    marginBottom: 4,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  durationText: {
    fontSize: 13,
    color: Colors.accentLight,
    fontWeight: "500" as const,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  livePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ADE80",
  },
  livePillText: {
    color: Colors.cream,
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1,
  },
  activeTripBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginRight: 10,
  },
  leaderEmoji: { fontSize: 14 },
  leaderAvatar: { fontSize: 18 },
  leaderName: {
    flex: 1,
    fontSize: 14,
    color: Colors.cream,
    fontWeight: "600" as const,
  },
  leaderPoints: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: "700" as const,
  },
  noScoresText: {
    flex: 1,
    fontSize: 14,
    color: Colors.accentLight,
    fontStyle: "italic" as const,
  },
  playerAvatars: {
    flexDirection: "row",
    gap: -4,
  },
  miniAvatarWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  miniAvatarText: { fontSize: 14 },
  miniAvatarMore: {
    fontSize: 10,
    color: Colors.cream,
    fontWeight: "700" as const,
  },
  tapHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    opacity: 0.7,
  },
  tapHintText: {
    color: Colors.accentLight,
    fontSize: 12,
    fontWeight: "500" as const,
  },
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
  heroSection: { alignItems: "center", paddingVertical: 30 },
  heroIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroEmoji: { fontSize: 44 },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: Colors.brown,
    marginBottom: 8,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 15,
    color: Colors.brownMuted,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  repeatCard: {
    marginTop: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  repeatCardPressed: {
    backgroundColor: Colors.creamDark,
    transform: [{ scale: 0.98 }],
  },
  repeatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  repeatIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#EDF5F0",
    alignItems: "center",
    justifyContent: "center",
  },
  repeatTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.brown,
  },
  repeatPreview: {
    fontSize: 13,
    color: Colors.brownMuted,
    lineHeight: 18,
    marginLeft: 42,
  },
  recentSection: { marginTop: 20 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.brown,
    marginBottom: 14,
  },
  recentTripCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recentTripHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  recentTripName: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.brown,
    flex: 1,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnPressed: {
    backgroundColor: "#FECACA",
    transform: [{ scale: 0.9 }],
  },
  recentTripDate: {
    fontSize: 13,
    color: Colors.brownMuted,
    marginBottom: 10,
    marginLeft: 24,
  },
  winnerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    marginLeft: 24,
  },
  winnerText: {
    fontSize: 14,
    color: Colors.brown,
    fontWeight: "600" as const,
  },
  recentScores: {
    flexDirection: "row",
    gap: 12,
    marginLeft: 24,
    flexWrap: "wrap",
  },
  miniScore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.cream,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  miniScoreAvatar: { fontSize: 16 },
  miniScorePoints: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  emptyState: { alignItems: "center", paddingVertical: 40, opacity: 0.6 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: {
    fontSize: 15,
    color: Colors.brownMuted,
    textAlign: "center",
  },
});
