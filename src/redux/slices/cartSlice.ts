import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
  id: string;
  name: string;
  price: string;
  description: string;
  image: string;
  category: string;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  selected?: boolean;
  variant?: {
    size: string;
    price: number;
  };
}

// Type guard to ensure CartItem has valid data
const isValidCartItem = (item: any): item is CartItem => {
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    (typeof item.price === "string" || typeof item.price === "number") &&
    typeof item.quantity === "number" &&
    item.quantity > 0
  );
};

interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: [],
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find(
        (item) => item.id === action.payload.id
      );
      const sanitizedPayload = {
        ...action.payload,
        price: action.payload.price?.toString() || "0",
        name: action.payload.name || "Unknown Product",
        image: action.payload.image || "",
        category: action.payload.category || "Other",
        description: action.payload.description || "",
        selected: true,
      };

      if (existingItem) {
        existingItem.quantity += sanitizedPayload.quantity;
      } else {
        state.items.push(sanitizedPayload);
      }
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },

    removeSelectedItems: (state, action: PayloadAction<string[]>) => {
      state.items = state.items.filter(
        (item) => !action.payload.includes(item.id)
      );
    },

    keepOnlySelectedItems: (state, action: PayloadAction<string[]>) => {
      state.items = state.items.filter((item) =>
        action.payload.includes(item.id)
      );
    },

    updateQuantity: (
      state,
      action: PayloadAction<{ id: string; quantity: number }>
    ) => {
      const item = state.items.find((item) => item.id === action.payload.id);
      if (item) {
        item.quantity = action.payload.quantity;
      }
    },
    clearCart: (state) => {
      state.items = [];
    },

    setCartItems: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
    },

    toggleItemSelection: (state, action: PayloadAction<string>) => {
      const item = state.items.find((item) => item.id === action.payload);
      if (item) {
        item.selected = !item.selected;
      }
    },

    selectAllItems: (state) => {
      state.items.forEach((item) => {
        item.selected = true;
      });
    },

    unselectAllItems: (state) => {
      state.items.forEach((item) => {
        item.selected = false;
      });
    },

    selectItem: (state, action: PayloadAction<string>) => {
      const item = state.items.find((item) => item.id === action.payload);
      if (item) {
        item.selected = true;
      }
    },

    unselectItem: (state, action: PayloadAction<string>) => {
      const item = state.items.find((item) => item.id === action.payload);
      if (item) {
        item.selected = false;
      }
    },

    initializeSelected: (state) => {
      state.items.forEach((item) => {
        if (item.selected === undefined) {
          item.selected = true;
        }
      });
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  removeSelectedItems,
  keepOnlySelectedItems,
  updateQuantity,
  clearCart,
  setCartItems,
  toggleItemSelection,
  selectAllItems,
  unselectAllItems,
  selectItem,
  unselectItem,
  initializeSelected,
} = cartSlice.actions;
export default cartSlice.reducer;
