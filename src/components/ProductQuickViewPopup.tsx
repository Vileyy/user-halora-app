import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

interface Variant {
  price: number;
  size: string;
  stockQty: number;
  sku?: string;
}

interface Product {
  id: string;
  name: string;
  price?: string;
  image: string;
  description?: string;
  variants?: Variant[];
}

interface ProductQuickViewPopupProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onViewDetails?: () => void;
}

const ProductQuickViewPopup: React.FC<ProductQuickViewPopupProps> = ({
  visible,
  product,
  onClose,
  onViewDetails,
}) => {
  if (!product) return null;

  // Hàm lấy giá hiển thị (ưu tiên variant đầu tiên)
  const getDisplayPrice = (): string => {
    if (product.variants && product.variants.length > 0) {
      return product.variants[0].price.toLocaleString("vi-VN");
    }
    if (product.price) {
      return parseInt(product.price).toLocaleString("vi-VN");
    }
    return "0";
  };

  // Lấy thông tin variant nếu có
  const getVariantInfo = (): string => {
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants[0];
      return `${variant.size}ml • Còn ${variant.stockQty} sản phẩm`;
    }
    return "";
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.popup}>
              {/* Close button */}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close-circle" size={30} color="#fff" />
              </TouchableOpacity>

              {/* Product Image */}
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: product.image }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              </View>

              {/* Product Info */}
              <View style={styles.infoContainer}>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.name}
                </Text>

                <Text style={styles.productPrice}>{getDisplayPrice()} VNĐ</Text>

                {getVariantInfo() && (
                  <Text style={styles.variantInfo}>{getVariantInfo()}</Text>
                )}

                {product.description && (
                  <Text style={styles.productDescription} numberOfLines={3}>
                    {product.description}
                  </Text>
                )}

                {/* View Details Button */}
                {onViewDetails && (
                  <TouchableOpacity
                    style={styles.viewDetailsButton}
                    onPress={onViewDetails}
                  >
                    <Text style={styles.viewDetailsText}>Xem chi tiết</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  popup: {
    width: width * 0.85,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    maxHeight: "80%",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 15,
  },
  imageContainer: {
    width: "100%",
    height: 300,
    backgroundColor: "#f8f8f8",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  infoContainer: {
    padding: 20,
  },
  productName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF6B6B",
    marginBottom: 8,
  },
  variantInfo: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  productDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 16,
  },
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F08080",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
  },
  viewDetailsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

export default ProductQuickViewPopup;
