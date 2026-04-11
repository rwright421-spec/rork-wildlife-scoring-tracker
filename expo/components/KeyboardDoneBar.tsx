import React from "react";
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Colors from "@/constants/colors";

export const KEYBOARD_ACCESSORY_ID = "keyboard-done-bar";

export function KeyboardAccessory() {
  if (Platform.OS !== "ios") return null;

  return (
    <InputAccessoryView nativeID={KEYBOARD_ACCESSORY_ID}>
      <View style={styles.container}>
        <View style={styles.spacer} />
        <Pressable
          onPress={() => Keyboard.dismiss()}
          style={({ pressed }) => [styles.doneButton, pressed && styles.doneButtonPressed]}
          hitSlop={8}
        >
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    backgroundColor: "#EEEAE5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#CBC5BD",
  },
  spacer: {
    flex: 1,
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  doneButtonPressed: {
    opacity: 0.6,
  },
  doneText: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
});
