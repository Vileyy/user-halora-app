import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Order, OrderItem } from "../../services/orderService";

export interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
  placingOrder: boolean;
  cancellingOrder: boolean;
}

const initialState: OrderState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
  placingOrder: false,
  cancellingOrder: false,
};

// Async thunk for placing order with inventory management
export const placeOrderWithInventory = createAsyncThunk(
  "order/placeOrderWithInventory",
  async (
    {
      userId,
      orderData,
    }: {
      userId: string;
      orderData: Omit<Order, "id" | "createdAt" | "updatedAt" | "status">;
    },
    { rejectWithValue }
  ) => {
    try {
      // Import here to avoid circular dependencies
      const { placeOrder } = await import("../../services/orderService");
      const orderId = await placeOrder(userId, orderData);
      return { orderId, orderData: { ...orderData, id: orderId } };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Đặt hàng thất bại"
      );
    }
  }
);

// Async thunk for cancelling order with inventory restoration
export const cancelOrderWithInventory = createAsyncThunk(
  "order/cancelOrderWithInventory",
  async (
    { userId, orderId }: { userId: string; orderId: string },
    { rejectWithValue }
  ) => {
    try {
      const { cancelOrder } = await import("../../services/orderService");
      await cancelOrder(userId, orderId);
      return orderId;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Hủy đơn hàng thất bại"
      );
    }
  }
);

// Async thunk for fetching user orders
export const fetchUserOrders = createAsyncThunk(
  "order/fetchUserOrders",
  async (userId: string, { rejectWithValue }) => {
    try {
      const { getUserOrders } = await import("../../services/orderService");
      const orders = await getUserOrders(userId);
      return orders;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Lấy danh sách đơn hàng thất bại"
      );
    }
  }
);

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentOrder: (state, action: PayloadAction<Order | null>) => {
      state.currentOrder = action.payload;
    },
    updateOrderStatus: (
      state,
      action: PayloadAction<{ orderId: string; status: Order["status"] }>
    ) => {
      const { orderId, status } = action.payload;
      const orderIndex = state.orders.findIndex(
        (order) => order.id === orderId
      );
      if (orderIndex !== -1) {
        state.orders[orderIndex].status = status;
        state.orders[orderIndex].updatedAt = new Date().toISOString();
      }
      if (state.currentOrder?.id === orderId) {
        state.currentOrder.status = status;
        state.currentOrder.updatedAt = new Date().toISOString();
      }
    },
    addOrder: (state, action: PayloadAction<Order>) => {
      state.orders.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Place Order
      .addCase(placeOrderWithInventory.pending, (state) => {
        state.placingOrder = true;
        state.error = null;
      })
      .addCase(placeOrderWithInventory.fulfilled, (state, action) => {
        state.placingOrder = false;
        const newOrder: Order = {
          ...action.payload.orderData,
          id: action.payload.orderId,
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.orders.unshift(newOrder);
        state.currentOrder = newOrder;
      })
      .addCase(placeOrderWithInventory.rejected, (state, action) => {
        state.placingOrder = false;
        state.error = action.payload as string;
      })
      // Cancel Order
      .addCase(cancelOrderWithInventory.pending, (state) => {
        state.cancellingOrder = true;
        state.error = null;
      })
      .addCase(cancelOrderWithInventory.fulfilled, (state, action) => {
        state.cancellingOrder = false;
        const orderId = action.payload;
        const orderIndex = state.orders.findIndex(
          (order) => order.id === orderId
        );
        if (orderIndex !== -1) {
          state.orders[orderIndex].status = "cancelled";
          state.orders[orderIndex].updatedAt = new Date().toISOString();
        }
        if (state.currentOrder?.id === orderId) {
          state.currentOrder.status = "cancelled";
          state.currentOrder.updatedAt = new Date().toISOString();
        }
      })
      .addCase(cancelOrderWithInventory.rejected, (state, action) => {
        state.cancellingOrder = false;
        state.error = action.payload as string;
      })
      // Fetch Orders
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCurrentOrder, updateOrderStatus, addOrder } =
  orderSlice.actions;

export default orderSlice.reducer;
