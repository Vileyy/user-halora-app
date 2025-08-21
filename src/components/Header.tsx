import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { TabParamList, RootStackParamList } from "../types/navigation";
import { useSelector } from "react-redux";
import { RootState } from "../redux/reducers/rootReducer";
import CartBadge from "./CartBadge";
import SearchDropdown from "./SearchDropdown";
import { CompositeNavigationProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { getDatabase, ref, onValue, off } from "firebase/database";

interface HeaderProps {
  search?: string;
  setSearch?: (text: string) => void;
  handleSearchSubmit?: () => void;
}

interface Product {
  id: string;
  name: string;
  price: string;
  description?: string;
  image: string;
  category?: string;
}

interface Notification {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  important: boolean;
  isRead: boolean;
}

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  StackNavigationProp<RootStackParamList>
>;

const Header: React.FC<HeaderProps> = ({
  search = "",
  setSearch,
  handleSearchSubmit,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Lấy số lượng sản phẩm trong giỏ hàng từ Redux
  const cartItems = useSelector((state: RootState) =>
    state.cart.items.reduce((total, item) => total + item.quantity, 0)
  );

  useEffect(() => {
    const database = getDatabase();
    const notificationsRef = ref(database, "notifications");

    const unsubscribe = onValue(
      notificationsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const notifications: Notification[] = Object.keys(data).map(
            (key) => ({
              id: key,
              ...data[key],
            })
          );

          // Count unread notifications
          const unreadNotifications = notifications.filter(
            (notification) => !notification.isRead
          );
          setUnreadCount(unreadNotifications.length);
        } else {
          setUnreadCount(0);
        }
      },
      (error) => {
        console.error("Error fetching notifications:", error);
        setUnreadCount(0);
      }
    );

    return () => off(notificationsRef, "value", unsubscribe);
  }, []);

  // Tổng số sản phẩm trong giỏ hàng
  const totalItems = cartItems;

  const handleMenuPress = () => {
    setIsMenuVisible(true);
    // console.log("Menu pressed");
  };

  const handleSearchPress = () => {
    if (handleSearchSubmit) {
      handleSearchSubmit();
    } else {
      navigation.navigate("SearchScreen");
    }
  };

  const handleNotificationPress = () => {
    navigation.navigate("NotifyScreen");
  };

  const handleCartPress = () => {
    navigation.navigate("CartScreen");
  };

  const handleProductSelect = (product: Product) => {
    setShowSearchDropdown(false);
    if (setSearch) {
      setSearch("");
    }
    navigation.navigate("ProductDetailScreen", {
      product: {
        ...product,
        description: product.description || "",
        category: product.category || "",
      },
    });
  };

  const handleSearchInputChange = (text: string) => {
    if (setSearch) {
      setSearch(text);
    }
    setShowSearchDropdown(text.trim().length > 0);
  };

  const handleSearchInputFocus = () => {
    if (search && search.trim().length > 0) {
      setShowSearchDropdown(true);
    }
  };

  const handleCloseDropdown = () => {
    setShowSearchDropdown(false);
  };

  return (
    <View style={styles.headerContainer}>
      {/* Overlay to close dropdown when tapping outside */}
      {showSearchDropdown && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleCloseDropdown}
        />
      )}

      <View style={styles.header}>
        {/* <TouchableOpacity style={styles.iconButton} onPress={handleMenuPress}>
          <Ionicons name="menu-outline" size={28} color="black" />
        </TouchableOpacity> */}

        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#888"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm"
            value={search}
            onChangeText={handleSearchInputChange}
            onSubmitEditing={handleSearchPress}
            onFocus={handleSearchInputFocus}
          />
        </View>

        {/* Thông báo */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleNotificationPress}
        >
          <Ionicons name="notifications-outline" size={24} color="black" />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Giỏ hàng */}
        {/* <TouchableOpacity style={styles.iconButton} onPress={handleCartPress}>
        <Ionicons name="cart-outline" size={24} color="black" />
        <CartBadge size="medium" />
      </TouchableOpacity> */}
      </View>

      {/* Search Dropdown - Moved outside header for better positioning */}
      <SearchDropdown
        searchText={search}
        onProductSelect={handleProductSelect}
        visible={showSearchDropdown}
        onClose={handleCloseDropdown}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    position: "relative",
    zIndex: 1000,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F08080",
    paddingHorizontal: 10,
    paddingBottom: 10,
    marginTop: -40,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    marginTop: 50,
    paddingHorizontal: 10,
    height: 40,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  iconButton: {
    backgroundColor: "white",
    borderRadius: 50,
    padding: 8,
    marginHorizontal: 10,
    marginTop: 50,
    marginLeft: -2,
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "red",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  notificationBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "red",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: "transparent",
  },
});

export default Header;
