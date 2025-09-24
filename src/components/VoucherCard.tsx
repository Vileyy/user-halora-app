import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

interface VoucherCardProps {
  voucher: {
    id: string;
    code: string;
    title: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    minOrder: number;
    startDate: number;
    endDate: number;
    status: "active" | "inactive";
    type: "shipping" | "product";
    usageCount: number;
    usageLimit: number;
  };
  isSelected?: boolean;
  onSelect?: () => void;
  currentTotal?: number;
}

export default function VoucherCard({
  voucher,
  isSelected = false,
  onSelect,
  currentTotal = 0,
}: VoucherCardProps) {
  const formatMoney = (amount: number): string => {
    return `${amount.toLocaleString()}₫`;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  };

  const getVoucherIcon = (type: string): any => {
    switch (type) {
      case "shipping":
        return "car-outline";
      case "product":
        return voucher.discountType === "percentage"
          ? "percent-outline"
          : "cash-outline";
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

  const isExpired = (): boolean => {
    return new Date().getTime() > voucher.endDate;
  };

  const isUsedUp = (): boolean => {
    return voucher.usageCount >= voucher.usageLimit;
  };

  const canUseVoucher = (): boolean => {
    if (voucher.status !== "active") return false;
    if (isExpired()) return false;
    if (isUsedUp()) return false;
    if (currentTotal && currentTotal < voucher.minOrder) return false;
    return true;
  };

  const getStatusBadge = () => {
    if (isExpired()) {
      return { text: "Hết hạn", color: "#FF6B7D" };
    }
    if (isUsedUp()) {
      return { text: "Đã hết lượt", color: "#FFA726" };
    }
    if (currentTotal && currentTotal < voucher.minOrder) {
      return { text: "Chưa đủ điều kiện", color: "#9E9E9E" };
    }
    return null;
  };

  const canUse = canUseVoucher();
  const statusBadge = getStatusBadge();
  const usagePercentage = (voucher.usageCount / voucher.usageLimit) * 100;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.containerSelected,
        !canUse && styles.containerDisabled,
      ]}
      onPress={canUse ? onSelect : undefined}
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
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={getVoucherIcon(voucher.type)}
              size={24}
              color={
                !canUse
                  ? "#ccc"
                  : voucher.type === "shipping"
                  ? "#4CAF50"
                  : "#FF6B7D"
              }
            />
          </View>
          <View style={styles.info}>
            <Text style={[styles.title, !canUse && styles.textDisabled]}>
              {voucher.title}
            </Text>
            <Text style={[styles.code, !canUse && styles.textDisabled]}>
              {voucher.code}
            </Text>
          </View>
          <View style={styles.discountContainer}>
            <Text style={[styles.discountText, !canUse && styles.textDisabled]}>
              {getDiscountText()}
            </Text>
          </View>
        </View>

        {/* Validity Period */}
        <View style={styles.validityContainer}>
          <Ionicons
            name="time-outline"
            size={14}
            color={!canUse ? "#ccc" : "#666"}
          />
          <Text style={[styles.validityText, !canUse && styles.textDisabled]}>
            {formatDate(voucher.startDate)} - {formatDate(voucher.endDate)}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.condition, !canUse && styles.textDisabled]}>
            Đơn tối thiểu: {formatMoney(voucher.minOrder)}
          </Text>

          <View style={styles.usageContainer}>
            <View style={styles.usageBar}>
              <View
                style={[
                  styles.usageProgress,
                  { width: `${usagePercentage}%` },
                  {
                    backgroundColor:
                      voucher.type === "shipping" ? "#4CAF50" : "#FF6B7D",
                  },
                ]}
              />
            </View>
            <Text style={[styles.usageText, !canUse && styles.textDisabled]}>
              Còn {voucher.usageLimit - voucher.usageCount}
            </Text>
          </View>
        </View>

        {/* Status Badge */}
        {statusBadge && (
          <View
            style={[styles.statusBadge, { backgroundColor: statusBadge.color }]}
          >
            <Text style={styles.statusBadgeText}>{statusBadge.text}</Text>
          </View>
        )}

        {/* Type Badge */}
        <View
          style={[
            styles.typeBadge,
            {
              backgroundColor:
                voucher.type === "shipping" ? "#E8F5E8" : "#FFE2E6",
            },
          ]}
        >
          <Text
            style={[
              styles.typeBadgeText,
              { color: voucher.type === "shipping" ? "#4CAF50" : "#FF6B7D" },
            ]}
          >
            {voucher.type === "shipping" ? "SHIPPING" : "PRODUCT"}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  containerSelected: {
    elevation: 6,
    shadowOpacity: 0.2,
    borderWidth: 2,
    borderColor: "#FF6B7D",
  },
  containerDisabled: {
    opacity: 0.6,
  },
  gradient: {
    padding: 20,
    position: "relative",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF0F2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  code: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FF6B7D",
    backgroundColor: "#FFF0F2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#FFE2E6",
    letterSpacing: 0.5,
  },
  discountContainer: {
    alignItems: "flex-end",
  },
  discountText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FF6B7D",
  },
  validityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },
  validityText: {
    fontSize: 12,
    color: "#666",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  condition: {
    fontSize: 12,
    color: "#888",
  },
  usageContainer: {
    alignItems: "flex-end",
    gap: 4,
  },
  usageBar: {
    width: 80,
    height: 4,
    backgroundColor: "#f0f0f0",
    borderRadius: 2,
    overflow: "hidden",
  },
  usageProgress: {
    height: "100%",
    borderRadius: 2,
  },
  usageText: {
    fontSize: 10,
    color: "#888",
  },
  textDisabled: {
    color: "#ccc",
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  typeBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
