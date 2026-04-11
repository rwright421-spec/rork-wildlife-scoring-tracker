import React, { useCallback, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ChevronLeft } from "lucide-react-native";
import Colors from "@/constants/colors";
import { PlayerHairMeta } from "@/types";

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

type EmojiGender = "female" | "male" | "neutral";

const FEMALE_EMOJIS = new Set(["👩", "👧", "👵", "👸", "👰", "🤶"]);
const MALE_EMOJIS = new Set(["👨", "👦", "👴", "🤴", "🎅", "🧔"]);

function getEmojiGender(base: string): EmojiGender {
  if (FEMALE_EMOJIS.has(base)) return "female";
  if (MALE_EMOJIS.has(base)) return "male";
  return "neutral";
}

interface HairStyleOption {
  id: string;
  label: string;
  zwj: string;
  icon: string;
}

const FEMALE_HAIR_STYLES: HairStyleOption[] = [
  { id: "default", label: "Default", zwj: "", icon: "💇‍♀️" },
  { id: "red_hair", label: "Red Hair", zwj: "\u200D\u{1F9B0}", icon: "🦰" },
  { id: "curly", label: "Curly", zwj: "\u200D\u{1F9B1}", icon: "🦱" },
  { id: "white_hair", label: "White Hair", zwj: "\u200D\u{1F9B3}", icon: "🦳" },
  { id: "bald", label: "Bald", zwj: "\u200D\u{1F9B2}", icon: "🦲" },
];

const MALE_HAIR_STYLES: HairStyleOption[] = [
  { id: "default", label: "Default", zwj: "", icon: "💇‍♂️" },
  { id: "red_hair", label: "Red Hair", zwj: "\u200D\u{1F9B0}", icon: "🦰" },
  { id: "curly", label: "Curly", zwj: "\u200D\u{1F9B1}", icon: "🦱" },
  { id: "white_hair", label: "White Hair", zwj: "\u200D\u{1F9B3}", icon: "🦳" },
  { id: "bald", label: "Bald", zwj: "\u200D\u{1F9B2}", icon: "🦲" },
];

const NEUTRAL_HAIR_STYLES: HairStyleOption[] = [
  { id: "default", label: "Default", zwj: "", icon: "💇" },
  { id: "red_hair", label: "Red Hair", zwj: "\u200D\u{1F9B0}", icon: "🦰" },
  { id: "curly", label: "Curly", zwj: "\u200D\u{1F9B1}", icon: "🦱" },
  { id: "white_hair", label: "White Hair", zwj: "\u200D\u{1F9B3}", icon: "🦳" },
  { id: "bald", label: "Bald", zwj: "\u200D\u{1F9B2}", icon: "🦲" },
];

function getHairStyles(gender: EmojiGender): HairStyleOption[] {
  switch (gender) {
    case "female": return FEMALE_HAIR_STYLES;
    case "male": return MALE_HAIR_STYLES;
    default: return NEUTRAL_HAIR_STYLES;
  }
}

interface HairColorOption {
  id: string;
  label: string;
  hex: string;
  zwj: string;
  isFashion: boolean;
}

