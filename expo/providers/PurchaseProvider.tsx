import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
} from "react-native-purchases";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const ENTITLEMENT_ID = "Wildlife Tracker Pro";

function getRCToken(): string {
  if (__DEV__ || Platform.OS === "web")
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY ?? "";
  return (
    Platform.select({
      ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
      android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
      default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY,
    }) ?? ""
  );
}

const rcKey = getRCToken();

if (!rcKey) {
  console.warn('Missing RevenueCat API key — purchases will not work. Check EXPO_PUBLIC_REVENUECAT_TEST_API_KEY / EXPO_PUBLIC_REVENUECAT_IOS_API_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY in your .env file.');
}

if (__DEV__) {
  console.log("[RevenueCat] Initializing SDK");
  console.log("[RevenueCat] Platform:", Platform.OS);
  console.log("[RevenueCat] Using key:", rcKey ? `${rcKey.substring(0, 8)}...` : "(empty)");
  console.log("[RevenueCat] Key source:", __DEV__ || Platform.OS === "web" ? "TEST" : Platform.OS === "ios" ? "iOS" : Platform.OS === "android" ? "Android" : "DEFAULT/TEST");
}

Purchases.setLogLevel(LOG_LEVEL.DEBUG);
Purchases.configure({ apiKey: rcKey });

function checkPremium(info: CustomerInfo): boolean {
  return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

export const [PurchaseProvider, usePurchases] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [isPremium, setIsPremium] = useState<boolean>(false);

  const customerInfoQuery = useQuery({
    queryKey: ["customerInfo"],
    queryFn: async () => {
      try {
        const info = await Purchases.getCustomerInfo();
        if (__DEV__) {
          console.log("[RevenueCat] Customer info received");
          console.log("[RevenueCat] Active entitlements:", Object.keys(info.entitlements.active));
          console.log("[RevenueCat] Entitlement 'Wildlife Tracker Pro' active:", info.entitlements.active[ENTITLEMENT_ID] !== undefined);
          console.log("[RevenueCat] Active subscriptions:", info.activeSubscriptions);
          console.log("[RevenueCat] All purchased product IDs:", info.allPurchasedProductIdentifiers);
        }
        return info;
      } catch (e) {
        console.log("[PurchaseProvider] Failed to get customer info:", e);
        return null;
      }
    },
  });

  const offeringsQuery = useQuery({
    queryKey: ["offerings"],
    queryFn: async () => {
      try {
        const offerings = await Purchases.getOfferings();
        return offerings.current;
      } catch (e) {
        console.log("[PurchaseProvider] Failed to get offerings:", e);
        return null;
      }
    },
  });

  useEffect(() => {
    if (customerInfoQuery.data) {
      setIsPremium(checkPremium(customerInfoQuery.data));
    }
  }, [customerInfoQuery.data]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        queryClient.invalidateQueries({ queryKey: ["customerInfo"] });
      }
    });
    return () => sub.remove();
  }, [queryClient]);

  const purchaseMutation = useMutation({
    mutationFn: async (pkg: PurchasesPackage) => {
      const result = await Purchases.purchasePackage(pkg);
      return result;
    },
    onSuccess: (data) => {
      if (checkPremium(data.customerInfo)) {
        setIsPremium(true);
      }
      queryClient.invalidateQueries({ queryKey: ["customerInfo"] });
    },
    onError: (error: any) => {
      if (error?.userCancelled) {
        console.log("[PurchaseProvider] User cancelled purchase");
      } else {
        console.log("[PurchaseProvider] Purchase error:", error);
      }
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      const info = await Purchases.restorePurchases();
      return info;
    },
    onSuccess: (info) => {
      setIsPremium(checkPremium(info));
      queryClient.invalidateQueries({ queryKey: ["customerInfo"] });
    },
  });

  const purchasePackage = useCallback(
    (pkg: PurchasesPackage) => {
      purchaseMutation.mutate(pkg);
    },
    [purchaseMutation]
  );

  const restorePurchases = useCallback(() => {
    restoreMutation.mutate();
  }, [restoreMutation]);

  const annualPackage = offeringsQuery.data?.annual ?? null;
  const lifetimePackage = offeringsQuery.data?.lifetime ?? null;

  return {
    isPremium,
    isLoading: customerInfoQuery.isLoading,
    offering: offeringsQuery.data ?? null,
    annualPackage,
    lifetimePackage,
    purchasePackage,
    restorePurchases,
    isPurchasing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
    restoreError: restoreMutation.error,
    restoreSuccess: restoreMutation.isSuccess,
  };
});
