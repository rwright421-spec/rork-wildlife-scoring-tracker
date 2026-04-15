import React, { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Minus } from "lucide-react-native";

import { Animal, PlayerSightings } from "@/types";
import Colors from "@/constants/colors";

interface AnimalButtonProps {
  animal: Animal;
  count: number;
  playerId: string;
  onSighting: (playerId: string, animalId: string) => void;
  onUndo: (playerId: string, animalId: string) => void;
}

const AnimalButton = React.memo(function AnimalButton({ animal, count, playerId, onSighting, onUndo }: AnimalButtonProps) {
  const handleSighting = useCallback(() => onSighting(playerId, animal.id), [playerId, animal.id, onSighting]);
  const handleUndo = useCallback(() => onUndo(playerId, animal.id), [playerId, animal.id, onUndo]);

  return (
    <View style={styles.animalItem}>
      <View style={styles.animalCountRow}>
        <Pressable
          style={({ pressed }) => [
            styles.undoBtn,
            pressed && styles.undoBtnPressed,
            count === 0 && styles.undoBtnDisabled,
          ]}
          onPress={handleUndo}
          disabled={count === 0}
          accessibilityRole="button"
          accessibilityLabel={`Undo ${animal.name} sighting`}
          accessibilityState={{ disabled: count === 0 }}
        >
          <Minus size={12} color={count > 0 ? Colors.brownMuted : Colors.textLight} />
        </Pressable>
        <Text style={styles.animalCount}>{count}</Text>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.animalButton,
          pressed && styles.animalButtonPressed,
        ]}
        onPress={handleSighting}
        accessibilityRole="button"
        accessibilityLabel={`${animal.name} — ${animal.points} point${animal.points !== 1 ? "s" : ""}`}
        accessibilityHint={`Log ${animal.name} sighting`}
      >
        {animal.emoji ? (
          <Text style={styles.animalEmoji}>{animal.emoji}</Text>
        ) : (
          <Text style={styles.animalInitial}>{animal.name.charAt(0).toUpperCase()}</Text>
        )}
        <Text style={styles.animalPts}>+{animal.points}</Text>
      </Pressable>
      <Text style={styles.animalName}>{animal.name}</Text>
    </View>
  );
});

interface AnimalGridProps {
  animals: Animal[];
  sightings: PlayerSightings;
  playerId: string;
  onSighting: (playerId: string, animalId: string) => void;
  onUndo: (playerId: string, animalId: string) => void;
}

function AnimalGrid({ animals, sightings, playerId, onSighting, onUndo }: AnimalGridProps) {
  return (
    <View style={styles.animalGrid}>
      {animals.map((animal) => (
        <AnimalButton
          key={animal.id}
          animal={animal}
          count={sightings[animal.id] || 0}
          playerId={playerId}
          onSighting={onSighting}
          onUndo={onUndo}
        />
      ))}
    </View>
  );
}

export default React.memo(AnimalGrid);

const styles = StyleSheet.create({
  animalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" },
  animalItem: { alignItems: "center", minWidth: 72 },
  animalCountRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  undoBtn: { padding: 4, borderRadius: 8, backgroundColor: Colors.cream },
  undoBtnPressed: { backgroundColor: Colors.creamDark },
  undoBtnDisabled: { opacity: 0.4 },
  animalCount: { fontSize: 15, fontWeight: "700" as const, color: Colors.brown, minWidth: 18, textAlign: "center" },
  animalButton: { width: 64, height: 64, borderRadius: 16, backgroundColor: Colors.cream, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },
  animalButtonPressed: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryLight, transform: [{ scale: 0.92 }] },
  animalEmoji: { fontSize: 28 },
  animalPts: { fontSize: 11, fontWeight: "700" as const, color: Colors.primary, marginTop: 1 },
  animalName: { fontSize: 11, color: Colors.brownMuted, marginTop: 4, fontWeight: "500" as const },
  animalInitial: { fontSize: 16, fontWeight: "700" as const, color: Colors.primaryLight },
});
