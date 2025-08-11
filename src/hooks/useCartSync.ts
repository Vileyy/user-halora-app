import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ref, set, get, onValue, off } from "firebase/database";
import { auth, database } from "../services/firebase";
import { RootState } from "../redux/reducers/rootReducer";
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
import { useAuth } from "./useAuth";

export const useCartSync = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const { user, isAuthenticated } = useAuth();

  // Lấy giỏ hàng từ Firebase khi component mount
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const cartRef = ref(database, `users/${user.uid}/cart`);

    const unsubscribe = onValue(
      cartRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Chuyển đổi object thành array nếu cần
          const items = Array.isArray(data) ? data : Object.values(data);
          dispatch(setCartItems(items));
        } else {
          dispatch(setCartItems([]));
        }
      },
      (error) => {
        console.error("Error fetching cart:", error);
      }
    );

    return () => {
      off(cartRef);
    };
  }, [user, dispatch]);

  // Đồng bộ giỏ hàng lên Firebase khi có thay đổi
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const cartRef = ref(database, `users/${user.uid}/cart`);
    set(cartRef, cartItems).catch((error) => {
      console.error("Error syncing cart to Firebase:", error);
    });
  }, [cartItems, user]);

  // Các hàm thao tác với giỏ hàng
  const addItemToCart = (product: Omit<CartItem, "quantity">) => {
    const cartItem: CartItem = {
      ...product,
      quantity: 1,
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

  // Thêm các function mới để quản lý việc chọn sản phẩm
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
