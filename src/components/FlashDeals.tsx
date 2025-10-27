import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { getDatabase, ref, onValue } from "firebase/database";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { filterOutOfStockProducts } from "../utils/inventoryUtils";

const TIMER_DURATION = 2 * 60 * 60; // 2 giờ = 7200 giây
const TIMER_STORAGE_KEY = "flash_deals_end_time";

interface Variant {
  price: number;
  size: string;
  stockQty: number;
  sku?: string;
}

interface FlashDealItem {
  id: string;
  name: string;
  price: string;
  description: string;
  image: string;
  category: string;
  brandId?: string;
  variants?: Variant[];
}

interface FlashDealsProps {
  onProductLongPress?: (product: FlashDealItem) => void;
}

const FlashDeals: React.FC<FlashDealsProps> = ({ onProductLongPress }) => {
  const [flashDeals, setFlashDeals] = useState<FlashDealItem[]>([]);
  const [countdown, setCountdown] = useState(TIMER_DURATION);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const db = getDatabase();
    const flashDealsRef = ref(db, "products");

    const unsubscribe = onValue(flashDealsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        let productsArray = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          .filter((product) => product.category === "FlashDeals");

        // Filter out products that are completely out of stock
        productsArray = filterOutOfStockProducts(productsArray);

        setFlashDeals(productsArray);
      }
    });

    return () => unsubscribe();
  }, []);

  // Khởi tạo và theo dõi thời gian đếm ngược
  useEffect(() => {
    const initializeCountdown = async () => {
      try {
        const endTimeString = await AsyncStorage.getItem(TIMER_STORAGE_KEY);

        let endTime;
        const currentTime = new Date().getTime();

        if (endTimeString) {
          endTime = parseInt(endTimeString);
          if (endTime <= currentTime) {
            endTime = currentTime + TIMER_DURATION * 1000;
            await AsyncStorage.setItem(TIMER_STORAGE_KEY, endTime.toString());
          }
        } else {
          endTime = currentTime + TIMER_DURATION * 1000;
          await AsyncStorage.setItem(TIMER_STORAGE_KEY, endTime.toString());
        }
        const remainingSeconds = Math.max(
          0,
          Math.floor((endTime - currentTime) / 1000)
        );
        setCountdown(remainingSeconds);
      } catch (error) {
        console.error("Error initializing countdown:", error);
        setCountdown(TIMER_DURATION);
      }
    };

    initializeCountdown();
  }, []);

  // Chạy đồng hồ đếm ngược
  useEffect(() => {
    if (countdown <= 0) {
      const resetCountdown = async () => {
        const newEndTime = new Date().getTime() + TIMER_DURATION * 1000;
        await AsyncStorage.setItem(TIMER_STORAGE_KEY, newEndTime.toString());
        setCountdown(TIMER_DURATION);
      };

      resetCountdown();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Hàm định dạng thời gian hh:mm:ss
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Xử lý khi bấm vào sản phẩm
  const handlePress = (product: FlashDealItem) => {
    // console.log("Product pressed:", product);
    navigation.navigate("ProductDetailScreen", { product });
  };

  // Hàm lấy giá hiển thị (ưu tiên variant đầu tiên)
  const getDisplayPrice = (item: FlashDealItem): string => {
    if (item.variants && item.variants.length > 0) {
      return item.variants[0].price.toLocaleString();
    }
    return parseInt(item.price).toLocaleString();
  };

  const renderItem = ({ item }: { item: FlashDealItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handlePress(item)}
      onLongPress={() => {
        onProductLongPress?.(item);
      }}
      delayLongPress={500}
    >
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>{getDisplayPrice(item)}₫</Text>
        {/* {item.variants && item.variants.length > 0 && (
          <Text style={styles.variantInfo}>{item.variants[0].size}ml</Text>
        )} */}
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/*Chỉnh phần tiêu đề + đồng hồ */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>🔥 Flash Deals</Text>
          <Text style={styles.timer}>⏳ {formatTime(countdown)}</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            // console.log("View all pressed");
            (navigation as any).navigate("ViewAllScreen", {
              category: "FlashDeals",
              title: "Flash Deals",
            });
          }}
        >
          <Text style={styles.viewAll}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.flashDealsBackground}>
        <FlatList
          data={flashDeals}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginRight: 8,
  },
  timer: {
    fontSize: 16,
    fontWeight: "bold",
    color: "red",
  },
  viewAll: {
    fontSize: 16,
    color: "black",
  },
  flashDealsBackground: {
    backgroundColor: "#ffeaea",
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  card: {
    width: 170,
    height: 260,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginRight: 12,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 120,
    resizeMode: "contain",
    borderRadius: 8,
  },
  infoContainer: {
    width: "100%",
    marginTop: 8,
    height: 110,
  },
  name: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    textAlign: "left",
    marginBottom: 4,
    height: 40,
  },
  price: {
    fontSize: 16,
    color: "red",
    fontWeight: "bold",
    marginVertical: 4,
    textAlign: "left",
    height: 24,
  },
  variantInfo: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginBottom: 4,
    textAlign: "left",
  },
  description: {
    fontSize: 13,
    color: "#666",
    textAlign: "left",
    lineHeight: 16,
    height: 32,
  },
});

export default FlashDeals;
