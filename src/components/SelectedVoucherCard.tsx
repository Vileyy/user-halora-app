import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface SelectedVoucherCardProps {
  voucher: {
    id: string;
    code: string;
    title: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    type: "shipping" | "product";
  };
  onRemove: () => void;
}

export default function SelectedVoucherCard({
  voucher,
  onRemove,
}: SelectedVoucherCardProps) {
  const formatMoney = (amount: number): string => {
    return `${amount.toLocaleString()}₫`;
  };

  const getVoucherIcon = (type: string): any => {
    switch (type) {
      case "shipping":
        return "car-outline";
      case "product":
        return voucher.discountType === "percentage"
          ? "pricetag-outline"
          : "wallet-outline";
      default:
        return "gift-outline";
    }
  };

  const getDiscountText = (): string => {
    if (voucher.type === "shipping") {
      return `Giảm ${voucher.discountValue}% phí ship`;
    } else if (voucher.discountType === "percentage") {
      return `Giảm ${voucher.discountValue}%`;
    } else {
      return `Giảm ${formatMoney(voucher.discountValue)}`;
    }
  };

  const getVoucherColor = (type: string) => {
    return type === "shipping" ? "#4CAF50" : "#FF6B7D";
  };

  const getVoucherGradient = (type: string): [string, string] => {
    return type === "shipping"
      ? ["#E8F5E8", "#F0F8F0"]
      : ["#FFE2E6", "#FFF0F2"];
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getVoucherGradient(voucher.type)}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.leftSection}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: getVoucherColor(voucher.type) + "20" },
              ]}
            >
              <Ionicons
                name={getVoucherIcon(voucher.type)}
                size={16}
                color={getVoucherColor(voucher.type)}
              />
            </View>
            <View style={styles.voucherInfo}>
              <Text style={styles.voucherTitle} numberOfLines={1}>
                {voucher.title}
              </Text>
              <Text style={styles.voucherCode}>{voucher.code}</Text>
              <Text
                style={[
                  styles.discountText,
                  { color: getVoucherColor(voucher.type) },
                ]}
              >
                {getDiscountText()}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.removeButton}
            onPress={onRemove}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={16} color="#999" />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.typeBadge,
            { backgroundColor: getVoucherColor(voucher.type) + "20" },
          ]}
        >
          <Text
            style={[
              styles.typeBadgeText,
              { color: getVoucherColor(voucher.type) },
            ]}
          >
            {voucher.type === "shipping" ? "VẬN CHUYỂN" : "SẢN PHẨM"}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    marginBottom: 8,
  },
  gradient: {
    padding: 12,
    position: "relative",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  voucherInfo: {
    flex: 1,
  },
  voucherTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  voucherCode: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FF6B7D",
    backgroundColor: "#FFF0F2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  discountText: {
    fontSize: 12,
    fontWeight: "600",
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  typeBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
