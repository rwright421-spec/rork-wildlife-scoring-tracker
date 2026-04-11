import { Tabs } from "expo-router";
import { BarChart3, Clock, Home, Settings } from "lucide-react-native";
import React from "react";

import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";

export default function TabLayout() {
  const { activeTrips } = useGame();
  const badgeCount = activeTrips.length > 1 ? activeTrips.length.toString() : undefined;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.brownMuted,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          tabBarBadge: badgeCount,
          tabBarBadgeStyle: badgeCount ? {
            backgroundColor: Colors.primary,
            color: Colors.white,
            fontSize: 11,
            fontWeight: "700" as const,
            minWidth: 20,
            height: 20,
            borderRadius: 10,
            lineHeight: 18,
          } : undefined,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ color, size }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
