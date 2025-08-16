import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  StatusBar,
  SafeAreaView,
  Alert,
} from "react-native";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, onValue } from "firebase/database";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../types/navigation";

type OrderHistoryScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "OrderHistoryScreen"
>;

interface OrderItem {
  id: string;
  name: string;
  price: string | number | undefined;
  image: string;
  quantity: number;
}

interface Order {
  id: string;
  status: string;
  deliveredDate?: string;
  createdAt?: string;
  updatedAt?: string;
  total?: number;
  totalAmount?: number;
  items: OrderItem[];
}

const OrderHistoryScreen = () => {
  const navigation = useNavigation<OrderHistoryScreenNavigationProp>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = () => {
    setLoading(true);
    const auth = getAuth();
    const userId = auth.currentUser?.uid;

    if (!userId) {
      setLoading(false);
      return;
    }

    const ordersRef = ref(getDatabase(), `users/${userId}/orders`);

    onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      const orderList: Order[] = [];

      if (data) {
        for (let key in data) {
          const order = data[key];
          if (order.status === "delivered") {
            orderList.push({ ...order, id: key });
          }
        }
        orderList.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      }

      setOrders(orderList);
      setLoading(false);
      setRefreshing(false);
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatPrice = (price: string | number | undefined | null) => {
    if (!price) {
      return "0 ₫";
    }

    // Convert string to number if needed
    const numPrice = typeof price === "string" ? parseFloat(price) : price;

    if (isNaN(numPrice)) {
      return "0 ₫";
    }

    return numPrice.toLocaleString("vi-VN") + " ₫";
  };

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) {
      return "Không xác định";
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Không xác định";
    }
    return `${date.toLocaleDateString("vi-VN")} · ${date.toLocaleTimeString(
      "vi-VN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    )}`;
  };

  const handleReorder = (product: OrderItem) => {
    if (!product || !product.id) {
      Alert.alert(
        "Thông báo",
        "Không thể đặt lại sản phẩm này. Vui lòng thử lại sau.",
        [{ text: "Đóng", style: "cancel" }]
      );
      return;
    }
    console.log("Navigating to product detail with ID:", product.id);
    try {
      navigation.navigate("ProductDetailScreen", {
        productId: product.id,
        product: {
          id: product.id,
          name: product.name,
          price: product.price ? product.price.toString() : "0",
          description: "",
          image: product.image,
          category: "",
        },
      });
    } catch (error) {
      console.error("Navigation error:", error);
      Alert.alert("Thông báo", "Không thể chuyển đến trang chi tiết sản phẩm");
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const totalItems =
      item.items?.reduce(
        (sum: number, product: OrderItem) => sum + (product.quantity || 0),
        0
      ) || 0;

    return (
      <View style={styles.card}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderCode}>Đơn hàng #{item.id.slice(-6)}</Text>
            <Text style={styles.dateText}>
              {formatDateTime(item.createdAt)}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={styles.statusIndicator} />
            <Text style={styles.statusText}>Đã giao</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.itemsContainer}>
          {item.items?.slice(0, 2).map((product: OrderItem, index: number) => (
            <View key={index} style={styles.productRow}>
              <Image
                source={{ uri: product.image }}
                style={styles.productImage}
                resizeMode="cover"
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>
                  {product.name}
                </Text>
                <View style={styles.productDetails}>
                  <Text style={styles.productPrice}>
                    {formatPrice(product.price)}
                  </Text>
                  <Text style={styles.productQuantity}>
                    x{product.quantity}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          {(item.items?.length || 0) > 2 && (
            <Text style={styles.moreItems}>
              + {(item.items?.length || 0) - 2} sản phẩm khác
            </Text>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.totalContainer}>
          <View style={styles.totalInfo}>
            <Text style={styles.totalItems}>{totalItems} sản phẩm</Text>
            <Text style={styles.totalPrice}>
              {formatPrice(item.totalAmount || item.total)}
            </Text>
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={() =>
                navigation.navigate("OrderDetailScreen", { orderId: item.id })
              }
            >
              <Text style={styles.viewDetailsText}>Xem chi tiết</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reorderButton}
              onPress={() => handleReorder(item.items?.[0])}
            >
              <Text style={styles.reorderText}>Đặt lại</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>Lịch sử mua hàng</Text>
      <Text style={styles.subtitle}>
        Danh sách các đơn hàng đã giao thành công
      </Text>
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={{
          uri: "https://cdn-icons-png.flaticon.com/512/4076/4076432.png",
        }}
        style={styles.emptyImage}
      />
      <Text style={styles.emptyTitle}>Chưa có đơn hàng nào</Text>
      <Text style={styles.emptySubtitle}>
        Bạn chưa có đơn hàng nào đã giao hàng
      </Text>
      <TouchableOpacity
        style={styles.shopNowButton}
        onPress={() => navigation.navigate("MainTabs")}
      >
        <Text style={styles.shopNowText}>Mua sắm ngay</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9F9F9" />
        <ActivityIndicator size="large" color="#FF6F61" />
        <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9F9" />
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FF6F61"]}
            tintColor="#FF6F61"
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerContainer: {
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  orderCode: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },
  dateText: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4CAF50",
  },
  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    width: "100%",
  },
  itemsContainer: {
    padding: 16,
  },
  productRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
  },
  productDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },
  productQuantity: {
    fontSize: 13,
    color: "#666",
    marginLeft: 8,
  },
  moreItems: {
    fontSize: 13,
    color: "#666",
    marginTop: 8,
    fontStyle: "italic",
  },
  totalContainer: {
    padding: 16,
  },
  totalInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalItems: {
    fontSize: 13,
    color: "#666",
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF6F61",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  viewDetailsButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#FF6F61",
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF6F61",
  },
  reorderButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#FF6F61",
    borderRadius: 8,
    marginLeft: 8,
    alignItems: "center",
  },
  reorderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    marginTop: 40,
  },
  emptyImage: {
    width: 100,
    height: 100,
    marginBottom: 24,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  shopNowButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: "#FF6F61",
    borderRadius: 8,
  },
  shopNowText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default OrderHistoryScreen;
