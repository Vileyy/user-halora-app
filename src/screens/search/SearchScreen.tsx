import React, { useState, useEffect, useCallback } from "react";
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

  // 🔎 Xử lý tìm kiếm
  const handleSearch = useCallback(
    (text: string) => {
      setSearchText(text);
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

  // 🔽 Sắp xếp sản phẩm
  const sortProducts = useCallback(
    (type: string) => {
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header với thanh tìm kiếm */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Tìm kiếm sản phẩm..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {/* Bộ lọc sắp xếp */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Sắp xếp theo:</Text>
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
          ].map((filter) => (
            <TouchableOpacity
              key={filter.type}
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
          ))}
        </View>
      </View>

      {/* Hiển thị số lượng kết quả */}
      <View style={styles.resultsCountContainer}>
        <Text style={styles.resultsCount}>
          {filteredProducts.length} sản phẩm
        </Text>
      </View>

      {/* Hiển thị loading */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6f61" />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            if (!item?.image || !item?.name) return null;

            return (
              <TouchableOpacity
                style={styles.productItem}
                onPress={() => {
                  navigation.navigate("ProductDetailScreen", { product: item });
                }}
                activeOpacity={0.9}
              >
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: item.image }}
                    style={styles.productImage}
                  />
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
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
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
    paddingBottom: 16,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  productsList: {
    padding: 8,
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
