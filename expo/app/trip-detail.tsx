// Wildlife Spotter - Trip Detail Screen
import { useLocalSearchParams } from "expo-router";
import { Calendar, Clock, Trophy } from "lucide-react-native";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import PlayerAvatar from "@/components/PlayerAvatar";

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trips, getPlayer, getTripAnimals } = useGame();
  const trip = useMemo(() => trips.find((t) => t.id === id), [trips, id]);
  const tripAnimals = useMemo(() => trip ? getTripAnimals(trip.id) : [], [trip, getTripAnimals]);

  React.useEffect(() => {
    if (trip) {
      if (__DEV__) console.log('[TripDetail] Showing trip:', trip.id, 'players:', trip.players.length, trip.players.map((p) => p.playerId));
    }
  }, [trip]);

  if (!trip) {
    return (<View style={styles.container}><View style={styles.centered}><Text style={styles.notFoundText}>Trip not found</Text></View></View>);
  }

  const winner = trip.winnerId ? getPlayer(trip.winnerId) : null;
  const sortedPlayers = [...trip.players].sort((a, b) => b.totalPoints - a.totalPoints);
  const duration = trip.endDate
    ? (() => {
        const start = new Date(trip.startDate);
        const end = new Date(trip.endDate);
        const hours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
        if (hours < 1) return "< 1 hour";
        if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""}`;
        const days = Math.round(hours / 24);
        return `${days} day${days > 1 ? "s" : ""}`;
      })()
    : "In progress";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.tripName}>{trip.name}</Text>
        <View style={styles.metaRow}><Calendar size={14} color={Colors.brownMuted} /><Text style={styles.metaText}>{new Date(trip.startDate).toLocaleDateString()}</Text></View>
        <View style={styles.metaRow}><Clock size={14} color={Colors.brownMuted} /><Text style={styles.metaText}>{duration}</Text></View>
        {winner && (<View style={styles.winnerBanner}><Trophy size={20} color={Colors.gold} /><View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Text style={styles.winnerBannerText}>Winner: </Text><PlayerAvatar avatar={winner.avatar} hairMeta={winner.hairMeta} size={22} fontSize={16} /><Text style={styles.winnerBannerText}> {winner.name}</Text></View></View>)}
      </View>
      <Text style={styles.sectionTitle}>Scoreboard</Text>
      {sortedPlayers.map((tp, index) => {
        const player = getPlayer(tp.playerId);
        const isWinner = tp.playerId === trip.winnerId;
        const medals = ["🥇", "🥈", "🥉"];
        const medal = index < 3 ? medals[index] : "";
        return (
          <View key={tp.playerId} style={[styles.playerCard, isWinner && styles.winnerCard]}>
            <View style={styles.playerHeader}>
              <Text style={styles.playerMedal}>{medal}</Text>
              <PlayerAvatar avatar={player?.avatar ?? "🧑"} hairMeta={player?.hairMeta} size={36} fontSize={22} />
              <Text style={styles.playerName}>{player?.name ?? "Unknown"}</Text>
              <View style={styles.totalBadge}><Text style={styles.totalPoints}>{tp.totalPoints}</Text><Text style={styles.totalLabel}>pts</Text></View>
            </View>
            <View style={styles.sightingsList}>
              {tripAnimals.map((animal) => {
                const count = tp.sightings[animal.id] || 0;
                if (count === 0) return null;
                return (
                  <View key={animal.id} style={styles.sightingRow}>
                    <Text style={styles.sightingEmoji}>{animal.emoji}</Text>
                    <Text style={styles.sightingName}>{animal.name}</Text>
                    <Text style={styles.sightingCount}>×{count}</Text>
                    <Text style={styles.sightingPoints}>{count * animal.points} pts</Text>
                  </View>
                );
              })}
              {Object.values(tp.sightings).every((c) => c === 0) && <Text style={styles.noSightings}>No sightings recorded</Text>}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { fontSize: 17, color: Colors.brownMuted },
  header: { marginBottom: 24 },
  tripName: { fontSize: 26, fontWeight: "800" as const, color: Colors.brown, marginBottom: 10 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  metaText: { fontSize: 14, color: Colors.brownMuted },
  winnerBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFFBEB", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, marginTop: 14, borderWidth: 1, borderColor: "#F5DEB3" },
  winnerBannerText: { fontSize: 16, fontWeight: "700" as const, color: Colors.brown },
  sectionTitle: { fontSize: 19, fontWeight: "700" as const, color: Colors.brown, marginBottom: 14 },
  playerCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  winnerCard: { borderColor: Colors.gold, borderWidth: 2 },
  playerHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  playerMedal: { fontSize: 20, width: 28, textAlign: "center" },
  playerAvatar: { fontSize: 26 },
  playerName: { flex: 1, fontSize: 17, fontWeight: "700" as const, color: Colors.brown },
  totalBadge: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, flexDirection: "row", alignItems: "baseline", gap: 3 },
  totalPoints: { fontSize: 18, fontWeight: "800" as const, color: Colors.white },
  totalLabel: { fontSize: 11, color: Colors.accentLight, fontWeight: "600" as const },
  sightingsList: { gap: 8 },
  sightingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  sightingEmoji: { fontSize: 20, width: 28, textAlign: "center" },
  sightingName: { flex: 1, fontSize: 15, color: Colors.brown },
  sightingCount: { fontSize: 15, color: Colors.brownMuted, fontWeight: "600" as const },
  sightingPoints: { fontSize: 15, color: Colors.primary, fontWeight: "700" as const, minWidth: 50, textAlign: "right" },
  noSightings: { fontSize: 14, color: Colors.textLight, fontStyle: "italic" as const },
});
