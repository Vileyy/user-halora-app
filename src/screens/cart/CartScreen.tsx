import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  SafeAreaView,
} from "react-native";
import React, { useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootState } from "../../redux/reducers/rootReducer";
import { CartItem } from "../../redux/slices/cartSlice";
import { useCartSync } from "../../hooks/useCartSync";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { RootStackParamList } from "../../types/navigation";
import { useAuth } from "../../hooks/useAuth";
import AuthRequiredModal from "../../components/AuthRequiredModal";

type CartScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CartScreen"
>;

export default function CartScreen() {
  const navigation = useNavigation<CartScreenNavigationProp>();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const {
    removeItemFromCart,
    updateItemQuantity,
    clearAllCart,
    toggleItemSelect,
    selectAllCartItems,
    unselectAllCartItems,
    initializeCartSelection,
  } = useCartSync();

  useEffect(() => {
    if (cartItems.length > 0) {
      initializeCartSelection();
    }
  }, [cartItems.length, initializeCartSelection]);

  // Tính toán các sản phẩm được chọn
  const {
    selectedItems,
    totalItems,
    totalPrice,
    formattedTotalPrice,
    isAllSelected,
  } = useMemo(() => {
    const selected = cartItems.filter((item) => item.selected);
    const total = selected.reduce((sum, item) => {
      const priceStr = item.price || "0";
      const price = parseInt(priceStr.toString().replace(/[^\d]/g, "")) || 0;
      return sum + price * item.quantity;
    }, 0);

    const itemCount = selected.reduce((sum, item) => sum + item.quantity, 0);
    const allSelected =
      cartItems.length > 0 && cartItems.every((item) => item.selected);

    return {
      selectedItems: selected,
      totalItems: itemCount,
      totalPrice: total,
      formattedTotalPrice: `${total.toLocaleString()}₫`,
      isAllSelected: allSelected,
    };
  }, [cartItems]);

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(id);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateItemQuantity(id, newQuantity);
  };

  const handleRemoveItem = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Xóa sản phẩm",
      "Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => removeItemFromCart(id),
        },
      ]
    );
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return;

    Alert.alert(
      "Xóa tất cả",
      "Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi giỏ hàng?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa tất cả",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            clearAllCart();
          },
        },
      ]
    );
  };

  const handleToggleSelectAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isAllSelected) {
      unselectAllCartItems();
    } else {
      selectAllCartItems();
    }
  };

  const handleToggleItemSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleItemSelect(id);
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      Alert.alert(
        "Chưa chọn sản phẩm",
        "Vui lòng chọn ít nhất một sản phẩm để thanh toán"
      );
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.navigate("CheckoutScreen", {
      selectedItems: selectedItems,
      totalPrice: totalPrice,
    });
  };

  const formatPrice = (price: string): string => {
    const priceStr = price || "0";
    const priceNumber =
      parseInt(priceStr.toString().replace(/[^\d]/g, "")) || 0;
    return `${priceNumber.toLocaleString()}₫`;
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      {/* Checkbox */}
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => handleToggleItemSelect(item.id)}
      >
        <View
          style={[styles.checkbox, item.selected && styles.checkboxSelected]}
        >
          {item.selected && (
            <Ionicons name="checkmark" size={16} color="#fff" />
          )}
        </View>
      </TouchableOpacity>

      <Image source={{ uri: item.image }} style={styles.productImage} />

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
      </View>

      <View style={styles.quantitySection}>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={[
              styles.quantityButton,
              item.quantity <= 1 && styles.quantityButtonDisabled,
            ]}
            onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <Ionicons
              name="remove"
              size={16}
              color={item.quantity <= 1 ? "#ccc" : "#666"}
            />
          </TouchableOpacity>

          <View style={styles.quantityDisplay}>
            <Text style={styles.quantityText}>{item.quantity}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.quantityButton,
              item.quantity >= 99 && styles.quantityButtonDisabled,
            ]}
            onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
            disabled={item.quantity >= 99}
          >
            <Ionicons
              name="add"
              size={16}
              color={item.quantity >= 99 ? "#ccc" : "#666"}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#FF6B7D" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cart-outline" size={120} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
      <Text style={styles.emptySubtitle}>
        Thêm sản phẩm yêu thích vào giỏ hàng để mua sắm
      </Text>
    </View>
  );

  const renderNotLoggedIn = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cart-outline" size={120} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>Cần đăng nhập</Text>
      <Text style={styles.emptySubtitle}>
        Vui lòng đăng nhập để xem các sản phẩm trong giỏ hàng
      </Text>
      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => setShowAuthModal(true)}
      >
        <Text style={styles.loginButtonText}>Đăng nhập ngay</Text>
      </TouchableOpacity>
    </View>
  );

  // Nếu chưa đăng nhập
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Giỏ hàng</Text>
          </View>
        </View>

        {/* Content */}
        {renderNotLoggedIn()}

        <AuthRequiredModal
          visible={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          title="Đăng nhập cần thiết"
          message="Vui lòng đăng nhập để xem các sản phẩm trong giỏ hàng"
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Giỏ hàng</Text>
        {cartItems.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearCart}
          >
            <Ionicons name="trash-outline" size={20} color="#FF6B7D" />
            <Text style={styles.clearButtonText}>Xóa tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Select All Section */}
      {cartItems.length > 0 && (
        <View style={styles.selectAllSection}>
          <TouchableOpacity
            style={styles.selectAllContainer}
            onPress={handleToggleSelectAll}
          >
            <View
              style={[
                styles.checkbox,
                isAllSelected && styles.checkboxSelected,
              ]}
            >
              {isAllSelected && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
            <Text style={styles.selectAllText}>
              {isAllSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.selectedCountText}>
            {selectedItems.length}/{cartItems.length} sản phẩm
          </Text>
        </View>
      )}

      {/* Cart Count */}
      {cartItems.length > 0 && (
        <View style={styles.cartSummary}>
          <Text style={styles.cartSummaryText}>
            {totalItems} sản phẩm được chọn
          </Text>
        </View>
      )}

      {/* Cart Items */}
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.cartList,
          cartItems.length === 0 && styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyCart}
      />

      {/* Bottom Checkout Section */}
      {cartItems.length > 0 && (
        <View style={styles.checkoutSection}>
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tạm tính:</Text>
              <Text style={styles.totalValue}>{formattedTotalPrice}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Phí vận chuyển:</Text>
              <Text style={styles.totalValue}>Miễn phí</Text>
            </View>
            <View style={[styles.totalRow, styles.finalTotalRow]}>
              <Text style={styles.finalTotalLabel}>Tổng cộng:</Text>
              <Text style={styles.finalTotalValue}>{formattedTotalPrice}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.checkoutButton,
              selectedItems.length === 0 && styles.checkoutButtonDisabled,
            ]}
            onPress={handleCheckout}
            disabled={selectedItems.length === 0}
          >
            <LinearGradient
              colors={
                selectedItems.length === 0
                  ? ["#E0E0E0", "#F0F0F0"]
                  : ["#FF6B7D", "#FF8A9B"]
              }
              style={styles.checkoutGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons
                name="card-outline"
                size={20}
                color={selectedItems.length === 0 ? "#999" : "#fff"}
              />
              <Text
                style={[
                  styles.checkoutButtonText,
                  selectedItems.length === 0 &&
                    styles.checkoutButtonTextDisabled,
                ]}
              >
                Thanh toán ({totalItems})
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
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  clearButtonText: {
    color: "#FF6B7D",
    fontSize: 14,
    fontWeight: "600",
  },
  cartSummary: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  cartSummaryText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  cartList: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
  },
  cartItem: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
    lineHeight: 22,
  },
  productCategory: {
    fontSize: 12,
    color: "#999",
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B7D",
  },
  quantitySection: {
    alignItems: "center",
    gap: 12,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    padding: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quantityButtonDisabled: {
    backgroundColor: "#f5f5f5",
    elevation: 0,
  },
  quantityDisplay: {
    minWidth: 32,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginTop: 24,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  checkoutSection: {
    backgroundColor: "#fff",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  totalSection: {
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: "#666",
  },
  totalValue: {
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  finalTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  finalTotalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  finalTotalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF6B7D",
  },
  checkoutButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#FF6B7D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  checkoutButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  checkoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  checkoutButtonTextDisabled: {
    color: "#999",
  },
  selectAllSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectAllContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectAllText: {
    fontSize: 14,
    color: "#666",
  },
  selectedCountText: {
    fontSize: 14,
    color: "#666",
  },
  checkboxContainer: {
    padding: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxSelected: {
    backgroundColor: "#FF6B7D",
    borderColor: "#FF6B7D",
  },
  loginButton: {
    backgroundColor: "#FF6B7D",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    elevation: 4,
    shadowColor: "#FF6B7D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
