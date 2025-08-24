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

  // User profile cho AI chatbot
  const userProfile: UserProfile = {
    id: user?.uid || "anonymous",
    skinType: undefined, // Có thể lấy từ user profile
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
    if (user?.uid) {
      setRecommendationContext((prev) => ({
        ...prev,
        userId: user.uid,
        // Có thể load thêm data từ AsyncStorage hoặc Firebase
        // recentlyViewed: await loadRecentlyViewed(),
        // searchHistory: await loadSearchHistory(),
      }));
    }
  }, [user]);

  const handleSearchSubmit = () => {
    if (searchText.trim()) {
      // Lưu search history cho AI recommendations
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
    // Navigate to product detail when AI recommends a product
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
          title="🤖 AI gợi ý cho bạn"
          context={recommendationContext}
          currentProducts={products}
          maxItems={5}
          showReason={true}
          onProductPress={(product) => {
            // Track user interaction
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
              },
            }));

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
