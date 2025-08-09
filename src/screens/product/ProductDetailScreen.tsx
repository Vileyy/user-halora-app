import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import React from "react";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation";

type ProductDetailRouteProp = RouteProp<
  RootStackParamList,
  "ProductDetailScreen"
>;

export default function ProductDetailScreen() {
  const route = useRoute<ProductDetailRouteProp>();
  const { product } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: product.image }} style={styles.productImage} />

      <View style={styles.content}>
        <Text style={styles.productName}>{product.name}</Text>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            {parseInt(product.price).toLocaleString()}₫
          </Text>
          <View style={styles.flashDealBadge}>
            <Text style={styles.flashDealText}>🔥 Flash Deal</Text>
          </View>
        </View>

        <View style={styles.categoryContainer}>
          <Text style={styles.categoryLabel}>Danh mục:</Text>
          <Text style={styles.categoryValue}>{product.category}</Text>
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionLabel}>Mô tả sản phẩm:</Text>
          <Text style={styles.descriptionText}>{product.description}</Text>
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.infoLabel}>Thông tin sản phẩm:</Text>
          <Text style={styles.infoText}>
            • Sản phẩm chính hãng, chất lượng cao
          </Text>
          <Text style={styles.infoText}>• Giao hàng toàn quốc</Text>
          <Text style={styles.infoText}>• Hỗ trợ đổi trả trong 30 ngày</Text>
          <Text style={styles.infoText}>• Bảo hành chính hãng</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  productImage: {
    width: width,
    height: width * 0.8,
    resizeMode: "contain",
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    lineHeight: 32,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#e74c3c",
    marginRight: 15,
  },
  flashDealBadge: {
    backgroundColor: "#ff6b6b",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  flashDealText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginRight: 10,
  },
  categoryValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  descriptionContainer: {
    marginBottom: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  productInfo: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
    lineHeight: 20,
  },
});
