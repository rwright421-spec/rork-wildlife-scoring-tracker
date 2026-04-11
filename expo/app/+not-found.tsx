// Wildlife Spotter - Not Found
import { Link, Stack } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/colors";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={styles.container}>
        <Text style={styles.emoji}>🌿</Text>
        <Text style={styles.title}>Trail not found!</Text>
        <Text style={styles.subtitle}>Looks like you wandered off the path.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Back to base camp</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20, backgroundColor: Colors.cream },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "700" as const, color: Colors.brown, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.brownMuted, marginBottom: 24 },
  link: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  linkText: { fontSize: 16, color: Colors.white, fontWeight: "600" as const },
});
