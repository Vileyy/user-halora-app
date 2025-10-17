import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
  Text,
  Linking,
} from "react-native";
import { getDatabase, ref, onValue } from "firebase/database";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const BANNER_WIDTH = width * 0.9;
const BANNER_HEIGHT = 180;

interface BannerItem {
  id?: string;
  title?: string;
  imageUrl?: string;
  linkUrl?: string;
  isActive?: boolean;
  updatedAt?: number;
}

const Banner: React.FC = () => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<BannerItem>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Auto scroll
  useEffect(() => {
    let scrollInterval: NodeJS.Timeout;
    if (banners.length > 1) {
      scrollInterval = setInterval(() => {
        const nextIndex = (activeIndex + 1) % banners.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        setActiveIndex(nextIndex);
      }, 3000);
    }
    return () => clearInterval(scrollInterval);
  }, [banners, activeIndex]);

  // Fetch data
  useEffect(() => {
    const db = getDatabase();
    const bannerRef = ref(db, "banners");
    const unsubscribe = onValue(bannerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const bannerArray = Object.values(data as Record<string, BannerItem>)
          .filter((item) => item.isActive === true)
          .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        setBanners(bannerArray);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (viewableItems.length > 0) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleBannerPress = (linkUrl?: string) => {
    if (linkUrl && linkUrl.trim() !== "") {
      Linking.openURL(linkUrl).catch((err) =>
        console.error("Couldn't open URL:", err)
      );
    }
  };

  // Display loading indicator
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  // If no banners to display
  if (banners.length === 0) {
    return (
      <View style={styles.noBannerContainer}>
        <Text style={styles.noBannerText}>No banners available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        snapToInterval={BANNER_WIDTH + 20}
        decelerationRate="fast"
        contentContainerStyle={styles.flatListContainer}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollToIndexFailed={(info) => {
          // console.warn("ScrollToIndex failed:", info);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }}
        renderItem={({ item }) => {
          const imageUrl =
            item.imageUrl || "https://via.placeholder.com/500x180";
          const title = item.title || "Untitled Banner";
          return (
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.bannerTouchable}
              onPress={() => handleBannerPress(item.linkUrl)}
            >
              <View style={styles.bannerContainer}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.banner}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.7)"]}
                  style={styles.gradient}
                >
                  <Text style={styles.bannerTitle}>{title}</Text>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Pagination indicators */}
      {banners.length > 1 && (
        <View style={styles.paginationContainer}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === activeIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
  },
  flatListContainer: {
    paddingHorizontal: 10,
  },
  bannerTouchable: {
    marginHorizontal: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bannerContainer: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
  },
  banner: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    justifyContent: "flex-end",
    paddingBottom: 12,
    paddingHorizontal: 15,
  },
  bannerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  loaderContainer: {
    height: BANNER_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
    borderRadius: 15,
    backgroundColor: "#f5f5f5",
  },
  noBannerContainer: {
    height: BANNER_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
    borderRadius: 15,
    backgroundColor: "#f5f5f5",
  },
  noBannerText: {
    fontSize: 16,
    color: "#888",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#007bff",
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default Banner;
