import React, { useState, useEffect } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../types/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../redux/reducers/rootReducer";
import { clearCart, removeSelectedItems } from "../../redux/slices/cartSlice";
import { placeOrderWithInventory } from "../../redux/slices/orderSlice";
import {
  createOrder,
  placeOrder,
  clearUserCart,
  removeItemsFromUserCart,
  getUserOrdersDebug,
} from "../../services/orderService";
import voucherService, { VoucherData } from "../../services/voucherService";
import { stripeService } from "../../services/stripeService";
import {
  useStripe,
  useConfirmPayment,
  CardField,
  StripeProvider,
} from "@stripe/stripe-react-native";

type StripePaymentScreenRouteProp = RouteProp<
  RootStackParamList,
  "StripePaymentScreen"
>;
type StripePaymentScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "StripePaymentScreen"
>;

type CartItem = {
  id: string;
  name: string;
  image: string;
  quantity: number;
  price: string | number;
  description?: string;
  category?: string;
  selectedSize?: string;
  selectedColor?: string;
  variant?: {
    size: string;
    price: number;
  };
};

const MONEY = (n: number) => `${(n || 0).toLocaleString()}₫`;

function StripePaymentContent() {
  const navigation = useNavigation<StripePaymentScreenNavigationProp>();
  const route = useRoute<StripePaymentScreenRouteProp>();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [cardDetails, setCardDetails] = useState<any>(null);

  const {
    selectedItems,
    totalPrice,
    itemsSubtotal,
    discountAmount,
    effectiveShipping,
    shippingMethod,
    appliedCoupon,
    appliedShippingVoucher,
    appliedProductVoucher,
  } = route.params as {
    selectedItems: CartItem[];
    totalPrice: number;
    itemsSubtotal: number;
    discountAmount: number;
    effectiveShipping: number;
    shippingMethod: string;
    appliedCoupon: string | null;
    appliedShippingVoucher: VoucherData | null;
    appliedProductVoucher: VoucherData | null;
  };

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        setIsProcessing(true);
        const secret = await stripeService.createPaymentIntent(totalPrice);
        setClientSecret(secret);
      } catch (error) {
        console.error("Error creating payment intent:", error);
        Alert.alert("Lỗi", "Không thể khởi tạo thanh toán. Vui lòng thử lại.");
        navigation.goBack();
      } finally {
        setIsProcessing(false);
      }
    };

    createPaymentIntent();
  }, [totalPrice, navigation]);

  const handlePayment = async () => {
    if (!clientSecret) {
      Alert.alert("Lỗi", "Chưa sẵn sàng thanh toán. Vui lòng thử lại.");
      return;
    }

    setIsProcessing(true);
    try {
      // Initialize Payment Sheet
      const init = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "Halora Cosmetics",
        customerId: user?.uid,
        customerEphemeralKeySecret: undefined,
        defaultBillingDetails: {
          name: user?.displayName || "Customer",
          email: user?.email || "",
        },
      });

      if (init.error) {
        console.error("Payment sheet init error:", init.error);
        Alert.alert("Lỗi", init.error.message);
        return;
      }

      // Present Payment Sheet
      const result = await presentPaymentSheet();

      if (result.error) {
        console.error("Payment sheet error:", result.error);
        Alert.alert("Thanh toán thất bại", result.error.message);
        return;
      }

      // Payment succeeded
      if (!result.error) {
        await createOrderAfterPayment();
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi xử lý thanh toán");
    } finally {
      setIsProcessing(false);
    }
  };

  const createOrderAfterPayment = async () => {
    try {
      // Create order data
      const orderData = {
        items: selectedItems.map((item) => {
          const orderItem: any = {
            id: item.id,
            name: item.name,
            price: item.price.toString(),
            description: item.description || "",
            image: item.image,
            category: item.category || "Other",
            quantity: item.quantity,
          };
          if (item.selectedSize !== undefined) {
            orderItem.selectedSize = item.selectedSize;
          }
          if (item.selectedColor !== undefined) {
            orderItem.selectedColor = item.selectedColor;
          }
          if (item.variant !== undefined) {
            orderItem.variant = item.variant;
          }
          return orderItem;
        }),
        itemsSubtotal,
        discountAmount,
        shippingCost: effectiveShipping,
        totalAmount: totalPrice,
        shippingMethod: shippingMethod as "standard" | "express",
        paymentMethod: "stripe" as const,
        appliedCoupon: appliedCoupon || null,
      };

      console.log(
        "Creating order with data:",
        JSON.stringify(orderData, null, 2)
      );

      // Use the new inventory-aware order placement
      const result = await dispatch(
        placeOrderWithInventory({
          userId: user!.uid,
          orderData,
        }) as any
      );

      if (placeOrderWithInventory.rejected.match(result)) {
        throw new Error(result.payload as string);
      }

      const orderId = (result.payload as any).orderId;
      await getUserOrdersDebug(user!.uid);

      const purchasedItemIds = selectedItems.map((item) => item.id);
      try {
        await removeItemsFromUserCart(user!.uid, purchasedItemIds);
        await new Promise((resolve) => setTimeout(resolve, 500));

        dispatch(removeSelectedItems(purchasedItemIds));
      } catch (cartError) {
        console.error("Error removing items from cart:", cartError);
        Alert.alert(
          "Thông báo",
          "Đơn hàng đã được tạo thành công nhưng có lỗi khi cập nhật giỏ hàng. Vui lòng kiểm tra lại giỏ hàng."
        );
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      (navigation as any).navigate("OrderSuccessScreen", {
        orderId,
        totalAmount: totalPrice,
      });
    } catch (error) {
      console.error("Error creating order after payment:", error);
      Alert.alert(
        "Lỗi",
        "Thanh toán thành công nhưng có lỗi khi tạo đơn hàng. Vui lòng liên hệ hỗ trợ."
      );
    }
  };

  const renderProductItem = (item: CartItem) => (
    <View key={item.id} style={styles.productItem}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.variant && (
          <Text style={styles.productVariant}>
            Dung tích: {item.variant.size}ml
          </Text>
        )}
        <Text style={styles.productPrice}>
          {MONEY(parseInt(String(item.price).replace(/[^\d]/g, "")) || 0)}
        </Text>
      </View>
      <Text style={styles.productQuantity}>x{item.quantity}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      {/* Modern Header */}
      <View style={styles.modernHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Thanh toán</Text>
          <Text style={styles.headerSubtitle}>Bảo mật với Stripe</Text>
        </View>
        <View style={styles.secureBadge}>
          <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Payment Amount Card */}
        <View style={styles.amountCard}>
          <View style={styles.amountHeader}>
            <Ionicons name="card-outline" size={24} color="#6366F1" />
            <Text style={styles.amountTitle}>Số tiền thanh toán</Text>
          </View>
          <Text style={styles.amountValue}>{MONEY(totalPrice)}</Text>
          <View style={styles.amountDetails}>
            <Text style={styles.amountDetailText}>
              {selectedItems.length} sản phẩm • Phí vận chuyển{" "}
              {MONEY(effectiveShipping)}
            </Text>
          </View>
        </View>

        {/* Card Input Section */}
        <View style={styles.cardSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card" size={20} color="#1a1a1a" />
            <Text style={styles.sectionTitle}>Thông tin thẻ</Text>
          </View>

          <View style={styles.cardFormContainer}>
            <View style={styles.paymentMethodCard}>
              <View style={styles.paymentMethodContent}>
                <View style={styles.paymentMethodIcon}>
                  <Ionicons name="card" size={24} color="#6366F1" />
                </View>
                <View style={styles.paymentMethodInfo}>
                  <Text style={styles.paymentMethodTitle}>
                    Thẻ tín dụng/ghi nợ (Stripe)
                  </Text>
                  <Text style={styles.paymentMethodSubtitle}>
                    Thanh toán an toàn với Stripe
                  </Text>
                </View>
                <View style={styles.paymentMethodStatus}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                </View>
              </View>
            </View>

            {/* Security Info */}
            <View style={styles.securityInfo}>
              <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              <Text style={styles.securityText}>
                Thông tin thẻ được mã hóa và bảo mật bởi Stripe
              </Text>
            </View>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.summarySection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt-outline" size={20} color="#1a1a1a" />
            <Text style={styles.sectionTitle}>Chi tiết đơn hàng</Text>
          </View>

          {/* Products */}
          <View style={styles.productsContainer}>
            {selectedItems.map((item, index) => (
              <View key={item.id} style={styles.productRow}>
                <Image
                  source={{ uri: item.image }}
                  style={styles.productThumbnail}
                />
                <View style={styles.productDetails}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.productMeta}>
                    Số lượng: {item.quantity} •{" "}
                    {MONEY(
                      parseInt(String(item.price).replace(/[^\d]/g, "")) || 0
                    )}
                  </Text>
                </View>
                <Text style={styles.productTotal}>
                  {MONEY(
                    (parseInt(String(item.price).replace(/[^\d]/g, "")) || 0) *
                      item.quantity
                  )}
                </Text>
              </View>
            ))}
          </View>

          {/* Cost Breakdown */}
          <View style={styles.costBreakdown}>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Tạm tính</Text>
              <Text style={styles.costValue}>{MONEY(itemsSubtotal)}</Text>
            </View>

            {discountAmount > 0 && (
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Giảm giá</Text>
                <Text style={[styles.costValue, styles.discountValue]}>
                  -{MONEY(discountAmount)}
                </Text>
              </View>
            )}

            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Phí vận chuyển</Text>
              <Text style={styles.costValue}>{MONEY(effectiveShipping)}</Text>
            </View>

            <View style={styles.costDivider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>{MONEY(totalPrice)}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modern Payment Button */}
      <View style={styles.paymentFooter}>
        <View style={styles.securityInfo}>
          <Ionicons name="lock-closed" size={14} color="#6B7280" />
          <Text style={styles.securityText}>
            Thanh toán được bảo mật bởi Stripe
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.modernPayButton,
            (isProcessing || !clientSecret) && styles.payButtonDisabled,
          ]}
          onPress={handlePayment}
          disabled={isProcessing || !clientSecret}
        >
          <LinearGradient
            colors={
              isProcessing || !clientSecret
                ? ["#9CA3AF", "#6B7280"]
                : ["#6366F1", "#8B5CF6"]
            }
            style={styles.payGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.processingText}>Đang xử lý...</Text>
              </View>
            ) : (
              <View style={styles.payButtonContent}>
                <Ionicons name="card" size={20} color="#fff" />
                <Text style={styles.modernPayText}>
                  Thanh toán {MONEY(totalPrice)}
                </Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function StripePaymentScreen() {
  return <StripePaymentContent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  // Modern Header
  modernHeader: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  secureBadge: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(76,175,80,0.2)",
  },

  scrollView: {
    flex: 1,
  },

  // Amount Card
  amountCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  amountHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  amountTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 12,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 8,
  },
  amountDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  amountDetailText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },

  // Card Section
  cardSection: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardFormContainer: {
    marginTop: 16,
  },
  cardInputRow: {
    marginBottom: 20,
  },
  cardInputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  cardNumberContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardNumberField: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D1D5DB",
    borderRadius: 8,
    fontSize: 16,
    color: "#1F2937",
    borderWidth: 1,
  },
  cardNumberFieldContainer: {
    height: 50,
  },
  cardDetailsRow: {
    flexDirection: "row",
    gap: 12,
  },
  cardDetailItem: {
    flex: 1,
  },
  cardExpiryContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardCvcContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardDetailField: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D1D5DB",
    borderRadius: 8,
    fontSize: 16,
    color: "#1F2937",
    borderWidth: 1,
  },
  cardDetailFieldContainer: {
    height: 50,
  },
  paymentMethodCard: {
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#3B82F6",
    marginBottom: 16,
  },
  paymentMethodButton: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  paymentMethodContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  paymentMethodSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  paymentMethodArrow: {
    marginLeft: 12,
  },
  paymentMethodStatus: {
    marginLeft: 12,
  },
  cardNumberInput: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D1D5DB",
    borderRadius: 8,
    fontSize: 16,
    color: "#1F2937",
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    height: 50,
  },
  cardDetailInput: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D1D5DB",
    borderRadius: 8,
    fontSize: 16,
    color: "#1F2937",
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    height: 50,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginLeft: 8,
  },
  cardInputContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modernCardField: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D1D5DB",
    borderRadius: 8,
    fontSize: 16,
    color: "#1F2937",
    borderWidth: 1,
  },
  modernCardFieldContainer: {
    height: 50,
  },
  cardHintContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cardHint: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 6,
    flex: 1,
  },

  // Summary Section
  summarySection: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  productsContainer: {
    marginBottom: 20,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  productThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  productMeta: {
    fontSize: 12,
    color: "#6B7280",
  },
  productTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },

  // Cost Breakdown
  costBreakdown: {
    marginTop: 8,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  costLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  costValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  discountValue: {
    color: "#10B981",
  },
  costDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
  },

  // Payment Footer
  paymentFooter: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  securityInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  securityText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 6,
    fontWeight: "500",
  },
  modernPayButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  payGradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  payButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  modernPayText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  processingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  processingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },

  // Legacy styles (keeping for compatibility)
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
  placeholder: {
    width: 32,
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FF6B7D",
    backgroundColor: "#FFF0F2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF6B7D",
  },
  productVariant: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginTop: 2,
    marginBottom: 2,
  },
  productQuantity: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  cardContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  cardField: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E0E0E0",
    borderRadius: 8,
    fontSize: 16,
    color: "#000000",
  },
  cardFieldContainer: {
    height: 50,
    marginVertical: 8,
  },
  bottomSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  payButton: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#FF6B7D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  payText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
