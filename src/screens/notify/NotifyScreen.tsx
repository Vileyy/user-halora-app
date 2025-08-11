import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar,
  RefreshControl,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getDatabase, ref, onValue, off, update } from "firebase/database";

interface Notification {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  important: boolean;
  isRead: boolean;
}

interface NotifyScreenProps {
  navigation: any;
}

const NotifyScreen = ({ navigation }: NotifyScreenProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = () => {
    const db = getDatabase();
    const notificationsRef = ref(db, "notifications");

    onValue(notificationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const notificationsArray: Notification[] = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        setNotifications(notificationsArray);
      } else {
        setNotifications([]);
      }
      setLoading(false);
      setRefreshing(false);
    });

    return () => {
      off(notificationsRef);
    };
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const markAsRead = async (notificationId: string) => {
    const db = getDatabase();
    const notificationRef = ref(db, `notifications/${notificationId}`);

    try {
      await update(notificationRef, {
        isRead: true,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    setSelectedNotification(notification);
    setModalVisible(true);

    // Mark as read if not already read
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedNotification(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${hours}:${minutes} ${day}/${month}/${year}`;
  };

  const getIconColor = (index: number) => {
    const colors = ["#ff6b9d", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57"];
    return colors[index % colors.length];
  };

  const renderNotification = ({
    item,
    index,
  }: {
    item: Notification;
    index: number;
  }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadNotification,
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.8}
    >
      {/* Icon Circle */}
      <View
        style={[styles.iconContainer, { backgroundColor: getIconColor(index) }]}
      >
        <Ionicons name="notifications" size={20} color="#fff" />
      </View>

      {/* Notification Content */}
      <View style={styles.contentContainer}>
        <Text
          style={[styles.notificationTitle, !item.isRead && styles.unreadTitle]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text
          style={[
            styles.notificationContent,
            !item.isRead && styles.unreadContent,
          ]}
          numberOfLines={3}
        >
          {item.content}
        </Text>
        <Text style={styles.notificationTime}>
          {formatDate(item.createdAt)}
        </Text>
      </View>

      {/* Unread indicator */}
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Không có thông báo</Text>
      <Text style={styles.emptySubtitle}>
        Bạn sẽ nhận được thông báo khi có tin tức mới
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Thông báo</Text>
          <Text style={styles.unreadCount}>
            {notifications.filter((n) => !n.isRead).length} chưa đọc
          </Text>
        </View>
      </View>

      {/* Notifications List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6f61" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notificationsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#ff6f61"]}
              tintColor="#ff6f61"
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {/* Notification Detail Popup */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}
        >
          <TouchableOpacity
            style={styles.popupContainer}
            activeOpacity={1}
            onPress={() => {}}
          >
            {/* Popup Header */}
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>Thông báo</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Popup Content */}
            {selectedNotification && (
              <View style={styles.popupContent}>
                <Text style={styles.popupNotificationTitle}>
                  {selectedNotification.title}
                </Text>

                <Text style={styles.popupNotificationTime}>
                  {formatDate(selectedNotification.createdAt)}
                </Text>

                <ScrollView
                  style={styles.popupScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.popupNotificationContent}>
                    {selectedNotification.content}
                  </Text>
                </ScrollView>

                {selectedNotification.important && (
                  <View style={styles.importantBadge}>
                    <Ionicons name="star" size={14} color="#fff" />
                    <Text style={styles.importantText}>Quan trọng</Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  unreadCount: {
    fontSize: 14,
    color: "#ff6f61",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationsList: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: "relative",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  unreadNotification: {
    backgroundColor: "#fefefe",
    borderLeftWidth: 3,
    borderLeftColor: "#ff6f61",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
    lineHeight: 20,
  },
  unreadTitle: {
    fontWeight: "bold",
    color: "#000",
  },
  notificationContent: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
    marginBottom: 8,
  },
  unreadContent: {
    color: "#333",
    fontWeight: "500",
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },
  unreadDot: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff6f61",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  // Popup Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  popupContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  popupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  closeButton: {
    padding: 4,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  popupContent: {
    padding: 20,
  },
  popupNotificationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    lineHeight: 22,
  },
  popupNotificationTime: {
    fontSize: 14,
    color: "#999",
    marginBottom: 16,
  },
  popupScrollContent: {
    maxHeight: 200,
    marginBottom: 16,
  },
  popupNotificationContent: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
  },
  importantBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffd700",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  importantText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 4,
  },
});

export default NotifyScreen;
