import React, { useCallback, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Colors from "@/constants/colors";

const SKIN_TONE_MODIFIERS: { label: string; modifier: string }[] = [
  { label: "Default", modifier: "" },
  { label: "Light", modifier: "\u{1F3FB}" },
  { label: "Medium-Light", modifier: "\u{1F3FC}" },
  { label: "Medium", modifier: "\u{1F3FD}" },
  { label: "Medium-Dark", modifier: "\u{1F3FE}" },
  { label: "Dark", modifier: "\u{1F3FF}" },
];

const SKIN_TONE_COLORS: string[] = [
  "#FFCC4D",
  "#FADCBC",
  "#E0BB95",
  "#BF8B68",
  "#9B643D",
  "#594539",
];

const PERSON_EMOJIS_WITH_SKIN_TONE = new Set([
  "🧑", "👩", "👨", "👧", "👦", "🧒", "👵", "👴",
  "👶", "👱", "🧔", "👳", "👲", "🧕", "👮",
  "👷", "💂", "🕵", "👩‍⚕️", "👨‍⚕️", "🤶", "🎅",
  "🤴", "👸", "🤵", "👰", "🦸", "🦹", "🧙", "🧚",
  "🧛", "🧜", "🧝", "🧞", "🧟", "💆", "💇", "🚶",
  "🧎", "🏃", "💃", "🕺", "🧖", "🤷", "🤦", "🙅",
  "🙆", "🙋", "🙇", "🙍", "🙎", "💁", "🤸", "🤽",
  "🤾", "🏋", "🏌", "🏄", "🚣", "🏊", "⛹", "🚴",
  "🚵", "🤼", "🤹", "🧗", "🤱", "👼", "🤰",
]);

function getBaseEmoji(emoji: string): string {
  const codePoints = [...emoji];
  return codePoints[0] || emoji;
}

function supportsModifiers(emoji: string): boolean {
  const base = getBaseEmoji(emoji);
  return PERSON_EMOJIS_WITH_SKIN_TONE.has(base);
}

interface AvatarPickerProps {
  options: string[];
  selected: string;
  onSelect: (emoji: string) => void;
  label?: string;
  size?: "small" | "normal";
}

export default function AvatarPicker({
  options,
  selected,
  onSelect,
  label = "Pick an avatar:",
  size = "normal",
}: AvatarPickerProps) {
  const [customizerVisible, setCustomizerVisible] = useState<boolean>(false);
  const [customizerBase, setCustomizerBase] = useState<string>("");
  const [selectedSkinTone, setSelectedSkinTone] = useState<number>(0);

  const isSmall = size === "small";

  const previewEmoji = useMemo(() => {
    if (!customizerBase) return "";
    const skinMod = SKIN_TONE_MODIFIERS[selectedSkinTone]?.modifier ?? "";
    return `${customizerBase}${skinMod}`;
  }, [customizerBase, selectedSkinTone]);

  const handleEmojiTap = useCallback(
    (emoji: string) => {
      if (supportsModifiers(emoji)) {
        const base = getBaseEmoji(emoji);
        setCustomizerBase(base);
        setSelectedSkinTone(0);
        setCustomizerVisible(true);
      } else {
        onSelect(emoji);
      }
    },
    [onSelect]
  );

  const handleDone = useCallback(() => {
    onSelect(previewEmoji);
    setCustomizerVisible(false);
  }, [previewEmoji, onSelect]);

  const handleCancel = useCallback(() => {
    setCustomizerVisible(false);
  }, []);

  return (
    <>
      <Text style={[styles.label, isSmall && styles.labelSmall]}>{label}</Text>
      <View style={[styles.grid, isSmall && styles.gridSmall]}>
        {options.map((emoji) => {
          const isSelected = selected === emoji || getBaseEmoji(selected) === getBaseEmoji(emoji);
          return (
            <Pressable
              key={emoji}
              style={[
                isSmall ? styles.optionSmall : styles.option,
                isSelected && styles.optionSelected,
              ]}
              onPress={() => handleEmojiTap(emoji)}
            >
              <Text style={isSmall ? styles.optionTextSmall : styles.optionText}>
                {emoji}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Modal
        visible={customizerVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <Pressable style={styles.overlay} onPress={handleCancel}>
          <Pressable style={styles.popup} onPress={() => {}}>
            <View style={styles.previewSection}>
              <View style={styles.previewCircle}>
                <Text style={styles.previewEmoji}>{previewEmoji}</Text>
              </View>
              <Text style={styles.previewLabel}>Choose Skin Tone</Text>
            </View>

            <View style={styles.section}>
              <View style={styles.swatchRow}>
                {SKIN_TONE_MODIFIERS.map((tone, index) => (
                  <Pressable
                    key={tone.label}
                    style={[
                      styles.swatch,
                      { backgroundColor: SKIN_TONE_COLORS[index] },
                      selectedSkinTone === index && styles.swatchSelected,
                    ]}
                    onPress={() => setSelectedSkinTone(index)}
                  >
                    {selectedSkinTone === index && (
                      <View style={styles.swatchCheck} />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelBtnPressed]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.doneBtn, pressed && styles.doneBtnPressed]}
                onPress={handleDone}
              >
                <Text style={styles.doneBtnText}>Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.brownMuted,
    marginBottom: 8,
  },
  labelSmall: {
    fontSize: 13,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  gridSmall: {
    gap: 6,
    marginBottom: 12,
  },
  option: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.cream,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionSmall: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.cream,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#EDF5F0",
  },
  optionText: {
    fontSize: 24,
  },
  optionTextSmall: {
    fontSize: 22,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  popup: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  previewSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  previewCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EDF5F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  previewEmoji: {
    fontSize: 44,
  },
  previewLabel: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.brown,
  },
  section: {
    marginBottom: 20,
  },
  swatchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "transparent",
  },
  swatchSelected: {
    borderColor: Colors.primary,
    transform: [{ scale: 1.1 }],
  },
  swatchCheck: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnPressed: {
    backgroundColor: Colors.creamDark,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.brownMuted,
  },
  doneBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: Colors.primary,
  },
  doneBtnPressed: {
    backgroundColor: Colors.primaryDark,
    transform: [{ scale: 0.97 }],
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.white,
  },
});
