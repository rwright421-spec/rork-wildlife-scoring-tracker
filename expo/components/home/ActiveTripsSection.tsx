import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Clock, Play } from "lucide-react-native";

import Colors from "@/constants/colors";
import PlayerAvatar from "@/components/PlayerAvatar";
import { Player, Trip } from "@/types";

interface Leader extends Player {
  points: number;
}

interface ActiveTripsSectionProps {
  activeTrips: Trip[];
  getPlayer: (id: string) => Player | undefined;
  getLeader: (trip: Trip) => Leader | null;
  formatDuration: (startDate: string) => string;
  onGoToTrip: (tripId: string) => void;
}

export default function ActiveTripsSection({
  activeTrips,
  getPlayer,
  getLeader,
  formatDuration,
  onGoToTrip,
}: ActiveTripsSectionProps) {
  if (activeTrips.length === 0) return null;

  return (
    <View style={styles.activeSection}>
      <View style={styles.activeSectionHeader}>
        <View style={styles.activeBadgeRow}>
          <View style={styles.liveDot} accessibilityElementsHidden={true} />
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
            onPress={() => onGoToTrip(trip.id)}
            testID={`active-trip-card-${trip.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Active trip: ${trip.name}, ${duration} elapsed. Tap to score`}
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
              <View style={styles.livePill} accessibilityElementsHidden={true}>
                <View style={styles.livePillDot} />
                <Text style={styles.livePillText}>LIVE</Text>
              </View>
            </View>

            <View style={styles.activeTripBottom}>
              {leader ? (
                <View style={styles.leaderRow} accessibilityLabel={`Leader: ${leader.name}, ${leader.points} points`}>
                  <Text style={styles.leaderEmoji} accessibilityElementsHidden={true}>👑</Text>
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

            <View style={styles.tapHint} accessibilityElementsHidden={true}>
              <Play size={12} color={Colors.cream} />
              <Text style={styles.tapHintText}>Tap to score</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
