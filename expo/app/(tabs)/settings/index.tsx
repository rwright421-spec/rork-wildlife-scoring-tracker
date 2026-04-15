import { useRouter } from "expo-router";
import { Check, Crown, Pencil, Plus, Trash2, UserPlus, X } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import Colors from "@/constants/colors";
import { AVATAR_OPTIONS, ANIMAL_EMOJI_OPTIONS } from "@/constants/animals";
import { FREE_PLAYER_LIMIT, FREE_CUSTOM_ANIMAL_LIMIT } from "@/constants/limits";
import { useGame } from "@/providers/GameProvider";
import { usePurchases } from "@/providers/PurchaseProvider";
import { Player, Trip } from "@/types";
import { KeyboardAccessory, KEYBOARD_ACCESSORY_ID } from "@/components/KeyboardDoneBar";
import AvatarPicker from "@/components/AvatarPicker";
import EditPlayerModal from "@/components/EditPlayerModal";
import PlayerAvatar from "@/components/PlayerAvatar";

export default function SettingsScreen() {
  const router = useRouter();
  const { isPremium, restorePurchases, isRestoring, restoreSuccess } = usePurchases();
  const game = useGame();
  const { players, animals, addPlayer, updatePlayer, removePlayer, addAnimal, removeAnimal, editAnimal } = game;
  const gameState = game;
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editPlayerModalVisible, setEditPlayerModalVisible] = useState<boolean>(false);
  const [newPlayerName, setNewPlayerName] = useState<string>("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    AVATAR_OPTIONS[0]
  );

  const [showAddPlayer, setShowAddPlayer] = useState<boolean>(false);
  const [newAnimalName, setNewAnimalName] = useState<string>("");
  const [newAnimalEmoji, setNewAnimalEmoji] = useState<string>(ANIMAL_EMOJI_OPTIONS[0]);
  const [newAnimalPoints, setNewAnimalPoints] = useState<string>("");
  const [showAddAnimal, setShowAddAnimal] = useState<boolean>(false);

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
    if (num < 1) { setError("Minimum is 1"); return; }
    if (num > 1000) { setError("Maximum is 1000"); return; }
    setError("");
  }, []);

  const checkDuplicatePlayerName = useCallback((name: string) => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) { setPlayerNameWarning(""); return; }
    const existing = players.find((p) => p.name.trim().toLowerCase() === trimmed);
    if (existing) { setPlayerNameWarning(`A player named "${existing.name}" already exists.`); } else { setPlayerNameWarning(""); }
  }, [players]);

  const checkDuplicateAnimalName = useCallback((name: string, excludeId?: string) => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) return "";
    const existing = animals.find((a) => a.name.trim().toLowerCase() === trimmed && a.id !== excludeId);
    return existing ? `An animal named "${existing.name}" already exists.` : "";
  }, [animals]);

  const customAnimalCount = React.useMemo(() => animals.filter((a) => !a.isDefault).length, [animals]);

  const handleAddPlayer = useCallback(() => {
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
    addPlayer(name, selectedAvatar);
    setNewPlayerName("");
    setSelectedAvatar(AVATAR_OPTIONS[0]);
    setShowAddPlayer(false);
    setPlayerNameWarning("");
  }, [newPlayerName, selectedAvatar, addPlayer]);

  const handleRemovePlayer = useCallback(
    (playerId: string, playerName: string) => {
      const { players: allPlayers, animals: allAnimals, trips, activeTrips, completedTrips } = gameState;

      const participatedTrips = trips.filter((t: Trip) =>
        t.players.some((tp) => tp.playerId === playerId)
      );
      let lifetimePoints = 0;
      participatedTrips.forEach((t: Trip) => {
        const tp = t.players.find((p) => p.playerId === playerId);
        if (tp) lifetimePoints += tp.totalPoints;
      });
      const wins = completedTrips.filter((t: Trip) => t.winnerId === playerId).length;
      const inActiveTrips = activeTrips.filter((t: Trip) =>
        t.players.some((tp) => tp.playerId === playerId)
      );

      let message = `Deleting ${playerName} will permanently remove them from ${participatedTrips.length} trip${participatedTrips.length !== 1 ? "s" : ""}`;
      if (lifetimePoints > 0) message += `, ${lifetimePoints.toLocaleString()} lifetime points`;
      if (wins > 0) message += `, and ${wins} win${wins !== 1 ? "s" : ""}`;
      message += ". This cannot be undone.";

      if (inActiveTrips.length > 0) {
        message += `\n\n${playerName} is currently in ${inActiveTrips.length} active trip${inActiveTrips.length !== 1 ? "s" : ""}. Removing them will delete their scores from ${inActiveTrips.length === 1 ? "that trip" : "those trips"}.`;
      }

      Alert.alert(`Delete ${playerName}?`, message, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => removePlayer(playerId),
        },
      ]);
    },
    [removePlayer, gameState]
  );

  const handleAddAnimal = useCallback(() => {
    const name = newAnimalName.trim();
    const emoji = newAnimalEmoji.trim();
    const points = parseInt(newAnimalPoints, 10);
    if (!name || !emoji) {
      Alert.alert(
        "Missing Info",
        "Please enter a name and emoji for the animal."
      );
      return;
    }
    if (isNaN(points) || points < 1) {
      Alert.alert("Invalid Points", "Points must be between 1 and 1000.");
      return;
    }
    if (points > 1000) {
      Alert.alert("Invalid Points", "Points must be between 1 and 1000.");
      return;
    }
    if (!isPremium && customAnimalCount >= FREE_CUSTOM_ANIMAL_LIMIT) {
      Alert.alert(
        "Custom Animal Limit",
        "Free accounts cannot add custom animals. Upgrade to Pro for unlimited custom animals!",
        [
          { text: "Not Now", style: "cancel" },
          { text: "Upgrade", onPress: () => router.push("/paywall") },
        ]
      );
      return;
    }
    addAnimal(name, emoji, points);
    setNewAnimalName("");
    setNewAnimalEmoji(ANIMAL_EMOJI_OPTIONS[0]);
    setNewAnimalPoints("");
    setShowAddAnimal(false);
    setNewPointsError("");
    setAnimalNameWarning("");
  }, [newAnimalName, newAnimalEmoji, newAnimalPoints, addAnimal]);

  const handleRemoveAnimal = useCallback(
    (animalId: string, animalName: string) => {
      const { trips } = gameState;
      let totalSightings = 0;
      let totalPoints = 0;
      trips.forEach((t: Trip) => {
        const animal = t.animals?.find((a) => a.id === animalId);
        t.players.forEach((tp) => {
          const count = tp.sightings[animalId] || 0;
          totalSightings += count;
          totalPoints += count * (animal?.points || 0);
        });
      });

      let message = `Removing ${animalName} from your defaults won't affect past trips — historical data is preserved. It just won't appear as a default in future trips.`;
      if (totalSightings > 0) {
        message += `\n\n(${totalSightings} sighting${totalSightings !== 1 ? "s" : ""} totaling ${totalPoints.toLocaleString()} pts exist across your trips.)`;
      }

      Alert.alert(`Remove ${animalName}?`, message, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeAnimal(animalId),
        },
      ]);
    },
    [removeAnimal, gameState]
  );

  const startEditing = useCallback((animalId: string) => {
    const animal = animals.find((a) => a.id === animalId);
    if (!animal) return;
    setEditingAnimalId(animalId);
    setEditName(animal.name);
    setEditEmoji(animal.emoji);
    setEditPoints(String(animal.points));
  }, [animals]);

  const cancelEditing = useCallback(() => {
    setEditingAnimalId(null);
    setEditName("");
    setEditEmoji("");
    setEditPoints("");
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingAnimalId) return;
    const name = editName.trim();
    const emoji = editEmoji.trim();
    const points = parseInt(editPoints, 10);
    if (!name || !emoji) {
      Alert.alert("Missing Info", "Name and emoji are required.");
      return;
    }
    if (isNaN(points) || points < 1) {
      Alert.alert("Invalid Points", "Points must be between 1 and 1000.");
      return;
    }
    if (points > 1000) {
      Alert.alert("Invalid Points", "Points must be between 1 and 1000.");
      return;
    }
    editAnimal(editingAnimalId, name, emoji, points);
    setPointsError("");
    setEditAnimalNameWarning("");
    cancelEditing();
  }, [editingAnimalId, editName, editEmoji, editPoints, editAnimal, cancelEditing]);

  const allEmojiOptions = React.useMemo(() => {
    const currentEmojis = animals.map((a) => a.emoji);
    const defaultEmojis = ["🦌", "🐺", "🐻", "🐈"];
    const combined = [...new Set([...defaultEmojis, ...currentEmojis, ...ANIMAL_EMOJI_OPTIONS])];
    return combined;
  }, [animals]);

  return (
    <><ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!isPremium && (
        <Pressable
          style={({ pressed }) => [
            styles.proCard,
            pressed && styles.proCardPressed,
          ]}
          onPress={() => router.push("/paywall")}
        >
          <View style={styles.proIconWrap}>
            <Crown size={20} color={Colors.gold} />
          </View>
          <View style={styles.proTextWrap}>
            <Text style={styles.proTitle}>Upgrade to Pro</Text>
            <Text style={styles.proSubtitle}>Unlock the full Wildlife Tracker experience</Text>
          </View>
          <Text style={styles.proArrow}>{'>'}</Text>
        </Pressable>
      )}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Players</Text>
          <Pressable
            style={styles.addBtn}
            onPress={() => setShowAddPlayer(!showAddPlayer)}
          >
            <UserPlus size={18} color={Colors.primary} />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>
        {showAddPlayer && (
          <View style={styles.addForm}>
            <TextInput
              style={styles.input}
              placeholder="Player name"
              placeholderTextColor={Colors.textLight}
              value={newPlayerName}
              onChangeText={(t) => { setNewPlayerName(t); checkDuplicatePlayerName(t); }}
              testID="player-name-input"
              returnKeyType="done"
              blurOnSubmit
              maxLength={20}
              inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
            />
            {playerNameWarning ? <Text style={styles.warningText}>{playerNameWarning}</Text> : null}
            <AvatarPicker
              options={AVATAR_OPTIONS}
              selected={selectedAvatar}
              onSelect={(emoji) => { setSelectedAvatar(emoji); }}
            />
            <Pressable
              style={({ pressed }) => [
                styles.confirmBtn,
                pressed && styles.confirmBtnPressed,
              ]}
              onPress={handleAddPlayer}
            >
              <Text style={styles.confirmBtnText}>Add Player</Text>
            </Pressable>
          </View>
        )}
        {players.length === 0 && (
          <Text style={styles.emptyText}>
            No players yet. Add your family members to get started!
          </Text>
        )}
        {players.map((player) => (
          <View key={player.id} style={styles.listItem}>
            <PlayerAvatar avatar={player.avatar} size={36} fontSize={22} />
            <Text style={styles.listName}>{player.name}</Text>
            <Pressable
              style={styles.editBtn}
              onPress={() => { setEditingPlayer(player); setEditPlayerModalVisible(true); }}
            >
              <Pencil size={16} color={Colors.primaryLight} />
            </Pressable>
            <Pressable
              style={styles.deleteBtn}
              onPress={() => handleRemovePlayer(player.id, player.name)}
            >
              <Trash2 size={18} color={Colors.danger} />
            </Pressable>
          </View>
        ))}
      </View>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Default Animals</Text>
            <Text style={styles.sectionSubtitle}>Default animals for new trips</Text>
          </View>
          <Pressable
            style={styles.addBtn}
            onPress={() => setShowAddAnimal(!showAddAnimal)}
          >
            <Plus size={18} color={Colors.primary} />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>
        {showAddAnimal && (
          <View style={styles.addForm}>
            <Text style={styles.avatarLabel}>Pick an emoji:</Text>
            <View style={styles.emojiGrid}>
              {allEmojiOptions.map((emoji) => (
                <Pressable
                  key={emoji}
                  style={[
                    styles.emojiOption,
                    newAnimalEmoji === emoji && styles.emojiSelected,
                  ]}
                  onPress={() => setNewAnimalEmoji(emoji)}
                >
                  <Text style={styles.emojiOptionText}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.animalFormRow}>
              <TextInput
                style={[styles.input, styles.flexInput]}
                placeholder="Animal name"
                placeholderTextColor={Colors.textLight}
                value={newAnimalName}
                onChangeText={(t) => { setNewAnimalName(t); setAnimalNameWarning(checkDuplicateAnimalName(t)); }}
                returnKeyType="done"
                blurOnSubmit
                maxLength={20}
                inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
              />
              <TextInput
                style={[styles.input, styles.pointsInput]}
                placeholder="Pts"
                placeholderTextColor={Colors.textLight}
                value={newAnimalPoints}
                onChangeText={(t) => { setNewAnimalPoints(t); validatePoints(t, setNewPointsError); }}
                keyboardType="number-pad"
                inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
              />
            </View>
            {animalNameWarning ? <Text style={styles.warningText}>{animalNameWarning}</Text> : null}
            {newPointsError ? <Text style={styles.errorText}>{newPointsError}</Text> : null}
            <Pressable
              style={({ pressed }) => [
                styles.confirmBtn,
                pressed && styles.confirmBtnPressed,
              ]}
              onPress={handleAddAnimal}
            >
              <Text style={styles.confirmBtnText}>Add Animal</Text>
            </Pressable>
          </View>
        )}
        {animals.map((animal) => (
          <View key={animal.id}>
            {editingAnimalId === animal.id ? (
              <View style={styles.editCard}>
                <Text style={styles.avatarLabel}>Emoji:</Text>
                <View style={styles.emojiGrid}>
                  {allEmojiOptions.map((emoji) => (
                    <Pressable
                      key={emoji}
                      style={[
                        styles.emojiOption,
                        editEmoji === emoji && styles.emojiSelected,
                      ]}
                      onPress={() => setEditEmoji(emoji)}
                    >
                      <Text style={styles.emojiOptionText}>{emoji}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.animalFormRow}>
                  <TextInput
                    style={[styles.input, styles.flexInput]}
                    placeholder="Animal name"
                    placeholderTextColor={Colors.textLight}
                    value={editName}
                    onChangeText={(t) => { setEditName(t); setEditAnimalNameWarning(checkDuplicateAnimalName(t, editingAnimalId ?? undefined)); }}
                    returnKeyType="done"
                    blurOnSubmit
                    maxLength={20}
                    inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
                  />
                  <TextInput
                    style={[styles.input, styles.pointsInput]}
                    placeholder="Pts"
                    placeholderTextColor={Colors.textLight}
                    value={editPoints}
                    onChangeText={(t) => { setEditPoints(t); validatePoints(t, setPointsError); }}
                    keyboardType="number-pad"
                    inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
                  />
                </View>
                {editAnimalNameWarning ? <Text style={styles.warningText}>{editAnimalNameWarning}</Text> : null}
                {pointsError ? <Text style={styles.errorText}>{pointsError}</Text> : null}
                <View style={styles.editActions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.editActionBtn,
                      styles.cancelBtn,
                      pressed && styles.cancelBtnPressed,
                    ]}
                    onPress={cancelEditing}
                  >
                    <X size={16} color={Colors.brownMuted} />
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.editActionBtn,
                      styles.saveBtn,
                      pressed && styles.saveBtnPressed,
                    ]}
                    onPress={handleSaveEdit}
                  >
                    <Check size={16} color={Colors.white} />
                    <Text style={styles.saveBtnText}>Save</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.listItem}>
                <Text style={styles.listEmoji}>{animal.emoji}</Text>
                <Text style={styles.listName}>{animal.name}</Text>
                <View style={styles.pointsPill}>
                  <Text style={styles.pointsPillText}>{animal.points} pts</Text>
                </View>
                <Pressable
                  style={styles.editBtn}
                  onPress={() => startEditing(animal.id)}
                >
                  <Pencil size={16} color={Colors.primaryLight} />
                </Pressable>
                <Pressable
                  style={styles.deleteBtn}
                  onPress={() => handleRemoveAnimal(animal.id, animal.name)}
                >
                  <Trash2 size={18} color={Colors.danger} />
                </Pressable>
              </View>
            )}
          </View>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Purchases</Text>
        <Pressable
          style={({ pressed }) => [
            styles.restorePurchaseBtn,
            pressed && styles.restorePurchaseBtnPressed,
          ]}
          onPress={() => {
            restorePurchases();
          }}
          disabled={isRestoring}
        >
          {isRestoring ? (
            <ActivityIndicator color={Colors.primary} size="small" />
          ) : (
            <Text style={styles.restorePurchaseBtnText}>
              {restoreSuccess ? "Purchases Restored!" : "Restore Purchases"}
            </Text>
          )}
        </Pressable>
        {isPremium && (
          <View style={styles.premiumBadge}>
            <Crown size={16} color={Colors.gold} />
            <Text style={styles.premiumBadgeText}>Wildlife Tracker Pro Active</Text>
          </View>
        )}
      </View>
    </ScrollView>
    <KeyboardAccessory />
    <EditPlayerModal
      visible={editPlayerModalVisible}
      player={editingPlayer}
      onSave={updatePlayer}
      onClose={() => { setEditPlayerModalVisible(false); setEditingPlayer(null); }}
    />
  </>);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: 20, paddingBottom: 40 },
  proCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1B4332",
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    gap: 14,
    shadowColor: "#1B4332",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  proCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  proIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(218,165,32,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  proTextWrap: {
    flex: 1,
  },
  proTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 2,
  },
  proSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  proArrow: {
    fontSize: 18,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600" as const,
  },
  section: { marginBottom: 32 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.brown,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.brownMuted,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EDF5F0",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  addForm: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.brown,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  avatarLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.brownMuted,
    marginBottom: 8,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  avatarOption: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.cream,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarSelected: { borderColor: Colors.primary, backgroundColor: "#EDF5F0" },
  avatarText: { fontSize: 24 },
  confirmBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmBtnPressed: {
    backgroundColor: Colors.primaryDark,
    transform: [{ scale: 0.97 }],
  },
  confirmBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.brownMuted,
    fontStyle: "italic" as const,
    textAlign: "center",
    padding: 20,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  listEmoji: { fontSize: 26 },
  listName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.brown,
  },
  pointsPill: {
    backgroundColor: Colors.cream,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pointsPillText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  editBtn: { padding: 8 },
  deleteBtn: { padding: 8 },
  animalFormRow: { flexDirection: "row", gap: 8 },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.cream,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  emojiSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#EDF5F0",
  },
  emojiOptionText: { fontSize: 22 },
  flexInput: { flex: 1 },
  pointsInput: { width: 72, textAlign: "center" },
  warningText: { fontSize: 12, color: "#B8860B", marginBottom: 6, marginTop: -4, paddingLeft: 2 },
  errorText: { fontSize: 12, color: Colors.danger, marginBottom: 6, marginTop: -4, paddingLeft: 2 },
  editCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  editActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  editActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  cancelBtn: {
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
  saveBtn: {
    backgroundColor: Colors.primary,
  },
  saveBtnPressed: {
    backgroundColor: Colors.primaryDark,
    transform: [{ scale: 0.97 }],
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  restorePurchaseBtn: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    alignItems: "center" as const,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  restorePurchaseBtnPressed: {
    backgroundColor: Colors.creamDark,
  },
  restorePurchaseBtnText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  premiumBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  premiumBadgeText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.brown,
  },
});
