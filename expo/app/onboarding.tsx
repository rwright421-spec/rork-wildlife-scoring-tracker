import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ArrowRight, Check, Plus, Trash2, Trees, Users } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import Colors from "@/constants/colors";
import { AVATAR_OPTIONS } from "@/constants/animals";
import { useGame } from "@/providers/GameProvider";
import { KeyboardAccessory, KEYBOARD_ACCESSORY_ID } from "@/components/KeyboardDoneBar";
import AvatarPicker from "@/components/AvatarPicker";
import PlayerAvatar from "@/components/PlayerAvatar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function OnboardingScreen() {
  const { addPlayer, players, removePlayer, completeOnboarding } = useGame();
  const [step, setStep] = useState<number>(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [newPlayerName, setNewPlayerName] = useState<string>("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATAR_OPTIONS[0]);

  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  const animateTransition = useCallback((toStep: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setStep(toStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

  const handleNext = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (step < 2) {
      animateTransition(step + 1);
    }
  }, [step, animateTransition]);

  const handleAddPlayer = useCallback(() => {
    const name = newPlayerName.trim();
    if (!name) {
      Alert.alert("Name Required", "Please enter a name for the player.");
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    addPlayer(name, selectedAvatar);
    setNewPlayerName("");
    setSelectedAvatar(AVATAR_OPTIONS[0]);
    setShowAddForm(false);
  }, [newPlayerName, selectedAvatar, addPlayer]);

  const handleRemovePlayer = useCallback(
    (playerId: string, playerName: string) => {
      Alert.alert("Remove Player", `Remove ${playerName}?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => removePlayer(playerId) },
      ]);
    },
    [removePlayer]
  );

  const handleFinish = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    completeOnboarding();
    router.replace("/(tabs)/(home)");
  }, [completeOnboarding]);

  const renderDots = () => (
    <View style={styles.dotsRow}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[
            styles.dot,
            step === i && styles.dotActive,
          ]}
        />
      ))}
    </View>
  );

  const renderStep0 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.welcomeIconWrap}>
        <View style={styles.welcomeIconBg}>
          <Text style={styles.welcomeEmoji}>🦌</Text>
        </View>
        <View style={styles.welcomeIconRing} />
      </View>
      <Text style={styles.welcomeTitle}>Wildlife Spotter</Text>
      <Text style={styles.welcomeSubtitle}>
        The family road trip game
      </Text>
      <View style={styles.featureList}>
        <View style={styles.featureRow}>
          <View style={styles.featureDot}>
            <Trees size={16} color={Colors.primary} />
          </View>
          <Text style={styles.featureText}>Spot animals on your trip</Text>
        </View>
        <View style={styles.featureRow}>
          <View style={styles.featureDot}>
            <Text style={styles.featureDotEmoji}>⭐</Text>
          </View>
          <Text style={styles.featureText}>Earn points for each sighting</Text>
        </View>
        <View style={styles.featureRow}>
          <View style={styles.featureDot}>
            <Text style={styles.featureDotEmoji}>🏆</Text>
          </View>
          <Text style={styles.featureText}>Crown the winner at the end</Text>
        </View>
      </View>
      <Pressable
        style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
        onPress={handleNext}
        testID="onboarding-next-0"
      >
        <Text style={styles.primaryBtnText}>Let's Go</Text>
        <ArrowRight size={20} color={Colors.white} />
      </Pressable>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeaderWrap}>
        <View style={styles.stepIconSmall}>
          <Users size={22} color={Colors.primary} />
        </View>
        <Text style={styles.stepTitle}>Who's playing?</Text>
        <Text style={styles.stepSubtitle}>
          Add your family members — you can always change this later in Settings.
        </Text>
      </View>

      <ScrollView
        style={styles.playerList}
        contentContainerStyle={styles.playerListContent}
        showsVerticalScrollIndicator={false}
      >
        {players.map((player) => (
          <View key={player.id} style={styles.playerCard}>
            <PlayerAvatar avatar={player.avatar} size={36} fontSize={22} />
            <Text style={styles.playerName}>{player.name}</Text>
            <Pressable
              style={styles.playerDeleteBtn}
              onPress={() => handleRemovePlayer(player.id, player.name)}
            >
              <Trash2 size={16} color={Colors.danger} />
            </Pressable>
          </View>
        ))}

        {showAddForm ? (
          <View style={styles.addForm}>
            <TextInput
              style={styles.input}
              placeholder="Player name"
              placeholderTextColor={Colors.textLight}
              value={newPlayerName}
              onChangeText={setNewPlayerName}
              autoFocus
              testID="onboarding-player-name-input"
              returnKeyType="done"
              blurOnSubmit
              maxLength={20}
              inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
            />
            <AvatarPicker
              options={AVATAR_OPTIONS}
              selected={selectedAvatar}
              onSelect={(emoji) => { setSelectedAvatar(emoji); }}
              size="small"
            />
            <View style={styles.formActions}>
              <Pressable
                style={({ pressed }) => [styles.cancelFormBtn, pressed && { opacity: 0.7 }]}
                onPress={() => { setShowAddForm(false); setNewPlayerName(""); }}
              >
                <Text style={styles.cancelFormText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.addConfirmBtn, pressed && styles.addConfirmBtnPressed]}
                onPress={handleAddPlayer}
              >
                <Check size={18} color={Colors.white} />
                <Text style={styles.addConfirmText}>Add</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.addPlayerBtn, pressed && { opacity: 0.7 }]}
            onPress={() => setShowAddForm(true)}
            testID="onboarding-add-player"
          >
            <Plus size={18} color={Colors.primary} />
            <Text style={styles.addPlayerBtnText}>Add Player</Text>
          </Pressable>
        )}
      </ScrollView>

      <View style={styles.step1Footer}>
        {players.length < 2 && (
          <Text style={styles.hintText}>Add at least 2 players to continue</Text>
        )}
        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            players.length < 2 && styles.primaryBtnDisabled,
            pressed && players.length >= 2 && styles.primaryBtnPressed,
          ]}
          onPress={players.length >= 2 ? handleNext : undefined}
          testID="onboarding-next-1"
        >
          <Text style={styles.primaryBtnText}>Continue</Text>
          <ArrowRight size={20} color={Colors.white} />
        </Pressable>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.readySection}>
        <View style={styles.readyIconWrap}>
          <Text style={styles.readyEmoji}>🎉</Text>
        </View>
        <Text style={styles.readyTitle}>You're all set!</Text>
        <Text style={styles.readySubtitle}>
          Your squad is ready to hit the road.
        </Text>
        <View style={styles.readyPlayerRow}>
          {players.map((p) => (
            <View key={p.id} style={styles.readyPlayerChip}>
              <PlayerAvatar avatar={p.avatar} size={28} fontSize={18} />
              <Text style={styles.readyPlayerName}>{p.name}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.readyHint}>
          Start your first trip from the home screen whenever you're ready.
        </Text>
      </View>
      <Pressable
        style={({ pressed }) => [styles.finishBtn, pressed && styles.finishBtnPressed]}
        onPress={handleFinish}
        testID="onboarding-finish"
      >
        <Text style={styles.finishBtnText}>Start Your First Trip</Text>
        <ArrowRight size={20} color={Colors.primary} />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.topDecor}>
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
      </View>
      {renderDots()}
      <Animated.View style={[styles.contentWrap, { opacity: fadeAnim }]}>
        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </Animated.View>
    <KeyboardAccessory />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  topDecor: {
    position: "absolute",
    top: -60,
    right: -40,
    width: 200,
    height: 200,
  },
  decorCircle1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(27,67,50,0.06)",
    top: 0,
    right: 0,
  },
  decorCircle2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(212,165,116,0.1)",
    top: 80,
    right: 60,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingTop: 60,
    paddingBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  contentWrap: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  welcomeIconWrap: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 28,
  },
  welcomeIconBg: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeIconRing: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: "rgba(27,67,50,0.12)",
  },
  welcomeEmoji: {
    fontSize: 56,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "800" as const,
    color: Colors.brown,
    textAlign: "center",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 17,
    color: Colors.brownMuted,
    textAlign: "center",
    marginBottom: 36,
  },
  featureList: {
    gap: 16,
    marginBottom: 48,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  featureDot: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EDF5F0",
    alignItems: "center",
    justifyContent: "center",
  },
  featureDotEmoji: {
    fontSize: 18,
  },
  featureText: {
    fontSize: 16,
    color: Colors.brown,
    fontWeight: "500" as const,
    flex: 1,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnPressed: {
    backgroundColor: Colors.primaryDark,
    transform: [{ scale: 0.97 }],
  },
  primaryBtnDisabled: {
    opacity: 0.4,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: "700" as const,
  },
  stepHeaderWrap: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 12,
  },
  stepIconSmall: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EDF5F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: Colors.brown,
    textAlign: "center",
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 15,
    color: Colors.brownMuted,
    textAlign: "center",
    lineHeight: 21,
  },
  playerList: {
    flex: 1,
  },
  playerListContent: {
    paddingBottom: 16,
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  playerAvatar: {
    fontSize: 28,
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.brown,
  },
  playerDeleteBtn: {
    padding: 8,
  },
  addForm: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
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
    marginBottom: 14,
  },
  avatarOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.cream,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#EDF5F0",
  },
  avatarText: {
    fontSize: 22,
  },
  formActions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelFormBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelFormText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.brownMuted,
  },
  addConfirmBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  addConfirmBtnPressed: {
    backgroundColor: Colors.primaryDark,
  },
  addConfirmText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  addPlayerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    backgroundColor: "rgba(27,67,50,0.03)",
  },
  addPlayerBtnText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  step1Footer: {
    paddingBottom: 40,
    gap: 10,
  },
  hintText: {
    fontSize: 13,
    color: Colors.brownMuted,
    textAlign: "center",
    fontStyle: "italic" as const,
  },
  readySection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 40,
  },
  readyIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#FFF8E7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  readyEmoji: {
    fontSize: 44,
  },
  readyTitle: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.brown,
    textAlign: "center",
    marginBottom: 8,
  },
  readySubtitle: {
    fontSize: 16,
    color: Colors.brownMuted,
    textAlign: "center",
    marginBottom: 24,
  },
  readyPlayerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  readyPlayerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  readyPlayerAvatar: {
    fontSize: 18,
  },
  readyPlayerName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.brown,
  },
  readyHint: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  finishBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    marginBottom: 40,
    shadowColor: Colors.accentDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  finishBtnPressed: {
    backgroundColor: Colors.accentDark,
    transform: [{ scale: 0.97 }],
  },
  finishBtnText: {
    color: Colors.primary,
    fontSize: 17,
    fontWeight: "700" as const,
  },
});
