import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface Variant {
  price: number;
  size: string;
  stockQty: number;
}

export interface Product {
  id: string;
  name: string;
  image: string;
  variants?: Variant[];
  price?: string; // For backwards compatibility
}

interface VariantSelectorProps {
  visible: boolean;
  onClose: () => void;
  product: Product;
  onVariantSelect: (variant: Variant, quantity: number) => void;
  initialVariant?: Variant;
  actionType: "addToCart" | "buyNow";
}

const VariantSelector: React.FC<VariantSelectorProps> = ({
  visible,
  onClose,
  product,
  onVariantSelect,
  initialVariant,
  actionType,
}) => {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    initialVariant ||
      (product.variants && product.variants.length > 0
        ? product.variants[0]
        : null)
  );
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (
      newQuantity >= 1 &&
      selectedVariant &&
      newQuantity <= selectedVariant.stockQty
    ) {
      setQuantity(newQuantity);
    }
  };

  const handleConfirm = () => {
    if (selectedVariant) {
      onVariantSelect(selectedVariant, quantity);
      onClose();
    }
  };

  const getActionText = () => {
    if (actionType === "addToCart") {
      return `Thêm ${quantity} vào giỏ`;
    }
    return "Mua ngay";
  };

  if (!product.variants || product.variants.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Chọn dung tích</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Product Info */}
          <View style={styles.productInfo}>
            <Image
              source={{ uri: product.image }}
              style={styles.productImage}
            />
            <View style={styles.productDetails}>
              <Text style={styles.productName} numberOfLines={2}>
                {product.name}
              </Text>
              {selectedVariant && (
                <Text style={styles.selectedPrice}>
                  {selectedVariant.price.toLocaleString()}₫
                </Text>
              )}
            </View>
          </View>

          {/* Variants */}
          <ScrollView style={styles.variantsContainer}>
            <Text style={styles.sectionTitle}>Dung tích:</Text>
            {product.variants.map((variant, index) => {
              const isOutOfStock = variant.stockQty === 0;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.variantItem,
                    selectedVariant === variant && styles.selectedVariant,
                    isOutOfStock && styles.outOfStockVariant,
                  ]}
                  onPress={() => {
                    if (!isOutOfStock) {
                      setSelectedVariant(variant);
                      setQuantity(1); // Reset quantity when variant changes
                    }
                  }}
                  disabled={isOutOfStock}
                >
                  <View style={styles.variantInfo}>
                    <Text style={styles.variantSize}>{variant.size}ml</Text>
                    <Text style={styles.variantPrice}>
                      {variant.price.toLocaleString()}₫
                    </Text>
                  </View>
                  <View style={styles.variantStock}>
                    <Text
                      style={[
                        styles.stockText,
                        isOutOfStock && styles.outOfStockText,
                      ]}
                    >
                      {isOutOfStock
                        ? "Hết hàng"
                        : `Còn ${variant.stockQty} sản phẩm`}
                    </Text>
                    {selectedVariant === variant && !isOutOfStock && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#FF6B7D"
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Quantity Selector */}
          {selectedVariant && (
            <View style={styles.quantitySection}>
              <Text style={styles.sectionTitle}>Số lượng:</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={[
                    styles.quantityButton,
                    quantity <= 1 && styles.quantityButtonDisabled,
                  ]}
                  onPress={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <Ionicons
                    name="remove"
                    size={20}
                    color={quantity <= 1 ? "#ccc" : "#333"}
                  />
                </TouchableOpacity>

                <Text style={styles.quantityText}>{quantity}</Text>

                <TouchableOpacity
                  style={[
                    styles.quantityButton,
                    quantity >= selectedVariant.stockQty &&
                      styles.quantityButtonDisabled,
                  ]}
                  onPress={() => handleQuantityChange(1)}
                  disabled={quantity >= selectedVariant.stockQty}
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color={
                      quantity >= selectedVariant.stockQty ? "#ccc" : "#333"
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Total */}
          {selectedVariant && (
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Tổng tiền:</Text>
              <Text style={styles.totalPrice}>
                {(selectedVariant.price * quantity).toLocaleString()}₫
              </Text>
            </View>
          )}

          {/* Action Button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              !selectedVariant && styles.actionButtonDisabled,
              actionType === "buyNow" && styles.buyNowButton,
            ]}
            onPress={handleConfirm}
            disabled={!selectedVariant}
          >
            <Ionicons
              name={actionType === "addToCart" ? "cart" : "flash"}
              size={20}
              color="#fff"
            />
            <Text style={styles.actionButtonText}>{getActionText()}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  productInfo: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  selectedPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF6B7D",
  },
  variantsContainer: {
    maxHeight: 200,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  variantItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#f8f9fa",
  },
  selectedVariant: {
    borderColor: "#FF6B7D",
    backgroundColor: "#fff5f5",
  },
  outOfStockVariant: {
    opacity: 0.5,
    backgroundColor: "#f5f5f5",
    borderColor: "#ddd",
  },
  variantInfo: {
    flex: 1,
  },
  variantSize: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  variantPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF6B7D",
  },
  variantStock: {
    alignItems: "flex-end",
  },
  stockText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  outOfStockText: {
    color: "#999",
    fontWeight: "500",
  },
  quantitySection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
  },
  quantityButtonDisabled: {
    backgroundColor: "#f0f0f0",
    borderColor: "#e0e0e0",
  },
  quantityText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginHorizontal: 24,
    minWidth: 40,
    textAlign: "center",
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    marginTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF6B7D",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFA726",
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  buyNowButton: {
    backgroundColor: "#FF6B7D",
  },
  actionButtonDisabled: {
    backgroundColor: "#e0e0e0",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default VariantSelector;
