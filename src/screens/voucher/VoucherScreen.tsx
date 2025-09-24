import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../types/navigation";
import VoucherCard from "../../components/VoucherCard";
import voucherService, { VoucherData } from "../../services/voucherService";

type VoucherScreenRouteProp = RouteProp<RootStackParamList, "VoucherScreen">;
type VoucherScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "VoucherScreen"
>;

export default function VoucherScreen() {
  const navigation = useNavigation<VoucherScreenNavigationProp>();
  const route = useRoute<VoucherScreenRouteProp>();
  const [allVouchers, setAllVouchers] = useState<VoucherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShippingVoucher, setSelectedShippingVoucher] = useState<
    string | null
  >(null);
  const [selectedProductVoucher, setSelectedProductVoucher] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const { currentTotal, onVoucherSelect } = route.params || {};

  useEffect(() => {
    const unsubscribe = voucherService.subscribeToVouchers(
      (vouchers) => {
        setAllVouchers(vouchers);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error("Error loading vouchers:", error);
        setError("Không thể tải danh sách voucher");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  // Get vouchers by type
  const getShippingVouchers = (): VoucherData[] => {
    return voucherService.filterVouchersByType(allVouchers, "shipping");
  };

  const getProductVouchers = (): VoucherData[] => {
    return voucherService.filterVouchersByType(allVouchers, "product");
  };

  const handleVoucherSelect = (voucher: VoucherData) => {
    const validation = voucherService.isVoucherValid(voucher, currentTotal);

    if (!validation.valid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Không thể sử dụng",
        validation.reason || "Voucher không hợp lệ"
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (voucher.type === "shipping") {
      // Toggle shipping voucher selection
      setSelectedShippingVoucher(
        selectedShippingVoucher === voucher.id ? null : voucher.id
      );
    } else {
      // Toggle product voucher selection
      setSelectedProductVoucher(
        selectedProductVoucher === voucher.id ? null : voucher.id
      );
    }
  };

  const handleApplyVoucher = () => {
    const result: { shippingVoucher?: string; productVoucher?: string } = {};

    if (selectedShippingVoucher) {
      const shippingVoucher = allVouchers.find(
        (v) => v.id === selectedShippingVoucher
      );
      if (shippingVoucher) result.shippingVoucher = shippingVoucher.code;
    }

    if (selectedProductVoucher) {
      const productVoucher = allVouchers.find(
        (v) => v.id === selectedProductVoucher
      );
      if (productVoucher) result.productVoucher = productVoucher.code;
    }

    if ((result.shippingVoucher || result.productVoucher) && onVoucherSelect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onVoucherSelect(result);
      navigation.goBack();
    }
  };

  const hasSelectedVouchers = () => {
    return selectedShippingVoucher || selectedProductVoucher;
  };

  const renderVoucherItem = ({ item: voucher }: { item: VoucherData }) => {
    const isSelected =
      voucher.type === "shipping"
        ? selectedShippingVoucher === voucher.id
        : selectedProductVoucher === voucher.id;

    return (
      <VoucherCard
        voucher={voucher}
        isSelected={isSelected}
        onSelect={() => handleVoucherSelect(voucher)}
        currentTotal={currentTotal}
      />
    );
  };

  const renderVoucherSection = (
    type: "shipping" | "product",
    title: string,
    icon: string,
    vouchers: VoucherData[]
  ) => {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name={icon as any} size={20} color="#FF6B7D" />
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{vouchers.length}</Text>
            </View>
          </View>
        </View>

        {vouchers.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>
              Không có voucher {type === "shipping" ? "vận chuyển" : "sản phẩm"}{" "}
              nào
            </Text>
          </View>
        ) : (
          <View style={styles.voucherList}>
            {vouchers.map((voucher) => (
              <View key={voucher.id} style={styles.voucherItemContainer}>
                {renderVoucherItem({ item: voucher })}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B7D" />
          <Text style={styles.loadingText}>Đang tải voucher...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
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
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF6B7D" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setError(null);
            }}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const shippingVouchers = getShippingVouchers();
  const productVouchers = getProductVouchers();

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

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={20} color="#FF6B7D" />
        <Text style={styles.infoBannerText}>
          Chọn tối đa 1 voucher cho mỗi loại để áp dụng vào đơn hàng
        </Text>
      </View>

      {/* Voucher Sections */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Shipping Vouchers Section */}
        {renderVoucherSection(
          "shipping",
          "Voucher Vận Chuyển",
          "car-outline",
          shippingVouchers
        )}

        {/* Product Vouchers Section */}
        {renderVoucherSection(
          "product",
          "Voucher Sản Phẩm",
          "gift-outline",
          productVouchers
        )}
      </ScrollView>

      {/* Apply Button */}
      {hasSelectedVouchers() && (
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
              <Text style={styles.applyButtonText}>
                Áp dụng voucher{hasSelectedVouchers() ? "s" : ""}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#FF6B7D",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  tabContainer: {
    backgroundColor: "#fff",
    flexDirection: "row",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    position: "relative",
  },
  tabButtonActive: {},
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  tabTextActive: {
    color: "#FF6B7D",
  },
  tabBadge: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  tabBadgeActive: {
    backgroundColor: "#FFE2E6",
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#666",
  },
  tabBadgeTextActive: {
    color: "#FF6B7D",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#FF6B7D",
    borderRadius: 1.5,
  },
  infoBanner: {
    backgroundColor: "#FFF8F9",
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B7D",
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 120,
  },
  sectionContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  sectionHeader: {
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: "#FFE2E6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF6B7D",
  },
  emptySection: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: "center",
  },
  emptySectionText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  voucherList: {
    padding: 16,
  },
  voucherItemContainer: {
    marginBottom: 12,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
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
