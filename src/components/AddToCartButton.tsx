import React, { useState } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { useCartSync } from "../hooks/useCartSync";
import { CartItem } from "../redux/slices/cartSlice";
import * as Haptics from "expo-haptics";
import { useAuth } from "../hooks/useAuth";
import AuthRequiredModal from "./AuthRequiredModal";

interface AddToCartButtonProps {
  product: Omit<CartItem, "quantity">;
  size?: "small" | "medium" | "large";
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  product,
  size = "medium",
  variant = "primary",
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { addItemToCart } = useCartSync();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = async () => {
    if (disabled || isLoading) return;

    // Kiểm tra đăng nhập
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setIsLoading(true);

    try {
      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Thêm sản phẩm vào giỏ hàng
      addItemToCart(product);

      // Hiển thị thông báo thành công
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Sản phẩm đã được thêm vào giỏ hàng!",
        position: "top",
        visibilityTime: 3000,
        topOffset: 60,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.",
        position: "top",
        visibilityTime: 3000,
        topOffset: 60,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonStyle = () => {
    return [
      styles.button,
      styles[size],
      variant === "primary" && styles.primary,
      variant === "secondary" && styles.secondary,
      variant === "outline" && styles.outline,
      disabled && styles.disabled,
    ].filter(Boolean);
  };

  const getTextStyle = () => {
    return [
      styles.text,
      styles[`${size}Text`],
      variant === "primary" && styles.primaryText,
      variant === "secondary" && styles.secondaryText,
      variant === "outline" && styles.outlineText,
      disabled && styles.disabledText,
    ].filter(Boolean);
  };

  return (
    <>
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={handleAddToCart}
        disabled={disabled || isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator
            size={size === "small" ? 16 : size === "large" ? 24 : 20}
            color={variant === "outline" ? "#FF6B7D" : "#fff"}
          />
        ) : (
          <>
            <Ionicons
              name="cart-outline"
              size={size === "small" ? 16 : size === "large" ? 24 : 20}
              color={variant === "outline" ? "#FF6B7D" : "#fff"}
              style={styles.icon}
            />
            <Text style={getTextStyle()}>Thêm vào giỏ</Text>
          </>
        )}
      </TouchableOpacity>

      <AuthRequiredModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Đăng nhập cần thiết"
        message="Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng"
      />
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  small: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primary: {
    backgroundColor: "#FF6B7D",
  },
  secondary: {
    backgroundColor: "#F8F9FA",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#FF6B7D",
  },
  disabled: {
    backgroundColor: "#E0E0E0",
    borderColor: "#E0E0E0",
  },
  text: {
    fontWeight: "600",
    marginLeft: 4,
  },
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 16,
  },
  primaryText: {
    color: "#fff",
  },
  secondaryText: {
    color: "#1a1a1a",
  },
  outlineText: {
    color: "#FF6B7D",
  },
  disabledText: {
    color: "#999",
  },
  icon: {
    marginRight: 4,
  },
});

export default AddToCartButton;
