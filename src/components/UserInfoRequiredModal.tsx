import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface UserInfoRequiredModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToProfile: () => void;
  missingFields: string[];
  message: string;
}

const { width } = Dimensions.get("window");

const UserInfoRequiredModal: React.FC<UserInfoRequiredModalProps> = ({
  visible,
  onClose,
  onNavigateToProfile,
  missingFields,
  message,
}) => {
  const modalAnimation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(modalAnimation, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleCompleteProfile = () => {
    onClose();
    onNavigateToProfile();
  };

  const getFieldDisplayName = (field: string): string => {
    switch (field) {
      case "name":
        return "Họ và tên";
      case "phone":
        return "Số điện thoại";
      case "address":
        return "Địa chỉ giao hàng";
      default:
        return field;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                {
                  scale: modalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
                {
                  translateY: modalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
              opacity: modalAnimation,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="person-circle-outline"
                size={60}
                color="#FF6B7D"
              />
            </View>
            <Text style={styles.title}>Cần cập nhật thông tin</Text>
            <Text style={styles.subtitle}>{message}</Text>
          </View>

          {/* Missing Fields List */}
          <View style={styles.fieldsContainer}>
            <Text style={styles.fieldsTitle}>Thông tin cần bổ sung:</Text>
            {missingFields.map((field, index) => (
              <View key={field} style={styles.fieldItem}>
                <View style={styles.fieldDot} />
                <Text style={styles.fieldText}>
                  {getFieldDisplayName(field)}
                </Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Để sau</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleCompleteProfile}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#FF6B7D", "#FF8A9B"]}
                style={styles.confirmGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="person-outline" size={18} color="#fff" />
                <Text style={styles.confirmButtonText}>Cập nhật ngay</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: width * 0.9,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  fieldsContainer: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  fieldsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  fieldItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  fieldDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF6B7D",
    marginRight: 12,
  },
  fieldText: {
    fontSize: 15,
    color: "#555",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  confirmButton: {
    flex: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  confirmGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});

export default UserInfoRequiredModal;
