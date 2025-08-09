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
import { TabParamList } from "../types/navigation";

interface HeaderProps {
  search?: string;
  setSearch?: (text: string) => void;
  handleSearchSubmit?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  search = "",
  setSearch,
  handleSearchSubmit,
}) => {
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartItems, setCartItems] = useState(0); 

  useEffect(() => {
    // Mock fetch notifications
    const fetchNotifications = () => {
      // Simulate unread notifications
      setUnreadCount(3);
    };

    fetchNotifications();
  }, []);

  // Mock total items in cart
  const totalItems = cartItems;

  const handleMenuPress = () => {
    setIsMenuVisible(true);
    console.log("Menu pressed");
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
    console.log("Cart pressed");
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.iconButton} onPress={handleMenuPress}>
        <Ionicons name="menu-outline" size={28} color="black" />
      </TouchableOpacity>

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
          onChangeText={setSearch}
          onSubmitEditing={handleSearchPress}
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
      <TouchableOpacity style={styles.iconButton} onPress={handleCartPress}>
        <Ionicons name="cart-outline" size={24} color="black" />
        {totalItems > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{totalItems}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F08080",
    paddingHorizontal: 10,
    paddingBottom: 10,
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
});

export default Header;
