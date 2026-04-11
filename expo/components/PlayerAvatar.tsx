import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface PlayerAvatarProps {
  avatar: string;
  size?: number;
  fontSize?: number;
}

export default function PlayerAvatar({
  avatar,
  size = 40,
  fontSize = 22,
}: PlayerAvatarProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.emoji, { fontSize }]}>{avatar}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  emoji: {
    textAlign: "center",
  },
});
