import React from "react";
import { StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/colors";

export default function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>🌲</Text>
      <Text style={styles.emptyText}>
        Your trip history will appear here
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: { alignItems: "center", paddingVertical: 40, opacity: 0.6 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: {
    fontSize: 15,
    color: Colors.brownMuted,
    textAlign: "center",
  },
});
