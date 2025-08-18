import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../types/navigation";

type VoucherScreenRouteProp = RouteProp<RootStackParamList, "VoucherScreen">;
type VoucherScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "VoucherScreen"
>;

interface Voucher {
  id: string;
  code: string;
  title: string;
  description: string;
  discount: number;
  discountType: "percentage" | "fixed" | "shipping";
  minOrder: number;
  maxDiscount?: number;
  expiryDate: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount?: number;
}

const MOCK_VOUCHERS: Voucher[] = [
  {
    id: "1",
    code: "FREESHIP",
    title: "Miễn phí vận chuyển",
    description: "Miễn phí vận chuyển cho đơn hàng từ 0₫",
    discount: 0,
    discountType: "shipping",
    minOrder: 0,
    expiryDate: "2024-12-31",
    isActive: true,
    usageLimit: 100,
    usedCount: 45,
  },
  {
    id: "2",
    code: "HALORA10",
    title: "Giảm 10%",
    description: "Giảm 10% cho đơn hàng từ 200.000₫",
    discount: 10,
    discountType: "percentage",
    minOrder: 200000,
    maxDiscount: 100000,
    expiryDate: "2024-12-31",
    isActive: true,
    usageLimit: 500,
    usedCount: 234,
  },
  {
    id: "3",
    code: "HALORA30K",
    title: "Giảm 30.000₫",
    description: "Giảm 30.000₫ cho đơn hàng từ 150.000₫",
    discount: 30000,
    discountType: "fixed",
    minOrder: 150000,
    expiryDate: "2024-12-31",
    isActive: true,
    usageLimit: 200,
    usedCount: 89,
  },
  {
    id: "4",
    code: "NEWUSER20",
    title: "Khách hàng mới - 20%",
    description: "Giảm 20% cho khách hàng mới (tối đa 50.000₫)",
    discount: 20,
    discountType: "percentage",
    minOrder: 100000,
    maxDiscount: 50000,
    expiryDate: "2024-12-31",
    isActive: true,
    usageLimit: 1000,
    usedCount: 678,
  },
  {
    id: "5",
    code: "SAVE50K",
    title: "Tiết kiệm 50.000₫",
    description: "Giảm 50.000₫ cho đơn hàng từ 500.000₫",
    discount: 50000,
    discountType: "fixed",
    minOrder: 500000,
    expiryDate: "2024-12-31",
    isActive: true,
    usageLimit: 50,
    usedCount: 23,
  },
  {
    id: "6",
    code: "WEEKEND15",
    title: "Cuối tuần vui vẻ",
    description: "Giảm 15% cho đơn hàng cuối tuần",
    discount: 15,
    discountType: "percentage",
    minOrder: 300000,
    maxDiscount: 75000,
    expiryDate: "2024-12-31",
    isActive: false, // Expired or inactive
    usageLimit: 300,
    usedCount: 156,
  },
];

