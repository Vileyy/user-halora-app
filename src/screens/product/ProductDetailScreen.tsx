import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Share,
  Alert,
  StatusBar,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/reducers/rootReducer";
import { useCartSync } from "../../hooks/useCartSync";

type ProductDetailRouteProp = RouteProp<
  RootStackParamList,
  "ProductDetailScreen"
>;

export default function ProductDetailScreen() {
  const route = useRoute<ProductDetailRouteProp>();
  const { product } = route.params;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const { addItemToCart } = useCartSync();

  const totalCartItems = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [showQuantityModal, setShowQuantityModal] = useState<boolean>(false);
  const [tempQuantity, setTempQuantity] = useState<number>(1);

  const formattedPrice = useMemo(() => {
    const priceStr = product.price || "0";
    const priceNumber = parseInt(priceStr.toString().replace(/[^\d]/g, ""));
    return isNaN(priceNumber) || priceNumber === 0
      ? "0₫"
      : `${priceNumber.toLocaleString()}₫`;
  }, [product.price]);

  const onToggleFavorite = () => setIsFavorite((prev) => !prev);

  const onShare = async () => {
    try {
      await Share.share({
        message: `${product.name} - ${formattedPrice}\n${product.description}`,
      });
    } catch {
      // ignore
    }
  };

  const onIncrease = () => setQuantity((q) => Math.min(q + 1, 99));
  const onDecrease = () => setQuantity((q) => Math.max(q - 1, 1));

  const onTempIncrease = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTempQuantity((q) => Math.min(q + 1, 99));
  };

  const onTempDecrease = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTempQuantity((q) => Math.max(q - 1, 1));
  };

  const openQuantityModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTempQuantity(quantity);
    setShowQuantityModal(true);
  };

  const confirmAddToCart = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setQuantity(tempQuantity);
    addItemToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description,
      image: product.image,
      category: product.category,
    });
    setShowQuantityModal(false);
    Alert.alert("Đã thêm vào giỏ", `${product.name} x${tempQuantity}`);
  };

  const onAddToCart = () => {
    openQuantityModal();
  };

  const onBuyNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    addItemToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description,
      image: product.image,
      category: product.category,
    });
    Alert.alert("Mua ngay", "Đang chuyển đến trang thanh toán...", [
      {
        text: "OK",
        onPress: () => {
          // TODO: Navigate to checkout screen
          console.log("Navigate to checkout");
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Header overlay */}
      <View style={[styles.headerOverlay, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.rightActions}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.navigate("CartScreen" as never)}
          >
            <Ionicons name="cart-outline" size={22} color="#fff" />
            {totalCartItems > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalCartItems}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={onToggleFavorite}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={22}
              color={isFavorite ? "#FF6B7D" : "#fff"}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerIconButton} onPress={onShare}>
            <Ionicons name="share-social-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image - Full screen */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: product.image }} style={styles.heroImage} />
        </View>

        {/* Content Card */}
        <View style={styles.contentCard}>
          {/* Product Info */}
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productPrice}>{formattedPrice}</Text>

            <View style={styles.ratingRow}>
              <View style={styles.stars}>
                {[1, 2, 3, 4].map((star) => (
                  <Ionicons key={star} name="star" size={14} color="#FFB800" />
                ))}
                <Ionicons name="star-half" size={14} color="#FFB800" />
              </View>
              <Text style={styles.ratingText}>4.0</Text>
              <Text style={styles.soldText}>Đã bán 128</Text>
            </View>
          </View>

          {/* Delivery Info */}
          <View style={styles.deliverySection}>
            <View style={styles.deliveryRow}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.deliveryLabel}>Địa điểm chi nhánh:</Text>
              <Text style={styles.deliveryValue}>
                82 Hồ Tùng Mậu, P.Bến Nghé, Q.1, TP.HCM
              </Text>
            </View>

            <View style={styles.deliveryRow}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.deliveryLabel}>Thời gian giao:</Text>
              <Text style={styles.deliveryValue}>24h - 48h</Text>
            </View>
          </View>

          {/* Product Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>

          {/* Specifications */}
          <View style={styles.specsSection}>
            <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Thương hiệu</Text>
              <Text style={styles.specValue}>Innisfree</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Xuất xứ</Text>
              <Text style={styles.specValue}>Hàn Quốc</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Dung tích</Text>
              <Text style={styles.specValue}>50ml</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Bảo hành</Text>
              <Text style={styles.specValue}>12 tháng</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Cart Button */}
      {totalCartItems > 0 && (
        <TouchableOpacity
          style={styles.floatingCart}
          onPress={() => navigation.navigate("CartScreen" as never)}
        >
          <Ionicons name="cart" size={20} color="#fff" />
          <View style={styles.floatingCartBadge}>
            <Text style={styles.floatingCartText}>{totalCartItems}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Bottom Action Bar */}
      <View
        style={[
          styles.bottomActionBar,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <TouchableOpacity style={styles.chatButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#666" />
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addToCartButton} onPress={onAddToCart}>
          <Ionicons name="cart-outline" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Thêm vào giỏ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buyNowButton} onPress={onBuyNow}>
          <Ionicons name="flash-outline" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Mua ngay</Text>
        </TouchableOpacity>
      </View>

      {/* Quantity Selection Modal */}
      <Modal
        visible={showQuantityModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowQuantityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn số lượng</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowQuantityModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Product Info in Modal */}
            <View style={styles.modalProductInfo}>
              <Image
                source={{ uri: product.image }}
                style={styles.modalProductImage}
              />
              <View style={styles.modalProductDetails}>
                <Text style={styles.modalProductName} numberOfLines={2}>
                  {product.name}
                </Text>
                <Text style={styles.modalProductPrice}>{formattedPrice}</Text>
              </View>
            </View>

            {/* Quantity Selector */}
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Số lượng:</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={[
                    styles.quantityButton,
                    tempQuantity <= 1 && styles.quantityButtonDisabled,
                  ]}
                  onPress={onTempDecrease}
                  disabled={tempQuantity <= 1}
                >
                  <Ionicons
                    name="remove"
                    size={20}
                    color={tempQuantity <= 1 ? "#ccc" : "#333"}
                  />
                </TouchableOpacity>

                <View style={styles.quantityDisplay}>
                  <Text style={styles.quantityText}>{tempQuantity}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.quantityButton,
                    tempQuantity >= 99 && styles.quantityButtonDisabled,
                  ]}
                  onPress={onTempIncrease}
                  disabled={tempQuantity >= 99}
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color={tempQuantity >= 99 ? "#ccc" : "#333"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowQuantityModal(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmAddToCart}
              >
                <Ionicons name="cart" size={18} color="#fff" />
                <Text style={styles.confirmButtonText}>
                  Thêm {tempQuantity} vào giỏ
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
  },

  // Header Styles
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FF6B7D",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },

  // Hero Section
  heroContainer: {
    width: width,
    height: height * 0.6,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  titleOverlay: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  heroSubtitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: -4,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  heroDescription: {
    fontSize: 14,
    color: "#fff",
    marginTop: 4,
    opacity: 0.9,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  // Content Card
  contentCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -30,
    paddingTop: 24,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },

  // Product Info
  productInfo: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  productName: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 10,
    lineHeight: 26,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FF6B7D",
    marginBottom: 14,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stars: {
    flexDirection: "row",
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  soldText: {
    fontSize: 14,
    color: "#666",
    marginLeft: "auto",
  },

  // Delivery Section
  deliverySection: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    backgroundColor: "#fafafa",
  },
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  deliveryLabel: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    width: 120,
  },
  deliveryValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    fontWeight: "500",
  },

  // Sections
  descriptionSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  specsSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  specRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f8f8",
  },
  specLabel: {
    fontSize: 14,
    color: "#666",
    width: 120,
  },
  specValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    fontWeight: "500",
  },

  // Floating Cart
  floatingCart: {
    position: "absolute",
    right: 16,
    bottom: 100,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FF6B7D",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  floatingCartBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FF4757",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  floatingCartText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },

  // Bottom Action Bar
  bottomActionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  chatButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chatButtonText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFA726",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
    shadowColor: "#FFA726",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buyNowButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6B7D",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
    shadowColor: "#FF6B7D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  modalProductInfo: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalProductImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  modalProductDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  modalProductPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF6B7D",
  },
  quantitySection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  quantityButtonDisabled: {
    backgroundColor: "#f9f9f9",
    borderColor: "#f0f0f0",
  },
  quantityDisplay: {
    minWidth: 60,
    height: 44,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#FF6B7D",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  confirmButton: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FF6B7D",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#FF6B7D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});
