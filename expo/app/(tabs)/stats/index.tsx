// Wildlife Spotter - Stats Screen
import { Activity, Award, Star, Target, TrendingUp, Trophy } from "lucide-react-native";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/colors";
import { useGame, usePlayerStats } from "@/providers/GameProvider";
import PlayerAvatar from "@/components/PlayerAvatar";

export default function StatsScreen() {
  const { animals, players, completedTrips, activeTrips } = useGame();
  const { stats: playerStats, activeTripCount } = usePlayerStats();

  if (players.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📊</Text>
        <Text style={styles.emptyTitle}>No Stats Yet</Text>
        <Text style={styles.emptySubtitle}>
          Add players and complete trips to see lifetime stats here.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {activeTripCount > 0 && (
        <View style={styles.activeBanner}>
          <Activity size={14} color={Colors.primaryLight} />
          <Text style={styles.activeBannerText}>
            Includes {activeTripCount} active trip{activeTripCount !== 1 ? "s" : ""}
          </Text>
        </View>
      )}
      {playerStats.map((stat) => (
        <View key={stat.player.id} style={styles.playerCard}>
          <View style={styles.playerHeader}>
            <PlayerAvatar avatar={stat.player.avatar} size={44} fontSize={26} />
            <View style={styles.playerNameSection}>
              <Text style={styles.playerName}>{stat.player.name}</Text>
              <Text style={styles.tripCount}>
                {stat.tripCount} trip{stat.tripCount !== 1 ? "s" : ""} completed
              </Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: "#EDF5F0" }]}>
                <Star size={18} color={Colors.primary} />
              </View>
              <Text style={styles.statValue}>{stat.totalPoints}</Text>
              <Text style={styles.statLabel}>Lifetime Pts</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: "#FFF7ED" }]}>
                <TrendingUp size={18} color={Colors.accent} />
              </View>
              <Text style={styles.statValue}>{stat.avgPerDay}</Text>
              <Text style={styles.statLabel}>Avg/Day</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: "#FFFBEB" }]}>
                <Trophy size={18} color={Colors.gold} />
              </View>
              <Text style={styles.statValue}>{stat.wins}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
          </View>
          <View style={styles.animalBreakdown}>
            <Text style={styles.breakdownTitle}>Animal Sightings</Text>
            <View style={styles.animalList}>
              {(() => {
                const allAnimalIds = Object.keys(stat.totalSightings).filter((id) => stat.totalSightings[id] > 0);
                const animalMap = new Map<string, { emoji: string; name: string; id: string }>();
                completedTrips.forEach((trip) => {
                  (trip.animals ?? []).forEach((a) => { if (!animalMap.has(a.id)) animalMap.set(a.id, a); });
                });
                activeTrips.forEach((trip) => {
                  (trip.animals ?? []).forEach((a) => { if (!animalMap.has(a.id)) animalMap.set(a.id, a); });
                });
                animals.forEach((a) => { if (!animalMap.has(a.id)) animalMap.set(a.id, a); });
                return allAnimalIds.map((animalId) => {
                  const animal = animalMap.get(animalId);
                  const count = stat.totalSightings[animalId] || 0;
                  if (!animal) return null;
                  return (
                    <View key={animalId} style={styles.animalRow}>
                      {animal.emoji ? (
                        <Text style={styles.animalEmoji}>{animal.emoji}</Text>
                      ) : (
                        <View style={styles.noEmojiBadge}>
                          <Text style={styles.noEmojiBadgeText}>{animal.name.charAt(0).toUpperCase()}</Text>
                        </View>
                      )}
                      <Text style={styles.animalName}>{animal.name}</Text>
                      <View style={styles.countBadge}>
                        <Target size={12} color={Colors.brownMuted} />
                        <Text style={styles.countText}>{count}</Text>
                      </View>
                    </View>
                  );
                });
              })()}
            </View>
          </View>
        </View>
      ))}
      {playerStats.length > 1 && (
        <View style={styles.leaderboardSection}>
          <View style={styles.leaderboardHeader}>
            <Award size={20} color={Colors.primary} />
            <Text style={styles.leaderboardTitle}>Win Leaderboard</Text>
          </View>
          {[...playerStats]
            .sort((a, b) => b.wins - a.wins)
            .map((stat, index) => {
              const medals = ["🥇", "🥈", "🥉"];
              const medal = index < 3 ? medals[index] : "";
              return (
                <View key={stat.player.id} style={styles.leaderRow}>
                  <Text style={styles.leaderMedal}>{medal}</Text>
                  <PlayerAvatar avatar={stat.player.avatar} size={28} fontSize={18} />
                  <Text style={styles.leaderName}>{stat.player.name}</Text>
                  <Text style={styles.leaderWins}>
                    {stat.wins} win{stat.wins !== 1 ? "s" : ""}
                  </Text>
                </View>
              );
            })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: 20, paddingBottom: 40 },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.cream,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.brown,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.brownMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  playerCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  playerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  playerAvatar: { fontSize: 40 },
  playerNameSection: { flex: 1 },
  playerName: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.brown,
  },
  tripCount: { fontSize: 13, color: Colors.brownMuted, marginTop: 2 },
  statsGrid: { flexDirection: "row", gap: 12, marginBottom: 20 },
  statItem: { flex: 1, alignItems: "center", gap: 6 },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.brown,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.brownMuted,
    fontWeight: "500" as const,
  },
  animalBreakdown: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.brownMuted,
    marginBottom: 10,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  animalList: { gap: 8 },
  animalRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  animalEmoji: { fontSize: 20, width: 28, textAlign: "center" },
  noEmojiBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.primaryLight, alignItems: "center" as const, justifyContent: "center" as const },
  noEmojiBadgeText: { fontSize: 14, fontWeight: "700" as const, color: Colors.white },
  animalName: { flex: 1, fontSize: 15, color: Colors.brown },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.cream,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.brown,
  },
  leaderboardSection: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  leaderboardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.brown,
  },
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  leaderMedal: { fontSize: 20, width: 28, textAlign: "center" },
  leaderAvatar: { fontSize: 24 },
  leaderName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.brown,
  },
  leaderWins: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  activeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E8F5EE",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#C8E6D5",
  },
  activeBannerText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.primaryLight,
  },
});
