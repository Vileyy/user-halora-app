import { useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ref, set, get, onValue, off } from "firebase/database";
import { auth, database } from "../services/firebase";
import { RootState } from "../redux/reducers/rootReducer";
import { useAuth } from "./useAuth";
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  setCartItems,
  toggleItemSelection,
  selectAllItems,
  unselectAllItems,
  selectItem,
  unselectItem,
  initializeSelected,
} from "../redux/slices/cartSlice";
import { CartItem } from "../redux/slices/cartSlice";

export const useCartSync = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const { user, isAuthenticated } = useAuth();

  // Sử dụng ref để theo dõi trạng thái
  const isLoaded = useRef(false);
  const shouldSync = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user || isLoaded.current) return;

    // console.log("🔄 Loading cart from Firebase for user:", user.uid);

    const loadCartFromFirebase = async () => {
      try {
        const cartRef = ref(database, `users/${user.uid}/cart`);
        const snapshot = await get(cartRef);
        const data = snapshot.val();

        // console.log("📦 Firebase cart data:", data);

        if (data && Array.isArray(data) && data.length > 0) {
          // console.log("✅ Loading existing cart items:", data);
          dispatch(setCartItems(data));
          dispatch(initializeSelected());
        } else {
          // console.log("📭 No cart data found, keeping current cart");
          dispatch(initializeSelected());
        }

        isLoaded.current = true;
        setTimeout(() => {
          shouldSync.current = true;
        }, 1000);
      } catch (error) {
        console.error("❌ Error loading cart:", error);
        isLoaded.current = true;
        shouldSync.current = true;
      }
    };

    loadCartFromFirebase();
  }, [user, isAuthenticated, dispatch]);

  useEffect(() => {
    if (!isAuthenticated || !user || !shouldSync.current) return;

    // console.log("💾 Syncing cart to Firebase:", cartItems);
    const cartRef = ref(database, `users/${user.uid}/cart`);
    set(cartRef, cartItems)
      .then(() => {
        // console.log("✅ Successfully synced to Firebase");
      })
      .catch((error) => {
        console.error("❌ Error syncing cart to Firebase:", error);
      });
  }, [cartItems, user, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      // console.log("🚪 User logged out, resetting sync state");
      isLoaded.current = false;
      shouldSync.current = false;
    }
  }, [isAuthenticated]);

  // Các hàm thao tác với giỏ hàng
  const addItemToCart = (product: Omit<CartItem, "selected"> | CartItem) => {
    const cartItem: CartItem = {
      ...product,
      quantity: product.quantity || 1,
      selected: true,
    };
    dispatch(addToCart(cartItem));
  };

  const removeItemFromCart = (productId: string) => {
    dispatch(removeFromCart(productId));
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      dispatch(removeFromCart(productId));
    } else {
      dispatch(updateQuantity({ id: productId, quantity }));
    }
  };

  const clearAllCart = () => {
    dispatch(clearCart());
  };

  const toggleItemSelect = (productId: string) => {
    dispatch(toggleItemSelection(productId));
  };

  const selectAllCartItems = () => {
    dispatch(selectAllItems());
  };

  const unselectAllCartItems = () => {
    dispatch(unselectAllItems());
  };

  const selectCartItem = (productId: string) => {
    dispatch(selectItem(productId));
  };

  const unselectCartItem = (productId: string) => {
    dispatch(unselectItem(productId));
  };

  const initializeCartSelection = () => {
    dispatch(initializeSelected());
  };

  return {
    cartItems,
    addItemToCart,
    removeItemFromCart,
    updateItemQuantity,
    clearAllCart,
    toggleItemSelect,
    selectAllCartItems,
    unselectAllCartItems,
    selectCartItem,
    unselectCartItem,
    initializeCartSelection,
  };
};
