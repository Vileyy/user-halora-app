import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { getAuth, signOut } from "firebase/auth";
import { getDatabase, ref, onValue, off } from "firebase/database";
import { useAuth } from "../../hooks/useAuth";
import AuthRequiredModal from "../../components/AuthRequiredModal";

interface User {
  uid: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  name?: string;
  avatar?: string;
}

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen = ({ navigation }: ProfileScreenProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const auth = getAuth();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = () => {
    const currentUser = auth.currentUser;

    if (currentUser) {
      const db = getDatabase();
      const userRef = ref(db, `users/${currentUser.uid}`);

      const unsubscribe = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setUser(userData);
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return unsubscribe; // Return cleanup function
    } else {
      // Nếu không có user đăng nhập, không redirect nữa
      setLoading(false);
    }
  };

  const handleMenuPress = (menuItem: string) => {
    // Kiểm tra đăng nhập trước khi thực hiện action
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    switch (menuItem) {
      case "profile":
        // Navigate to profile edit screen
        break;
      case "password":
        // Navigate to change password screen
        break;
      case "history":
        // Navigate to purchase history screen
        break;
      case "orders":
        navigation.navigate("OrderStatusScreen");
        break;
      case "favorites":
        // Navigate to favorites screen
        break;
      case "logout":
        handleLogout();
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            // Sign out from Firebase Auth
            await signOut(auth);

            // Clear any stored user data/tokens here
            await AsyncStorage.multiRemove([
              "userToken",
              "userId",
              "userEmail",
              "isLoggedIn",
            ]);

            // Navigate to login screen and reset navigation stack
            navigation.reset({
              index: 0,
              routes: [{ name: "LoginScreen" }],
            });
          } catch (error) {
            console.error("Error during logout:", error);
            Alert.alert(
              "Lỗi",
              "Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại."
            );
          }
        },
      },
    ]);
  };

  const getDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) {
      const namePart = user.email.split("@")[0];
      return namePart.charAt(0).toUpperCase() + namePart.slice(1);
    }
    return "Người dùng";
  };

  const getAvatarInitials = () => {
    const name = getDisplayName();
    return name.charAt(0).toUpperCase();
  };

  const menuItems = [
    {
      id: "profile",
      title: "Thông tin cá nhân",
      icon: "person-outline",
      color: "#333",
    },
    {
      id: "password",
      title: "Đổi mật khẩu",
      icon: "lock-closed-outline",
      color: "#333",
    },
    {
      id: "history",
      title: "Lịch sử mua hàng",
      icon: "receipt-outline",
      color: "#333",
    },
    {
      id: "orders",
      title: "Tình trạng đơn hàng",
      icon: "document-text-outline",
      color: "#333",
    },
    {
      id: "favorites",
      title: "Sản phẩm yêu thích",
      icon: "heart-outline",
      color: "#333",
    },
    {
      id: "logout",
      title: "Đăng xuất",
      icon: "log-out-outline",
      color: "#ff4757",
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Đang tải...</Text>
      </View>
    );
  }

  // Render UI yêu cầu đăng nhập
  const renderNotLoggedIn = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="person-circle-outline" size={120} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>Cần đăng nhập</Text>
      <Text style={styles.emptySubtitle}>
        Vui lòng đăng nhập để xem thông tin cá nhân và sử dụng các tính năng
        khác
      </Text>
      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => setShowAuthModal(true)}
      >
        <Text style={styles.loginButtonText}>Đăng nhập ngay</Text>
      </TouchableOpacity>
    </View>
  );

  // Nếu chưa đăng nhập
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        {/* Header */}
        <View style={styles.profileHeader}>
          <Text style={styles.profileHeaderTitle}>Cá nhân</Text>
        </View>

        {/* Content */}
        {renderNotLoggedIn()}

        <AuthRequiredModal
          visible={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          title="Đăng nhập cần thiết"
          message="Vui lòng đăng nhập để truy cập thông tin cá nhân"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{getAvatarInitials()}</Text>
              </View>
            )}
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{getDisplayName()}</Text>
            <Text style={styles.userEmail}>
              {auth.currentUser?.email || user?.email || "email@example.com"}
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.lastMenuItem,
              ]}
              onPress={() => handleMenuPress(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={item.color}
                  />
                </View>
                <Text style={[styles.menuTitle, { color: item.color }]}>
                  {item.title}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={16} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* User Status Badge
        {user?.status && (
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                user.status === "active"
                  ? styles.activeBadge
                  : styles.bannedBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  user.status === "active"
                    ? styles.activeText
                    : styles.bannedText,
                ]}
              >
                {user.status === "active"
                  ? "Tài khoản hoạt động"
                  : "Tài khoản bị khóa"}
              </Text>
            </View>
          </View>
        )} */}
      </ScrollView>

      <AuthRequiredModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Đăng nhập cần thiết"
        message="Vui lòng đăng nhập để sử dụng tính năng này"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  userCard: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    marginTop: Platform.OS === "ios" ? 50 : 40,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#b8860b",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  menuContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  statusContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  activeBadge: {
    backgroundColor: "#e8f5e8",
  },
  bannedBadge: {
    backgroundColor: "#ffe8e8",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  activeText: {
    color: "#27ae60",
  },
  bannedText: {
    color: "#e74c3c",
  },
  profileHeader: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profileHeaderTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginTop: 24,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: "#FF6B7D",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#FF6B7D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default ProfileScreen;
