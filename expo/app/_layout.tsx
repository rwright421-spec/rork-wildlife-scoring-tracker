// Wildlife Spotter - Root Layout
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import Colors from "@/constants/colors";
import { GameProvider, useGame } from "@/providers/GameProvider";

LogBox.ignoreLogs(["Non-serializable values were found in the navigation state"]);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { hasCompletedOnboarding, isLoading } = useGame();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading || hasCompletedOnboarding === null) return;

    const onOnboarding = segments[0] === "onboarding";

    if (!hasCompletedOnboarding && !onOnboarding) {
      router.replace("/onboarding");
    } else if (hasCompletedOnboarding && onOnboarding) {
      router.replace("/(tabs)/(home)");
    }
  }, [hasCompletedOnboarding, isLoading, segments]);

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: Colors.cream },
        headerTintColor: Colors.primary,
        headerTitleStyle: { color: Colors.brown, fontWeight: "600" as const },
        contentStyle: { backgroundColor: Colors.cream },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="active-trip"
        options={{ headerShown: false, presentation: "fullScreenModal" }}
      />
      <Stack.Screen name="trip-detail" options={{ title: "Trip Details" }} />
      <Stack.Screen
        name="new-trip"
        options={{
          title: "New Trip",
          presentation: "modal",
          headerStyle: { backgroundColor: Colors.cream },
        }}
      />
      <Stack.Screen
        name="end-trip"
        options={{
          title: "End Trip",
          presentation: "modal",
          headerStyle: { backgroundColor: Colors.cream },
        }}
      />
      <Stack.Screen
        name="trip-summary"
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="onboarding"
        options={{
          headerShown: false,
          gestureEnabled: false,
          animation: "fade",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GameProvider>
          <StatusBar style="light" />
          <RootLayoutNav />
        </GameProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
