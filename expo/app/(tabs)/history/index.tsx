import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { MapPin, Trash2, Trophy } from "lucide-react-native";
import React, { useCallback, useMemo, useRef } from "react";
import { Alert, Animated, FlatList, PanResponder, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import { Trip } from "@/types";
import PlayerAvatar from "@/components/PlayerAvatar";

const SWIPE_THRESHOLD = -80;
const DELETE_BTN_WIDTH = 80;

function SwipeableTripCard({ trip, onDelete, children }: { trip: Trip; onDelete: (trip: Trip) => void; children: React.ReactNode }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        const newX = isOpen.current
          ? Math.min(0, Math.max(-DELETE_BTN_WIDTH * 1.5, -DELETE_BTN_WIDTH + gestureState.dx))
          : Math.min(0, Math.max(-DELETE_BTN_WIDTH * 1.5, gestureState.dx));
        translateX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        const finalX = isOpen.current ? -DELETE_BTN_WIDTH + gestureState.dx : gestureState.dx;
        if (finalX < SWIPE_THRESHOLD) {
          Animated.spring(translateX, { toValue: -DELETE_BTN_WIDTH, useNativeDriver: true, friction: 8 }).start();
          isOpen.current = true;
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
          isOpen.current = false;
        }
      },
    })
  ).current;

  const closeSwipe = useCallback(() => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
    isOpen.current = false;
  }, [translateX]);

  const handleLongPress = useCallback(() => {
    if (Platform.OS !== "web") { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
    onDelete(trip);
  }, [trip, onDelete]);

  const handleDeletePress = useCallback(() => {
    closeSwipe();
    onDelete(trip);
  }, [trip, onDelete, closeSwipe]);

  return (
    <View style={swipeStyles.wrapper}>
      <View style={swipeStyles.deleteBackground}>
        <Pressable onPress={handleDeletePress} style={swipeStyles.deleteBtn} accessibilityRole="button" accessibilityLabel={`Delete trip ${trip.name}`}>
          <Trash2 size={20} color={Colors.white} />
          <Text style={swipeStyles.deleteBtnText}>Delete</Text>
        </Pressable>
      </View>
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <Pressable
          onPress={() => {
            if (isOpen.current) {
              closeSwipe();
            } else {
              router.push({ pathname: "/trip-detail", params: { id: trip.id } });
            }
          }}
          onLongPress={handleLongPress}
          delayLongPress={500}
          style={({ pressed }) => [styles.tripCard, pressed && !isOpen.current && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Trip: ${trip.name}`}
          accessibilityHint="Tap to view details, long press to delete"
        >
          {children}
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function HistoryScreen() {
  const { completedTrips, getPlayer, deleteTrip } = useGame();

  const handleDeleteTrip = useCallback((trip: Trip) => {
    const playerNames = trip.players
      .map((tp) => {
        const p = getPlayer(tp.playerId);
        return p?.name ?? "Unknown";
      })
      .join(", ");

    Alert.alert(
      `Delete ${trip.name}?`,
      `This will permanently remove all scores, sightings, and the recorded winner. This will also affect lifetime stats for all players who were on this trip.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web") { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); }
            deleteTrip(trip.id);
            if (__DEV__) console.log('[History] Deleted completed trip:', trip.id, trip.name);
          },
        },
      ]
    );
  }, [getPlayer, deleteTrip]);

  if (completedTrips.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🗺️</Text>
        <Text style={styles.emptyTitle}>No Trips Yet</Text>
        <Text style={styles.emptySubtitle}>
          Complete your first trip and it will show up here.
        </Text>
      </View>
    );
  }

  const sortedTrips = useMemo(() => {
    return completedTrips.map((trip) => {
      const sortedPlayers = [...trip.players].sort(
        (a, b) => b.totalPoints - a.totalPoints
      );
      const totalPoints = trip.players.reduce(
        (sum, p) => sum + p.totalPoints,
        0
      );
      return { trip, sortedPlayers, totalPoints };
    });
  }, [completedTrips]);

  const renderTripCard = useCallback(({ item }: { item: typeof sortedTrips[number] }) => {
    const { trip, sortedPlayers, totalPoints } = item;
    const winner = trip.winnerId ? getPlayer(trip.winnerId) : null;
    return (
      <SwipeableTripCard trip={trip} onDelete={handleDeleteTrip}>
        <View style={styles.cardHeader}>
          <View style={styles.tripInfo}>
            <MapPin size={18} color={Colors.primary} />
            <Text style={styles.tripName}>{trip.name}</Text>
          </View>
          <Text style={styles.totalPoints}>{totalPoints} pts</Text>
        </View>
        <Text style={styles.tripDate}>
          {new Date(trip.startDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </Text>
        {winner && (
          <View style={styles.winnerRow} accessibilityLabel={`Winner: ${winner.name}`}>
            <Trophy size={14} color={Colors.gold} />
            <Text style={styles.winnerName}>
              {winner.name}
            </Text>
          </View>
        )}
        <View style={styles.playersRow}>
          {sortedPlayers.map((tp) => {
            const player = getPlayer(tp.playerId);
            return (
              <View key={tp.playerId} style={styles.playerChip} accessibilityLabel={`${player?.name ?? "Unknown"}, ${tp.totalPoints} points`}>
                <PlayerAvatar avatar={player?.avatar ?? "?"} size={20} fontSize={14} />
                <Text style={styles.chipPoints}>{tp.totalPoints}</Text>
              </View>
            );
          })}
        </View>
      </SwipeableTripCard>
    );
  }, [getPlayer, handleDeleteTrip]);

  const keyExtractor = useCallback((item: typeof sortedTrips[number]) => item.trip.id, []);

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={sortedTrips}
      renderItem={renderTripCard}
      keyExtractor={keyExtractor}
      ListHeaderComponent={<Text style={styles.swipeHint}>Swipe left or long press to delete</Text>}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
}

const swipeStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
    overflow: "hidden",
    borderRadius: 16,
  },
  deleteBackground: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: DELETE_BTN_WIDTH,
    backgroundColor: Colors.danger,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: DELETE_BTN_WIDTH,
    gap: 4,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.white,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: 20, paddingBottom: 40 },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.cream,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.brown,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.brownMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  swipeHint: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: "center",
    marginBottom: 14,
  },
  tripCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  tripInfo: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  tripName: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.brown,
    flex: 1,
  },
  totalPoints: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  tripDate: {
    fontSize: 13,
    color: Colors.brownMuted,
    marginLeft: 26,
    marginBottom: 10,
  },
  winnerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 26,
    marginBottom: 10,
  },
  winnerName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.brown,
  },
  playersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginLeft: 26,
  },
  playerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.cream,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  chipAvatar: { fontSize: 16 },
  chipPoints: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
});
