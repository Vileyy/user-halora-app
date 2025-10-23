import React, { useMemo, useState, useEffect } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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
import UserInfoRequiredModal from "../../components/UserInfoRequiredModal";
import SelectedVoucherCard from "../../components/SelectedVoucherCard";
import {
  validateUserForOrder,
  createValidationMessage,
  ValidationResult,
} from "../../utils/userValidation";
import { stripeService } from "../../services/stripeService";
import { useStripe, StripeProvider } from "@stripe/stripe-react-native";
const COD_LOGO = require("../../assets/image/cod-logo.png");
const MOMO_LOGO = require("../../assets/image/momo-logo.png");
const STRIPE_LOGO = require("../../assets/image/stripe-logo.png");

type CheckoutScreenRouteProp = RouteProp<RootStackParamList, "CheckoutScreen">;
type CheckoutScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CheckoutScreen"
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
const parseMoney = (v: string | number) =>
  typeof v === "number" ? v : parseInt(String(v).replace(/[^\d]/g, "")) || 0;

function CheckoutContent() {
  const navigation = useNavigation<CheckoutScreenNavigationProp>();
  const route = useRoute<CheckoutScreenRouteProp>();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    missingFields: [],
    messages: [],
  });
  const { selectedItems, totalPrice } = route.params as {
    selectedItems: CartItem[];
    totalPrice: number;
  };

  // Coupon & phương thức
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [appliedShippingVoucher, setAppliedShippingVoucher] =
    useState<VoucherData | null>(null);
  const [appliedProductVoucher, setAppliedProductVoucher] =
    useState<VoucherData | null>(null);
  const [allVouchers, setAllVouchers] = useState<VoucherData[]>([]);
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">(
    "standard"
  );
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "momo" | "stripe">(
    "cod"
  );

  // Load vouchers
  useEffect(() => {
    const unsubscribe = voucherService.subscribeToVouchers(
      (vouchers) => {
        setAllVouchers(vouchers);
      },
      (error) => {
        console.error("Error loading vouchers:", error);
      }
    );

    return unsubscribe;
  }, []);

  const itemsSubtotal = useMemo(() => {
    if (typeof totalPrice === "number") return totalPrice;
    return selectedItems.reduce(
      (sum, it) => sum + parseMoney(it.price) * (it.quantity || 1),
      0
    );
  }, [selectedItems, totalPrice]);

  const baseShipping = useMemo(
    () => (shippingMethod === "standard" ? 30000 : 60000),
    [shippingMethod]
  );

  const discountAmount = useMemo(() => {
    // Xử lý product voucher từ VoucherService
    if (appliedProductVoucher) {
      return voucherService.calculateDiscount(
        appliedProductVoucher,
        itemsSubtotal,
        0
      );
    }

    // Fallback cho các voucher cũ (hardcoded)
    if (appliedCoupon === "HALORA10") return Math.round(itemsSubtotal * 0.1);
    if (appliedCoupon === "HALORA30K") return 30000;
    return 0;
  }, [appliedProductVoucher, appliedCoupon, itemsSubtotal]);

  const shippingDiscount = useMemo(() => {
    // Xử lý voucher vận chuyển từ VoucherService
    if (appliedShippingVoucher) {
      const discount = voucherService.calculateDiscount(
        appliedShippingVoucher,
        itemsSubtotal,
        baseShipping
      );
      // console.log("🚚 Shipping Voucher Debug:", {
      //   voucherCode: appliedShippingVoucher.code,
      //   discountType: appliedShippingVoucher.discountType,
      //   discountValue: appliedShippingVoucher.discountValue,
      //   baseShipping: baseShipping,
      //   itemsSubtotal: itemsSubtotal,
      //   calculatedDiscount: discount,
      //   discountPercentage:
      //     appliedShippingVoucher.discountType === "percentage"
      //       ? `${appliedShippingVoucher.discountValue}%`
      //       : "Fixed amount",
      // });
      return discount;
    }

    // Fallback cho voucher cũ
    if (appliedCoupon === "FREESHIP") return baseShipping;
    return 0;
  }, [appliedShippingVoucher, appliedCoupon, baseShipping, itemsSubtotal]);

  const effectiveShipping = useMemo(() => {
    return Math.max(0, baseShipping - shippingDiscount);
  }, [baseShipping, shippingDiscount]);

  const finalTotal = useMemo(() => {
    const total = itemsSubtotal - discountAmount + effectiveShipping;
    return total > 0 ? total : 0;
  }, [itemsSubtotal, discountAmount, effectiveShipping]);

  // Create Stripe Payment Intent
  const createStripePaymentIntent = async (amount: number) => {
    try {
      const clientSecret = await stripeService.createPaymentIntent(amount);
      return clientSecret;
    } catch (error) {
      console.error("Error creating payment intent:", error);
      Alert.alert("Lỗi", "Không thể khởi tạo thanh toán Stripe");
      return null;
    }
  };

  // Handle Stripe Payment
  const handleStripePayment = async (clientSecret: string) => {
    try {
      // Initialize Payment Sheet
      const init = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "Halora Cosmetics",
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

      // Payment succeeded - create order
      if (!result.error) {
        await createStripeOrder();
      }
    } catch (error) {
      console.error("Stripe payment error:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi xử lý thanh toán");
    }
  };

  // Create order after successful Stripe payment
  const createStripeOrder = async () => {
    setIsPlacingOrder(true);
    try {
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
        totalAmount: finalTotal,
        shippingMethod: shippingMethod as "standard" | "express",
        paymentMethod: "stripe" as const,
        appliedCoupon: appliedCoupon || null,
      };

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

      // Cập nhật voucher usage count
      const voucherIdsToUpdate: string[] = [];
      if (appliedShippingVoucher) {
        voucherIdsToUpdate.push(appliedShippingVoucher.id);
      }
      if (appliedProductVoucher) {
        voucherIdsToUpdate.push(appliedProductVoucher.id);
      }

      if (voucherIdsToUpdate.length > 0) {
        try {
          const voucherUpdateResult =
            await voucherService.updateMultipleVoucherUsage(voucherIdsToUpdate);
          if (voucherUpdateResult.success) {
            // console.log("✅ Voucher usage updated successfully");
          } else {
            console.warn(
              "⚠️ Some vouchers could not be updated:",
              voucherUpdateResult.message
            );
          }
        } catch (voucherError) {
          console.error("Error updating voucher usage:", voucherError);
          // Không throw error vì đơn hàng đã thành công
        }
      }

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
        totalAmount: finalTotal,
      });
    } catch (error) {
      console.error("Error creating order:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi tạo đơn hàng");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Apply coupon
  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      Alert.alert("Lỗi", "Vui lòng nhập mã giảm giá");
      return;
    }

    // Tìm voucher trong danh sách
    const voucher = allVouchers.find((v) => v.code === code);
    if (voucher) {
      const validation = voucherService.isVoucherValid(voucher, itemsSubtotal);
      if (validation.valid) {
        // Clear old vouchers
        setAppliedShippingVoucher(null);
        setAppliedProductVoucher(null);
        setAppliedCoupon(null);

        // Apply new voucher
        if (voucher.type === "shipping") {
          setAppliedShippingVoucher(voucher);
        } else {
          setAppliedProductVoucher(voucher);
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert("Thành công", `Đã áp dụng voucher ${code}`);
        return;
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Voucher không hợp lệ", validation.reason);
        return;
      }
    }

    setAppliedCoupon(code);
    setAppliedShippingVoucher(null);
    setAppliedProductVoucher(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Thành công", `Đã áp dụng mã ${code}`);
  };

  const handlePlaceOrder = () => {
    if (!user) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập để đặt hàng");
      return;
    }

    // Check user info
    const validation = validateUserForOrder(user);
    if (!validation.isValid) {
      setValidationResult(validation);
      setShowUserInfoModal(true);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Xác nhận đặt hàng",
      `Tổng tiền: ${MONEY(finalTotal)}\nThanh toán: ${
        paymentMethod === "cod"
          ? "COD"
          : paymentMethod === "momo"
          ? "MoMo"
          : "Stripe"
      }`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đặt hàng",
          onPress: async () => {
            // Nếu chọn Stripe, tạo Payment Intent và mở Payment Sheet
            if (paymentMethod === "stripe") {
              const clientSecret = await createStripePaymentIntent(finalTotal);
              if (clientSecret) {
                await handleStripePayment(clientSecret);
              }
              return;
            }

            setIsPlacingOrder(true);
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
                totalAmount: finalTotal,
                shippingMethod,
                paymentMethod,
                appliedCoupon: appliedCoupon || null,
              };

              // console.log(
              //   "Creating order with data:",
              //   JSON.stringify(orderData, null, 2)
              // );

              // Use the new inventory-aware order placement
              const result = await dispatch(
                placeOrderWithInventory({
                  userId: user.uid,
                  orderData,
                }) as any
              );

              if (placeOrderWithInventory.rejected.match(result)) {
                throw new Error(result.payload as string);
              }

              const orderId = (result.payload as any).orderId;
              await getUserOrdersDebug(user.uid);

              // Cập nhật voucher usage count
              const voucherIdsToUpdate: string[] = [];
              if (appliedShippingVoucher) {
                voucherIdsToUpdate.push(appliedShippingVoucher.id);
              }
              if (appliedProductVoucher) {
                voucherIdsToUpdate.push(appliedProductVoucher.id);
              }

              if (voucherIdsToUpdate.length > 0) {
                try {
                  const voucherUpdateResult =
                    await voucherService.updateMultipleVoucherUsage(
                      voucherIdsToUpdate
                    );
                  if (voucherUpdateResult.success) {
                    // console.log("✅ Voucher usage updated successfully");
                  } else {
                    console.warn(
                      "⚠️ Some vouchers could not be updated:",
                      voucherUpdateResult.message
                    );
                  }
                } catch (voucherError) {
                  console.error("Error updating voucher usage:", voucherError);
                  // Không throw error vì đơn hàng đã thành công
                }
              }

              const purchasedItemIds = selectedItems.map((item) => item.id);
              try {
                await removeItemsFromUserCart(user.uid, purchasedItemIds);
                await new Promise((resolve) => setTimeout(resolve, 500));

                dispatch(removeSelectedItems(purchasedItemIds));
              } catch (cartError) {
                console.error("Error removing items from cart:", cartError);
                Alert.alert(
                  "Thông báo",
                  "Đơn hàng đã được tạo thành công nhưng có lỗi khi cập nhật giỏ hàng. Vui lòng kiểm tra lại giỏ hàng."
                );
              }
              (navigation as any).navigate("OrderSuccessScreen", {
                orderId,
                totalAmount: finalTotal,
              });
              // console.log("Navigated to OrderSuccessScreen");
            } catch (error) {
              console.error("Error placing order:", error);

              let errorMessage = "Không thể đặt hàng. Vui lòng thử lại.";
              if (error instanceof Error) {
                errorMessage = error.message;
              }

              Alert.alert("Lỗi đặt hàng", errorMessage);
            } finally {
              setIsPlacingOrder(false);
            }
          },
        },
      ]
    );
  };

  // Utility function để tạo unique key cho cart item
  const createUniqueKey = (item: CartItem): string => {
    if (item.variant?.size) {
      return `${item.id}_${item.variant.size}`;
    }
    return item.id;
  };

  const renderProductItem = (item: CartItem) => (
    <View key={createUniqueKey(item)} style={styles.productItem}>
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
        <Text style={styles.productPrice}>{MONEY(parseMoney(item.price))}</Text>
      </View>
      <Text style={styles.productQuantity}>x{item.quantity}</Text>
    </View>
  );

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
        <Text style={styles.headerTitle}>Thanh Toán</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Sản phẩm đã chọn */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sản phẩm đã chọn</Text>
            <Text style={styles.sectionBadge}>
              {selectedItems?.length || 0} món
            </Text>
          </View>
          {selectedItems.map(renderProductItem)}
        </View>

        {/* Halora Voucher */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Halora Voucher</Text>

          {/* Hiển thị voucher đã chọn */}
          {appliedShippingVoucher && (
            <SelectedVoucherCard
              voucher={appliedShippingVoucher}
              onRemove={() => {
                setAppliedShippingVoucher(null);
                setCouponCode("");
              }}
            />
          )}

          {appliedProductVoucher && (
            <SelectedVoucherCard
              voucher={appliedProductVoucher}
              onRemove={() => {
                setAppliedProductVoucher(null);
                setCouponCode("");
              }}
            />
          )}

          {/* Nút chọn voucher nếu chưa có voucher nào */}
          {!appliedShippingVoucher && !appliedProductVoucher && (
            <TouchableOpacity
              style={styles.voucherButtonFullWidth}
              onPress={() => {
                navigation.navigate("VoucherScreen", {
                  currentTotal: itemsSubtotal,
                  onVoucherSelect: (vouchers: {
                    shippingVoucher?: string;
                    productVoucher?: string;
                  }) => {
                    setAppliedShippingVoucher(null);
                    setAppliedProductVoucher(null);
                    setAppliedCoupon(null);

                    if (vouchers.shippingVoucher) {
                      const shippingVoucher = allVouchers.find(
                        (v) => v.code === vouchers.shippingVoucher
                      );
                      if (shippingVoucher) {
                        const validation = voucherService.isVoucherValid(
                          shippingVoucher,
                          itemsSubtotal
                        );
                        if (validation.valid) {
                          setAppliedShippingVoucher(shippingVoucher);
                          setCouponCode(shippingVoucher.code);
                        }
                      }
                    }

                    // Handle product voucher
                    if (vouchers.productVoucher) {
                      const productVoucher = allVouchers.find(
                        (v) => v.code === vouchers.productVoucher
                      );
                      if (productVoucher) {
                        const validation = voucherService.isVoucherValid(
                          productVoucher,
                          itemsSubtotal
                        );
                        if (validation.valid) {
                          setAppliedProductVoucher(productVoucher);
                          if (!vouchers.shippingVoucher) {
                            setCouponCode(productVoucher.code);
                          }
                        }
                      }
                    }
                  },
                });
              }}
            >
              <View style={styles.voucherButtonContent}>
                <Ionicons name="gift-outline" size={18} color="#FF6B7D" />
                <Text style={styles.voucherButtonText}>
                  Chọn voucher có sẵn
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#FF6B7D" />
            </TouchableOpacity>
          )}

          {/* Input cho voucher cũ (fallback) */}
          {/* <View style={styles.couponContainer}>
            <View style={styles.couponInputContainer}>
              <Ionicons name="pricetag-outline" size={20} color="#666" />
              <TextInput
                style={styles.couponInput}
                placeholder="Hoặc nhập mã voucher thủ công"
                value={couponCode}
                onChangeText={setCouponCode}
                placeholderTextColor="#999"
                autoCapitalize="characters"
              />
            </View>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApplyCoupon}
            >
              <Text style={styles.applyButtonText}>Áp dụng</Text>
            </TouchableOpacity>
          </View> */}

          {/* Hiển thị voucher cũ đã áp dụng */}
          {appliedCoupon &&
            !appliedShippingVoucher &&
            !appliedProductVoucher && (
              <View style={styles.couponAppliedRow}>
                <Ionicons name="checkmark-circle" size={18} color="#FF6B7D" />
                <Text style={styles.couponAppliedText}>
                  Đã áp dụng mã{" "}
                  <Text style={{ fontWeight: "700" }}>{appliedCoupon}</Text>
                </Text>
                <TouchableOpacity onPress={() => setAppliedCoupon(null)}>
                  <Text style={styles.removeCouponText}>Gỡ</Text>
                </TouchableOpacity>
              </View>
            )}
        </View>

        {/* Phương thức vận chuyển */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức vận chuyển</Text>

          <TouchableOpacity
            style={[
              styles.shippingOption,
              shippingMethod === "standard" && styles.shippingOptionSelected,
            ]}
            onPress={() => {
              setShippingMethod("standard");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View style={styles.shippingOptionLeft}>
              <Ionicons name="car-outline" size={20} color="#666" />
              <View style={styles.shippingOptionInfo}>
                <Text style={styles.shippingOptionTitle}>
                  Giao hàng tiêu chuẩn
                </Text>
                <Text style={styles.shippingOptionDesc}>
                  Nhận trong 3–5 ngày
                </Text>
              </View>
            </View>
            <Text style={styles.shippingOptionPrice}>{MONEY(30000)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.shippingOption,
              shippingMethod === "express" && styles.shippingOptionSelected,
            ]}
            onPress={() => {
              setShippingMethod("express");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View style={styles.shippingOptionLeft}>
              <Ionicons name="rocket-outline" size={20} color="#666" />
              <View style={styles.shippingOptionInfo}>
                <Text style={styles.shippingOptionTitle}>Giao hàng nhanh</Text>
                <Text style={styles.shippingOptionDesc}>
                  Nhận trong 1–2 ngày
                </Text>
              </View>
            </View>
            <Text style={styles.shippingOptionPrice}>{MONEY(60000)}</Text>
          </TouchableOpacity>
        </View>

        {/* Phương thức thanh toán */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === "cod" && styles.paymentOptionSelected,
            ]}
            onPress={() => {
              setPaymentMethod("cod");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View style={styles.paymentOptionLeft}>
              <View style={styles.paymentIconContainer}>
                <Image source={COD_LOGO} style={styles.paymentLogo} />
              </View>
              <Text style={styles.paymentOptionTitle}>
                Thanh toán khi nhận hàng (COD)
              </Text>
            </View>
            <View
              style={[
                styles.radioButton,
                paymentMethod === "cod" && styles.radioButtonSelected,
              ]}
            >
              {paymentMethod === "cod" && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === "momo" && styles.paymentOptionSelected,
            ]}
            onPress={() => {
              setPaymentMethod("momo");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View style={styles.paymentOptionLeft}>
              <View style={styles.paymentIconContainer}>
                <Image source={MOMO_LOGO} style={styles.paymentLogo} />
              </View>
              <Text style={styles.paymentOptionTitle}>Ví MoMo</Text>
            </View>
            <View
              style={[
                styles.radioButton,
                paymentMethod === "momo" && styles.radioButtonSelected,
              ]}
            >
              {paymentMethod === "momo" && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === "stripe" && styles.paymentOptionSelected,
            ]}
            onPress={() => {
              setPaymentMethod("stripe");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View style={styles.paymentOptionLeft}>
              <View style={styles.paymentIconContainer}>
                <Image source={STRIPE_LOGO} style={styles.paymentLogo} />
              </View>
              <Text style={styles.paymentOptionTitle}>
                Thẻ tín dụng/ghi nợ (Stripe)
              </Text>
            </View>
            <View
              style={[
                styles.radioButton,
                paymentMethod === "stripe" && styles.radioButtonSelected,
              ]}
            >
              {paymentMethod === "stripe" && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* --- TÓM TẮT CHI PHÍ --- */}
        <View style={[styles.section, styles.summaryCard]}>
          <View style={styles.summaryHeader}>
            <Ionicons name="receipt-outline" size={18} color="#FF6B7D" />
            <Text style={styles.summaryTitle}>Tóm tắt chi phí</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tiền hàng</Text>
            <Text style={styles.summaryValue}>{MONEY(itemsSubtotal)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Giảm giá</Text>
            <Text style={[styles.summaryValue, styles.negativeValue]}>
              -{MONEY(discountAmount)}
            </Text>
          </View>

          {/* Hiển thị giảm phí vận chuyển nếu có */}
          {shippingDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giảm phí vận chuyển</Text>
              <Text style={[styles.summaryValue, styles.negativeValue]}>
                -{MONEY(shippingDiscount)}
              </Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
            <Text style={styles.summaryValue}>{MONEY(effectiveShipping)}</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalLabel}>Tổng cộng</Text>
            <Text style={styles.summaryTotalValue}>{MONEY(finalTotal)}</Text>
          </View>

          {/* Hiển thị thông tin voucher đã áp dụng */}
          {appliedShippingVoucher && (
            <Text style={styles.summaryHint}>
              🚚 Đã áp dụng{" "}
              <Text style={{ fontWeight: "700" }}>
                {appliedShippingVoucher.code}
              </Text>{" "}
              — Giảm{" "}
              {appliedShippingVoucher.discountType === "percentage"
                ? `${appliedShippingVoucher.discountValue}%`
                : `${appliedShippingVoucher.discountValue.toLocaleString()}₫`}{" "}
              phí vận chuyển
            </Text>
          )}

          {appliedProductVoucher && (
            <Text style={styles.summaryHint}>
              🎁 Đã áp dụng{" "}
              <Text style={{ fontWeight: "700" }}>
                {appliedProductVoucher.code}
              </Text>{" "}
              — Giảm{" "}
              {appliedProductVoucher.discountType === "percentage"
                ? `${appliedProductVoucher.discountValue}%`
                : `${appliedProductVoucher.discountValue.toLocaleString()}₫`}{" "}
              trên tiền hàng
            </Text>
          )}

          {/* Fallback cho voucher cũ */}
          {!appliedShippingVoucher &&
            !appliedProductVoucher &&
            appliedCoupon === "FREESHIP" && (
              <Text style={styles.summaryHint}>
                Đã áp dụng <Text style={{ fontWeight: "700" }}>FREESHIP</Text> —
                miễn phí vận chuyển
              </Text>
            )}
          {!appliedShippingVoucher &&
            !appliedProductVoucher &&
            appliedCoupon === "HALORA10" && (
              <Text style={styles.summaryHint}>
                Giảm 10% trên tiền hàng (HALORA10)
              </Text>
            )}
          {!appliedShippingVoucher &&
            !appliedProductVoucher &&
            appliedCoupon === "HALORA30K" && (
              <Text style={styles.summaryHint}>
                Giảm trực tiếp 30.000₫ (HALORA30K)
              </Text>
            )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Tổng cộng & Đặt hàng */}
      <View style={styles.bottomSection}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Tổng cộng:</Text>
          <Text style={styles.totalAmount}>{MONEY(finalTotal)}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            isPlacingOrder && styles.placeOrderButtonDisabled,
          ]}
          onPress={handlePlaceOrder}
          disabled={isPlacingOrder}
        >
          <LinearGradient
            colors={isPlacingOrder ? ["#ccc", "#ddd"] : ["#FF6B7D", "#FF8A9B"]}
            style={styles.placeOrderGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.placeOrderText}>
              {isPlacingOrder ? "Đang xử lý..." : "Đặt hàng"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <UserInfoRequiredModal
        visible={showUserInfoModal}
        onClose={() => setShowUserInfoModal(false)}
        onNavigateToProfile={() => navigation.navigate("EditProfileScreen")}
        missingFields={validationResult.missingFields}
        message={createValidationMessage(validationResult)}
      />
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

  scrollView: {
    flex: 1,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  voucherButtonFullWidth: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF8F9",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE2E6",
    elevation: 1,
    shadowColor: "#FF6B7D",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    marginBottom: 16,
  },
  voucherButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  voucherButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8F9",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FFE2E6",
    elevation: 1,
    shadowColor: "#FF6B7D",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  voucherButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF6B7D",
    letterSpacing: 0.2,
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
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
    lineHeight: 18,
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
  couponContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  couponInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  couponInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: "#1a1a1a",
  },
  applyButton: {
    backgroundColor: "#FF6B7D",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  applyButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  couponAppliedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  couponAppliedText: {
    fontSize: 13,
    color: "#1a1a1a",
  },
  removeCouponText: {
    color: "#FF6B7D",
    fontWeight: "700",
  },

  shippingOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    marginBottom: 8,
  },
  shippingOptionSelected: {
    borderColor: "#FF6B7D",
    backgroundColor: "#FFF5F5",
  },
  shippingOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  shippingOptionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  shippingOptionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  shippingOptionDesc: {
    fontSize: 12,
    color: "#666",
  },
  shippingOptionPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF6B7D",
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    marginBottom: 8,
  },
  paymentOptionSelected: {
    borderColor: "#FF6B7D",
    backgroundColor: "#FFF5F5",
  },
  paymentOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  paymentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  paymentLogo: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
  paymentOptionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginLeft: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonSelected: {
    borderColor: "#FF6B7D",
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF6B7D",
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: "#FFE2E6",
    marginBottom: 30,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#444",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  negativeValue: {
    color: "#00A86B",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#F1F1F1",
    marginVertical: 10,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FF6B7D",
  },
  summaryHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#666",
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
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF6B7D",
  },
  placeOrderButton: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#FF6B7D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  placeOrderGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  placeOrderText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  placeOrderButtonDisabled: {
    opacity: 0.6,
  },
});

export default function CheckoutScreen() {
  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
    >
      <CheckoutContent />
    </StripeProvider>
  );
}
