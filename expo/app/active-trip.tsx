import { router, Stack, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Plus, Trash2, X, Check, UserPlus, Settings } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, FlatList, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ANIMAL_EMOJI_OPTIONS, AVATAR_OPTIONS, getNameForEmoji } from "@/constants/animals";
import { FREE_PLAYER_LIMIT, FREE_CUSTOM_ANIMAL_LIMIT } from "@/constants/limits";
import { Animal, Player } from "@/types";

import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import { usePurchases } from "@/providers/PurchaseProvider";
import { KeyboardAccessory, KEYBOARD_ACCESSORY_ID } from "@/components/KeyboardDoneBar";
import AvatarPicker from "@/components/AvatarPicker";
import EditPlayerModal from "@/components/EditPlayerModal";
import PlayerAvatar from "@/components/PlayerAvatar";
import TripHeader from "@/components/TripHeader";
import PlayerList from "@/components/PlayerList";

interface LastAction {
  playerId: string;
  animalId: string;
  playerName: string;
  animalEmoji: string;
  animalPoints: number;
}

interface CelebrationData {
  emoji: string;
  points: number;
}

export default function ActiveTripScreen() {
  const insets = useSafeAreaInsets();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { activeTrips, getTrip, getPlayer, getTripAnimals, recordSighting, undoSighting, updateTripAnimal, addTripAnimal, removeTripAnimal, players, addPlayer, updatePlayer, addPlayerToTrip, removePlayerFromTrip, deleteTrip, updateTrip } = useGame();
  const { isPremium } = usePurchases();
  const [editPlayerModalVisible, setEditPlayerModalVisible] = useState<boolean>(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);

  const currentTrip = useMemo(() => {
    if (tripId) return getTrip(tripId);
    return activeTrips[0] ?? null;
  }, [tripId, getTrip, activeTrips]);

  const tripAnimals = currentTrip ? getTripAnimals(currentTrip.id) : [];
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [editPoints, setEditPoints] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [addPlayerModalVisible, setAddPlayerModalVisible] = useState(false);
  const [editTripName, setEditTripName] = useState("");
  const [editTripStartDate, setEditTripStartDate] = useState("");
  const [isEditingTripDetails, setIsEditingTripDetails] = useState(false);
  const [isCreatingNewPlayer, setIsCreatingNewPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [pointsError, setPointsError] = useState<string>("");
  const [playerNameWarning, setPlayerNameWarning] = useState<string>("");
  const [animalNameWarning, setAnimalNameWarning] = useState<string>("");
  const [newPlayerAvatar, setNewPlayerAvatar] = useState("🧑");

  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const snackbarOpacity = useRef(new Animated.Value(0)).current;
  const snackbarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const celebrationScale = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const celebrationTextY = useRef(new Animated.Value(20)).current;
  const validatePoints = useCallback((value: string) => {
    if (!value) { setPointsError(""); return; }
    const num = parseInt(value, 10);
    if (isNaN(num)) { setPointsError("Enter a valid number"); return; }
    if (num < 1) { setPointsError("Minimum is 1"); return; }
    if (num > 1000) { setPointsError("Maximum is 1000"); return; }
    setPointsError("");
  }, []);

  const checkDuplicatePlayerName = useCallback((name: string) => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) { setPlayerNameWarning(""); return; }
    const existing = players.find((p) => p.name.trim().toLowerCase() === trimmed);
    if (existing) { setPlayerNameWarning(`A player named "${existing.name}" already exists.`); } else { setPlayerNameWarning(""); }
  }, [players]);

  const checkDuplicateAnimalName = useCallback((name: string) => {
    if (!currentTrip) return;
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) { setAnimalNameWarning(""); return; }
    const existing = tripAnimals.find((a) => a.name.trim().toLowerCase() === trimmed && (!editingAnimal || a.id !== editingAnimal.id));
    if (existing) { setAnimalNameWarning(`An animal named "${existing.name}" already exists in this trip.`); } else { setAnimalNameWarning(""); }
  }, [currentTrip, tripAnimals, editingAnimal]);

  const sortedPlayers = useMemo(() => {
    if (!currentTrip) return [];
    return [...currentTrip.players].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }, [currentTrip]);

  const showSnackbar = useCallback((action: LastAction) => {
    if (snackbarTimer.current) clearTimeout(snackbarTimer.current);
    setLastAction(action);
    Animated.timing(snackbarOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    snackbarTimer.current = setTimeout(() => {
      Animated.timing(snackbarOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setLastAction(null);
      });
    }, 5000);
  }, [snackbarOpacity]);

  const handleUndoLast = useCallback(() => {
    if (!currentTrip || !lastAction) return;
    if (Platform.OS !== "web") { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); }
    undoSighting(currentTrip.id, lastAction.playerId, lastAction.animalId);
    if (snackbarTimer.current) clearTimeout(snackbarTimer.current);
    Animated.timing(snackbarOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setLastAction(null);
    });
  }, [currentTrip, lastAction, undoSighting, snackbarOpacity]);

  useEffect(() => {
    return () => { if (snackbarTimer.current) clearTimeout(snackbarTimer.current); };
  }, []);

  const triggerCelebration = useCallback((emoji: string, points: number) => {
    setCelebration({ emoji, points });
    celebrationScale.setValue(0);
    celebrationOpacity.setValue(1);
    celebrationTextY.setValue(20);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Animated.parallel([
      Animated.sequence([
        Animated.spring(celebrationScale, { toValue: 1.2, friction: 4, tension: 120, useNativeDriver: true }),
        Animated.timing(celebrationScale, { toValue: 1.5, duration: 600, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(celebrationOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.delay(1200),
        Animated.timing(celebrationOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(200),
        Animated.timing(celebrationTextY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start(() => {
      setCelebration(null);
    });
  }, [celebrationScale, celebrationOpacity, celebrationTextY]);

  const handleSighting = useCallback((playerId: string, animalId: string) => {
    if (!currentTrip) return;
    const animal = tripAnimals.find((a) => a.id === animalId);
    const isRare = animal && animal.points >= 20;
    if (Platform.OS !== "web" && !isRare) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
    recordSighting(currentTrip.id, playerId, animalId);
    const player = getPlayer(playerId);
    if (player && animal) {
      showSnackbar({ playerId, animalId, playerName: player.name, animalEmoji: animal.emoji, animalPoints: animal.points });
      if (isRare) {
        triggerCelebration(animal.emoji, animal.points);
      }
    }
  }, [currentTrip, recordSighting, getPlayer, tripAnimals, showSnackbar, triggerCelebration]);

  const handleUndo = useCallback((playerId: string, animalId: string) => {
    if (!currentTrip) return;
    if (Platform.OS !== "web") { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
    undoSighting(currentTrip.id, playerId, animalId);
  }, [currentTrip, undoSighting]);

  const handleEndTrip = useCallback(() => {
    if (!currentTrip) return;
    Alert.alert("End Trip?", "Are you sure you want to end this trip?", [
      { text: "Cancel", style: "cancel" },
      { text: "End Trip", style: "destructive", onPress: () => { router.replace({ pathname: "/end-trip", params: { tripId: currentTrip.id } }); } },
    ]);
  }, [currentTrip]);

  const handleDeleteTrip = useCallback(() => {
    if (!currentTrip) return;
    setEditModalVisible(false);
    setTimeout(() => {
      Alert.alert(
        "Delete this trip?",
        "All scores and sightings will be permanently lost. This cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              if (Platform.OS !== "web") { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); }
              deleteTrip(currentTrip.id);
              if (__DEV__) console.log('[ActiveTrip] Deleted trip:', currentTrip.id);
              router.back();
            },
          },
        ]
      );
    }, 300);
  }, [currentTrip, deleteTrip]);

  const availablePlayers = useMemo(() => {
    if (!currentTrip) return [];
    const tripPlayerIds = new Set(currentTrip.players.map((tp) => tp.playerId));
    return players.filter((p) => !tripPlayerIds.has(p.id));
  }, [currentTrip, players]);

  const openAddPlayerModal = useCallback(() => {
    setIsCreatingNewPlayer(false);
    setNewPlayerName("");
    setNewPlayerAvatar("🧑");
    setShowAvatarPicker(false);
    setAddPlayerModalVisible(true);
  }, []);

  const handleSelectExistingPlayer = useCallback((player: Player) => {
    if (!currentTrip) return;
    if (Platform.OS !== "web") { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
    addPlayerToTrip(currentTrip.id, player.id);
    if (__DEV__) console.log('[ActiveTrip] Added existing player to trip:', player.name);
    setAddPlayerModalVisible(false);
  }, [currentTrip, addPlayerToTrip]);

  const handleCreateAndAddPlayer = useCallback(() => {
    if (!currentTrip) return;
    const name = newPlayerName.trim();
    if (!name) { Alert.alert("Missing name", "Please enter a player name."); return; }
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
    setPlayerNameWarning("");
    if (Platform.OS !== "web") { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
    const newPlayer = addPlayer(name, newPlayerAvatar);
    addPlayerToTrip(currentTrip.id, newPlayer.id);
    if (__DEV__) console.log('[ActiveTrip] Created new player and added to trip:', name);
    setAddPlayerModalVisible(false);
  }, [currentTrip, newPlayerName, newPlayerAvatar, addPlayer, addPlayerToTrip]);

  const openEditModal = useCallback(() => {
    setEditingAnimal(null);
    setIsAddingNew(false);
    setShowEmojiPicker(false);
    setIsEditingTripDetails(false);
    setEditModalVisible(true);
  }, []);

  const startEditTripDetails = useCallback(() => {
    if (!currentTrip) return;
    setEditTripName(currentTrip.name);
    setEditTripStartDate(new Date(currentTrip.startDate).toISOString().split('T')[0]);
    setIsEditingTripDetails(true);
  }, [currentTrip]);

  const saveTripDetails = useCallback(() => {
    if (!currentTrip) return;
    const name = editTripName.trim();
    if (!name) { Alert.alert("Missing name", "Please enter a trip name."); return; }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(editTripStartDate)) { Alert.alert("Invalid date", "Use YYYY-MM-DD format."); return; }
    const parsedDate = new Date(editTripStartDate + 'T12:00:00');
    if (isNaN(parsedDate.getTime())) { Alert.alert("Invalid date", "Please enter a valid date."); return; }
    if (Platform.OS !== "web") { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
    updateTrip(currentTrip.id, { name, startDate: parsedDate.toISOString() });
    setIsEditingTripDetails(false);
    if (__DEV__) console.log('[ActiveTrip] Updated trip details:', name, editTripStartDate);
  }, [currentTrip, editTripName, editTripStartDate, updateTrip]);

  const startEditAnimal = useCallback((animal: Animal) => {
    setEditingAnimal(animal);
    setEditName(animal.name);
    setEditEmoji(animal.emoji);
    setEditPoints(animal.points.toString());
    setIsAddingNew(false);
    setShowEmojiPicker(false);
  }, []);

  const [noEmojiMode, setNoEmojiMode] = useState<boolean>(false);

  const startAddAnimal = useCallback(() => {
    setEditingAnimal(null);
    setEditName("");
    setEditEmoji("🐰");
    setEditPoints("1");
    setIsAddingNew(true);
    setShowEmojiPicker(false);
    setNoEmojiMode(false);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingAnimal(null);
    setIsAddingNew(false);
    setShowEmojiPicker(false);
  }, []);

  const customTripAnimalCount = useMemo(() => tripAnimals.filter((a) => !a.isDefault).length, [tripAnimals]);

  const saveEdit = useCallback(() => {
    if (!currentTrip) return;
    const name = editName.trim();
    const pts = parseInt(editPoints, 10);
    if (!name) { Alert.alert("Missing name", "Please enter an animal name."); return; }
    if (isNaN(pts) || pts < 1) { Alert.alert("Invalid points", "Points must be between 1 and 1000."); return; }
    if (pts > 1000) { Alert.alert("Invalid points", "Points must be between 1 and 1000."); return; }
    if (isAddingNew && !isPremium && customTripAnimalCount >= FREE_CUSTOM_ANIMAL_LIMIT) {
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
    if (Platform.OS !== "web") { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
    if (isAddingNew) {
      addTripAnimal(currentTrip.id, name, noEmojiMode ? "" : editEmoji, pts);
      setNoEmojiMode(false);
    } else if (editingAnimal) {
      updateTripAnimal(currentTrip.id, editingAnimal.id, name, editEmoji, pts);
    }
    setEditingAnimal(null);
    setIsAddingNew(false);
    setShowEmojiPicker(false);
    setPointsError("");
    setAnimalNameWarning("");
  }, [currentTrip, editName, editEmoji, editPoints, editingAnimal, isAddingNew, noEmojiMode, addTripAnimal, updateTripAnimal]);

  const handleRemovePlayerFromTrip = useCallback((playerId: string, playerName: string, totalPoints: number) => {
    if (!currentTrip) return;
    const sightingCount = Object.values(currentTrip.players.find((tp) => tp.playerId === playerId)?.sightings ?? {}).reduce((sum, c) => sum + c, 0);
    let message = `Remove ${playerName} from this trip?`;
    if (totalPoints > 0) {
      message += `\n\nThey have ${sightingCount} sighting${sightingCount !== 1 ? "s" : ""} and ${totalPoints.toLocaleString()} points in this trip. These will be permanently deleted.`;
    }
    Alert.alert(`Remove ${playerName}?`, message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          if (Platform.OS !== "web") { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); }
          removePlayerFromTrip(currentTrip.id, playerId);
          if (__DEV__) console.log('[ActiveTrip] Removed player from trip:', playerId);
        },
      },
    ]);
  }, [currentTrip, removePlayerFromTrip]);

  const handleRemoveAnimal = useCallback((animal: Animal) => {
    if (!currentTrip) return;
    const totalSightings = currentTrip.players.reduce((sum, tp) => sum + (tp.sightings[animal.id] || 0), 0);
    const totalPoints = totalSightings * animal.points;

    if (totalSightings > 0) {
      Alert.alert(
        `Remove ${animal.emoji} ${animal.name}?`,
        `${animal.name} has been spotted ${totalSightings} time${totalSightings !== 1 ? "s" : ""} this trip for ${totalPoints.toLocaleString()} points total. Removing it will subtract those points from your players' scores.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Remove", style: "destructive", onPress: () => {
            removeTripAnimal(currentTrip.id, animal.id);
            if (editingAnimal?.id === animal.id) { setEditingAnimal(null); setIsAddingNew(false); }
          }},
        ]
      );
    } else {
      Alert.alert(
        `Remove ${animal.emoji} ${animal.name}?`,
        `No sightings logged yet. Remove ${animal.name} from this trip?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Remove", style: "destructive", onPress: () => {
            removeTripAnimal(currentTrip.id, animal.id);
            if (editingAnimal?.id === animal.id) { setEditingAnimal(null); setIsAddingNew(false); }
          }},
        ]
      );
    }
  }, [currentTrip, editingAnimal, removeTripAnimal]);

  if (!currentTrip) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.noTrip}>
          <Text style={styles.noTripText}>No active trip</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backBtnText}>Go Back</Text></Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <TripHeader
        tripName={currentTrip.name}
        paddingTop={insets.top + 8}
        onBack={() => router.back()}
        onSettings={openEditModal}
        onEndTrip={handleEndTrip}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}>
        <PlayerList
          sortedPlayers={sortedPlayers}
          tripAnimals={tripAnimals}
          getPlayer={getPlayer}
          onSighting={handleSighting}
          onUndo={handleUndo}
          onEditPlayer={(playerId) => { setEditingPlayerId(playerId); setEditPlayerModalVisible(true); }}
        />
      </ScrollView>
      {celebration && (
        <Animated.View style={[styles.celebrationOverlay, { opacity: celebrationOpacity }]} pointerEvents="none">
          <Animated.Text style={[styles.celebrationEmoji, { transform: [{ scale: celebrationScale }] }]}>
            {celebration.emoji}
          </Animated.Text>
          <Animated.View style={[styles.celebrationBadge, { opacity: celebrationOpacity, transform: [{ translateY: celebrationTextY }] }]}>
            <Text style={styles.celebrationLabel}>Rare find!</Text>
            <Text style={styles.celebrationPoints}>+{celebration.points} pts</Text>
          </Animated.View>
        </Animated.View>
      )}
      <Modal visible={editModalVisible} animationType="slide" transparent testID="edit-animals-modal">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Trip Settings</Text>
              <Pressable onPress={() => setEditModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={22} color={Colors.brown} />
              </Pressable>
            </View>

            {!(editingAnimal || isAddingNew) && !isEditingTripDetails && (
              <>
                <Pressable
                  onPress={startEditTripDetails}
                  style={styles.addPlayerMenuBtn}
                  testID="edit-trip-details-btn"
                >
                  <Settings size={20} color={Colors.primary} />
                  <View style={styles.addPlayerMenuInfo}>
                    <Text style={styles.addPlayerMenuTitle}>Edit Trip Details</Text>
                    <Text style={styles.addPlayerMenuSub}>Change name or start date</Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => { setEditModalVisible(false); setTimeout(() => openAddPlayerModal(), 300); }}
                  style={styles.addPlayerMenuBtn}
                  testID="add-player-btn"
                >
                  <UserPlus size={20} color={Colors.primary} />
                  <View style={styles.addPlayerMenuInfo}>
                    <Text style={styles.addPlayerMenuTitle}>Add Player</Text>
                    <Text style={styles.addPlayerMenuSub}>Add someone to this trip mid-game</Text>
                  </View>
                </Pressable>
                {currentTrip.players.length > 1 && (
                  <View style={styles.removePlayerSection}>
                    <Text style={styles.removePlayerSectionTitle}>Players in this trip</Text>
                    {currentTrip.players.map((tp) => {
                      const player = getPlayer(tp.playerId);
                      return (
                        <View key={tp.playerId} style={styles.removePlayerRow}>
                          <Text style={styles.removePlayerAvatar}>{player?.avatar ?? "?"}</Text>
                          <View style={styles.removePlayerInfo}>
                            <Text style={styles.removePlayerName}>{player?.name ?? "Unknown"}</Text>
                            <Text style={styles.removePlayerMeta}>{tp.totalPoints} pts</Text>
                          </View>
                          <Pressable
                            onPress={() => handleRemovePlayerFromTrip(tp.playerId, player?.name ?? "this player", tp.totalPoints)}
                            style={styles.removePlayerBtn}
                            hitSlop={8}
                          >
                            <Trash2 size={16} color={Colors.danger} />
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                )}
              </>
            )}

            {isEditingTripDetails ? (
              <View style={styles.editForm}>
                <Text style={styles.editFormTitle}>Edit Trip Details</Text>
                <View>
                  <Text style={styles.editFieldLabel}>Trip Name</Text>
                  <TextInput style={styles.editInput} value={editTripName} onChangeText={setEditTripName} placeholder="Trip name" placeholderTextColor={Colors.textLight} returnKeyType="done" blurOnSubmit maxLength={30} inputAccessoryViewID={KEYBOARD_ACCESSORY_ID} />
                </View>
                <View>
                  <Text style={styles.editFieldLabel}>Start Date (YYYY-MM-DD)</Text>
                  <TextInput style={styles.editInput} value={editTripStartDate} onChangeText={setEditTripStartDate} placeholder="2024-01-15" placeholderTextColor={Colors.textLight} returnKeyType="done" blurOnSubmit maxLength={10} inputAccessoryViewID={KEYBOARD_ACCESSORY_ID} />
                </View>
                <View style={styles.editFormActions}>
                  <Pressable onPress={() => setIsEditingTripDetails(false)} style={styles.editCancelBtn}><Text style={styles.editCancelBtnText}>Cancel</Text></Pressable>
                  <Pressable onPress={saveTripDetails} style={styles.editSaveBtn}><Check size={18} color={Colors.white} /><Text style={styles.editSaveBtnText}>Save</Text></Pressable>
                </View>
              </View>
            ) : (editingAnimal || isAddingNew) ? (
              <View style={styles.editForm}>
                <Text style={styles.editFormTitle}>{isAddingNew ? "Add New Animal" : "Edit " + editingAnimal?.name}</Text>
                {isAddingNew && !noEmojiMode ? (
                  <>
                    <Pressable onPress={() => setShowEmojiPicker(!showEmojiPicker)} style={styles.emojiSelector}>
                      <Text style={styles.emojiSelectorValue}>{editEmoji}</Text>
                      <Text style={styles.emojiSelectorLabel}>Tap to change</Text>
                    </Pressable>
                    <Pressable onPress={() => { setNoEmojiMode(true); setEditName(""); }} style={styles.noEmojiToggle}>
                      <Text style={styles.noEmojiToggleText}>No emoji</Text>
                    </Pressable>
                  </>
                ) : isAddingNew && noEmojiMode ? (
                  <Pressable onPress={() => { setNoEmojiMode(false); const suggested = getNameForEmoji(editEmoji); if (!editName.trim()) setEditName(suggested); }} style={styles.noEmojiToggle}>
                    <Text style={styles.noEmojiToggleText}>Use emoji</Text>
                  </Pressable>
                ) : (
                  <>
                    <Pressable onPress={() => setShowEmojiPicker(!showEmojiPicker)} style={styles.emojiSelector}>
                      <Text style={styles.emojiSelectorValue}>{editEmoji}</Text>
                      <Text style={styles.emojiSelectorLabel}>Tap to change</Text>
                    </Pressable>
                  </>
                )}
                {showEmojiPicker && (
                  <View style={styles.emojiGrid}>
                    {ANIMAL_EMOJI_OPTIONS.map((emoji) => (
                      <Pressable key={emoji} style={[styles.emojiOption, editEmoji === emoji && styles.emojiOptionSelected]} onPress={() => { setEditEmoji(emoji); setShowEmojiPicker(false); if (isAddingNew) { const suggested = getNameForEmoji(emoji); if (!editName.trim() || getNameForEmoji(editEmoji) === editName.trim()) { setEditName(suggested); } } }}>
                        <Text style={styles.emojiOptionText}>{emoji}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                <View style={styles.editFieldRow}>
                  <View style={styles.editFieldFlex}>
                    <Text style={styles.editFieldLabel}>Name</Text>
                    <TextInput style={styles.editInput} value={editName} onChangeText={(t) => { setEditName(t); checkDuplicateAnimalName(t); }} placeholder="Animal name" placeholderTextColor={Colors.textLight} returnKeyType="done" blurOnSubmit maxLength={20} inputAccessoryViewID={KEYBOARD_ACCESSORY_ID} />
                  </View>
                  <View style={styles.editFieldSmall}>
                    <Text style={styles.editFieldLabel}>Points</Text>
                    <TextInput style={styles.editInput} value={editPoints} onChangeText={(t) => { setEditPoints(t); validatePoints(t); }} keyboardType="number-pad" placeholder="5" placeholderTextColor={Colors.textLight} inputAccessoryViewID={KEYBOARD_ACCESSORY_ID} />
                  </View>
                </View>
                {animalNameWarning ? <Text style={styles.warningText}>{animalNameWarning}</Text> : null}
                {pointsError ? <Text style={styles.errorText}>{pointsError}</Text> : null}
                <View style={styles.editFormActions}>
                  <Pressable onPress={cancelEdit} style={styles.editCancelBtn}><Text style={styles.editCancelBtnText}>Cancel</Text></Pressable>
                  <Pressable onPress={saveEdit} style={styles.editSaveBtn}><Check size={18} color={Colors.white} /><Text style={styles.editSaveBtnText}>Save</Text></Pressable>
                </View>
              </View>
            ) : (
              <ScrollView style={styles.animalListScroll} contentContainerStyle={styles.animalListContent}>
                {tripAnimals.map((animal) => {
                  const totalSightings = currentTrip ? currentTrip.players.reduce((sum, tp) => sum + (tp.sightings[animal.id] || 0), 0) : 0;
                  return (
                    <Pressable key={animal.id} style={styles.animalListItem} onPress={() => startEditAnimal(animal)}>
                      {animal.emoji ? (
                        <Text style={styles.animalListEmoji}>{animal.emoji}</Text>
                      ) : (
                        <View style={styles.noEmojiListIcon}>
                          <Text style={styles.noEmojiListIconText}>{animal.name.charAt(0).toUpperCase()}</Text>
                        </View>
                      )}
                      <View style={styles.animalListInfo}>
                        <Text style={styles.animalListName}>{animal.name}</Text>
                        <Text style={styles.animalListMeta}>{animal.points} pts{totalSightings > 0 ? " · " + totalSightings + " sighting" + (totalSightings !== 1 ? "s" : "") : ""}</Text>
                      </View>
                      <Pressable onPress={() => handleRemoveAnimal(animal)} style={styles.animalDeleteBtn} hitSlop={8}>
                        <Trash2 size={18} color={Colors.danger} />
                      </Pressable>
                    </Pressable>
                  );
                })}
                <Pressable onPress={startAddAnimal} style={styles.addAnimalBtn}>
                  <Plus size={20} color={Colors.primary} />
                  <Text style={styles.addAnimalBtnText}>Add Animal</Text>
                </Pressable>
                <View style={styles.deleteTripDivider} />
                <Pressable onPress={handleDeleteTrip} style={styles.deleteTripBtn} testID="delete-trip-btn">
                  <Trash2 size={18} color={Colors.dangerLight} />
                  <Text style={styles.deleteTripBtnText}>Delete Trip</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={addPlayerModalVisible} animationType="slide" transparent testID="add-player-modal">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isCreatingNewPlayer ? "New Player" : "Add Player"}</Text>
              <Pressable onPress={() => setAddPlayerModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={22} color={Colors.brown} />
              </Pressable>
            </View>

            {isCreatingNewPlayer ? (
              <View style={styles.editForm}>
                <Pressable onPress={() => setShowAvatarPicker(!showAvatarPicker)} style={styles.emojiSelector}>
                  <Text style={styles.emojiSelectorValue}>{newPlayerAvatar}</Text>
                  <Text style={styles.emojiSelectorLabel}>Tap to change</Text>
                </Pressable>
                {showAvatarPicker && (
                  <AvatarPicker
                    options={AVATAR_OPTIONS}
                    selected={newPlayerAvatar}
                    onSelect={(avatar) => { setNewPlayerAvatar(avatar); setShowAvatarPicker(false); }}
                    label="Pick an avatar:"
                    size="small"
                  />
                )}
                <View>
                  <Text style={styles.editFieldLabel}>Name</Text>
                  <TextInput style={styles.editInput} value={newPlayerName} onChangeText={(t) => { setNewPlayerName(t); checkDuplicatePlayerName(t); }} placeholder="Player name" placeholderTextColor={Colors.textLight} autoFocus returnKeyType="done" blurOnSubmit maxLength={20} inputAccessoryViewID={KEYBOARD_ACCESSORY_ID} />
                  {playerNameWarning ? <Text style={styles.warningText}>{playerNameWarning}</Text> : null}
                </View>
                <View style={styles.editFormActions}>
                  <Pressable onPress={() => { setIsCreatingNewPlayer(false); setPlayerNameWarning(""); }} style={styles.editCancelBtn}>
                    <Text style={styles.editCancelBtnText}>{availablePlayers.length > 0 ? "Back" : "Cancel"}</Text>
                  </Pressable>
                  <Pressable onPress={handleCreateAndAddPlayer} style={styles.editSaveBtn}>
                    <Check size={18} color={Colors.white} />
                    <Text style={styles.editSaveBtnText}>Add</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <ScrollView style={styles.animalListScroll} contentContainerStyle={styles.animalListContent}>
                {availablePlayers.length > 0 ? (
                  availablePlayers.map((player) => (
                    <Pressable key={player.id} style={styles.playerListItem} onPress={() => handleSelectExistingPlayer(player)}>
                      <PlayerAvatar avatar={player.avatar} size={32} fontSize={20} />
                      <Text style={styles.playerListName}>{player.name}</Text>
                      <Plus size={18} color={Colors.primary} />
                    </Pressable>
                  ))
                ) : (
                  <View style={styles.noPlayersMsg}>
                    <Text style={styles.noPlayersMsgText}>All players are already in this trip</Text>
                  </View>
                )}
                <Pressable onPress={() => { setIsCreatingNewPlayer(true); setNewPlayerName(""); setNewPlayerAvatar("🧑"); setShowAvatarPicker(false); }} style={styles.addAnimalBtn}>
                  <UserPlus size={20} color={Colors.primary} />
                  <Text style={styles.addAnimalBtnText}>Create New Player</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <EditPlayerModal
        visible={editPlayerModalVisible}
        player={editingPlayerId ? (getPlayer(editingPlayerId) ?? null) : null}
        onSave={updatePlayer}
        onClose={() => { setEditPlayerModalVisible(false); setEditingPlayerId(null); }}
      />
      <KeyboardAccessory />
      {lastAction && (
        <Animated.View style={[styles.snackbar, { opacity: snackbarOpacity, bottom: insets.bottom + 16 }]}>
          <View style={styles.snackbarContent}>
            <Text style={styles.snackbarText}>
              {lastAction.animalEmoji ? lastAction.animalEmoji + " " : ""}{lastAction.playerName} +{lastAction.animalPoints}
            </Text>
            <Pressable
              onPress={handleUndoLast}
              style={({ pressed }) => [styles.snackbarBtn, pressed && styles.snackbarBtnPressed]}
              testID="undo-last-tap"
            >
              <Text style={styles.snackbarBtnText}>Undo</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  scrollView: { flex: 1, backgroundColor: Colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  scrollContent: { padding: 16, gap: 16 },
  noTrip: { flex: 1, alignItems: "center", justifyContent: "center" },
  noTripText: { fontSize: 18, color: Colors.cream, marginBottom: 16 },
  backBtn: { backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backBtnText: { color: Colors.cream, fontSize: 16, fontWeight: "600" as const },
  snackbar: { position: "absolute" as const, left: 16, right: 16, alignItems: "center" },
  snackbarContent: { flexDirection: "row" as const, alignItems: "center" as const, backgroundColor: Colors.primaryDark, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 14, gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
  snackbarText: { flex: 1, color: Colors.cream, fontSize: 15, fontWeight: "600" as const },
  snackbarBtn: { backgroundColor: Colors.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  snackbarBtnPressed: { backgroundColor: Colors.accentDark },
  snackbarBtnText: { color: Colors.white, fontSize: 14, fontWeight: "700" as const },
  celebrationOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.25)", zIndex: 99 },
  celebrationEmoji: { fontSize: 80 },
  celebrationBadge: { marginTop: 12, backgroundColor: Colors.accent, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  celebrationLabel: { fontSize: 16, fontWeight: "800" as const, color: Colors.white, letterSpacing: 0.5 },
  celebrationPoints: { fontSize: 22, fontWeight: "900" as const, color: Colors.white, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalContainer: { backgroundColor: Colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%", paddingTop: 8, overflow: "hidden" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 20, fontWeight: "700" as const, color: Colors.brown },
  modalCloseBtn: { padding: 6 },
  animalListScroll: { flexShrink: 1 },
  animalListContent: { padding: 16, gap: 10 },
  animalListItem: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  animalListEmoji: { fontSize: 32 },
  animalListInfo: { flex: 1 },
  animalListName: { fontSize: 16, fontWeight: "600" as const, color: Colors.brown },
  animalListMeta: { fontSize: 13, color: Colors.brownMuted, marginTop: 2 },
  animalDeleteBtn: { padding: 8 },
  addAnimalBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.white, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: Colors.primary, borderStyle: "dashed" },
  addAnimalBtnText: { fontSize: 16, fontWeight: "600" as const, color: Colors.primary },
  editForm: { padding: 20, gap: 16 },
  editFormTitle: { fontSize: 18, fontWeight: "700" as const, color: Colors.brown },
  emojiSelector: { alignSelf: "center", alignItems: "center", backgroundColor: Colors.white, width: 80, height: 80, borderRadius: 20, justifyContent: "center", borderWidth: 2, borderColor: Colors.accent },
  emojiSelectorValue: { fontSize: 36 },
  emojiSelectorLabel: { fontSize: 10, color: Colors.brownMuted, marginTop: 2 },
  noEmojiToggle: { alignSelf: "center" as const, marginTop: -8 },
  noEmojiToggleText: { fontSize: 13, fontWeight: "600" as const, color: Colors.primaryLight, textDecorationLine: "underline" as const },
  noEmojiListIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.primaryLight, alignItems: "center" as const, justifyContent: "center" as const },
  noEmojiListIconText: { fontSize: 16, fontWeight: "700" as const, color: Colors.white },
  emojiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", backgroundColor: Colors.white, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: Colors.border },
  emojiOption: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: Colors.cream },
  emojiOptionSelected: { backgroundColor: Colors.accentLight, borderWidth: 2, borderColor: Colors.accent },
  emojiOptionText: { fontSize: 24 },
  editFieldRow: { flexDirection: "row", gap: 12 },
  editFieldFlex: { flex: 1 },
  editFieldSmall: { width: 90 },
  editFieldLabel: { fontSize: 13, fontWeight: "600" as const, color: Colors.brownMuted, marginBottom: 6 },
  editInput: { backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: Colors.brown, borderWidth: 1, borderColor: Colors.border },
  warningText: { fontSize: 12, color: "#B8860B", marginBottom: 6, paddingLeft: 2 },
  errorText: { fontSize: 12, color: Colors.danger, marginBottom: 6, paddingLeft: 2 },
  editFormActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  editCancelBtn: { flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  editCancelBtnText: { fontSize: 16, fontWeight: "600" as const, color: Colors.brownMuted },
  editSaveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.primary },
  editSaveBtnText: { fontSize: 16, fontWeight: "700" as const, color: Colors.white },
  addPlayerMenuBtn: { flexDirection: "row", alignItems: "center", gap: 14, marginHorizontal: 16, marginTop: 12, backgroundColor: Colors.white, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: Colors.border },
  addPlayerMenuInfo: { flex: 1 },
  addPlayerMenuTitle: { fontSize: 16, fontWeight: "600" as const, color: Colors.primary },
  addPlayerMenuSub: { fontSize: 12, color: Colors.brownMuted, marginTop: 2 },
  playerListItem: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  playerListAvatar: { fontSize: 32 },
  playerListName: { flex: 1, fontSize: 16, fontWeight: "600" as const, color: Colors.brown },
  noPlayersMsg: { alignItems: "center", padding: 20 },
  noPlayersMsgText: { fontSize: 14, color: Colors.brownMuted, textAlign: "center" },
  deleteTripDivider: { height: 1, backgroundColor: Colors.border, marginTop: 16, marginBottom: 8 },
  deleteTripBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14, backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA" },
  deleteTripBtnText: { fontSize: 16, fontWeight: "600" as const, color: Colors.dangerLight },
  removePlayerSection: { marginHorizontal: 16, marginTop: 12, gap: 8 },
  removePlayerSectionTitle: { fontSize: 13, fontWeight: "600" as const, color: Colors.brownMuted, marginBottom: 2, paddingLeft: 4 },
  removePlayerRow: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  removePlayerAvatar: { fontSize: 24 },
  removePlayerInfo: { flex: 1 },
  removePlayerName: { fontSize: 15, fontWeight: "600" as const, color: Colors.brown },
  removePlayerMeta: { fontSize: 12, color: Colors.brownMuted, marginTop: 1 },
  removePlayerBtn: { padding: 8 },
});
