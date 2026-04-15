import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Repeat } from "lucide-react-native";

import Colors from "@/constants/colors";

interface RepeatPreview {
  playerNames: string[];
  animalCount: number;
}

interface HeroSectionProps {
  repeatPreview: RepeatPreview | null;
  onRepeatLastTrip: () => void;
}

export default function HeroSection({ repeatPreview, onRepeatLastTrip }: HeroSectionProps) {
  return (
    <>
      <View style={styles.heroSection}>
        <View style={styles.heroIcon} accessibilityElementsHidden={true}>
          <Text style={styles.heroEmoji}>🦌</Text>
        </View>
        <Text style={styles.heroTitle}>Ready for an Adventure?</Text>
        <Text style={styles.heroSubtitle}>
          Start a new trip and spot some wildlife with your family!
        </Text>
      </View>

      {repeatPreview && (
        <Pressable
          style={({ pressed }) => [
            styles.repeatCard,
            pressed && styles.repeatCardPressed,
          ]}
          onPress={onRepeatLastTrip}
          testID="repeat-trip-button"
          accessibilityRole="button"
          accessibilityLabel={`Repeat last trip with ${repeatPreview.playerNames.join(", ")} and ${repeatPreview.animalCount} animal${repeatPreview.animalCount !== 1 ? "s" : ""}`}
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
    </>
  );
}

const styles = StyleSheet.create({
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
});
