import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../types/navigation";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/reducers/rootReducer";
import { getOrder, Order } from "../../services/orderService";

type OrderDetailScreenRouteProp = RouteProp<any, any>;
type OrderDetailScreenNavigationProp = StackNavigationProp<any, any>;

const MONEY = (n: number) => `${(n || 0).toLocaleString()}₫`;

export default function OrderDetailScreen() {
  const navigation = useNavigation<OrderDetailScreenNavigationProp>();
  const route = useRoute<OrderDetailScreenRouteProp>();
  const { orderId } = route.params as { orderId: string };
  const user = useSelector((state: RootState) => state.auth.user);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        if (!user) {
          setError("Vui lòng đăng nhập để xem chi tiết đơn hàng");
          setLoading(false);
          return;
        }

        console.log(
          "🔥 Fetching order details for:",
          orderId,
          "user:",
          user.uid
        );
        const orderData = await getOrder(user.uid, orderId);

        if (orderData) {
          console.log("🔥 Order found:", orderData);
          setOrder(orderData);
        } else {
          console.log("🔥 Order not found");
          setError("Không tìm thấy thông tin đơn hàng");
        }
      } catch (error) {
        console.error("🔥 Error fetching order:", error);
        setError("Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [orderId, user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#f39c12"; // Vàng
      case "confirmed":
        return "#3498db"; // Xanh dương
      case "shipped":
        return "#2ecc71"; // Xanh lá
      case "delivered":
        return "#27ae60"; // Xanh lá đậm
      case "cancelled":
        return "#e74c3c"; // Đỏ
      default:
        return "#95a5a6"; // Xám
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
        return "Đã xác nhận";
      case "shipped":
        return "Đang giao hàng";
      case "delivered":
        return "Đã giao hàng";
      case "cancelled":
        return "Đã hủy";
      default:
        return "Không xác định";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return "time-outline";
      case "confirmed":
        return "checkmark-circle-outline";
      case "shipped":
        return "car-outline";
      case "delivered":
        return "checkmark-done-circle-outline";
      case "cancelled":
        return "close-circle-outline";
      default:
        return "help-circle-outline";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B7D" />
          <Text style={styles.loadingText}>Đang tải thông tin đơn hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#e74c3c" />
          <Text style={styles.errorTitle}>Không thể tải thông tin</Text>
          <Text style={styles.errorMessage}>
            {error || "Không tìm thấy thông tin đơn hàng"}
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Order Status Section */}
        <View style={styles.statusSection}>
          <View
            style={[
              styles.statusIcon,
              { backgroundColor: getStatusColor(order.status) },
            ]}
          >
            <Ionicons
              name={getStatusIcon(order.status)}
              size={24}
              color="white"
            />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>
              {getStatusText(order.status)}
            </Text>
            <Text style={styles.statusDescription}>
              Đơn hàng #{order.id?.slice(-8).toUpperCase() || ""}
            </Text>
          </View>
        </View>

        {/* Order Information */}
        <View style={styles.infoSection}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#FF6B7D"
            />
            <Text style={styles.sectionTitle}>Thông tin đơn hàng</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Mã đơn hàng</Text>
              <Text style={styles.infoValue}>
                #{order.id?.slice(-8).toUpperCase() || ""}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Ngày đặt hàng</Text>
              <Text style={styles.infoValue}>
                {new Date(order.createdAt).toLocaleDateString("vi-VN")}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Phương thức thanh toán</Text>
              <Text style={styles.infoValue}>
                {order.paymentMethod === "cod"
                  ? "Thanh toán khi nhận hàng"
                  : "Ví MoMo"}
              </Text>
            </View>

            <View style={[styles.infoItem, styles.noBorder]}>
              <Text style={styles.infoLabel}>Phương thức vận chuyển</Text>
              <Text style={styles.infoValue}>
                {order.shippingMethod === "standard"
                  ? "Giao hàng tiêu chuẩn"
                  : "Giao hàng nhanh"}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.itemsSection}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="cart-outline" size={20} color="#FF6B7D" />
            <Text style={styles.sectionTitle}>Sản phẩm đã mua</Text>
          </View>

          {order.items.map((item, index) => (
            <View
              key={index}
              style={[
                styles.productItem,
                index === order.items.length - 1 ? styles.noBorder : {},
              ]}
            >
              <Image
                source={{
                  uri: item.image || "https://via.placeholder.com/60",
                }}
                style={styles.productImage}
                resizeMode="cover"
              />

              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.productPrice}>
                  {MONEY(parseFloat(item.price))}
                </Text>
                {item.selectedSize && (
                  <Text style={styles.productDetail}>
                    Size: {item.selectedSize}
                  </Text>
                )}
                {item.selectedColor && (
                  <Text style={styles.productDetail}>
                    Màu: {item.selectedColor}
                  </Text>
                )}
              </View>

              <View style={styles.productRight}>
                <Text style={styles.productQuantity}>x{item.quantity}</Text>
                <Text style={styles.productTotal}>
                  {MONEY(parseFloat(item.price) * item.quantity)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.summarySection}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="receipt-outline" size={20} color="#FF6B7D" />
            <Text style={styles.sectionTitle}>Tổng hóa đơn</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tiền hàng</Text>
              <Text style={styles.summaryValue}>
                {MONEY(order.itemsSubtotal)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
              <Text style={styles.summaryValue}>
                {MONEY(order.shippingCost)}
              </Text>
            </View>

            {order.discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Giảm giá</Text>
                <Text style={styles.discountValue}>
                  -{MONEY(order.discountAmount)}
                </Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>{MONEY(order.totalAmount)}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#7f8c8d",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#7f8c8d",
    textAlign: "center",
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: "#FF6B7D",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 2,
  },
  errorButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },

  // Status Section
  statusSection: {
    backgroundColor: "white",
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 6,
  },
  statusDescription: {
    fontSize: 14,
    color: "#7f8c8d",
  },

  // Section Styling
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: "white",
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    overflow: "hidden",
  },
  infoItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  infoLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "500",
  },
  noBorder: {
    borderBottomWidth: 0,
  },

  // Order Items Section
  itemsSection: {
    backgroundColor: "white",
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productItem: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    alignItems: "center",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: "#f1f2f6",
  },
  productInfo: {
    flex: 1,
    paddingHorizontal: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 13,
    color: "#FF6B7D",
    fontWeight: "500",
    marginBottom: 2,
  },
  productDetail: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 1,
  },
  productRight: {
    alignItems: "flex-end",
  },
  productQuantity: {
    fontSize: 13,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  productTotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2c3e50",
  },

  // Summary Section
  summarySection: {
    backgroundColor: "white",
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    overflow: "hidden",
    paddingVertical: 6,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  summaryValue: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "500",
  },
  discountValue: {
    fontSize: 14,
    color: "#e74c3c",
    fontWeight: "500",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B7D",
  },
});
