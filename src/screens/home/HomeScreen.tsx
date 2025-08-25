import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { TabParamList } from "../../types/navigation";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import Header from "../../components/Header";
import Banner from "../../components/Banner";
import FlashDeals from "../../components/FlashDeals";
import Categories from "../../components/Categories";
import NewProducts from "../../components/NewProducts";
import SmartRecommendations from "../../components/SmartRecommendations";
import FloatingChatButton from "../../components/FloatingChatButton";
import { SmartRecommendationContext, UserProfile } from "../../types/ai";
import { getDatabase, ref, onValue } from "firebase/database";
import {
  getUserPurchaseHistory,
  getUserRecentlyViewed,
} from "../../services/orderService";

type HomeNavProp = BottomTabNavigationProp<TabParamList, "HomeScreen">;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const [searchText, setSearchText] = useState("");
  const [products, setProducts] = useState<any[]>([]);

  // Lấy thông tin user từ Redux
  const authState = useSelector((state: any) => state.auth);
  const user = authState?.user;

  // State cho AI recommendations
  const [recommendationContext, setRecommendationContext] =
    useState<SmartRecommendationContext>({
      userId: user?.uid || "anonymous",
      recentlyViewed: [],
      purchaseHistory: [],
      searchHistory: [],
      favorites: [],
      cartItems: [],
      sessionBehavior: {
        timeSpent: {},
        interactions: {},
      },
    });

  // Force refresh recommendations context khi cần
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // User profile cho AI chatbot
  const userProfile: UserProfile = {
    id: user?.uid || "anonymous",
    skinType: undefined,
    age: undefined,
    concerns: [],
    allergies: [],
    currentProducts: [],
    preferences: {
      priceRange: [0, 1000000],
      preferredBrands: [],
      preferredIngredients: [],
      avoidIngredients: [],
    },
  };

  useEffect(() => {
    // Fetch products from Firebase
    const db = getDatabase();
    const productsRef = ref(db, "products");

    const unsubscribe = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const productsArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setProducts(productsArray);
      } else {
        setProducts([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Update recommendation context với user behavior
    if (user?.uid && products.length > 0) {
      loadUserBehaviorData(user.uid);
    }
  }, [user, products]);

  // Load user behavior data từ Firebase
  const loadUserBehaviorData = async (userId: string) => {
    try {
      console.log("🔄 Loading real user behavior data for:", userId);

      // Load thực tế từ Firebase orders
      const realPurchaseHistory = await getUserPurchaseHistory(userId);
      const realViewedProducts = await getUserRecentlyViewed(userId);

      setRecommendationContext((prev) => ({
        ...prev,
        userId: userId,
        purchaseHistory: realPurchaseHistory,
        recentlyViewed: realViewedProducts,
        // searchHistory: await loadSearchHistory(userId),
        // favorites: await loadFavorites(userId),
      }));

      console.log("🔄 ✅ Loaded real user behavior data:", {
        userId,
        purchaseHistoryCount: realPurchaseHistory.length,
        viewedCount: realViewedProducts.length,
        purchaseHistory: realPurchaseHistory.slice(0, 5), // Log first 5 for debug
      });

      // Note: Không cần fallback ở đây nữa vì AI service sẽ tự động handle user mới
      // AI service sẽ tạo popular recommendations cho user không có purchase history
    } catch (error) {
      console.error("Error loading user behavior data:", error);

      // Fallback to mock data nếu có lỗi
      try {
        const mockPurchaseHistory = await getMockPurchaseHistory(userId);
        setRecommendationContext((prev) => ({
          ...prev,
          purchaseHistory: mockPurchaseHistory,
        }));
        console.log("🔄 Fallback to mock data due to error");
      } catch (fallbackError) {
        console.error("Error even with fallback data:", fallbackError);
      }
    }
  };

  // Mock functions - thực tế sẽ thay thế bằng Firebase calls
  const getMockPurchaseHistory = async (userId: string): Promise<string[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockHistory: string[] = [];
        if (products.length > 0) {
          mockHistory.push(...products.slice(0, 3).map((p) => p.id));
        }
        resolve(mockHistory);
      }, 500);
    });
  };

  const getMockViewedProducts = async (userId: string): Promise<string[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockViewed: string[] = [];
        if (products.length > 3) {
          mockViewed.push(...products.slice(3, 8).map((p) => p.id));
        }
        resolve(mockViewed);
      }, 300);
    });
  };

  const handleSearchSubmit = () => {
    if (searchText.trim()) {
      setRecommendationContext((prev) => ({
        ...prev,
        searchHistory: [searchText.trim(), ...prev.searchHistory.slice(0, 4)],
      }));

      navigation.navigate("SearchScreen");
    }
  };

  const handleViewMorePress = () => {
    // console.log("View more pressed");
  };

  const handleProductRecommend = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      (navigation as any).navigate("ProductDetailScreen", {
        productId: productId,
        product: product,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#F08080" />

      {/* Header */}
      <Header
        search={searchText}
        setSearch={setSearchText}
        handleSearchSubmit={handleSearchSubmit}
      />

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <Banner />

        {/* Smart AI Recommendations */}
        <SmartRecommendations
          title="Gợi ý cho bạn"
          context={recommendationContext}
          currentProducts={products}
          maxItems={5}
          showReason={true}
          onProductPress={(product) => {
            // Update recently viewed và session behavior
            setRecommendationContext((prev) => ({
              ...prev,
              recentlyViewed: [product.id, ...prev.recentlyViewed.slice(0, 9)],
              sessionBehavior: {
                ...prev.sessionBehavior,
                interactions: {
                  ...prev.sessionBehavior.interactions,
                  [product.id]:
                    (prev.sessionBehavior.interactions[product.id] || 0) + 1,
                },
                timeSpent: {
                  ...prev.sessionBehavior.timeSpent,
                  [product.id]: Date.now(), // Track when user viewed this product
                },
              },
            }));

            console.log(
              "👆 User clicked on recommended product:",
              product.name
            );

            (navigation as any).navigate("ProductDetailScreen", {
              productId: product.id,
              product: product,
            });
          }}
        />

        {/* Flash Deals */}
        <FlashDeals />

        {/* Categories */}
        <Categories />

        {/* New Products */}
        <NewProducts />
      </ScrollView>

      {/* Floating AI Chat Button */}
      <FloatingChatButton
        userProfile={userProfile}
        onProductRecommend={handleProductRecommend}
        availableProducts={products}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  additionalContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
});
