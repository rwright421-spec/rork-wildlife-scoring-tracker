import { Check, X } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { AVATAR_OPTIONS } from "@/constants/animals";
import { Player, PlayerHairMeta } from "@/types";
import AvatarPicker from "@/components/AvatarPicker";
import { KeyboardAccessory, KEYBOARD_ACCESSORY_ID } from "@/components/KeyboardDoneBar";

interface EditPlayerModalProps {
  visible: boolean;
  player: Player | null;
  onSave: (playerId: string, name: string, avatar: string, hairMeta?: PlayerHairMeta) => void;
  onClose: () => void;
}

export default function EditPlayerModal({
  visible,
  player,
  onSave,
  onClose,
}: EditPlayerModalProps) {
  const [name, setName] = useState<string>("");
  const [avatar, setAvatar] = useState<string>(AVATAR_OPTIONS[0]);
  const [hairMeta, setHairMeta] = useState<PlayerHairMeta | undefined>(undefined);

  useEffect(() => {
    if (player && visible) {
      setName(player.name);
      setAvatar(player.avatar);
      setHairMeta(player.hairMeta);
    }
  }, [player, visible]);

  const handleSave = useCallback(() => {
    if (!player) return;
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert("Name Required", "Please enter a name for the player.");
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    console.log("[EditPlayerModal] Saving player:", player.id, "name:", trimmed, "avatar:", avatar);
    onSave(player.id, trimmed, avatar, hairMeta);
    onClose();
  }, [player, name, avatar, hairMeta, onSave, onClose]);

  if (!player) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID="edit-player-modal"
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Player</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <X size={20} color={Colors.brownMuted} />
            </Pressable>
          </View>

          <View style={styles.avatarSection}>
            <Pressable style={styles.currentAvatarCircle}>
              <Text style={styles.currentAvatarEmoji}>{avatar}</Text>
            </Pressable>
          </View>

          <AvatarPicker
            options={AVATAR_OPTIONS}
            selected={avatar}
            onSelect={(emoji, meta) => { setAvatar(emoji); setHairMeta(meta); }}
            label="Change avatar:"
            size="small"
          />

          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Player name"
            placeholderTextColor={Colors.textLight}
            returnKeyType="done"
            blurOnSubmit
            inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
            testID="edit-player-name-input"
          />

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelBtn,
                pressed && styles.cancelBtnPressed,
              ]}
              onPress={onClose}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.saveBtn,
                pressed && styles.saveBtnPressed,
              ]}
              onPress={handleSave}
            >
              <Check size={18} color={Colors.white} />
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
      <KeyboardAccessory />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.brown,
  },
  closeBtn: {
    padding: 4,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  currentAvatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EDF5F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  currentAvatarEmoji: {
    fontSize: 38,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.brownMuted,
    marginBottom: 6,
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
    marginBottom: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
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
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  saveBtnPressed: {
    backgroundColor: Colors.primaryDark,
    transform: [{ scale: 0.97 }],
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.white,
  },
});
