import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowLeft, Square, Settings } from "lucide-react-native";

import Colors from "@/constants/colors";

interface TripHeaderProps {
  tripName: string;
  paddingTop: number;
  onBack: () => void;
  onSettings: () => void;
  onEndTrip: () => void;
}

function TripHeader({ tripName, paddingTop, onBack, onSettings, onEndTrip }: TripHeaderProps) {
  return (
    <View style={[styles.header, { paddingTop }]}>
      <Pressable onPress={onBack} style={styles.headerBack} accessibilityRole="button" accessibilityLabel="Go back">
        <ArrowLeft size={22} color={Colors.cream} />
      </Pressable>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle} numberOfLines={1}>{tripName}</Text>
        <View style={styles.headerLive} accessibilityElementsHidden={true}>
          <View style={styles.headerLiveDot} />
          <Text style={styles.headerLiveText}>LIVE</Text>
        </View>
      </View>
      <View style={styles.headerActions}>
        <Pressable onPress={onSettings} style={styles.editAnimalsBtn} testID="edit-animals-btn" accessibilityRole="button" accessibilityLabel="Trip settings">
          <Settings size={18} color={Colors.cream} />
        </Pressable>
        <Pressable onPress={onEndTrip} style={styles.endTripBtn} accessibilityRole="button" accessibilityLabel="End trip">
          <Square size={16} color={Colors.dangerLight} fill={Colors.dangerLight} />
          <Text style={styles.endTripBtnText}>End</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default React.memo(TripHeader);

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, gap: 12 },
  headerBack: { padding: 8 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" as const, color: Colors.white },
  headerLive: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  headerLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#4ADE80" },
  headerLiveText: { fontSize: 10, fontWeight: "700" as const, color: "#4ADE80", letterSpacing: 1 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  editAnimalsBtn: { padding: 8, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 10 },
  endTripBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  endTripBtnText: { color: Colors.dangerLight, fontSize: 14, fontWeight: "600" as const },
});
