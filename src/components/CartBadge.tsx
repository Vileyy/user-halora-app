import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../redux/reducers/rootReducer";

interface CartBadgeProps {
  size?: "small" | "medium" | "large";
  color?: string;
  backgroundColor?: string;
  showZero?: boolean;
}

const CartBadge: React.FC<CartBadgeProps> = ({
  size = "medium",
  color = "#fff",
  backgroundColor = "#FF6B7D",
  showZero = false,
}) => {
  const cartItems = useSelector((state: RootState) =>
    state.cart.items.reduce((total, item) => total + item.quantity, 0)
  );

  // Không hiển thị badge nếu số lượng = 0 và showZero = false
  if (cartItems === 0 && !showZero) {
    return null;
  }

  const getBadgeStyle = () => {
    const baseStyle = [styles.badge, styles[size]];

    return [
      ...baseStyle,
      {
        backgroundColor,
        minWidth: size === "small" ? 16 : size === "large" ? 24 : 20,
        height: size === "small" ? 16 : size === "large" ? 24 : 20,
      },
    ];
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`${size}Text`]];

    return [...baseStyle, { color }];
  };

  return (
    <View style={getBadgeStyle()}>
      <Text style={getTextStyle()}>
        {cartItems > 99 ? "99+" : cartItems.toString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  small: {
    borderRadius: 8,
  },
  medium: {
    borderRadius: 10,
  },
  large: {
    borderRadius: 12,
  },
  text: {
    fontWeight: "bold",
    textAlign: "center",
  },
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 14,
  },
});

export default CartBadge;