export default function VoucherScreen() {
  const navigation = useNavigation<VoucherScreenNavigationProp>();
  const route = useRoute<VoucherScreenRouteProp>();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null);

  const { currentTotal, onVoucherSelect } = route.params || {};

  useEffect(() => {
    // Simulate loading vouchers
    setTimeout(() => {
      setVouchers(MOCK_VOUCHERS);
      setLoading(false);
    }, 1000);
  }, []);

  const formatMoney = (amount: number): string => {
    return `${amount.toLocaleString()}₫`;
  };

  const getVoucherIcon = (discountType: string): any => {
    switch (discountType) {
      case "shipping":
        return "car-outline";
      case "percentage":
        return "percent-outline";
      case "fixed":
        return "cash-outline";
      default:
        return "gift-outline";
    }
  };

  const getDiscountText = (voucher: Voucher): string => {
    if (voucher.discountType === "shipping") {
      return "Miễn phí ship";
    } else if (voucher.discountType === "percentage") {
      return `Giảm ${voucher.discount}%`;
    } else {
      return `Giảm ${formatMoney(voucher.discount)}`;
    }
  };

  const canUseVoucher = (voucher: Voucher): boolean => {
    if (!voucher.isActive) return false;
    if (currentTotal && currentTotal < voucher.minOrder) return false;
    if (
      voucher.usageLimit &&
      voucher.usedCount &&
      voucher.usedCount >= voucher.usageLimit
    )
      return false;
    return true;
  };

  const handleVoucherSelect = (voucher: Voucher) => {
    if (!canUseVoucher(voucher)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Không thể sử dụng",
        `Voucher này yêu cầu đơn hàng tối thiểu ${formatMoney(
          voucher.minOrder
        )}`
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedVoucher(voucher.id);
  };

  const handleApplyVoucher = () => {
    const voucher = vouchers.find((v) => v.id === selectedVoucher);
    if (voucher && onVoucherSelect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onVoucherSelect(voucher.code);
      navigation.goBack();
    }
  };

  const renderVoucherItem = (voucher: Voucher) => {
    const isSelected = selectedVoucher === voucher.id;
    const canUse = canUseVoucher(voucher);
    const usagePercentage =
      voucher.usageLimit && voucher.usedCount
        ? (voucher.usedCount / voucher.usageLimit) * 100
        : 0;

    return (
      <TouchableOpacity
        key={voucher.id}
        style={[
          styles.voucherCard,
          isSelected && styles.voucherCardSelected,
          !canUse && styles.voucherCardDisabled,
        ]}
        onPress={() => handleVoucherSelect(voucher)}
        disabled={!canUse}
      >
        <LinearGradient
          colors={
            !canUse
              ? ["#f5f5f5", "#e0e0e0"]
              : isSelected
              ? ["#FFE2E6", "#FFF0F2"]
              : ["#ffffff", "#fafafa"]
          }
          style={styles.voucherGradient}
        >
          <View style={styles.voucherHeader}>
            <View style={styles.voucherIconContainer}>
              <Ionicons
                name={getVoucherIcon(voucher.discountType)}
                size={24}
                color={!canUse ? "#ccc" : "#FF6B7D"}
              />
            </View>
            <View style={styles.voucherInfo}>
              <Text
                style={[
                  styles.voucherTitle,
                  !canUse && styles.voucherTextDisabled,
                ]}
              >
                {voucher.title}
              </Text>
              <Text
                style={[
                  styles.voucherCode,
                  !canUse && styles.voucherTextDisabled,
                ]}
              >
                {voucher.code}
              </Text>
            </View>
            <View style={styles.voucherDiscount}>
              <Text
                style={[
                  styles.discountText,
                  !canUse && styles.voucherTextDisabled,
                ]}
              >
                {getDiscountText(voucher)}
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.voucherDescription,
              !canUse && styles.voucherTextDisabled,
            ]}
          >
            {voucher.description}
          </Text>

          <View style={styles.voucherFooter}>
            <Text
              style={[
                styles.voucherCondition,
                !canUse && styles.voucherTextDisabled,
              ]}
            >
              Đơn tối thiểu: {formatMoney(voucher.minOrder)}
            </Text>
            {voucher.usageLimit && (
              <View style={styles.usageContainer}>
                <View style={styles.usageBar}>
                  <View
                    style={[
                      styles.usageProgress,
                      { width: `${usagePercentage}%` },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.usageText,
                    !canUse && styles.voucherTextDisabled,
                  ]}
                >
                  Còn {voucher.usageLimit - (voucher.usedCount || 0)}
                </Text>
              </View>
            )}
          </View>

          {!canUse && (
            <View style={styles.disabledOverlay}>
              <Text style={styles.disabledText}>
                {currentTotal && currentTotal < voucher.minOrder
                  ? "Chưa đủ điều kiện"
                  : "Đã hết lượt sử dụng"}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn Voucher</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B7D" />
          <Text style={styles.loadingText}>Đang tải voucher...</Text>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Info Banner */}
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle" size={20} color="#FF6B7D" />
              <Text style={styles.infoBannerText}>
                Chọn voucher phù hợp để tiết kiệm chi phí đơn hàng của bạn
              </Text>
            </View>

            {/* Available Vouchers */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Voucher có sẵn ({vouchers.filter((v) => v.isActive).length})
              </Text>
              {vouchers.map(renderVoucherItem)}
            </View>

            <View style={{ height: 120 }} />
          </ScrollView>

          {/* Apply Button */}
          {selectedVoucher && (
            <View style={styles.bottomSection}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApplyVoucher}
              >
                <LinearGradient
                  colors={["#FF6B7D", "#FF8A9B"]}
                  style={styles.applyGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.applyButtonText}>Áp dụng voucher</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  infoBanner: {
    backgroundColor: "#FFF8F9",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B7D",
    elevation: 1,
    shadowColor: "#FF6B7D",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  voucherCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  voucherCardSelected: {
    elevation: 6,
    shadowOpacity: 0.2,
    borderWidth: 2,
    borderColor: "#FF6B7D",
  },
  voucherCardDisabled: {
    opacity: 0.6,
  },
  voucherGradient: {
    padding: 20,
    position: "relative",
  },
  voucherHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  voucherIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFF0F2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    elevation: 1,
    shadowColor: "#FF6B7D",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  voucherInfo: {
    flex: 1,
  },
  voucherTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  voucherCode: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FF6B7D",
    backgroundColor: "#FFF0F2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#FFE2E6",
    letterSpacing: 0.5,
  },
  voucherDiscount: {
    alignItems: "flex-end",
  },
  discountText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FF6B7D",
    letterSpacing: 0.3,
  },
  voucherDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    lineHeight: 21,
    opacity: 0.9,
  },
  voucherFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  voucherCondition: {
    fontSize: 12,
    color: "#888",
  },
  usageContainer: {
    alignItems: "flex-end",
    gap: 6,
  },
  usageBar: {
    width: 90,
    height: 6,
    backgroundColor: "#f0f0f0",
    borderRadius: 3,
    overflow: "hidden",
  },
  usageProgress: {
    height: "100%",
    backgroundColor: "#FF6B7D",
    borderRadius: 3,
  },
  usageText: {
    fontSize: 10,
    color: "#888",
  },
  voucherTextDisabled: {
    color: "#ccc",
  },
  disabledOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
  },
  bottomSection: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  applyButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#FF6B7D",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  applyGradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
