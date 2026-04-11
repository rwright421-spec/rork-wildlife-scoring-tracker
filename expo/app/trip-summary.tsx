import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { Crown, MapPin, Share2, Trophy, X } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ViewShot, { captureRef } from "react-native-view-shot";

import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import PlayerAvatar from "@/components/PlayerAvatar";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateRange(start: string, end: string | null): string {
  const s = formatDate(start);
  if (!end) return s;
  const e = formatDate(end);
  if (s === e) return s;
  return `${s} — ${e}`;
}

function getTripDuration(start: string, end: string | null): string {
  if (!end) return "Ongoing";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours < 1) return `${Math.max(1, minutes)}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export default function TripSummaryScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const insets = useSafeAreaInsets();
  const { trips, getPlayer, getTripAnimals } = useGame();
  const cardRef = useRef<ViewShot>(null);
  const [sharing, setSharing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const trophyScale = useRef(new Animated.Value(0)).current;
  const rowAnims = useRef<Animated.Value[]>([]).current;

  const trip = useMemo(
    () => trips.find((t) => t.id === tripId) ?? null,
    [trips, tripId]
  );

  useEffect(() => {
    if (trip) {
      if (__DEV__) console.log('[TripSummary] Showing trip:', trip.id, 'players:', trip.players.length, trip.players.map((p) => p.playerId));
    }
  }, [trip]);

  const sortedPlayers = useMemo(() => {
    if (!trip) return [];
    return [...trip.players].sort((a, b) => b.totalPoints - a.totalPoints);
  }, [trip]);

  const winner = useMemo(() => {
    if (!trip?.winnerId) return null;
    return getPlayer(trip.winnerId);
  }, [trip, getPlayer]);

  const tripAnimals = trip ? getTripAnimals(trip.id) : [];

  const totalSightings = useMemo(() => {
    if (!trip) return 0;
    return trip.players.reduce((sum, tp) => {
      return sum + Object.values(tp.sightings).reduce((s, c) => s + c, 0);
    }, 0);
  }, [trip]);

  while (rowAnims.length < sortedPlayers.length) {
    rowAnims.push(new Animated.Value(0));
  }

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.spring(trophyScale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }, 300);

    sortedPlayers.forEach((_, i) => {
      setTimeout(() => {
        if (rowAnims[i]) {
          Animated.spring(rowAnims[i], {
            toValue: 1,
            friction: 7,
            tension: 50,
            useNativeDriver: true,
          }).start();
        }
      }, 500 + i * 120);
    });
  }, [sortedPlayers.length]);

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const uri = await captureRef(cardRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
      if (__DEV__) console.log("Captured summary card:", uri);

      if (Platform.OS === "web") {
        if (__DEV__) console.log("Web sharing not fully supported for images");
        setSharing(false);
        return;
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Share Trip Summary",
        });
      }
    } catch (err) {
      if (__DEV__) console.log("Share error:", err);
    } finally {
      setSharing(false);
    }
  }, []);

  const handleDone = useCallback(() => {
    router.dismissAll();
  }, []);

  if (!trip) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centered}>
          <Text style={styles.noTripText}>Trip not found</Text>
          <Pressable style={styles.doneBtn} onPress={handleDone}>
            <Text style={styles.doneBtnText}>Go Home</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={handleDone} style={styles.closeBtn}>
          <X size={22} color={Colors.brownMuted} />
        </Pressable>
        <Pressable
          onPress={handleShare}
          style={({ pressed }) => [
            styles.shareBtn,
            pressed && styles.shareBtnPressed,
          ]}
          disabled={sharing}
        >
          <Share2 size={18} color={Colors.white} />
          <Text style={styles.shareBtnText}>
            {sharing ? "Saving..." : "Share"}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ViewShot
          ref={cardRef}
          options={{ format: "png", quality: 1 }}
          style={styles.cardWrapper}
        >
          <View style={styles.summaryCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderPattern}>
                {[...Array(5)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.patternDot,
                      {
                        left: `${15 + i * 18}%` as unknown as number,
                        top: 8 + (i % 2) * 12,
                        opacity: 0.08 + i * 0.03,
                      },
                    ]}
                  />
                ))}
              </View>
              <View style={styles.cardTitleRow}>
                <MapPin size={16} color={Colors.accentLight} />
                <Text style={styles.cardTripLabel}>TRIP COMPLETE</Text>
              </View>
              <Text style={styles.cardTripName}>{trip.name}</Text>
              <Text style={styles.cardDateRange}>
                {formatDateRange(trip.startDate, trip.endDate)}
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statChip}>
                  <Text style={styles.statValue}>
                    {getTripDuration(trip.startDate, trip.endDate)}
                  </Text>
                  <Text style={styles.statLabel}>Duration</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statChip}>
                  <Text style={styles.statValue}>{totalSightings}</Text>
                  <Text style={styles.statLabel}>Sightings</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statChip}>
                  <Text style={styles.statValue}>{tripAnimals.length}</Text>
                  <Text style={styles.statLabel}>Species</Text>
                </View>
              </View>
            </View>

            {winner && (
              <Animated.View
                style={[
                  styles.winnerSection,
                  { transform: [{ scale: trophyScale }] },
                ]}
              >
                <View style={styles.winnerGlow}>
                  <PlayerAvatar avatar={winner.avatar} hairMeta={winner.hairMeta} size={56} fontSize={36} />
                </View>
                <View style={styles.winnerInfo}>
                  <View style={styles.winnerLabelRow}>
                    <Trophy size={14} color={Colors.gold} />
                    <Text style={styles.winnerLabel}>WINNER</Text>
                  </View>
                  <Text style={styles.winnerName}>{winner.name}</Text>
                  <Text style={styles.winnerPoints}>
                    {trip.players.find((p) => p.playerId === winner.id)
                      ?.totalPoints ?? 0}{" "}
                    points
                  </Text>
                </View>
              </Animated.View>
            )}

            <View style={styles.leaderboard}>
              <Text style={styles.leaderboardTitle}>LEADERBOARD</Text>
              {sortedPlayers.map((tp, index) => {
                const player = getPlayer(tp.playerId);
                const isWinner = trip.winnerId === tp.playerId;
                const rowAnim = rowAnims[index];
                const medal = index < 3 ? medals[index] : null;

                return (
                  <Animated.View
                    key={tp.playerId}
                    style={[
                      styles.leaderRow,
                      isWinner && styles.leaderRowWinner,
                      index === sortedPlayers.length - 1 &&
                        styles.leaderRowLast,
                      {
                        opacity: rowAnim,
                        transform: [
                          {
                            translateX: rowAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-30, 0],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.rankContainer}>
                      {medal ? (
                        <Text style={styles.medalText}>{medal}</Text>
                      ) : (
                        <Text style={styles.rankNumber}>{index + 1}</Text>
                      )}
                    </View>
                    <Text style={styles.leaderAvatar}>
                      {player?.avatar ?? "👤"}
                    </Text>
                    <View style={styles.leaderInfo}>
                      <View style={styles.leaderNameRow}>
                        <Text
                          style={[
                            styles.leaderName,
                            isWinner && styles.leaderNameWinner,
                          ]}
                        >
                          {player?.name ?? "Unknown"}
                        </Text>
                        {isWinner && (
                          <Crown size={14} color={Colors.gold} />
                        )}
                      </View>
                      <View style={styles.sightingSummary}>
                        {tripAnimals
                          .filter((a) => (tp.sightings[a.id] || 0) > 0)
                          .slice(0, 4)
                          .map((a) => (
                            <Text key={a.id} style={styles.sightingMini}>
                              {a.emoji}
                              {tp.sightings[a.id]}
                            </Text>
                          ))}
                      </View>
                    </View>
                    <View
                      style={[
                        styles.leaderPoints,
                        isWinner && styles.leaderPointsWinner,
                      ]}
                    >
                      <Text
                        style={[
                          styles.leaderPointsText,
                          isWinner && styles.leaderPointsTextWinner,
                        ]}
                      >
                        {tp.totalPoints}
                      </Text>
                      <Text
                        style={[
                          styles.leaderPointsLabel,
                          isWinner && styles.leaderPointsLabelWinner,
                        ]}
                      >
                        pts
                      </Text>
                    </View>
                  </Animated.View>
                );
              })}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.footerText}>🦌 Wildlife Spotter</Text>
            </View>
          </View>
        </ViewShot>

        <Pressable
          style={({ pressed }) => [
            styles.doneButton,
            pressed && styles.doneButtonPressed,
          ]}
          onPress={handleDone}
          testID="trip-summary-done"
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  noTripText: {
    fontSize: 17,
    color: Colors.brownMuted,
    marginBottom: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  shareBtnPressed: {
    backgroundColor: Colors.primaryDark,
    transform: [{ scale: 0.96 }],
  },
  shareBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "600" as const,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  cardWrapper: {
    borderRadius: 24,
    overflow: "hidden",
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  cardHeader: {
    backgroundColor: Colors.primary,
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  cardHeaderPattern: {
    ...StyleSheet.absoluteFillObject,
  },
  patternDot: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.white,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  cardTripLabel: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.accentLight,
    letterSpacing: 1.5,
  },
  cardTripName: {
    fontSize: 26,
    fontWeight: "800" as const,
    color: Colors.white,
    textAlign: "center",
    marginBottom: 4,
  },
  cardDateRange: {
    fontSize: 14,
    color: Colors.accentLight,
    fontWeight: "500" as const,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statChip: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: Colors.white,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.accentLight,
    fontWeight: "500" as const,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  winnerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: "#FFFBF0",
  },
  winnerGlow: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  winnerAvatar: {
    fontSize: 28,
  },
  winnerInfo: {
    flex: 1,
  },
  winnerLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 2,
  },
  winnerLabel: {
    fontSize: 11,
    fontWeight: "800" as const,
    color: Colors.gold,
    letterSpacing: 1.2,
  },
  winnerName: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.brown,
  },
  winnerPoints: {
    fontSize: 14,
    color: Colors.brownMuted,
    fontWeight: "500" as const,
    marginTop: 1,
  },
  leaderboard: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  leaderboardTitle: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.brownMuted,
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  leaderRowWinner: {
    backgroundColor: "#FFFDF5",
    marginHorizontal: -12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderBottomWidth: 0,
    marginBottom: 2,
  },
  leaderRowLast: {
    borderBottomWidth: 0,
  },
  rankContainer: {
    width: 28,
    alignItems: "center",
  },
  medalText: {
    fontSize: 20,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.textLight,
  },
  leaderAvatar: {
    fontSize: 24,
  },
  leaderInfo: {
    flex: 1,
  },
  leaderNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  leaderName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.brown,
  },
  leaderNameWinner: {
    color: Colors.brown,
  },
  sightingSummary: {
    flexDirection: "row",
    gap: 8,
    marginTop: 3,
  },
  sightingMini: {
    fontSize: 12,
    color: Colors.brownMuted,
    fontWeight: "500" as const,
  },
  leaderPoints: {
    backgroundColor: Colors.cream,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  leaderPointsWinner: {
    backgroundColor: Colors.primary,
  },
  leaderPointsText: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: Colors.brown,
  },
  leaderPointsTextWinner: {
    color: Colors.white,
  },
  leaderPointsLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.brownMuted,
  },
  leaderPointsLabelWinner: {
    color: Colors.accentLight,
  },
  cardFooter: {
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginHorizontal: 20,
  },
  footerText: {
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: "600" as const,
  },
  doneBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  doneBtnText: {
    color: Colors.white,
    fontWeight: "600" as const,
    fontSize: 16,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  doneButtonPressed: {
    backgroundColor: Colors.primaryDark,
    transform: [{ scale: 0.97 }],
  },
  doneButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: "700" as const,
  },
});
