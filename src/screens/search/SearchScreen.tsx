import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform,
  StatusBar,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getDatabase, ref, onValue, off } from "firebase/database";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  category?: string;
}

interface SearchScreenProps {
  navigation: any;
}

const SearchScreen = ({ navigation }: SearchScreenProps) => {
  const [searchText, setSearchText] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState("name");

  // Animation refs
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const searchBarTranslateY = useRef(new Animated.Value(-30)).current;
  const filterContainerOpacity = useRef(new Animated.Value(0)).current;
  const filterContainerTranslateY = useRef(new Animated.Value(-20)).current;
  const resultsCountOpacity = useRef(new Animated.Value(0)).current;
  const productsOpacity = useRef(new Animated.Value(0)).current;
  const loadingSpinValue = useRef(new Animated.Value(0)).current;
  const searchScale = useRef(new Animated.Value(0.95)).current;

  // Individual item animations
  const [itemAnimations, setItemAnimations] = useState<Animated.Value[]>([]);

  // Entrance animations
  useEffect(() => {
    // Header animation
    Animated.sequence([
      Animated.delay(100),
      Animated.spring(headerOpacity, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    // Search bar animation
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(searchBarTranslateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.spring(searchScale, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Filter container animation
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(filterContainerOpacity, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(filterContainerTranslateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Results count animation
    Animated.sequence([
      Animated.delay(400),
      Animated.spring(resultsCountOpacity, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Loading animation
  useEffect(() => {
    if (loading) {
      const spinAnimation = () => {
        loadingSpinValue.setValue(0);
        Animated.timing(loadingSpinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(() => {
          if (loading) {
            spinAnimation();
          }
        });
      };
      spinAnimation();
    }
  }, [loading]);

  // Products loaded animation with staggered effect
  useEffect(() => {
    if (!loading && filteredProducts.length > 0) {
      // Create animation values for each product
      const animations = filteredProducts.map(() => new Animated.Value(0));
      setItemAnimations(animations);

      // Products container fade in
      Animated.spring(productsOpacity, {
        toValue: 1,
        useNativeDriver: true,
      }).start(() => {
        // Staggered item animations
        animations.forEach((anim, index) => {
          Animated.sequence([
            Animated.delay(index * 100), // 100ms delay between items
            Animated.timing(anim, {
              toValue: 1,
              duration: 600,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]).start();
        });
      });
    } else if (!loading) {
      // Show empty state animation
      Animated.spring(productsOpacity, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, filteredProducts]);

  // Animated styles
  const headerAnimatedStyle = {
    opacity: headerOpacity,
    transform: [
      {
        translateY: headerOpacity.interpolate({
          inputRange: [0, 1],
          outputRange: [-20, 0],
        }),
      },
    ],
  };

  const searchBarAnimatedStyle = {
    opacity: searchBarTranslateY.interpolate({
      inputRange: [-30, 0],
      outputRange: [0, 1],
    }),
    transform: [{ translateY: searchBarTranslateY }, { scale: searchScale }],
  };

  const filterContainerAnimatedStyle = {
    opacity: filterContainerOpacity,
    transform: [{ translateY: filterContainerTranslateY }],
  };

  const resultsCountAnimatedStyle = {
    opacity: resultsCountOpacity,
    transform: [
      {
        translateY: resultsCountOpacity.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      },
    ],
  };

  const productsAnimatedStyle = {
    opacity: productsOpacity,
    transform: [
      {
        translateY: productsOpacity.interpolate({
          inputRange: [0, 1],
          outputRange: [40, 0],
        }),
      },
    ],
  };

  const loadingAnimatedStyle = {
    transform: [
      {
        rotate: loadingSpinValue.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "360deg"],
        }),
      },
    ],
  };

  useEffect(() => {
    const db = getDatabase();
    const productsRef = ref(db, "products");

    const fetchData = () => {
      onValue(productsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const productsArray: Product[] = Object.keys(data)
            .map((key) => ({
              id: key,
              ...data[key],
            }))
            .filter((item) => item?.image && item?.name);
          setProducts(productsArray);
          setFilteredProducts(productsArray);
        } else {
          setProducts([]);
          setFilteredProducts([]);
        }
        setLoading(false);
      });
    };

    fetchData();
    return () => {
      off(productsRef);
    };
  }, []);

  // Handle search with animation
  const handleSearch = useCallback(
    (text: string) => {
      setSearchText(text);

      // Animate search results change
      Animated.sequence([
        Animated.timing(productsOpacity, {
          toValue: 0.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(productsOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      if (text.trim() === "") {
        setFilteredProducts(products);
      } else {
        const results = products.filter((item) =>
          item?.name?.toLowerCase().includes(text.toLowerCase())
        );
        setFilteredProducts(results);
      }
    },
    [products]
  );

  // Sort products with animation
  const sortProducts = useCallback(
    (type: string) => {
      // Animate filter button press
      Animated.sequence([
        Animated.timing(productsOpacity, {
          toValue: 0.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(productsOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      let sorted = [...filteredProducts];

      if (type === "name") {
        sorted.sort((a, b) => a?.name?.localeCompare(b?.name));
      } else if (type === "price_asc") {
        sorted.sort((a, b) => (a?.price || 0) - (b?.price || 0));
      } else if (type === "price_desc") {
        sorted.sort((a, b) => (b?.price || 0) - (a?.price || 0));
      }

      setSortType(type);
      setFilteredProducts(sorted);
    },
    [filteredProducts]
  );

  // Animation handlers
  const handleSearchFocus = () => {
    Animated.spring(searchScale, {
      toValue: 1.02,
      useNativeDriver: true,
    }).start();
  };

  const handleSearchBlur = () => {
    Animated.spring(searchScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleProductPress = (item: Product) => {
    // Add scale animation feedback
    Animated.sequence([
      Animated.timing(searchScale, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(searchScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    navigation.navigate("ProductDetailScreen", { product: item });
  };

  const renderProduct = ({ item, index }: { item: Product; index: number }) => {
    if (!item?.image || !item?.name) return null;

    const itemAnim = itemAnimations[index] || new Animated.Value(0);

    return (
      <Animated.View
        style={[
          styles.productItem,
          {
            opacity: itemAnim,
            transform: [
              {
                translateY: itemAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
              {
                scale: itemAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => handleProductPress(item)}
          activeOpacity={0.9}
          style={{ flex: 1 }}
        >
          <View style={styles.imageContainer}>
            <Image source={{ uri: item.image }} style={styles.productImage} />
          </View>
          <View style={styles.productInfo}>
            <Text
              style={styles.productName}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.name}
            </Text>
            <Text style={styles.productPrice}>
              {item.price?.toLocaleString()}₫
            </Text>
            {item.description && (
              <Text
                numberOfLines={2}
                ellipsizeMode="tail"
                style={styles.productDescription}
              >
                {item.description}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header với thanh tìm kiếm */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <Animated.View style={[styles.searchBar, searchBarAnimatedStyle]}>
          <Animated.View
            style={{
              transform: [
                {
                  scale: searchScale.interpolate({
                    inputRange: [0.95, 1],
                    outputRange: [0, 1],
                  }),
                },
              ],
            }}
          >
            <Ionicons name="search-outline" size={20} color="#666" />
          </Animated.View>
          <TextInput
            style={styles.input}
            placeholder="Tìm kiếm sản phẩm..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={handleSearch}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
          />
          {searchText ? (
            <Animated.View
              style={{
                opacity: searchScale.interpolate({
                  inputRange: [0.95, 1],
                  outputRange: [0, 1],
                }),
              }}
            >
              <TouchableOpacity onPress={() => handleSearch("")}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            </Animated.View>
          ) : null}
        </Animated.View>
      </Animated.View>

      {/* Bộ lọc sắp xếp */}
      <Animated.View
        style={[styles.filterContainer, filterContainerAnimatedStyle]}
      >
        <Animated.Text
          style={[
            styles.filterLabel,
            {
              opacity: filterContainerOpacity,
              transform: [
                {
                  translateX: filterContainerOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          Sắp xếp theo:
        </Animated.Text>
        <View style={styles.filtersWrapper}>
          {[
            { label: "Aa Tên A-Z", type: "name", icon: "text" as const },
            {
              label: "Giá thấp → cao",
              type: "price_asc",
              icon: "trending-up" as const,
            },
            {
              label: "Giá cao → thấp",
              type: "price_desc",
              icon: "trending-down" as const,
            },
          ].map((filter, index) => (
            <Animated.View
              key={filter.type}
              style={{
                flex: 1,
                opacity: filterContainerOpacity,
                transform: [
                  {
                    translateY: filterContainerOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  sortType === filter.type && styles.activeFilter,
                ]}
                onPress={() => sortProducts(filter.type)}
              >
                <Ionicons
                  name={filter.icon}
                  size={16}
                  color={sortType === filter.type ? "#fff" : "#555"}
                  style={styles.filterIcon}
                />
                <Text
                  style={[
                    styles.filterText,
                    sortType === filter.type && styles.activeFilterText,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      {/* Hiển thị số lượng kết quả */}
      <Animated.View
        style={[styles.resultsCountContainer, resultsCountAnimatedStyle]}
      >
        <Text style={styles.resultsCount}>
          {filteredProducts.length} sản phẩm
          {searchText ? ` cho "${searchText}"` : ""}
        </Text>
      </Animated.View>

      {/* Hiển thị loading */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Animated.View style={loadingAnimatedStyle}>
            <ActivityIndicator size="large" color="#ff6f61" />
          </Animated.View>
          <Animated.Text
            style={[
              styles.loadingText,
              {
                opacity: headerOpacity,
              },
            ]}
          >
            Đang tải sản phẩm...
          </Animated.Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <Animated.View style={[styles.emptyContainer, productsAnimatedStyle]}>
          <Ionicons name="bag-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchText
              ? "Không tìm thấy sản phẩm nào"
              : "Chưa có sản phẩm nào"}
          </Text>
        </Animated.View>
      ) : (
        <Animated.View style={productsAnimatedStyle}>
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.productsList}
            showsVerticalScrollIndicator={false}
            renderItem={renderProduct}
          />
        </Animated.View>
      )}
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
    textAlign: "center",
  },
  header: {
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#333",
  },
  filterContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  filtersWrapper: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#eaeaea",
    flex: 1,
    minHeight: 40,
  },
  filterIcon: {
    marginRight: 4,
  },
  activeFilter: {
    backgroundColor: "#ff6f61",
    borderColor: "#ff6f61",
  },
  activeFilterText: {
    color: "#fff",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#555",
    textAlign: "center",
  },
  resultsCountContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: "500",
    color: "#777",
  },
  productsList: {
    padding: 8,
    paddingBottom: 280,
  },
  row: {
    justifyContent: "space-between",
  },
  productItem: {
    width: "48%",
    marginHorizontal: "1%",
    marginVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
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
  imageContainer: {
    width: "100%",
    height: 160,
    backgroundColor: "#f9f9f9",
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: "#ff6f61",
    fontWeight: "bold",
    marginBottom: 6,
  },
  productDescription: {
    fontSize: 12,
    color: "#777",
    lineHeight: 16,
  },
});

export default SearchScreen;
