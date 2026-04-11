// Wildlife Spotter - Settings Stack
import { Stack } from "expo-router";
import React from "react";

import Colors from "@/constants/colors";

export default function SettingsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.cream,
        headerTitleStyle: { fontWeight: "700" as const, color: Colors.cream },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Settings" }} />
    </Stack>
  );
}
