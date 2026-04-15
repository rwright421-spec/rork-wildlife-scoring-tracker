// Wildlife Spotter - Trip Detail Screen
import { useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Calendar, Check, Clock, Pencil, Trophy, X } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import { sanitizeTextInput, INPUT_LIMITS } from "@/utils/sanitize";
import PlayerAvatar from "@/components/PlayerAvatar";
import { KeyboardAccessory, KEYBOARD_ACCESSORY_ID } from "@/components/KeyboardDoneBar";

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trips, getPlayer, getTripAnimals, updateTrip } = useGame();
  const trip = useMemo(() => trips.find((t) => t.id === id), [trips, id]);
  const tripAnimals = useMemo(() => trip ? getTripAnimals(trip.id) : [], [trip, getTripAnimals]);

  React.useEffect(() => {
    if (trip) {
      if (__DEV__) console.log('[TripDetail] Showing trip:', trip.id, 'players:', trip.players.length, trip.players.map((p) => p.playerId));
    }
  }, [trip]);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");

  const startEditing = useCallback(() => {
    if (!trip) return;
    setEditName(trip.name);
    setEditStartDate(new Date(trip.startDate).toISOString().split('T')[0]);
    setEditEndDate(trip.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : "");
    setIsEditing(true);
  }, [trip]);

  const saveEdits = useCallback(() => {
    if (!trip) return;
    const name = sanitizeTextInput(editName, INPUT_LIMITS.TRIP_NAME);
    if (!name) { Alert.alert("Missing name", "Please enter a trip name."); return; }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(editStartDate)) { Alert.alert("Invalid date", "Start date must be YYYY-MM-DD."); return; }
    const parsedStart = new Date(editStartDate + 'T12:00:00');
    if (isNaN(parsedStart.getTime())) { Alert.alert("Invalid date", "Please enter a valid start date."); return; }
    let parsedEnd: Date | null = null;
    if (editEndDate.trim()) {
      if (!dateRegex.test(editEndDate)) { Alert.alert("Invalid date", "End date must be YYYY-MM-DD."); return; }
      parsedEnd = new Date(editEndDate + 'T12:00:00');
      if (isNaN(parsedEnd.getTime())) { Alert.alert("Invalid date", "Please enter a valid end date."); return; }
    }
    if (Platform.OS !== "web") { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
    updateTrip(trip.id, {
      name,
      startDate: parsedStart.toISOString(),
      ...(parsedEnd ? { endDate: parsedEnd.toISOString() } : {}),
    });
    setIsEditing(false);
    if (__DEV__) console.log('[TripDetail] Updated trip:', name, editStartDate, editEndDate);
  }, [trip, editName, editStartDate, editEndDate, updateTrip]);

  if (!trip) {
    return (<View style={styles.container}><View style={styles.centered}><Text style={styles.notFoundText}>Trip not found</Text></View></View>);
  }

  const winner = trip.winnerId ? getPlayer(trip.winnerId) : null;
  const sortedPlayers = [...trip.players].sort((a, b) => b.totalPoints - a.totalPoints);
  const duration = trip.endDate
    ? (() => {
        const start = new Date(trip.startDate);
        const end = new Date(trip.endDate);
        const hours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
        if (hours < 1) return "< 1 hour";
        if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""}`;
        const days = Math.round(hours / 24);
        return `${days} day${days > 1 ? "s" : ""}`;
      })()
    : "In progress";

  return (<>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {isEditing ? (
          <View style={styles.editSection}>
            <Text style={styles.editSectionTitle}>Edit Trip Details</Text>
            <View>
              <Text style={styles.editFieldLabel}>Trip Name</Text>
              <TextInput style={styles.editInput} value={editName} onChangeText={setEditName} placeholder="Trip name" placeholderTextColor={Colors.textLight} returnKeyType="done" blurOnSubmit maxLength={INPUT_LIMITS.TRIP_NAME} inputAccessoryViewID={KEYBOARD_ACCESSORY_ID} />
            </View>
            <View>
              <Text style={styles.editFieldLabel}>Start Date (YYYY-MM-DD)</Text>
              <TextInput style={styles.editInput} value={editStartDate} onChangeText={setEditStartDate} placeholder="2024-01-15" placeholderTextColor={Colors.textLight} returnKeyType="done" blurOnSubmit maxLength={10} inputAccessoryViewID={KEYBOARD_ACCESSORY_ID} />
            </View>
            {trip.endDate && (
              <View>
                <Text style={styles.editFieldLabel}>End Date (YYYY-MM-DD)</Text>
                <TextInput style={styles.editInput} value={editEndDate} onChangeText={setEditEndDate} placeholder="2024-01-16" placeholderTextColor={Colors.textLight} returnKeyType="done" blurOnSubmit maxLength={10} inputAccessoryViewID={KEYBOARD_ACCESSORY_ID} />
              </View>
            )}
            <View style={styles.editActions}>
              <Pressable onPress={() => setIsEditing(false)} style={styles.editCancelBtn}><X size={16} color={Colors.brownMuted} /><Text style={styles.editCancelText}>Cancel</Text></Pressable>
              <Pressable onPress={saveEdits} style={styles.editSaveBtn}><Check size={16} color={Colors.white} /><Text style={styles.editSaveText}>Save</Text></Pressable>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.tripNameRow}>
              <Text style={styles.tripName}>{trip.name}</Text>
              <Pressable onPress={startEditing} style={styles.editIconBtn} hitSlop={8}>
                <Pencil size={16} color={Colors.primary} />
              </Pressable>
            </View>
            <View style={styles.metaRow}><Calendar size={14} color={Colors.brownMuted} /><Text style={styles.metaText}>{new Date(trip.startDate).toLocaleDateString()}</Text></View>
            <View style={styles.metaRow}><Clock size={14} color={Colors.brownMuted} /><Text style={styles.metaText}>{duration}</Text></View>
            {winner && (<View style={styles.winnerBanner}><Trophy size={20} color={Colors.gold} /><View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Text style={styles.winnerBannerText}>Winner: </Text><PlayerAvatar avatar={winner.avatar} size={22} fontSize={16} /><Text style={styles.winnerBannerText}> {winner.name}</Text></View></View>)}
          </>
        )}
      </View>
      <Text style={styles.sectionTitle}>Scoreboard</Text>
      {sortedPlayers.map((tp, index) => {
        const player = getPlayer(tp.playerId);
        const isWinner = tp.playerId === trip.winnerId;
        const medals = ["🥇", "🥈", "🥉"];
        const medal = index < 3 ? medals[index] : "";
        return (
          <View key={tp.playerId} style={[styles.playerCard, isWinner && styles.winnerCard]}>
            <View style={styles.playerHeader}>
              <Text style={styles.playerMedal}>{medal}</Text>
              <PlayerAvatar avatar={player?.avatar ?? "🧑"} size={36} fontSize={22} />
              <Text style={styles.playerName}>{player?.name ?? "Unknown"}</Text>
              <View style={styles.totalBadge}><Text style={styles.totalPoints}>{tp.totalPoints}</Text><Text style={styles.totalLabel}>pts</Text></View>
            </View>
            <View style={styles.sightingsList}>
              {tripAnimals.map((animal) => {
                const count = tp.sightings[animal.id] || 0;
                if (count === 0) return null;
                return (
                  <View key={animal.id} style={styles.sightingRow}>
                    {animal.emoji ? (
                      <Text style={styles.sightingEmoji}>{animal.emoji}</Text>
                    ) : (
                      <View style={styles.noEmojiBadge}>
                        <Text style={styles.noEmojiBadgeText}>{animal.name.charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                    <Text style={styles.sightingName}>{animal.name}</Text>
                    <Text style={styles.sightingCount}>×{count}</Text>
                    <Text style={styles.sightingPoints}>{count * animal.points} pts</Text>
                  </View>
                );
              })}
              {Object.values(tp.sightings).every((c) => c === 0) && <Text style={styles.noSightings}>No sightings recorded</Text>}
            </View>
          </View>
        );
      })}
    </ScrollView>
    <KeyboardAccessory />
  </>);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { fontSize: 17, color: Colors.brownMuted },
  header: { marginBottom: 24 },
  tripName: { fontSize: 26, fontWeight: "800" as const, color: Colors.brown, marginBottom: 10, flex: 1 },
  tripNameRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  editIconBtn: { padding: 8, backgroundColor: Colors.cream, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  editSection: { gap: 14 },
  editSectionTitle: { fontSize: 18, fontWeight: "700" as const, color: Colors.brown },
  editFieldLabel: { fontSize: 13, fontWeight: "600" as const, color: Colors.brownMuted, marginBottom: 6 },
  editInput: { backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: Colors.brown, borderWidth: 1, borderColor: Colors.border },
  editActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  editCancelBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  editCancelText: { fontSize: 16, fontWeight: "600" as const, color: Colors.brownMuted },
  editSaveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.primary },
  editSaveText: { fontSize: 16, fontWeight: "700" as const, color: Colors.white },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  metaText: { fontSize: 14, color: Colors.brownMuted },
  winnerBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFFBEB", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, marginTop: 14, borderWidth: 1, borderColor: "#F5DEB3" },
  winnerBannerText: { fontSize: 16, fontWeight: "700" as const, color: Colors.brown },
  sectionTitle: { fontSize: 19, fontWeight: "700" as const, color: Colors.brown, marginBottom: 14 },
  playerCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  winnerCard: { borderColor: Colors.gold, borderWidth: 2 },
  playerHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  playerMedal: { fontSize: 20, width: 28, textAlign: "center" },
  playerAvatar: { fontSize: 26 },
  playerName: { flex: 1, fontSize: 17, fontWeight: "700" as const, color: Colors.brown },
  totalBadge: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, flexDirection: "row", alignItems: "baseline", gap: 3 },
  totalPoints: { fontSize: 18, fontWeight: "800" as const, color: Colors.white },
  totalLabel: { fontSize: 11, color: Colors.accentLight, fontWeight: "600" as const },
  sightingsList: { gap: 8 },
  sightingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  sightingEmoji: { fontSize: 20, width: 28, textAlign: "center" },
  sightingName: { flex: 1, fontSize: 15, color: Colors.brown },
  sightingCount: { fontSize: 15, color: Colors.brownMuted, fontWeight: "600" as const },
  sightingPoints: { fontSize: 15, color: Colors.primary, fontWeight: "700" as const, minWidth: 50, textAlign: "right" },
  noSightings: { fontSize: 14, color: Colors.textLight, fontStyle: "italic" as const },
  noEmojiBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.primaryLight, alignItems: "center" as const, justifyContent: "center" as const },
  noEmojiBadgeText: { fontSize: 14, fontWeight: "700" as const, color: Colors.white },
});
