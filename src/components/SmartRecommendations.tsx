import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { aiService } from "../services/aiService";
import { ProductRecommendation, SmartRecommendationContext } from "../types/ai";

const { width } = Dimensions.get("window");

interface SmartRecommendationsProps {
  title?: string;
  context: SmartRecommendationContext;
  currentProducts?: any[];
  maxItems?: number;
  showReason?: boolean;
  onProductPress?: (product: ProductRecommendation) => void;
}

const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  title = "Gợi ý dành cho bạn",
  context,
  currentProducts = [],
  maxItems = 5,
  showReason = true,
  onProductPress,
}) => {
  const navigation = useNavigation();
  const [recommendations, setRecommendations] = useState<
    ProductRecommendation[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shownRecommendations, setShownRecommendations] = useState<string[]>(
    []
  );
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());

  useEffect(() => {
    loadRecommendations();
  }, [
    context.userId,
    context.currentProduct,
    currentProducts.length,
    context.purchaseHistory?.length,
    context.recentlyViewed?.length,
    JSON.stringify(context.purchaseHistory?.slice(0, 3)),
  ]);

  // Auto refresh every 5 minutes nếu user đang active
  useEffect(() => {
    const autoRefreshInterval = setInterval(() => {
      if (!loading && recommendations.length > 0) {
        setShownRecommendations([]);
        loadRecommendations();
      }
    }, 1 * 60 * 1000);

    return () => clearInterval(autoRefreshInterval);
  }, [loading, recommendations.length]);

  const loadRecommendations = async () => {
    if (!context.userId || currentProducts.length === 0) {
      // console.log("⏳ Waiting for user ID and products to load...");
      return;
    }

    // console.log("🚀 Starting recommendations load for user:", context.userId);
    setLoading(true);
    setError(null);

    try {
      const userBehavior = {
        viewedProducts: context.recentlyViewed,
        purchaseHistory: context.purchaseHistory,
        favorites: context.favorites,
        searchHistory: context.searchHistory,
        skinType: (context as any).skinType,
        age: (context as any).age,
        concerns: (context as any).concerns,
      };

      const recs = await aiService.getSmartRecommendations(
        context.userId,
        currentProducts,
        userBehavior,
        shownRecommendations
      );

      setRecommendations(recs.slice(0, maxItems));
      setLastRefreshTime(Date.now());

      // save the new recommendations
      const newShownIds = recs.map((r) => r.id);
      setShownRecommendations((prev) => [...prev, ...newShownIds]);
    } catch (err) {
      console.error("Smart Recommendations Error:", err);
      setError("Không thể tải gợi ý. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    // console.log("🔄 Manual refresh triggered");
    // Reset shown recommendations to see the new products
    setShownRecommendations([]);
    loadRecommendations();
  };

  const handleProductPress = (product: ProductRecommendation) => {
    if (onProductPress) {
      onProductPress(product);
    } else {
      (navigation as any).navigate("ProductDetailScreen", {
        productId: product.id,
        product: product,
      });
    }
  };

  const formatPrice = (price: string | number): string => {
    if (!price) return "0₫";
    const priceStr = price.toString();
    const priceNumber = parseInt(priceStr.replace(/[^\d]/g, ""));
    return isNaN(priceNumber) ? "0₫" : `${priceNumber.toLocaleString()}₫`;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return "#4CAF50"; // Xanh lá
    if (confidence >= 0.6) return "#FF9800"; // Cam
    return "#757575"; // Xám
  };

  const renderRecommendationItem = ({
    item,
    index,
  }: {
    item: ProductRecommendation;
    index: number;
  }) => (
    <TouchableOpacity
      style={[styles.recommendationCard, { marginLeft: index === 0 ? 16 : 8 }]}
      onPress={() => handleProductPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.productImage} />
        <View
          style={[
            styles.confidenceBadge,
            { backgroundColor: getConfidenceColor(item.confidence) },
          ]}
        >
          <Text style={styles.confidenceText}>
            {Math.round(item.confidence * 100)}%
          </Text>
        </View>
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>

        {showReason && (
          <View style={styles.reasonContainer}>
            <Ionicons name="bulb-outline" size={12} color="#FF99CC" />
            <Text style={styles.reasonText} numberOfLines={2}>
              {item.reason}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="sparkles-outline" size={48} color="#ccc" />
      <Text style={styles.emptyText}>Chưa có gợi ý nào cho bạn</Text>
      <Text style={styles.emptySubtext}>
        Hãy xem thêm sản phẩm để nhận được gợi ý tốt hơn!
      </Text>
    </View>
  );

  if (error && !loading && recommendations.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons name="sparkles" size={20} color="#FF99CC" />
            <Text style={styles.title}>{title}</Text>
          </View>
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color="#f44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadRecommendations}
          >
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="sparkles" size={20} color="#FF99CC" />
          <Text style={styles.title}>{title}</Text>
        </View>

        {loading && <ActivityIndicator size="small" color="#FF99CC" />}

        <TouchableOpacity onPress={handleRefresh} disabled={loading}>
          <Ionicons
            name="refresh"
            size={20}
            color={loading ? "#ccc" : "#FF99CC"}
          />
        </TouchableOpacity>
      </View>

      {loading && recommendations.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF99CC" />
          <Text style={styles.loadingText}>Đang tạo gợi ý cho bạn...</Text>
        </View>
      ) : recommendations.length > 0 ? (
        <FlatList
          data={recommendations}
          renderItem={renderRecommendationItem}
          keyExtractor={(item, index) => `${item.id}_${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        renderEmptyState()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  listContainer: {
    paddingRight: 16,
  },
  recommendationCard: {
    width: width * 0.4,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    resizeMode: "cover",
  },
  confidenceBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    minHeight: 36,
  },
  reasonContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f8f9fa",
    padding: 6,
    borderRadius: 6,
  },
  reasonText: {
    fontSize: 11,
    color: "#666",
    marginLeft: 4,
    flex: 1,
    lineHeight: 14,
  },
  loadingContainer: {
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
  errorContainer: {
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: "#f44336",
    marginTop: 8,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FF99CC",
    borderRadius: 6,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default SmartRecommendations;
