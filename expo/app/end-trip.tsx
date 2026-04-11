import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Trophy } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import PlayerAvatar from "@/components/PlayerAvatar";

export default function EndTripScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { activeTrips, getTrip, getPlayer, endTrip } = useGame();

  const currentTrip = useMemo(() => {
    if (tripId) return getTrip(tripId);
    return activeTrips[0] ?? null;
  }, [tripId, getTrip, activeTrips]);

  React.useEffect(() => {
    if (currentTrip) {
      console.log('[EndTrip] Loaded trip:', currentTrip.id, 'players:', currentTrip.players.length, currentTrip.players.map((p) => ({ id: p.playerId, pts: p.totalPoints })));
    }
  }, [currentTrip]);

  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);
  const sortedPlayers = useMemo(() => {
    if (!currentTrip) return [];
    return [...currentTrip.players].sort((a, b) => b.totalPoints - a.totalPoints);
  }, [currentTrip]);

  const handleEndTrip = useCallback(() => {
    if (!currentTrip) return;
    if (Platform.OS !== "web") { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
    const id = currentTrip.id;
    endTrip(id, selectedWinnerId);
    router.replace({ pathname: "/trip-summary", params: { tripId: id } });
  }, [currentTrip, selectedWinnerId, endTrip]);

  if (!currentTrip) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.noTripText}>No active trip to end</Text>
          <Pressable style={styles.dismissBtn} onPress={() => router.dismiss()}><Text style={styles.dismissBtnText}>Go Back</Text></Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerSection}>
        <Trophy size={40} color={Colors.gold} />
        <Text style={styles.title}>Pick the Winner!</Text>
        <Text style={styles.subtitle}>Who won &quot;{currentTrip.name}&quot;?</Text>
      </View>
      <View style={styles.playerList}>
        {sortedPlayers.map((tp, index) => {
          const player = getPlayer(tp.playerId);
          const isSelected = selectedWinnerId === tp.playerId;
          const medals = ["🥇", "🥈", "🥉"];
          const medal = index < 3 ? medals[index] : `#${index + 1}`;
          return (
            <Pressable key={tp.playerId} style={[styles.playerCard, isSelected && styles.playerCardSelected]} onPress={() => setSelectedWinnerId(tp.playerId)}>
              <Text style={styles.medal}>{medal}</Text>
              <PlayerAvatar avatar={player?.avatar ?? "🧑"} hairMeta={player?.hairMeta} size={40} fontSize={24} />
              <View style={styles.playerDetails}>
                <Text style={[styles.playerName, isSelected && styles.playerNameSelected]}>{player?.name ?? "Unknown"}</Text>
                <Text style={styles.playerPoints}>{tp.totalPoints} points</Text>
              </View>
              {isSelected && <View style={styles.winnerBadge}><Trophy size={16} color={Colors.white} /></View>}
            </Pressable>
          );
        })}
      </View>
      <Pressable style={({ pressed }) => [styles.endButton, pressed && styles.endButtonPressed]} onPress={handleEndTrip}>
        <Text style={styles.endButtonText}>{selectedWinnerId ? "End Trip & Crown Winner" : "End Trip Without Winner"}</Text>
      </Pressable>
      <Pressable style={styles.cancelButton} onPress={() => router.dismiss()}><Text style={styles.cancelText}>Cancel</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: 24, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  noTripText: { fontSize: 17, color: Colors.brownMuted, marginBottom: 16 },
  dismissBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  dismissBtnText: { color: Colors.white, fontWeight: "600" as const },
  headerSection: { alignItems: "center", marginBottom: 28 },
  title: { fontSize: 24, fontWeight: "800" as const, color: Colors.brown, marginTop: 12, marginBottom: 4 },
  subtitle: { fontSize: 15, color: Colors.brownMuted },
  playerList: { gap: 10, marginBottom: 28 },
  playerCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderRadius: 16, padding: 16, borderWidth: 2, borderColor: Colors.border, gap: 12 },
  playerCardSelected: { borderColor: Colors.gold, backgroundColor: "#FFFBEB" },
  medal: { fontSize: 22, width: 32, textAlign: "center" },
  avatar: { fontSize: 28 },
  playerDetails: { flex: 1 },
  playerName: { fontSize: 17, fontWeight: "700" as const, color: Colors.brown },
  playerNameSelected: { color: Colors.gold },
  playerPoints: { fontSize: 14, color: Colors.brownMuted, marginTop: 2 },
  winnerBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.gold, alignItems: "center", justifyContent: "center" },
  endButton: { backgroundColor: Colors.primary, paddingVertical: 18, borderRadius: 16, alignItems: "center", marginBottom: 12, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
  endButtonPressed: { backgroundColor: Colors.primaryDark, transform: [{ scale: 0.97 }] },
  endButtonText: { color: Colors.white, fontSize: 17, fontWeight: "700" as const },
  cancelButton: { paddingVertical: 14, alignItems: "center" },
  cancelText: { color: Colors.brownMuted, fontSize: 16, fontWeight: "500" as const },
});
