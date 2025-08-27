import { database } from "./firebase";
import { ref, push, set, get } from "firebase/database";

export interface OrderItem {
  id: string;
  name: string;
  price: string;
  description: string;
  image: string;
  category: string;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  variant?: {
    size: string;
    price: number;
  };
}

export interface Order {
  id?: string;
  items: OrderItem[];
  itemsSubtotal: number;
  discountAmount: number;
  shippingCost: number;
  totalAmount: number;
  shippingMethod: "standard" | "express";
  paymentMethod: "cod" | "momo";
  appliedCoupon?: string | null;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  createdAt: string;
  updatedAt: string;
}

/**
 * Hàm helper để loại bỏ undefined values từ object
 */
const removeUndefinedValues = (obj: any): any => {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedValues);
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = removeUndefinedValues(value);
    }
  }
  return result;
};

/**
 * Tạo order mới và lưu vào Firebase Realtime Database
 * Path: users/{userId}/orders/{orderId}
 */
export const createOrder = async (
  userId: string,
  orderData: Omit<Order, "id" | "createdAt" | "updatedAt" | "status">
): Promise<string> => {
  try {
    console.log("🔥 Firebase createOrder - Starting...");
    console.log("🔥 User ID:", userId);
    console.log("🔥 Input orderData:", JSON.stringify(orderData, null, 2));

    // Path: users/{userId}/orders
    const userOrdersRef = ref(database, `users/${userId}/orders`);
    console.log("🔥 User orders ref created");

    const newOrderRef = push(userOrdersRef);
    console.log("🔥 New order ref created, key:", newOrderRef.key);

    const order: Order = {
      ...orderData,
      id: newOrderRef.key!,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    console.log("🔥 Order object created:", JSON.stringify(order, null, 2));

    // Loại bỏ tất cả undefined values trước khi lưu vào Firebase
    const cleanOrder = removeUndefinedValues(order);
    // console.log(
    //   "🔥 Clean order (no undefined values):",
    //   JSON.stringify(cleanOrder, null, 2)
    // );

    console.log("🔥 Attempting to write to Firebase...");
    await set(newOrderRef, cleanOrder);
    console.log("🔥 Successfully wrote to Firebase!");

    // Kiểm tra lại xem order đã được lưu chưa
    console.log("🔥 Verifying order was saved...");
    const verification = await get(newOrderRef);
    if (verification.exists()) {
      console.log("🔥 ✅ Order verified: Data exists in Firebase!");
      console.log("🔥 Saved data:", verification.val());
    } else {
      console.log("🔥 ❌ Warning: Order verification failed - data not found!");
    }

    return newOrderRef.key!;
  } catch (error) {
    console.error("🔥 Error creating order:", error);
    console.error("🔥 Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error("Không thể tạo đơn hàng. Vui lòng thử lại.");
  }
};

/**
 * Lấy thông tin order theo ID của user
 * Path: users/{userId}/orders/{orderId}
 */
export const getOrder = async (
  userId: string,
  orderId: string
): Promise<Order | null> => {
  try {
    // console.log("🔥 Getting order:", orderId, "for user:", userId);
    const orderRef = ref(database, `users/${userId}/orders/${orderId}`);
    const snapshot = await get(orderRef);

    if (snapshot.exists()) {
      // console.log("🔥 Order found:", snapshot.val());
      return snapshot.val() as Order;
    }

    // console.log("🔥 Order not found");
    return null;
  } catch (error) {
    console.error("Error getting order:", error);
    throw new Error("Không thể lấy thông tin đơn hàng.");
  }
};

/**
 * Lấy danh sách orders của user
 * Path: users/{userId}/orders
 */
export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    // console.log("🔥 Getting all orders for user:", userId);
    const userOrdersRef = ref(database, `users/${userId}/orders`);
    const snapshot = await get(userOrdersRef);

    if (snapshot.exists()) {
      const ordersData = snapshot.val();
      const orders = Object.values(ordersData) as Order[];

      // console.log("🔥 Found orders:", orders.length);

      // Sắp xếp theo thời gian tạo (mới nhất trước)
      return orders.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    // console.log("🔥 No orders found for user");
    return [];
  } catch (error) {
    console.error("Error getting user orders:", error);
    throw new Error("Không thể lấy danh sách đơn hàng.");
  }
};

/**
 * Lấy danh sách product IDs từ purchase history (chỉ orders delivered)
 * Dùng cho AI recommendations
 */
export const getUserPurchaseHistory = async (
  userId: string
): Promise<string[]> => {
  try {
    console.log("🛒 Getting purchase history for user:", userId);
    const userOrdersRef = ref(database, `users/${userId}/orders`);
    const snapshot = await get(userOrdersRef);

    if (snapshot.exists()) {
      const ordersData = snapshot.val();
      const purchasedProductIds: string[] = [];

      // Lọc chỉ những orders đã delivered và lấy product IDs
      Object.values(ordersData).forEach((order: any) => {
        if (order.status === "delivered" && order.items) {
          order.items.forEach((item: OrderItem) => {
            if (item.id && !purchasedProductIds.includes(item.id)) {
              purchasedProductIds.push(item.id);
            }
          });
        }
      });

      // Sắp xếp theo thời gian mua gần nhất (orders mới nhất trước)
      const ordersWithTime = Object.values(ordersData)
        .filter((order: any) => order.status === "delivered")
        .sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      // Lấy product IDs theo thứ tự thời gian (sản phẩm mua gần nhất trước)
      const sortedProductIds: string[] = [];
      ordersWithTime.forEach((order: any) => {
        if (order.items) {
          order.items.forEach((item: OrderItem) => {
            if (item.id && !sortedProductIds.includes(item.id)) {
              sortedProductIds.push(item.id);
            }
          });
        }
      });

      console.log(
        "🛒 Purchase history found:",
        sortedProductIds.length,
        "unique products"
      );
      return sortedProductIds;
    }

    console.log("🛒 No purchase history found for user");
    return [];
  } catch (error) {
    console.error("Error getting purchase history:", error);
    return [];
  }
};

/**
 * Lấy recently viewed products từ user behavior (có thể lưu trong profile hoặc async storage)
 * Hiện tại return empty array, có thể implement sau
 */
export const getUserRecentlyViewed = async (
  userId: string
): Promise<string[]> => {
  try {
    // TODO: Implement recently viewed tracking
    // Có thể lưu trong users/{userId}/behavior/recentlyViewed
    // Hoặc sử dụng AsyncStorage cho session-based tracking
    return [];
  } catch (error) {
    console.error("Error getting recently viewed:", error);
    return [];
  }
};

/**
 * Cập nhật trạng thái order
 * Path: users/{userId}/orders/{orderId}
 */
export const updateOrderStatus = async (
  userId: string,
  orderId: string,
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
): Promise<void> => {
  try {
    const orderRef = ref(database, `users/${userId}/orders/${orderId}`);
    await set(orderRef, {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    throw new Error("Không thể cập nhật trạng thái đơn hàng.");
  }
};

/**
 * Hủy đơn hàng - cập nhật trạng thái thành cancelled
 * Path: users/{userId}/orders/{orderId}
 */
export const cancelOrder = async (
  userId: string,
  orderId: string
): Promise<void> => {
  try {
    // console.log("🔥 Cancelling order:", orderId, "for user:", userId);

    // Lấy thông tin đơn hàng hiện tại
    const orderRef = ref(database, `users/${userId}/orders/${orderId}`);
    const snapshot = await get(orderRef);

    if (!snapshot.exists()) {
      throw new Error("Không tìm thấy đơn hàng");
    }

    const currentOrder = snapshot.val() as Order;

    // Kiểm tra xem đơn hàng có thể hủy không
    if (
      currentOrder.status !== "pending" &&
      currentOrder.status !== "confirmed"
    ) {
      throw new Error("Không thể hủy đơn hàng đang được xử lý hoặc đã giao");
    }

    // Cập nhật trạng thái thành cancelled
    const updatedOrder = {
      ...currentOrder,
      status: "cancelled" as const,
      updatedAt: new Date().toISOString(),
    };

    await set(orderRef, updatedOrder);
    // console.log("🔥 Order cancelled successfully");
  } catch (error) {
    console.error("Error cancelling order:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể hủy đơn hàng. Vui lòng thử lại.");
  }
};

/**
 * Xóa items khỏi cart sau khi đặt hàng thành công
 * Path: users/{userId}/cart
 */
export const clearUserCart = async (userId: string): Promise<void> => {
  try {
    console.log("🔥 Clearing cart for user:", userId);
    const cartRef = ref(database, `users/${userId}/cart`);
    await set(cartRef, null);
    console.log("🔥 Cart cleared successfully");
  } catch (error) {
    console.error("Error clearing cart:", error);
    throw new Error("Không thể xóa giỏ hàng.");
  }
};

/**
 * Xóa specific items khỏi cart sau khi đặt hàng thành công
 * Path: users/{userId}/cart
 */
export const removeItemsFromUserCart = async (
  userId: string,
  itemIds: string[]
): Promise<void> => {
  try {
    console.log("🔥 Removing specific items from cart for user:", userId);
    console.log("🔥 Items to remove:", itemIds);

    const cartRef = ref(database, `users/${userId}/cart`);
    const snapshot = await get(cartRef);

    if (snapshot.exists()) {
      const currentCart = snapshot.val();
      console.log("🔥 Current cart:", currentCart);

      // Filter out the items that were purchased
      console.log("🔥 Current cart keys:", Object.keys(currentCart));
      console.log("🔥 Items to remove (itemIds):", itemIds);

      const updatedCart = Object.keys(currentCart)
        .filter((key) => {
          const shouldKeep = !itemIds.includes(key);
          console.log(`🔥 Key: ${key}, shouldKeep: ${shouldKeep}`);
          return shouldKeep;
        })
        .reduce((obj: any, key) => {
          obj[key] = currentCart[key];
          return obj;
        }, {});

      console.log("🔥 Updated cart after removing items:", updatedCart);

      // If cart is empty after removing items, set to null, otherwise update with remaining items
      if (Object.keys(updatedCart).length === 0) {
        await set(cartRef, null);
        console.log("🔥 Cart is now empty, set to null");
      } else {
        await set(cartRef, updatedCart);
        console.log("🔥 Cart updated with remaining items");
      }
    } else {
      console.log("🔥 No cart found for user");
    }
  } catch (error) {
    console.error("Error removing items from cart:", error);
    throw new Error("Không thể xóa sản phẩm khỏi giỏ hàng.");
  }
};

/**
 * Debug function - Lấy tất cả orders của user để kiểm tra
 */
export const getUserOrdersDebug = async (userId: string): Promise<void> => {
  try {
    console.log("🔥 DEBUG: Fetching all orders for user:", userId);
    const userOrdersRef = ref(database, `users/${userId}/orders`);
    const snapshot = await get(userOrdersRef);

    if (snapshot.exists()) {
      const allOrders = snapshot.val();
      console.log(
        "🔥 DEBUG: User orders in Firebase:",
        JSON.stringify(allOrders, null, 2)
      );
      console.log(
        "🔥 DEBUG: Total orders count:",
        Object.keys(allOrders).length
      );
    } else {
      console.log("🔥 DEBUG: No orders found for user in Firebase database");
    }
  } catch (error) {
    console.error("🔥 DEBUG: Error fetching user orders:", error);
  }
};
