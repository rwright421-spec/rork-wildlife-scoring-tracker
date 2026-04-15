import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Check, ChevronLeft, ChevronRight, Clock, MapPin, Minus, Pencil, Plus, Trash2, X } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import Colors from "@/constants/colors";
import { ANIMAL_EMOJI_OPTIONS, AVATAR_OPTIONS, NO_EMOJI, getNameForEmoji } from "@/constants/animals";
import { ANIMAL_POINTS_MIN, ANIMAL_POINTS_MAX } from "@/constants/config";
import { FREE_PLAYER_LIMIT, FREE_CUSTOM_ANIMAL_LIMIT } from "@/constants/limits";
import { useGame } from "@/providers/GameProvider";
import { usePurchases } from "@/providers/PurchaseProvider";
import { Animal, Player } from "@/types";
import { KeyboardAccessory, KEYBOARD_ACCESSORY_ID } from "@/components/KeyboardDoneBar";
import AvatarPicker from "@/components/AvatarPicker";
import PlayerAvatar from "@/components/PlayerAvatar";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function NewTripScreen() {
  const { players, animals, trips, startTrip, addPlayer } = useGame();
  const { isPremium } = usePurchases();
  const params = useLocalSearchParams<{ repeatPlayerIds?: string; repeatAnimals?: string }>();

  const [step, setStep] = useState<number>(1);
  const [tripName, setTripName] = useState<string>("");
  const [showLocationHistory, setShowLocationHistory] = useState<boolean>(true);

  const pastLocations = useMemo(() => {
    const names = trips.map((t) => t.name).filter(Boolean);
    const unique = [...new Set(names)];
    return unique.slice(0, 10);
  }, [trips]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(() => {
    if (params.repeatPlayerIds) {
      const ids = params.repeatPlayerIds.split(",").filter(Boolean);
      const validIds = ids.filter((id) => players.some((p) => p.id === id));
      if (validIds.length >= 2) return validIds;
    }
    return players.map((p) => p.id);
  });

  const [tripAnimals, setTripAnimals] = useState<Animal[]>(() => {
    if (params.repeatAnimals) {
      try {
        const parsed = JSON.parse(params.repeatAnimals) as Animal[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((a) => ({ ...a }));
        }
      } catch (e) {
        if (__DEV__) console.log("Failed to parse repeat animals:", e);
      }
    }
    return animals.map((a) => ({ ...a }));
  });
  const [showAddAnimal, setShowAddAnimal] = useState<boolean>(false);
  const [newAnimalName, setNewAnimalName] = useState<string>("");
  const [newAnimalEmoji, setNewAnimalEmoji] = useState<string>(ANIMAL_EMOJI_OPTIONS[0]);
  const [newAnimalPoints, setNewAnimalPoints] = useState<string>("1");
  const [noEmojiMode, setNoEmojiMode] = useState<boolean>(false);

  const [showAddPlayer, setShowAddPlayer] = useState<boolean>(false);
  const [newPlayerName, setNewPlayerName] = useState<string>("");
  const [newPlayerAvatar, setNewPlayerAvatar] = useState<string>(AVATAR_OPTIONS[0]);

  const [editingAnimalId, setEditingAnimalId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editEmoji, setEditEmoji] = useState<string>("");
  const [editPoints, setEditPoints] = useState<string>("");
  const [pointsError, setPointsError] = useState<string>("");
  const [newPointsError, setNewPointsError] = useState<string>("");
  const [playerNameWarning, setPlayerNameWarning] = useState<string>("");
  const [animalNameWarning, setAnimalNameWarning] = useState<string>("");
  const [editAnimalNameWarning, setEditAnimalNameWarning] = useState<string>("");

  const validatePoints = useCallback((value: string, setError: (e: string) => void) => {
    if (!value) { setError(""); return; }
    const num = parseInt(value, 10);
    if (isNaN(num)) { setError("Enter a valid number"); return; }
    if (num < ANIMAL_POINTS_MIN) { setError(`Minimum is ${ANIMAL_POINTS_MIN}`); return; }
    if (num > ANIMAL_POINTS_MAX) { setError(`Maximum is ${ANIMAL_POINTS_MAX}`); return; }
    setError("");
  }, []);

  const checkDuplicatePlayerName = useCallback((name: string) => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) { setPlayerNameWarning(""); return; }
    const existing = players.find((p: Player) => p.name.trim().toLowerCase() === trimmed);
    if (existing) { setPlayerNameWarning(`A player named "${existing.name}" already exists.`); } else { setPlayerNameWarning(""); }
  }, [players]);

  const checkDuplicateAnimalName = useCallback((name: string, excludeId?: string) => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) return "";
    const existing = tripAnimals.find((a) => a.name.trim().toLowerCase() === trimmed && a.id !== excludeId);
    return existing ? `An animal named "${existing.name}" already exists in this trip.` : "";
  }, [tripAnimals]);

  const togglePlayer = useCallback((playerId: string) => {
    setSelectedPlayerIds((prev) => prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]);
  }, []);

  const handleAddNewPlayer = useCallback(() => {
    const name = newPlayerName.trim();
    if (!name) {
      Alert.alert("Name Required", "Please enter a name for the player.");
      return;
    }
    if (!isPremium && players.length >= FREE_PLAYER_LIMIT) {
      Alert.alert(
        "Player Limit Reached",
        `Free accounts can add up to ${FREE_PLAYER_LIMIT} players. Upgrade to Pro for unlimited players!`,
        [
          { text: "Not Now", style: "cancel" },
          { text: "Upgrade", onPress: () => router.push("/paywall") },
        ]
      );
      return;
    }
    const player = addPlayer(name, newPlayerAvatar);
    setSelectedPlayerIds((prev) => [...prev, player.id]);
    setNewPlayerName("");
    setNewPlayerAvatar(AVATAR_OPTIONS[0]);
    setShowAddPlayer(false);
    setPlayerNameWarning("");
    if (__DEV__) console.log('[NewTrip] Added new player inline:', player.id, name);
  }, [newPlayerName, newPlayerAvatar, addPlayer]);

  const canProceedStep1 = tripName.trim().length > 0;
  const canProceedStep2 = selectedPlayerIds.length >= 2;

  const handleNextStep = useCallback(() => {
    if (step === 1) {
      if (!canProceedStep1) {
        Alert.alert("Name Required", "Please enter a trip name before continuing.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (selectedPlayerIds.length < 2) {
        Alert.alert("Need Players", "Select at least 2 players.");
        return;
      }
      setStep(3);
    }
  }, [step, selectedPlayerIds, canProceedStep1]);

  const handlePrevStep = useCallback(() => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  }, [step]);

  const handleStartTrip = useCallback(() => {
    if (tripAnimals.length === 0) { Alert.alert("No Animals", "Add at least one animal for this trip."); return; }
    const name = tripName.trim() || `Trip ${new Date().toLocaleDateString()}`;
    if (Platform.OS !== "web") { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
    const newTripId = startTrip(name, selectedPlayerIds, tripAnimals);
    router.dismiss();
    setTimeout(() => { router.push({ pathname: "/active-trip", params: { tripId: newTripId } }); }, 300);
  }, [tripName, selectedPlayerIds, tripAnimals, startTrip]);

  const customTripAnimalCount = useMemo(() => tripAnimals.filter((a) => !a.isDefault).length, [tripAnimals]);

  const handleAddAnimal = useCallback(() => {
    const name = newAnimalName.trim();
    const points = parseInt(newAnimalPoints, 10);
    if (!name) { Alert.alert("Missing Info", "Please enter a name for the animal."); return; }
    if (isNaN(points) || points < ANIMAL_POINTS_MIN) { Alert.alert("Invalid Points", `Points must be between ${ANIMAL_POINTS_MIN} and ${ANIMAL_POINTS_MAX}.`); return; }
    if (points > ANIMAL_POINTS_MAX) { Alert.alert("Invalid Points", `Points must be between ${ANIMAL_POINTS_MIN} and ${ANIMAL_POINTS_MAX}.`); return; }
    if (!isPremium && customTripAnimalCount >= FREE_CUSTOM_ANIMAL_LIMIT) {
      Alert.alert(
        "Custom Animal Limit",
        "Free accounts cannot add more than 4 animals. Upgrade to Pro for unlimited custom animals!",
        [
          { text: "Not Now", style: "cancel" },
          { text: "Upgrade", onPress: () => router.push("/paywall") },
        ]
      );
      return;
    }
    const animal: Animal = { id: generateId(), name, emoji: noEmojiMode ? "" : newAnimalEmoji, points, isDefault: false };
    setTripAnimals((prev) => [...prev, animal]);
    setNewAnimalName("");
    setNewAnimalEmoji(ANIMAL_EMOJI_OPTIONS[0]);
    setNewAnimalPoints("1");
    setShowAddAnimal(false);
    setNewPointsError("");
    setAnimalNameWarning("");
    setNoEmojiMode(false);
  }, [newAnimalName, newAnimalEmoji, newAnimalPoints, noEmojiMode]);

  const handleRemoveAnimal = useCallback((animalId: string) => {
    setTripAnimals((prev) => prev.filter((a) => a.id !== animalId));
  }, []);

  const startEditing = useCallback((animalId: string) => {
    const animal = tripAnimals.find((a) => a.id === animalId);
    if (!animal) return;
    setEditingAnimalId(animalId);
    setEditName(animal.name);
    setEditEmoji(animal.emoji);
    setEditPoints(String(animal.points));
  }, [tripAnimals]);

  const cancelEditing = useCallback(() => {
    setEditingAnimalId(null);
    setEditName("");
    setEditEmoji("");
    setEditPoints("");
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingAnimalId) return;
    const name = editName.trim();
    const points = parseInt(editPoints, 10);
    if (!name) { Alert.alert("Missing Info", "Name is required."); return; }
    if (isNaN(points) || points < ANIMAL_POINTS_MIN) { Alert.alert("Invalid Points", `Points must be between ${ANIMAL_POINTS_MIN} and ${ANIMAL_POINTS_MAX}.`); return; }
    if (points > ANIMAL_POINTS_MAX) { Alert.alert("Invalid Points", `Points must be between ${ANIMAL_POINTS_MIN} and ${ANIMAL_POINTS_MAX}.`); return; }
    setTripAnimals((prev) => prev.map((a) => a.id === editingAnimalId ? { ...a, name, emoji: editEmoji, points } : a));
    setPointsError("");
    setEditAnimalNameWarning("");
    cancelEditing();
  }, [editingAnimalId, editName, editEmoji, editPoints, cancelEditing]);

  const allEmojiOptions = useMemo(() => {
    const currentEmojis = tripAnimals.map((a) => a.emoji);
    const defaultEmojis = ["🦌", "🐺", "🐻", "🐈"];
    return [...new Set([...defaultEmojis, ...currentEmojis, ...ANIMAL_EMOJI_OPTIONS])];
  }, [tripAnimals]);

  const totalTripPoints = useMemo(() => tripAnimals.reduce((sum, a) => sum + a.points, 0), [tripAnimals]);

  return (
    <><ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.stepIndicator}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={styles.stepRow}>
            <View style={[styles.stepDot, s === step && styles.stepDotActive, s < step && styles.stepDotDone]}>
              {s < step ? <Check size={12} color={Colors.white} /> : <Text style={[styles.stepDotText, (s === step || s < step) && styles.stepDotTextActive]}>{s}</Text>}
            </View>
            {s < 3 && <View style={[styles.stepLine, s < step && styles.stepLineDone]} />}
          </View>
        ))}
      </View>
      <Text style={styles.stepLabel}>
        {step === 1 ? "Name your trip" : step === 2 ? "Who's playing?" : "Animals for this trip"}
      </Text>

      {step === 1 && (
        <View style={styles.section}>
          <View style={styles.inputRow}>
            <MapPin size={20} color={Colors.brownMuted} />
            <TextInput style={styles.input} placeholder="e.g. Yellowstone Weekend" placeholderTextColor={Colors.textLight} value={tripName} onChangeText={(t) => { setTripName(t); setShowLocationHistory(false); }} autoFocus returnKeyType="done" blurOnSubmit maxLength={30} inputAccessoryViewID={KEYBOARD_ACCESSORY_ID} />
            {tripName.length > 0 && (
              <Pressable onPress={() => { setTripName(""); setShowLocationHistory(true); }} hitSlop={8}>
                <X size={18} color={Colors.brownMuted} />
              </Pressable>
            )}
          </View>

          {pastLocations.length > 0 && showLocationHistory && tripName.length === 0 && (
            <View style={styles.locationHistorySection}>
              <View style={styles.locationHistoryHeader}>
                <Clock size={14} color={Colors.brownMuted} />
                <Text style={styles.locationHistoryTitle}>Recent Locations</Text>
              </View>
              <View style={styles.locationChips}>
                {pastLocations.map((loc) => (
                  <Pressable
                    key={loc}
                    style={({ pressed }) => [styles.locationChip, pressed && styles.locationChipPressed]}
                    onPress={() => { setTripName(loc); setShowLocationHistory(false); }}
                  >
                    <MapPin size={14} color={Colors.primaryLight} />
                    <Text style={styles.locationChipText}>{loc}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <Pressable style={({ pressed }) => [styles.nextButton, pressed && styles.nextButtonPressed, !canProceedStep1 && styles.buttonDisabled]} onPress={handleNextStep} disabled={!canProceedStep1}>
            <Text style={styles.nextButtonText}>Next</Text>
            <ChevronRight size={18} color={Colors.white} />
          </Pressable>
        </View>
      )}

      {step === 2 && (
        <View style={styles.section}>
          <Text style={styles.sublabel}>Select at least 2 players</Text>
          <View style={styles.playerList}>
            {players.map((player) => {
              const selected = selectedPlayerIds.includes(player.id);
              return (
                <Pressable key={player.id} style={[styles.playerChip, selected && styles.playerChipSelected]} onPress={() => togglePlayer(player.id)}>
                  <PlayerAvatar avatar={player.avatar} size={28} fontSize={18} />
                  <Text style={[styles.playerChipName, selected && styles.playerChipNameSelected]}>{player.name}</Text>
                  {selected && <View style={styles.checkIcon}><Check size={14} color={Colors.white} /></View>}
                </Pressable>
              );
            })}
          </View>

          {showAddPlayer ? (
            <View style={styles.addPlayerForm}>
              <TextInput
                style={styles.addPlayerInput}
                placeholder="Player name"
                placeholderTextColor={Colors.textLight}
                value={newPlayerName}
                onChangeText={(t) => { setNewPlayerName(t); checkDuplicatePlayerName(t); }}
                autoFocus
                returnKeyType="done"
                blurOnSubmit
                maxLength={INPUT_LIMITS.PLAYER_NAME}
                inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
              />
              {playerNameWarning ? <Text style={styles.warningText}>{playerNameWarning}</Text> : null}
              <AvatarPicker
                options={AVATAR_OPTIONS}
                selected={newPlayerAvatar}
                onSelect={(emoji) => { setNewPlayerAvatar(emoji); }}
                size="small"
              />
              <View style={styles.addPlayerActions}>
                <Pressable
                  style={({ pressed }) => [styles.editActionBtn, styles.cancelBtn, pressed && styles.cancelBtnPressed]}
                  onPress={() => { setShowAddPlayer(false); setNewPlayerName(""); setNewPlayerAvatar(AVATAR_OPTIONS[0]); }}
                >
                  <X size={16} color={Colors.brownMuted} />
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.editActionBtn, styles.saveBtn, pressed && styles.saveBtnPressed]}
                  onPress={handleAddNewPlayer}
                >
                  <Check size={16} color={Colors.white} />
                  <Text style={styles.saveBtnText}>Add</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={styles.addNewPlayerBtn} onPress={() => setShowAddPlayer(true)}>
              <Plus size={18} color={Colors.primary} />
              <Text style={styles.addNewPlayerBtnText}>New Player</Text>
            </Pressable>
          )}

          <View style={styles.navRow}>
            <Pressable style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]} onPress={handlePrevStep}>
              <ChevronLeft size={18} color={Colors.brown} />
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.nextButton, pressed && styles.nextButtonPressed, !canProceedStep2 && styles.buttonDisabled]} onPress={handleNextStep} disabled={!canProceedStep2}>
              <Text style={styles.nextButtonText}>Next</Text>
              <ChevronRight size={18} color={Colors.white} />
            </Pressable>
          </View>
        </View>
      )}

      {step === 3 && (
        <View style={styles.section}>
          <Text style={styles.sublabel}>
            Customize the animals and points for this trip. Changes here won't affect your defaults.
          </Text>

          <View style={styles.animalSummary}>
            <Text style={styles.animalSummaryText}>{tripAnimals.length} animal{tripAnimals.length !== 1 ? "s" : ""}</Text>
          </View>

          {tripAnimals.map((animal) => (
            <View key={animal.id}>
              {editingAnimalId === animal.id ? (
                <View style={styles.editCard}>
                  <Text style={styles.emojiLabel}>Emoji:</Text>
                  <View style={styles.emojiGrid}>
                    {allEmojiOptions.map((emoji) => (
                      <Pressable key={emoji} style={[styles.emojiOption, editEmoji === emoji && styles.emojiSelected]} onPress={() => setEditEmoji(emoji)}>
                        <Text style={styles.emojiOptionText}>{emoji}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={styles.animalFormRow}>
                    <TextInput style={[styles.formInput, styles.flexInput]} placeholder="Animal name" placeholderTextColor={Colors.textLight} value={editName} onChangeText={(t) => { setEditName(t); setEditAnimalNameWarning(checkDuplicateAnimalName(t, editingAnimalId ?? undefined)); }} returnKeyType="done" blurOnSubmit maxLength={20} inputAccessoryViewID={KEYBOARD_ACCESSORY_ID} />
                    <TextInput style={[styles.formInput, styles.pointsInput]} placeholder="Pts" placeholderTextColor={Colors.textLight} value={editPoints} onChangeText={(t) => { setEditPoints(t); validatePoints(t, setPointsError); }} keyboardType="number-pad" inputAccessoryViewID={KEYBOARD_ACCESSORY_ID} />
                  </View>
                  {editAnimalNameWarning ? <Text style={styles.warningText}>{editAnimalNameWarning}</Text> : null}
                  {pointsError ? <Text style={styles.errorText}>{pointsError}</Text> : null}
                  <View style={styles.editActions}>
                    <Pressable style={({ pressed }) => [styles.editActionBtn, styles.cancelBtn, pressed && styles.cancelBtnPressed]} onPress={cancelEditing}>
                      <X size={16} color={Colors.brownMuted} />
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </Pressable>
                    <Pressable style={({ pressed }) => [styles.editActionBtn, styles.saveBtn, pressed && styles.saveBtnPressed]} onPress={handleSaveEdit}>
                      <Check size={16} color={Colors.white} />
                      <Text style={styles.saveBtnText}>Save</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={styles.animalRow}>
                  {animal.emoji ? (
                    <Text style={styles.animalEmoji}>{animal.emoji}</Text>
                  ) : (
                    <View style={styles.noEmojiIcon}>
                      <Text style={styles.noEmojiIconText}>{animal.name.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <Text style={styles.animalName}>{animal.name}</Text>
                  <View style={styles.pointsPill}>
                    <Text style={styles.pointsPillText}>{animal.points} pts</Text>
                  </View>
                  <Pressable style={styles.iconBtn} onPress={() => startEditing(animal.id)}>
                    <Pencil size={15} color={Colors.primaryLight} />
                  </Pressable>
                  <Pressable style={styles.iconBtn} onPress={() => handleRemoveAnimal(animal.id)}>
                    <Trash2 size={15} color={Colors.danger} />
                  </Pressable>
                </View>
              )}
            </View>
          ))}

          {showAddAnimal ? (
            <View style={styles.addAnimalForm}>
              {!noEmojiMode ? (
                <>
                  <View style={styles.emojiLabelRow}>
                    <Text style={styles.emojiLabel}>Pick an emoji:</Text>
                    <Pressable onPress={() => { setNoEmojiMode(true); setNewAnimalName(""); }} hitSlop={8}>
                      <Text style={styles.noEmojiLink}>No emoji</Text>
                    </Pressable>
                  </View>
                  <View style={styles.emojiGrid}>
                    {allEmojiOptions.map((emoji) => (
                      <Pressable key={emoji} style={[styles.emojiOption, newAnimalEmoji === emoji && styles.emojiSelected]} onPress={() => { setNewAnimalEmoji(emoji); const suggestedName = getNameForEmoji(emoji); if (!newAnimalName.trim() || getNameForEmoji(newAnimalEmoji) === newAnimalName.trim()) { setNewAnimalName(suggestedName); } }}>
                        <Text style={styles.emojiOptionText}>{emoji}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : (
                <View style={styles.noEmojiHeader}>
                  <Text style={styles.emojiLabel}>Custom animal (no emoji)</Text>
                  <Pressable onPress={() => { setNoEmojiMode(false); const suggestedName = getNameForEmoji(newAnimalEmoji); if (!newAnimalName.trim()) { setNewAnimalName(suggestedName); } }} hitSlop={8}>
                    <Text style={styles.noEmojiLink}>Use emoji</Text>
                  </Pressable>
                </View>
              )}
              <View style={styles.animalFormRow}>
                <TextInput style={[styles.formInput, styles.flexInput]} placeholder="Animal name" placeholderTextColor={Colors.textLight} value={newAnimalName} onChangeText={(t) => { setNewAnimalName(t); setAnimalNameWarning(checkDuplicateAnimalName(t)); }} returnKeyType="done" blurOnSubmit maxLength={20} inputAccessoryViewID={KEYBOARD_ACCESSORY_ID} />
                <TextInput style={[styles.formInput, styles.pointsInput]} placeholder="Pts" placeholderTextColor={Colors.textLight} value={newAnimalPoints} onChangeText={(t) => { setNewAnimalPoints(t); validatePoints(t, setNewPointsError); }} keyboardType="number-pad" inputAccessoryViewID={KEYBOARD_ACCESSORY_ID} />
              </View>
              {animalNameWarning ? <Text style={styles.warningText}>{animalNameWarning}</Text> : null}
              {newPointsError ? <Text style={styles.errorText}>{newPointsError}</Text> : null}
              <View style={styles.editActions}>
                <Pressable style={({ pressed }) => [styles.editActionBtn, styles.cancelBtn, pressed && styles.cancelBtnPressed]} onPress={() => { setShowAddAnimal(false); setNewPointsError(""); setAnimalNameWarning(""); setNoEmojiMode(false); }}>
                  <X size={16} color={Colors.brownMuted} />
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [styles.editActionBtn, styles.saveBtn, pressed && styles.saveBtnPressed]} onPress={handleAddAnimal}>
                  <Plus size={16} color={Colors.white} />
                  <Text style={styles.saveBtnText}>Add</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={styles.addAnimalBtn} onPress={() => setShowAddAnimal(true)}>
              <Plus size={18} color={Colors.primary} />
              <Text style={styles.addAnimalBtnText}>Add Animal</Text>
            </Pressable>
          )}

          <View style={styles.navRow}>
            <Pressable style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]} onPress={handlePrevStep}>
              <ChevronLeft size={18} color={Colors.brown} />
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed, tripAnimals.length === 0 && styles.buttonDisabled]} onPress={handleStartTrip} disabled={tripAnimals.length === 0}>
              <Text style={styles.startButtonText}>Start Adventure!</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
    <KeyboardAccessory />
  </>);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: 24, paddingBottom: 40 },
  stepIndicator: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  stepRow: { flexDirection: "row", alignItems: "center" },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.border, alignItems: "center", justifyContent: "center" },
  stepDotActive: { backgroundColor: Colors.primary },
  stepDotDone: { backgroundColor: Colors.primary },
  stepDotText: { fontSize: 13, fontWeight: "700" as const, color: Colors.brownMuted },
  stepDotTextActive: { color: Colors.white },
  stepLine: { width: 40, height: 2, backgroundColor: Colors.border, marginHorizontal: 6 },
  stepLineDone: { backgroundColor: Colors.primary },
  stepLabel: { fontSize: 20, fontWeight: "700" as const, color: Colors.brown, textAlign: "center", marginBottom: 20 },
  section: { marginBottom: 28 },
  sublabel: { fontSize: 13, color: Colors.brownMuted, marginBottom: 14 },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border, gap: 10, marginBottom: 16 },
  input: { flex: 1, fontSize: 16, color: Colors.brown, paddingVertical: 14 },
  locationHistorySection: { marginBottom: 20 },
  locationHistoryHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  locationHistoryTitle: { fontSize: 13, fontWeight: "600" as const, color: Colors.brownMuted, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  locationChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  locationChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.white, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  locationChipPressed: { backgroundColor: "#EDF5F0", borderColor: Colors.primaryLight },
  locationChipText: { fontSize: 14, fontWeight: "500" as const, color: Colors.brown },
  playerList: { gap: 10, marginBottom: 14 },
  playerChip: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderRadius: 14, padding: 16, borderWidth: 2, borderColor: Colors.border, gap: 12 },
  playerChipSelected: { borderColor: Colors.primary, backgroundColor: "#EDF5F0" },
  playerEmoji: { fontSize: 28 },
  playerChipName: { flex: 1, fontSize: 17, fontWeight: "600" as const, color: Colors.brown },
  playerChipNameSelected: { color: Colors.primary },
  checkIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  addNewPlayerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#EDF5F0", paddingVertical: 14, borderRadius: 14, marginBottom: 14 },
  addNewPlayerBtnText: { color: Colors.primary, fontSize: 15, fontWeight: "600" as const },
  addPlayerForm: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  addPlayerInput: { backgroundColor: Colors.cream, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: Colors.brown, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  avatarLabel: { fontSize: 14, fontWeight: "600" as const, color: Colors.brownMuted, marginBottom: 8 },
  avatarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  avatarOption: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.cream, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  avatarSelected: { borderColor: Colors.primary, backgroundColor: "#EDF5F0" },
  avatarText: { fontSize: 24 },
  addPlayerActions: { flexDirection: "row", gap: 10 },
  navRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.white, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.border },
  backButtonPressed: { backgroundColor: Colors.creamDark },
  backButtonText: { color: Colors.brown, fontSize: 16, fontWeight: "600" as const },
  nextButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 14 },
  nextButtonPressed: { backgroundColor: Colors.primaryDark, transform: [{ scale: 0.97 }] },
  buttonDisabled: { opacity: 0.5 },
  nextButtonText: { color: Colors.white, fontSize: 16, fontWeight: "700" as const },
  startButton: { flex: 1, backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 14, alignItems: "center", shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
  startButtonPressed: { backgroundColor: Colors.primaryDark, transform: [{ scale: 0.97 }] },
  startButtonText: { color: Colors.white, fontSize: 17, fontWeight: "700" as const },
  animalSummary: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  animalSummaryText: { fontSize: 14, color: Colors.brownMuted, fontWeight: "500" as const },
  animalRow: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  animalEmoji: { fontSize: 24 },
  animalName: { flex: 1, fontSize: 15, fontWeight: "600" as const, color: Colors.brown },
  pointsPill: { backgroundColor: Colors.cream, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pointsPillText: { fontSize: 13, fontWeight: "700" as const, color: Colors.primary },
  iconBtn: { padding: 6 },
  addAnimalBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#EDF5F0", paddingVertical: 14, borderRadius: 14, marginTop: 4, marginBottom: 8 },
  addAnimalBtnText: { color: Colors.primary, fontSize: 15, fontWeight: "600" as const },
  addAnimalForm: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginTop: 4, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  emojiLabelRow: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, marginBottom: 8 },
  noEmojiLink: { fontSize: 13, fontWeight: "600" as const, color: Colors.primaryLight, textDecorationLine: "underline" as const },
  noEmojiHeader: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, marginBottom: 12 },
  noEmojiIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.primaryLight, alignItems: "center" as const, justifyContent: "center" as const },
  noEmojiIconText: { fontSize: 14, fontWeight: "700" as const, color: Colors.white },
  emojiLabel: { fontSize: 14, fontWeight: "600" as const, color: Colors.brownMuted },
  emojiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  emojiOption: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.cream, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  emojiSelected: { borderColor: Colors.primary, backgroundColor: "#EDF5F0" },
  emojiOptionText: { fontSize: 20 },
  animalFormRow: { flexDirection: "row", gap: 8 },
  formInput: { backgroundColor: Colors.cream, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: Colors.brown, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  flexInput: { flex: 1 },
  pointsInput: { width: 70, textAlign: "center" },
  editCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 8, borderWidth: 2, borderColor: Colors.primaryLight },
  warningText: { fontSize: 12, color: "#B8860B", marginBottom: 6, marginTop: -4, paddingLeft: 2 },
  errorText: { fontSize: 12, color: Colors.danger, marginBottom: 6, marginTop: -4, paddingLeft: 2 },
  editActions: { flexDirection: "row", gap: 10, marginTop: 2 },
  editActionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 12 },
  cancelBtn: { backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.border },
  cancelBtnPressed: { backgroundColor: Colors.creamDark },
  cancelBtnText: { fontSize: 14, fontWeight: "600" as const, color: Colors.brownMuted },
  saveBtn: { backgroundColor: Colors.primary },
  saveBtnPressed: { backgroundColor: Colors.primaryDark, transform: [{ scale: 0.97 }] },
  saveBtnText: { fontSize: 14, fontWeight: "600" as const, color: Colors.white },
});
