import { useRouter } from "expo-router";
import { Crown, Shield, Star, X, Zap } from "lucide-react-native";
import React, { useCallback, useRef, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Colors from "@/constants/colors";
import { usePurchases } from "@/providers/PurchaseProvider";

type PlanType = "annual" | "lifetime";

export default function PaywallScreen() {
  const router = useRouter();
  const {
    annualPackage,
    lifetimePackage,
    purchasePackage,
    restorePurchases,
    isPurchasing,
    isRestoring,
  } = usePurchases();

  const [selectedPlan, setSelectedPlan] = React.useState<PlanType>("lifetime");

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const handlePurchase = useCallback(() => {
    const pkg = selectedPlan === "annual" ? annualPackage : lifetimePackage;
    if (!pkg) {
      Alert.alert("Unavailable", "This package is not available right now.");
      return;
    }
    purchasePackage(pkg);
  }, [selectedPlan, annualPackage, lifetimePackage, purchasePackage]);

  const handleRestore = useCallback(() => {
    restorePurchases();
  }, [restorePurchases]);

  const annualPrice = annualPackage?.product?.priceString ?? "$2.99";
  const lifetimePrice = lifetimePackage?.product?.priceString ?? "$9.99";

  const features = [
    { icon: Zap, label: "Unlimited trips & players" },
    { icon: Star, label: "Custom animals & point values" },
    { icon: Shield, label: "Full lifetime stats & history" },
    { icon: Crown, label: "Support future development" },
  ];

  return (
    <View style={styles.container}>
      <Pressable style={styles.closeBtn} onPress={() => router.back()}>
        <X size={22} color={Colors.brownMuted} />
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={styles.iconRing}>
            <Text style={styles.heroEmoji}>🦌</Text>
          </View>
          <Text style={styles.heroTitle}>Wildlife Tracker Pro</Text>
          <Text style={styles.heroSubtitle}>
            Unlock the full experience for your family adventures
          </Text>
        </View>

        <View style={styles.featuresCard}>
          {features.map((feat, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIconWrap}>
                <feat.icon size={18} color={Colors.primary} />
              </View>
              <Text style={styles.featureText}>{feat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.plansSection}>
          <Pressable
            style={[
              styles.planCard,
              selectedPlan === "annual" && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan("annual")}
          >
            <View style={styles.planRadio}>
              <View
                style={[
                  styles.radioOuter,
                  selectedPlan === "annual" && styles.radioOuterSelected,
                ]}
              >
                {selectedPlan === "annual" && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </View>
            <View style={styles.planInfo}>
              <Text style={styles.planName}>Annual</Text>
              <Text style={styles.planPrice}>
                {annualPrice}
                <Text style={styles.planPeriod}>/year</Text>
              </Text>
              <Text style={styles.planDetail}>Auto-renews yearly</Text>
            </View>
          </Pressable>

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Pressable
              style={[
                styles.planCard,
                styles.planCardLifetime,
                selectedPlan === "lifetime" && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan("lifetime")}
            >
              <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueText}>Best Value</Text>
              </View>
              <View style={styles.planRadio}>
                <View
                  style={[
                    styles.radioOuter,
                    selectedPlan === "lifetime" && styles.radioOuterSelected,
                  ]}
                >
                  {selectedPlan === "lifetime" && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>Lifetime</Text>
                <Text style={styles.planPrice}>
                  {lifetimePrice}
                  <Text style={styles.planPeriod}> one-time</Text>
                </Text>
                <Text style={styles.planDetail}>Pay once, yours forever</Text>
              </View>
            </Pressable>
          </Animated.View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.purchaseBtn,
            pressed && styles.purchaseBtnPressed,
            isPurchasing && styles.purchaseBtnDisabled,
          ]}
          onPress={handlePurchase}
          disabled={isPurchasing || isRestoring}
        >
          {isPurchasing ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.purchaseBtnText}>
              {selectedPlan === "annual"
                ? `Subscribe for ${annualPrice}/year`
                : `Get Lifetime for ${lifetimePrice}`}
            </Text>
          )}
        </Pressable>

        <Pressable
          style={styles.restoreBtn}
          onPress={handleRestore}
          disabled={isPurchasing || isRestoring}
        >
          {isRestoring ? (
            <ActivityIndicator color={Colors.primaryLight} size="small" />
          ) : (
            <Text style={styles.restoreText}>Restore Purchases</Text>
          )}
        </Pressable>

        <Text style={styles.legalText}>
          Payment will be charged to your account. Subscriptions auto-renew
          unless cancelled at least 24 hours before the end of the current
          period. Manage subscriptions in your device settings.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  closeBtn: {
    position: "absolute" as const,
    top: 16,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#EDF5F0",
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  heroEmoji: {
    fontSize: 42,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800" as const,
    color: Colors.brown,
    marginBottom: 8,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 15,
    color: Colors.brownMuted,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 260,
  },
  featuresCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EDF5F0",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.brown,
    flex: 1,
  },
  plansSection: {
    gap: 12,
    marginBottom: 24,
  },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 14,
  },
  planCardLifetime: {
    overflow: "hidden" as const,
  },
  planCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#F4FAF6",
  },
  bestValueBadge: {
    position: "absolute" as const,
    top: 0,
    right: 0,
    backgroundColor: Colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  bestValueText: {
    fontSize: 11,
    fontWeight: "800" as const,
    color: Colors.white,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },
  planRadio: {
    width: 28,
    alignItems: "center",
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.brown,
    marginBottom: 2,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  planPeriod: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.brownMuted,
  },
  planDetail: {
    fontSize: 12,
    color: Colors.brownMuted,
    marginTop: 2,
  },
  purchaseBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  purchaseBtnPressed: {
    backgroundColor: Colors.primaryDark,
    transform: [{ scale: 0.98 }],
  },
  purchaseBtnDisabled: {
    opacity: 0.7,
  },
  purchaseBtnText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: "700" as const,
  },
  restoreBtn: {
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 16,
  },
  restoreText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primaryLight,
  },
  legalText: {
    fontSize: 11,
    color: Colors.textLight,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 12,
  },
});
