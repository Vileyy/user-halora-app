import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../types/navigation";
import { getDatabase, ref, onValue } from "firebase/database";
import { Ionicons } from "@expo/vector-icons";

type ViewAllScreenRouteProp = RouteProp<RootStackParamList, "ViewAllScreen">;
type ViewAllScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ViewAllScreen"
>;

interface Product {
  id: string;
  name: string;
  price: string;
  description: string;
  image: string;
  category: string;
}

type SortOption =
  | "name_asc"
  | "name_desc"
  | "price_asc"
  | "price_desc"
  | "default";

export default function ViewAllScreen() {
  const navigation = useNavigation<ViewAllScreenNavigationProp>();
  const route = useRoute<ViewAllScreenRouteProp>();
  const { category, title } = route.params;

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchText, setSearchText] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("default");
  const [loading, setLoading] = useState(true);
  const [showSortOptions, setShowSortOptions] = useState(false);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const searchScale = useRef(new Animated.Value(0.8)).current;
  const sortOptionsHeight = useRef(new Animated.Value(0)).current;
  const searchBarTranslateY = useRef(new Animated.Value(-20)).current;
  const productsOpacity = useRef(new Animated.Value(0)).current;
  const loadingSpinValue = useRef(new Animated.Value(0)).current;

  // Staggered animation values for individual items
  const [itemAnimations, setItemAnimations] = useState<Animated.Value[]>([]);

  // Entrance animations
  useEffect(() => {
    Animated.sequence([
      Animated.delay(100),
      Animated.spring(headerOpacity, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(200),
      Animated.spring(searchBarTranslateY, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(300),
      Animated.spring(searchScale, {
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

  // Products loaded animation with staggered fade in down
  useEffect(() => {
    if (!loading && products.length > 0) {
      const animations = products.map(() => new Animated.Value(0));
      setItemAnimations(animations);

      // Start staggered animations
      Animated.sequence([
        Animated.delay(100),
        Animated.spring(productsOpacity, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Animate each item with fade in down effect
        animations.forEach((anim, index) => {
          Animated.sequence([
            Animated.delay(index * 120), 
            Animated.parallel([
              Animated.timing(anim, {
                toValue: 1,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
            ]),
          ]).start();
        });
      });
    }
  }, [loading, products]);

  // Sort options animation
  useEffect(() => {
    Animated.spring(sortOptionsHeight, {
      toValue: showSortOptions ? 250 : 0,
      useNativeDriver: false, 
    }).start();
  }, [showSortOptions]);

  // Animated styles
  const headerAnimatedStyle = {
    opacity: headerOpacity,
    transform: [
      {
        translateY: headerOpacity.interpolate({
          inputRange: [0, 1],
          outputRange: [-10, 0],
        }),
      },
    ],
  };

  const searchBarAnimatedStyle = {
    transform: [{ translateY: searchBarTranslateY }, { scale: searchScale }],
  };

  const sortOptionsAnimatedStyle = {
    height: sortOptionsHeight,
    opacity: sortOptionsHeight.interpolate({
      inputRange: [0, 250],
      outputRange: [0, 1],
    }),
  };

  const productsAnimatedStyle = {
    opacity: productsOpacity,
    transform: [
      {
        translateY: productsOpacity.interpolate({
          inputRange: [0, 1],
          outputRange: [40, 0], // Enhanced fade in down effect
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

  // Fetch products from Firebase
  useEffect(() => {
    const db = getDatabase();
    const productsRef = ref(db, "products");

    const unsubscribe = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const productsArray = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          .filter((product) => product.category === category);

        setProducts(productsArray);
        setFilteredProducts(productsArray);
      } else {
        setProducts([]);
        setFilteredProducts([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [category]);

  // Handle search and sort
  useEffect(() => {
    let result = [...products];

    // Filter by search text
    if (searchText.trim()) {
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(searchText.toLowerCase()) ||
          product.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Sort products
    switch (sortOption) {
      case "name_asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "price_asc":
        result.sort((a, b) => parseInt(a.price) - parseInt(b.price));
        break;
      case "price_desc":
        result.sort((a, b) => parseInt(b.price) - parseInt(a.price));
        break;
      default:
        // Keep original order
        break;
    }

    setFilteredProducts(result);
  }, [products, searchText, sortOption]);

  const handleProductPress = (product: Product) => {
    navigation.navigate("ProductDetailScreen", { product });
  };

  const handleSortOption = (option: SortOption) => {
    setSortOption(option);
    setShowSortOptions(false);
  };

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

  const handleProductPressWithAnimation = (product: Product) => {
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
    navigation.navigate("ProductDetailScreen", { product });
  };

  const getSortOptionText = (option: SortOption) => {
    switch (option) {
      case "name_asc":
        return "Tên A-Z";
      case "name_desc":
        return "Tên Z-A";
      case "price_asc":
        return "Giá thấp đến cao";
      case "price_desc":
        return "Giá cao đến thấp";
      default:
        return "Mặc định";
    }
  };

  const renderProduct = ({ item, index }: { item: Product; index: number }) => {
    const itemAnim = itemAnimations[index] || new Animated.Value(0);

    return (
      <Animated.View
        style={[
          styles.productCard,
          {
            opacity: itemAnim,
            transform: [
              {
                translateY: itemAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [80, 0], // Fade in down effect
                }),
              },
              {
                scale: itemAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1], // Subtle scale effect
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => handleProductPressWithAnimation(item)}
          activeOpacity={0.7}
          style={{ flex: 1 }}
        >
          <Image source={{ uri: item.image }} style={styles.productImage} />
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.productPrice}>
              {parseInt(item.price).toLocaleString()}₫
            </Text>
            <Text style={styles.productDescription} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderSortOptions = () => {
    return (
      <Animated.View
        style={[styles.sortOptionsContainer, sortOptionsAnimatedStyle]}
      >
        {(
          [
            "default",
            "name_asc",
            "name_desc",
            "price_asc",
            "price_desc",
          ] as SortOption[]
        ).map((option, index) => (
          <Animated.View
            key={option}
            style={{
              opacity: sortOptionsHeight.interpolate({
                inputRange: [0, 250],
                outputRange: [0, 1],
              }),
              transform: [
                {
                  translateX: sortOptionsHeight.interpolate({
                    inputRange: [0, 250],
                    outputRange: [-50, 0],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              style={[
                styles.sortOption,
                sortOption === option && styles.sortOptionActive,
              ]}
              onPress={() => handleSortOption(option)}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  sortOption === option && styles.sortOptionTextActive,
                ]}
              >
                {getSortOptionText(option)}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#F08080" />
        <View style={styles.loadingContainer}>
          <Animated.View style={loadingAnimatedStyle}>
            <ActivityIndicator size="large" color="#F08080" />
          </Animated.View>
          <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#F08080" />

      {/* Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <Animated.View
          style={{
            transform: [
              {
                translateX: headerOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 0],
                }),
              },
            ],
          }}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        </Animated.View>
        <Animated.Text
          style={[
            styles.headerTitle,
            {
              transform: [
                {
                  scale: headerOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        >
          {title}
        </Animated.Text>
        <View style={styles.headerRight} />
      </Animated.View>

      {/* Search and Sort Bar */}
      <Animated.View
        style={[styles.searchSortContainer, searchBarAnimatedStyle]}
      >
        <Animated.View
          style={[
            styles.searchContainer,
            {
              transform: [
                {
                  scale: searchBarTranslateY.interpolate({
                    inputRange: [-20, 0],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Animated.View
            style={{
              transform: [
                {
                  translateX: searchBarTranslateY.interpolate({
                    inputRange: [-20, 0],
                    outputRange: [-10, 0],
                  }),
                },
              ],
            }}
          >
            <Ionicons
              name="search"
              size={20}
              color="#666"
              style={styles.searchIcon}
            />
          </Animated.View>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm..."
            value={searchText}
            onChangeText={setSearchText}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            placeholderTextColor="#999"
          />
          {searchText ? (
            <Animated.View
              style={{
                transform: [
                  {
                    scale: searchScale.interpolate({
                      inputRange: [0.8, 1],
                      outputRange: [0, 1],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            </Animated.View>
          ) : null}
        </Animated.View>

        <Animated.View
          style={{
            transform: [
              {
                translateX: searchBarTranslateY.interpolate({
                  inputRange: [-20, 0],
                  outputRange: [30, 0],
                }),
              },
            ],
          }}
        >
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortOptions(!showSortOptions)}
          >
            <Ionicons name="filter" size={20} color="#333" />
            <Text style={styles.sortButtonText}>Sắp xếp</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Sort Options */}
      {renderSortOptions()}

      {/* Products Count */}
      <Animated.View
        style={[
          styles.countContainer,
          {
            opacity: productsOpacity,
            transform: [
              {
                translateY: productsOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.countText}>
          {filteredProducts.length} sản phẩm
          {searchText ? ` cho "${searchText}"` : ""}
        </Text>
      </Animated.View>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <Animated.View
          style={[
            styles.emptyContainer,
            {
              opacity: productsOpacity,
              transform: [
                {
                  translateY: productsOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
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
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.productsList}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.row}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    width: 40,
  },
  searchSortContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 10,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  sortButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  sortOptionsContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    overflow: "hidden",
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  sortOptionActive: {
    backgroundColor: "#f0f8ff",
  },
  sortOptionText: {
    fontSize: 16,
    color: "#333",
  },
  sortOptionTextActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
  countContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  countText: {
    fontSize: 14,
    color: "#666",
  },
  productsList: {
    padding: 16,
  },
  row: {
    justifyContent: "space-between",
  },
  productCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  productImage: {
    width: "100%",
    height: 140,
    borderRadius: 8,
    resizeMode: "cover",
    backgroundColor: "#f8f8f8",
  },
  productInfo: {
    marginTop: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
    height: 40,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 16,
    color: "#F08080",
    fontWeight: "bold",
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
    height: 32,
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
});
