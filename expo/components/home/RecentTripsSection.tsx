import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MapPin, Trash2, Trophy } from "lucide-react-native";

import Colors from "@/constants/colors";
import PlayerAvatar from "@/components/PlayerAvatar";
import { Player, Trip } from "@/types";

interface RecentTripsSectionProps {
  recentTrips: Trip[];
  getPlayer: (id: string) => Player | undefined;
  onDeleteTrip: (tripId: string, tripName: string) => void;
}

export default function RecentTripsSection({
  recentTrips,
  getPlayer,
  onDeleteTrip,
}: RecentTripsSectionProps) {
  if (recentTrips.length === 0) return null;

  return (
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
                  onDeleteTrip(trip.id, trip.name);
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
  );
}

const styles = StyleSheet.create({
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
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
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
  miniScorePoints: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
});