const HAIR_COLORS: HairColorOption[] = [
  { id: "default", label: "None", hex: "", zwj: "", isFashion: false },
  { id: "black", label: "Black", hex: "#1C1C1C", zwj: "", isFashion: false },
  { id: "dark_brown", label: "Dk Brown", hex: "#3B2314", zwj: "", isFashion: false },
  { id: "medium_brown", label: "Med Brown", hex: "#6B3A2A", zwj: "", isFashion: false },
  { id: "light_brown", label: "Lt Brown", hex: "#A0642D", zwj: "", isFashion: false },
  { id: "blonde", label: "Blonde", hex: "#D4A839", zwj: "", isFashion: false },
  { id: "strawberry", label: "Strawberry", hex: "#C67A3C", zwj: "", isFashion: false },
  { id: "red", label: "Red", hex: "#B33030", zwj: "", isFashion: false },
  { id: "auburn", label: "Auburn", hex: "#7B3B2E", zwj: "", isFashion: false },
  { id: "gray", label: "Gray", hex: "#9E9E9E", zwj: "", isFashion: false },
  { id: "white", label: "White", hex: "#E8E8E8", zwj: "", isFashion: false },
  { id: "blue", label: "Blue", hex: "#2979FF", zwj: "", isFashion: true },
  { id: "purple", label: "Purple", hex: "#9C27B0", zwj: "", isFashion: true },
  { id: "pink", label: "Pink", hex: "#E91E8F", zwj: "", isFashion: true },
  { id: "green", label: "Green", hex: "#2E7D32", zwj: "", isFashion: true },
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

const HAIR_SUPPORTED_EMOJIS = new Set(["🧑", "👩", "👨", "👧", "👦", "🧒", "👵", "👴"]);

function getBaseEmoji(emoji: string): string {
  const codePoints = [...emoji];
  return codePoints[0] || emoji;
}

function supportsModifiers(emoji: string): boolean {
  const base = getBaseEmoji(emoji);
  return PERSON_EMOJIS_WITH_SKIN_TONE.has(base);
}

function supportsHair(emoji: string): boolean {
  const base = getBaseEmoji(emoji);
  return HAIR_SUPPORTED_EMOJIS.has(base);
}

function buildEmoji(base: string, skinTone: string, hairZwj: string): string {
  return `${base}${skinTone}${hairZwj}`;
}

type CustomizerStep = "skin" | "hairstyle" | "haircolor";

function getHairStylePreviewEmoji(base: string, skinMod: string, style: HairStyleOption): string {
  if (!style.zwj) return `${base}${skinMod}`;
  return `${base}${skinMod}${style.zwj}`;
}

interface AvatarPickerProps {
  options: string[];
  selected: string;
  onSelect: (emoji: string, hairMeta?: PlayerHairMeta) => void;
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
  const [selectedHairStyleIdx, setSelectedHairStyleIdx] = useState<number>(0);
  const [selectedHairColorIdx, setSelectedHairColorIdx] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<CustomizerStep>("skin");

  const isSmall = size === "small";

  const emojiGender = useMemo(() => getEmojiGender(customizerBase), [customizerBase]);
  const hairStyles = useMemo(() => getHairStyles(emojiGender), [emojiGender]);
  const canHaveHair = useMemo(() => supportsHair(customizerBase), [customizerBase]);

  const selectedHairStyle = hairStyles[selectedHairStyleIdx] ?? hairStyles[0];
  const selectedHairColor = HAIR_COLORS[selectedHairColorIdx] ?? HAIR_COLORS[0];

  const previewEmoji = useMemo(() => {
    if (!customizerBase) return "";
    const skinMod = SKIN_TONE_MODIFIERS[selectedSkinTone]?.modifier ?? "";
    const hairZwj = selectedHairStyle?.zwj || "";
    return buildEmoji(customizerBase, skinMod, hairZwj);
  }, [customizerBase, selectedSkinTone, selectedHairStyle]);

  const skinMod = SKIN_TONE_MODIFIERS[selectedSkinTone]?.modifier ?? "";

  const handleEmojiTap = useCallback(
    (emoji: string) => {
      if (supportsModifiers(emoji)) {
        const base = getBaseEmoji(emoji);
        setCustomizerBase(base);
        setSelectedSkinTone(0);
        setSelectedHairStyleIdx(0);
        setSelectedHairColorIdx(0);
        setCurrentStep("skin");
        setCustomizerVisible(true);
        console.log("[AvatarPicker] Opened customizer for:", base, "gender:", getEmojiGender(base));
      } else {
        onSelect(emoji, undefined);
      }
    },
    [onSelect]
  );

  const handleNext = useCallback(() => {
    if (currentStep === "skin") {
      if (canHaveHair) {
        setCurrentStep("hairstyle");
      } else {
        const skinMod = SKIN_TONE_MODIFIERS[selectedSkinTone]?.modifier ?? "";
        const finalEmoji = buildEmoji(customizerBase, skinMod, "");
        onSelect(finalEmoji, undefined);
        setCustomizerVisible(false);
        console.log("[AvatarPicker] Selected (no hair):", finalEmoji);
      }
    } else if (currentStep === "hairstyle") {
      setCurrentStep("haircolor");
    }
  }, [currentStep, canHaveHair, selectedSkinTone, customizerBase, onSelect]);

  const handleBack = useCallback(() => {
    if (currentStep === "haircolor") {
      setCurrentStep("hairstyle");
    } else if (currentStep === "hairstyle") {
      setCurrentStep("skin");
    }
  }, [currentStep]);

  const handleDone = useCallback(() => {
    const hairColor = HAIR_COLORS[selectedHairColorIdx];
    const hairStyle = hairStyles[selectedHairStyleIdx];

    const hasStyle = hairStyle && hairStyle.id !== "default";
    const hasColor = hairColor && hairColor.id !== "default" && hairColor.hex;

    const meta: PlayerHairMeta | undefined =
      (hasStyle || hasColor)
        ? {
            style: hasStyle ? hairStyle.id : undefined,
            color: hasColor ? hairColor.id : undefined,
            colorHex: hasColor ? hairColor.hex : undefined,
          }
        : undefined;

    onSelect(previewEmoji, meta);
    setCustomizerVisible(false);
    console.log("[AvatarPicker] Final selection:", previewEmoji, "meta:", meta);
  }, [previewEmoji, onSelect, selectedHairColorIdx, selectedHairStyleIdx, hairStyles]);

  const handleCancel = useCallback(() => {
    setCustomizerVisible(false);
  }, []);

  const stepTitle = useMemo(() => {
    switch (currentStep) {
      case "skin": return "Skin Tone";
      case "hairstyle": return "Hair Style";
      case "haircolor": return "Hair Color";
    }
  }, [currentStep]);

  const stepIndicator = useMemo(() => {
    const totalSteps = canHaveHair ? 3 : 1;
    const stepNum = currentStep === "skin" ? 1 : currentStep === "hairstyle" ? 2 : 3;
    return { stepNum, totalSteps };
  }, [currentStep, canHaveHair]);

  const selectionSummary = useMemo(() => {
    const parts: string[] = [];
    if (selectedHairStyle && selectedHairStyle.id !== "default") {
      parts.push(selectedHairStyle.label);
    }
    if (selectedHairColor && selectedHairColor.id !== "default") {
      parts.push(selectedHairColor.label);
    }
    return parts.join(" · ");
  }, [selectedHairStyle, selectedHairColor]);

  const naturalColors = HAIR_COLORS.filter((c) => !c.isFashion);
  const fashionColors = HAIR_COLORS.filter((c) => c.isFashion);

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
                {selectedHairColor && selectedHairColor.id !== "default" && selectedHairColor.hex ? (
                  <View style={[styles.previewBadge, { backgroundColor: selectedHairColor.hex }]} />
                ) : null}
              </View>
              <Text style={styles.previewLabel}>Customize Avatar</Text>
              {selectionSummary ? (
                <Text style={styles.selectionSummary}>{selectionSummary}</Text>
              ) : null}
              <View style={styles.stepRow}>
                {Array.from({ length: stepIndicator.totalSteps }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.stepDot,
                      i < stepIndicator.stepNum && styles.stepDotActive,
                    ]}
                  />
                ))}
              </View>
            </View>

            {currentStep !== "skin" && (
              <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={8}>
                <ChevronLeft size={16} color={Colors.brownMuted} />
                <Text style={styles.backBtnText}>Back</Text>
              </Pressable>
            )}

            <Text style={styles.sectionLabel}>{stepTitle}</Text>

            {currentStep === "skin" && (
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
            )}

            {currentStep === "hairstyle" && (
              <View style={styles.section}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.hairScrollContent}
                >
                  {hairStyles.map((style, index) => {
                    const stylePreview = getHairStylePreviewEmoji(customizerBase, skinMod, style);
                    return (
                      <Pressable
                        key={style.id}
                        style={[
                          styles.hairStyleCard,
                          selectedHairStyleIdx === index && styles.hairStyleCardSelected,
                        ]}
                        onPress={() => {
                          setSelectedHairStyleIdx(index);
                          console.log("[AvatarPicker] Selected hair style:", style.label, "preview:", stylePreview);
                        }}
                      >
                        <Text style={styles.hairStyleIcon}>{stylePreview}</Text>
                        <Text
                          style={[
                            styles.hairStyleLabel,
                            selectedHairStyleIdx === index && styles.hairStyleLabelSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {style.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {currentStep === "haircolor" && (
              <View style={styles.section}>
                <Text style={styles.colorGroupLabel}>Natural</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.colorScrollContent}
                >
                  {naturalColors.map((color) => {
                    const globalIdx = HAIR_COLORS.findIndex((c) => c.id === color.id);
                    const isSelected = selectedHairColorIdx === globalIdx;
                    return (
                      <Pressable
                        key={color.id}
                        style={[
                          styles.colorCard,
                          isSelected && styles.colorCardSelected,
                        ]}
                        onPress={() => {
                          setSelectedHairColorIdx(globalIdx);
                          console.log("[AvatarPicker] Selected hair color:", color.label);
                        }}
                      >
                        {color.hex ? (
                          <View style={[styles.colorDot, { backgroundColor: color.hex }]}>
                            {isSelected && <View style={styles.colorDotCheck} />}
                          </View>
                        ) : (
                          <View style={[styles.colorDot, styles.colorDotDefault]}>
                            {isSelected && <View style={styles.colorDotCheck} />}
                          </View>
                        )}
                        <Text
                          style={[
                            styles.colorLabel,
                            isSelected && styles.colorLabelSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {color.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Text style={[styles.colorGroupLabel, { marginTop: 14 }]}>Fashion</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.colorScrollContent}
                >
                  {fashionColors.map((color) => {
                    const globalIdx = HAIR_COLORS.findIndex((c) => c.id === color.id);
                    const isSelected = selectedHairColorIdx === globalIdx;
                    return (
                      <Pressable
                        key={color.id}
                        style={[
                          styles.colorCard,
                          isSelected && styles.colorCardSelected,
                        ]}
                        onPress={() => {
                          setSelectedHairColorIdx(globalIdx);
                          console.log("[AvatarPicker] Selected fashion hair color:", color.label);
                        }}
                      >
                        <View style={[styles.colorDot, { backgroundColor: color.hex }]}>
                          {isSelected && <View style={styles.colorDotCheck} />}
                        </View>
                        <Text
                          style={[
                            styles.colorLabel,
                            isSelected && styles.colorLabelSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {color.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <View style={styles.actions}>
              {currentStep === "skin" && !canHaveHair ? (
                <>
                  <Pressable
                    style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelBtnPressed]}
                    onPress={handleCancel}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.doneBtn, pressed && styles.doneBtnPressed]}
                    onPress={handleNext}
                  >
                    <Text style={styles.doneBtnText}>Done</Text>
                  </Pressable>
                </>
              ) : currentStep === "haircolor" ? (
                <>
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
                </>
              ) : (
                <>
                  <Pressable
                    style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelBtnPressed]}
                    onPress={handleCancel}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.nextBtn, pressed && styles.nextBtnPressed]}
                    onPress={handleNext}
                  >
                    <Text style={styles.nextBtnText}>Next</Text>
                  </Pressable>
                </>
              )}
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
    marginBottom: 16,
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
  previewBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
    borderColor: Colors.white,
  },
  selectionSummary: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.primary,
    marginBottom: 4,
    marginTop: -2,
  },
  previewLabel: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.brown,
    marginBottom: 6,
  },
  stepRow: {
    flexDirection: "row",
    gap: 6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.brownMuted,
  },
  section: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.brownMuted,
    marginBottom: 10,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
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
  hairScrollContent: {
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  hairStyleCard: {
    width: 72,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
    backgroundColor: Colors.cream,
    borderWidth: 2,
    borderColor: "transparent",
  },
  hairStyleCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#EDF5F0",
  },
  hairStyleIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  hairStyleLabel: {
    fontSize: 11,
    fontWeight: "500" as const,
    color: Colors.brownMuted,
    textAlign: "center" as const,
  },
  hairStyleLabelSelected: {
    color: Colors.primary,
    fontWeight: "700" as const,
  },
  colorGroupLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  colorScrollContent: {
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  colorCard: {
    width: 56,
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.cream,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#EDF5F0",
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginBottom: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  colorDotDefault: {
    backgroundColor: Colors.border,
  },
  colorDotCheck: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  colorLabel: {
    fontSize: 9,
    fontWeight: "500" as const,
    color: Colors.brownMuted,
    textAlign: "center" as const,
  },
  colorLabelSelected: {
    color: Colors.primary,
    fontWeight: "700" as const,
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
  nextBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: Colors.accent,
  },
  nextBtnPressed: {
    backgroundColor: Colors.accentDark,
    transform: [{ scale: 0.97 }],
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.white,
  },
});
