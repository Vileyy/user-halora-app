import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
  Alert,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../types/navigation";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/reducers/rootReducer";
import { getOrder, Order, cancelOrder } from "../../services/orderService";

const { width } = Dimensions.get("window");

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
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [processingCancel, setProcessingCancel] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));

  // Animation for modal
  useEffect(() => {
    if (cancelModalVisible) {
      Animated.spring(animatedValue, {
        toValue: 1,
        friction: 7,
        tension: 70,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [cancelModalVisible]);

  const modalTranslateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  const modalOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        if (!user) {
          setError("Vui lòng đăng nhập để xem chi tiết đơn hàng");
          setLoading(false);
          return;
        }

        // console.log(
        //   "🔥 Fetching order details for:",
        //   orderId,
        //   "user:",
        //   user.uid
        // );
        const orderData = await getOrder(user.uid, orderId);

        if (orderData) {
          // console.log("🔥 Order found:", orderData);
          setOrder(orderData);
        } else {
          // console.log("🔥 Order not found");
          setError("Không tìm thấy thông tin đơn hàng");
        }
      } catch (error) {
        // console.error("🔥 Error fetching order:", error);
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
      case "processing":
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
      case "processing":
        return "Đang xử lý";
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

  const handleCancelOrder = async () => {
    try {
      setProcessingCancel(true);

      if (!user || !order?.id) {
        throw new Error("Không có thông tin người dùng hoặc đơn hàng");
      }

      await cancelOrder(user.uid, order.id);

      // Cập nhật state local
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              status: "cancelled",
              updatedAt: new Date().toISOString(),
            }
          : null
      );

      setCancelModalVisible(false);
      Toast.show({
        text1: "Đã hủy đơn hàng thành công",
        type: "success",
      });
    } catch (error) {
      console.error("Error cancelling order:", error);
      // Có thể thêm alert thông báo lỗi ở đây
      alert(
        error instanceof Error
          ? error.message
          : "Không thể hủy đơn hàng. Vui lòng thử lại."
      );
    } finally {
      setProcessingCancel(false);
    }
  };

  const handleReorder = () => {
    navigation.navigate("MainTabs");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return "time-outline";
      case "confirmed":
        return "checkmark-circle-outline";
      case "processing":
        return "construct-outline";
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
              {order.status === "pending" &&
                "Đơn hàng của bạn đang chờ xác nhận"}
              {order.status === "confirmed" &&
                "Đơn hàng của bạn đã được xác nhận"}
              {order.status === "processing" &&
                "Đơn hàng của bạn đang được xử lý"}
              {order.status === "shipped" && "Đơn hàng của bạn đang được giao"}
              {order.status === "delivered" &&
                "Đơn hàng của bạn đã được giao thành công"}
              {order.status === "cancelled" &&
                "Đơn hàng đã bị hủy. Bạn có thể đặt mua lại các sản phẩm này."}
            </Text>
          </View>
        </View>

        {/* Quick Info Bar */}
        <View style={styles.quickInfoBar}>
          <View style={styles.quickInfoItem}>
            <Text style={styles.quickInfoLabel}>Mã đơn</Text>
            <Text style={styles.quickInfoValue}>
              #{order.id?.slice(-6).toUpperCase() || ""}
            </Text>
          </View>
          <View style={styles.quickInfoDivider} />
          <View style={styles.quickInfoItem}>
            <Text style={styles.quickInfoLabel}>Ngày đặt</Text>
            <Text style={styles.quickInfoValue}>
              {new Date(order.createdAt).toLocaleDateString("vi-VN")}
            </Text>
          </View>
          <View style={styles.quickInfoDivider} />
          <View style={styles.quickInfoItem}>
            <Text style={styles.quickInfoLabel}>Tổng tiền</Text>
            <Text style={styles.quickInfoValueTotal}>
              {MONEY(order.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Order Timeline */}
        {order.status && order.status !== "cancelled" && (
          <View style={styles.timelineSection}>
            <Text style={styles.sectionTitle}>Tiến trình đơn hàng</Text>
            <View style={styles.timeline}>
              <TimelineItem
                title="Đặt hàng"
                time={new Date(order.createdAt).toLocaleString("vi-VN")}
                status="Hoàn thành"
                isActive={true}
                isFirst={true}
              />
              <TimelineItem
                title="Xác nhận"
                time={
                  order.status === "confirmed" ||
                  order.status === "processing" ||
                  order.status === "shipped" ||
                  order.status === "delivered"
                    ? new Date(order.updatedAt).toLocaleString("vi-VN")
                    : "Đang chờ"
                }
                status={
                  order.status === "confirmed" ||
                  order.status === "processing" ||
                  order.status === "shipped" ||
                  order.status === "delivered"
                    ? "Hoàn thành"
                    : "Đang chờ"
                }
                isActive={
                  order.status === "confirmed" ||
                  order.status === "processing" ||
                  order.status === "shipped" ||
                  order.status === "delivered"
                }
              />
              <TimelineItem
                title="Đang xử lý"
                time={
                  order.status === "processing" ||
                  order.status === "shipped" ||
                  order.status === "delivered"
                    ? new Date(order.updatedAt).toLocaleString("vi-VN")
                    : "Đang chờ"
                }
                status={
                  order.status === "processing" ||
                  order.status === "shipped" ||
                  order.status === "delivered"
                    ? "Hoàn thành"
                    : "Đang chờ"
                }
                isActive={
                  order.status === "processing" ||
                  order.status === "shipped" ||
                  order.status === "delivered"
                }
              />
              <TimelineItem
                title="Đang giao"
                time={
                  order.status === "shipped" || order.status === "delivered"
                    ? new Date(order.updatedAt).toLocaleString("vi-VN")
                    : "Đang chờ"
                }
                status={
                  order.status === "shipped" || order.status === "delivered"
                    ? "Hoàn thành"
                    : "Đang chờ"
                }
                isActive={
                  order.status === "shipped" || order.status === "delivered"
                }
              />
              <TimelineItem
                title="Đã giao"
                time={
                  order.status === "delivered"
                    ? new Date(order.updatedAt).toLocaleString("vi-VN")
                    : "Đang chờ"
                }
                status={
                  order.status === "delivered" ? "Hoàn thành" : "Đang chờ"
                }
                isActive={order.status === "delivered"}
                isLast={true}
              />
            </View>
          </View>
        )}

        {/* Order Information */}
        <View style={styles.infoSection}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#3498db"
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
            <Ionicons name="cart-outline" size={20} color="#3498db" />
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
                {item.variant && (
                  <Text style={styles.productVariant}>
                    Dung tích: {item.variant.size}ml
                  </Text>
                )}
                <Text style={styles.productPrice}>
                  {MONEY(parseFloat(item.price))}
                </Text>
                <Text style={styles.productQuantity}>x{item.quantity}</Text>
              </View>

              <Text style={styles.productTotal}>
                {MONEY(parseFloat(item.price) * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.summarySection}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="receipt-outline" size={20} color="#3498db" />
            <Text style={styles.sectionTitle}>Tổng hóa đơn</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tạm tính</Text>
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

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {/* Nút Hủy đơn hàng - chỉ hiển thị khi status là pending hoặc confirmed */}
          {(order.status === "pending" || order.status === "confirmed") && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setCancelModalVisible(true)}
            >
              <Ionicons
                name="close-circle-outline"
                size={20}
                color="#e74c3c"
                style={styles.buttonIcon}
              />
              <Text style={styles.cancelButtonText}>Hủy đơn hàng</Text>
            </TouchableOpacity>
          )}

          {/* Nút Đánh giá sản phẩm - chỉ hiển thị khi status là delivered */}
          {order.status === "delivered" && (
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() => {
                if (order.id) {
                  navigation.navigate("MultiProductReviewScreen", {
                    orderId: order.id,
                  });
                }
              }}
            >
              <Ionicons
                name="star-outline"
                size={20}
                color="#f39c12"
                style={styles.buttonIcon}
              />
              <Text style={styles.reviewButtonText}>Đánh giá sản phẩm</Text>
            </TouchableOpacity>
          )}

          {/* Nút Mua lại - chỉ hiển thị khi status là cancelled */}
          {order.status === "cancelled" && (
            <TouchableOpacity
              style={styles.reorderButton}
              onPress={handleReorder}
            >
              <Ionicons
                name="refresh-outline"
                size={20}
                color="#2ecc71"
                style={styles.buttonIcon}
              />
              <Text style={styles.reorderButtonText}>Mua lại</Text>
            </TouchableOpacity>
          )}

          {/* Nút Liên hệ hỗ trợ - luôn hiển thị */}
          <TouchableOpacity
            style={[
              styles.supportButton,
              // Điều chỉnh width dựa trên số lượng nút hiển thị
              order.status === "pending" ||
              order.status === "confirmed" ||
              order.status === "delivered" ||
              order.status === "cancelled"
                ? {}
                : { width: "100%" },
            ]}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={20}
              color="white"
              style={styles.buttonIcon}
            />
            <Text style={styles.supportButtonText}>Liên hệ hỗ trợ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom Cancel Order Modal */}
      <Modal
        transparent={true}
        visible={cancelModalVisible}
        onRequestClose={() => setCancelModalVisible(false)}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ translateY: modalTranslateY }],
                opacity: modalOpacity,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <MaterialIcons name="error-outline" size={46} color="#e74c3c" />
              <Text style={styles.modalTitle}>Xác nhận hủy đơn hàng</Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                Bạn có chắc chắn muốn hủy đơn hàng này không? Sau khi hủy, đơn
                hàng sẽ không thể khôi phục.
              </Text>

              <View style={styles.orderSummaryInModal}>
                <Text style={styles.orderIdInModal}>
                  Mã đơn hàng: #{order.id?.slice(-6).toUpperCase() || ""}
                </Text>
                <Text style={styles.totalAmountInModal}>
                  Giá trị: {MONEY(order.totalAmount)}
                </Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setCancelModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Không, giữ lại</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleCancelOrder}
                disabled={processingCancel}
              >
                {processingCancel ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>
                    Có, hủy đơn hàng
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// TimelineItem Component
const TimelineItem = ({
  title,
  time,
  status,
  isActive,
  isFirst = false,
  isLast = false,
}: {
  title: string;
  time: string;
  status: string;
  isActive: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}) => {
  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineLeft}>
        <View
          style={[
            styles.timelinePoint,
            isActive ? styles.activePoint : styles.inactivePoint,
          ]}
        />
        {!isLast && (
          <View
            style={[
              styles.timelineLine,
              isActive ? styles.activeLine : styles.inactiveLine,
            ]}
          />
        )}
      </View>
      <View style={styles.timelineContent}>
        <Text style={styles.timelineTitle}>{title}</Text>
        <Text style={styles.timelineTime}>{time}</Text>
        <Text
          style={[
            styles.timelineStatus,
            { color: status === "Hoàn thành" ? "#2ecc71" : "#f39c12" },
          ]}
        >
          {status}
        </Text>
      </View>
    </View>
  );
};

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
    backgroundColor: "#3498db",
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

  // Quick Info Bar
  quickInfoBar: {
    flexDirection: "row",
    backgroundColor: "white",
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickInfoItem: {
    alignItems: "center",
    flex: 1,
  },
  quickInfoDivider: {
    width: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 5,
  },
  quickInfoLabel: {
    fontSize: 12,
    color: "#95a5a6",
    marginBottom: 4,
  },
  quickInfoValue: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "500",
  },
  quickInfoValueTotal: {
    fontSize: 14,
    color: "#e74c3c",
    fontWeight: "700",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    lineHeight: 20,
  },

  // Timeline Section
  timelineSection: {
    backgroundColor: "white",
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeline: {
    marginTop: 12,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 12,
  },
  timelineLeft: {
    width: 24,
    alignItems: "center",
  },
  timelinePoint: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
  },
  activePoint: {
    backgroundColor: "#3498db",
    borderColor: "#e1f0fa",
  },
  inactivePoint: {
    backgroundColor: "#bdc3c7",
    borderColor: "#ecf0f1",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    marginBottom: 4,
  },
  activeLine: {
    backgroundColor: "#3498db",
  },
  inactiveLine: {
    backgroundColor: "#bdc3c7",
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 16,
    paddingBottom: 16,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 13,
    color: "#7f8c8d",
    marginBottom: 2,
  },
  timelineStatus: {
    fontSize: 12,
    fontWeight: "500",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontWeight: "500",
    color: "#2c3e50",
    marginBottom: 4,
  },
  productVariant: {
    fontSize: 12,
    color: "#666",
    fontWeight: "400",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 13,
    color: "#7f8c8d",
    marginBottom: 2,
  },
  productQuantity: {
    fontSize: 13,
    color: "#7f8c8d",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: "#e74c3c",
  },

  // Action Section
  actionSection: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#fff0f0",
    borderWidth: 1,
    borderColor: "#ffcece",
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#e74c3c",
    fontWeight: "600",
    fontSize: 14,
  },
  reviewButton: {
    flex: 1,
    backgroundColor: "#fff8e1",
    borderWidth: 1,
    borderColor: "#ffe082",
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  reviewButtonText: {
    color: "#f39c12",
    fontWeight: "600",
    fontSize: 14,
  },
  reorderButton: {
    flex: 1,
    backgroundColor: "#e8f5e8",
    borderWidth: 1,
    borderColor: "#a8d8a8",
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  reorderButtonText: {
    color: "#2ecc71",
    fontWeight: "600",
    fontSize: 14,
  },
  supportButton: {
    flex: 1,
    backgroundColor: "#3498db",
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  supportButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  buttonIcon: {
    marginRight: 8,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 5,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 12,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalText: {
    fontSize: 14,
    color: "#7f8c8d",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 16,
  },
  orderSummaryInModal: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  orderIdInModal: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "500",
    marginBottom: 6,
  },
  totalAmountInModal: {
    fontSize: 16,
    color: "#e74c3c",
    fontWeight: "bold",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#f5f6fa",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginRight: 12,
  },
  modalCancelButtonText: {
    color: "#7f8c8d",
    fontWeight: "600",
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: "#e74c3c",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalConfirmButtonText: {
    color: "white",
    fontWeight: "600",
  },
});
