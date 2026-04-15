import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Animal, Player, TripPlayer } from "@/types";
import Colors from "@/constants/colors";
import PlayerAvatar from "@/components/PlayerAvatar";
import AnimalGrid from "@/components/AnimalGrid";

interface PlayerListProps {
  sortedPlayers: TripPlayer[];
  tripAnimals: Animal[];
  getPlayer: (id: string) => Player | undefined;
  onSighting: (playerId: string, animalId: string) => void;
  onUndo: (playerId: string, animalId: string) => void;
  onEditPlayer: (playerId: string) => void;
}

function PlayerList({ sortedPlayers, tripAnimals, getPlayer, onSighting, onUndo, onEditPlayer }: PlayerListProps) {
  return (
    <>
      {sortedPlayers.map((tp, index) => {
        const player = getPlayer(tp.playerId);
        const isLeader = index === 0 && tp.totalPoints > 0;
        return (
          <View key={tp.playerId} style={[styles.playerCard, isLeader && styles.leaderCard]}>
            <View style={styles.playerHeader}>
              <Pressable
                style={styles.playerInfo}
                onPress={() => {
                  if (player) {
                    onEditPlayer(player.id);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${player?.name ?? "Unknown"}`}
              >
                {isLeader && <Text style={styles.crownEmoji} accessibilityElementsHidden={true}>👑</Text>}
                <PlayerAvatar avatar={player?.avatar ?? "🧑"} size={36} fontSize={22} />
                <Text style={styles.playerName}>{player?.name ?? "Unknown"}</Text>
              </Pressable>
              <View
                style={styles.pointsBadge}
                accessibilityLabel={`${player?.name ?? "Unknown"}, ${tp.totalPoints} points${isLeader ? ", 1st place" : ""}`}
              >
                <Text style={styles.pointsValue}>{tp.totalPoints}</Text>
                <Text style={styles.pointsLabel}>pts</Text>
              </View>
            </View>
            <AnimalGrid
              animals={tripAnimals}
              sightings={tp.sightings}
              playerId={tp.playerId}
              onSighting={onSighting}
              onUndo={onUndo}
            />
          </View>
        );
      })}
    </>
  );
}

export default React.memo(PlayerList);

const styles = StyleSheet.create({
  playerCard: { backgroundColor: Colors.white, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: Colors.border },
  leaderCard: { borderColor: Colors.accent, borderWidth: 2, shadowColor: Colors.accent, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 },
  playerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  playerInfo: { flexDirection: "row", alignItems: "center", gap: 8 },
  crownEmoji: { fontSize: 18 },
  playerName: { fontSize: 18, fontWeight: "700" as const, color: Colors.brown },
  pointsBadge: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14, flexDirection: "row", alignItems: "baseline", gap: 4 },
  pointsValue: { fontSize: 22, fontWeight: "800" as const, color: Colors.white },
  pointsLabel: { fontSize: 12, color: Colors.accentLight, fontWeight: "600" as const },
});
