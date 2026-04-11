import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";
import { PlayerHairMeta } from "@/types";

interface PlayerAvatarProps {
  avatar: string;
  hairMeta?: PlayerHairMeta;
  size?: number;
  fontSize?: number;
}

export default function PlayerAvatar({
  avatar,
  hairMeta,
  size = 40,
  fontSize = 22,
}: PlayerAvatarProps) {
  const showBadge = hairMeta?.colorHex && hairMeta.colorHex.length > 0;
  const badgeSize = Math.max(10, Math.round(size * 0.22));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.emoji, { fontSize }]}>{avatar}</Text>
      {showBadge ? (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: hairMeta!.colorHex,
              borderWidth: Math.max(1, Math.round(badgeSize * 0.15)),
            },
          ]}
        />
      ) : null}
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
  badge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    borderColor: Colors.white,
  },
});
