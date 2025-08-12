import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";

const OrderSuccessScreen = () => {
  const navigation = useNavigation();
  const scaleAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();

    const timeout = setTimeout(() => {
      navigation.navigate("MainTabs" as never);
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.successContainer,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons name="check-circle" size={100} color="#4CAF50" />
        </View>
        <Text style={styles.title}>Đặt hàng thành công!</Text>
        <Text style={styles.subtitle}>
          Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi
        </Text>
        <Text style={styles.message}>
          Chúng tôi sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  successContainer: {
    alignItems: "center",
    padding: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
});

export default OrderSuccessScreen;