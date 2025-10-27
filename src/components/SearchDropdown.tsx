import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getDatabase, ref, onValue, off } from "firebase/database";
import { filterOutOfStockProducts } from "../utils/inventoryUtils";

const { width } = Dimensions.get("window");

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  description?: string;
  category?: string;
  variants?: Array<{
    price: number;
    size: string;
    stockQty: number;
  }>;
}

interface SearchDropdownProps {
  searchText: string;
  onProductSelect: (product: Product) => void;
  visible: boolean;
  onClose: () => void;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  searchText,
  onProductSelect,
  visible,
  onClose,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Fetch products from Firebase
  useEffect(() => {
    if (!visible) return;

    setLoading(true);
    const database = getDatabase();
    const productsRef = ref(database, "products");

    const unsubscribe = onValue(
      productsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          let productList = Object.keys(data)
            .map((key) => ({
              id: key,
              ...data[key],
            }))
            .filter((item) => item && item.name && item.image); // Filter out invalid products

          // Filter out products that are completely out of stock
          productList = filterOutOfStockProducts(productList);

          setProducts(productList);
        } else {
          setProducts([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching products:", error);
        setLoading(false);
      }
    );

    return () => off(productsRef, "value", unsubscribe);
  }, [visible]);

  // Filter products based on search text
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredProducts([]);
      return;
    }

    const filtered = products
      .filter((product) => {
        // Safety check
        if (!product || !product.name || typeof product.name !== "string") {
          return false;
        }

        const searchLower = searchText.toLowerCase();
        const nameMatch = product.name.toLowerCase().includes(searchLower);
        const categoryMatch =
          product.category &&
          typeof product.category === "string" &&
          product.category.toLowerCase().includes(searchLower);

        return nameMatch || categoryMatch;
      })
      .slice(0, 4); // Limit to 10 results

    setFilteredProducts(filtered);
  }, [searchText, products]);

  // Hàm lấy giá hiển thị (ưu tiên variant đầu tiên)
  const getDisplayPrice = (item: Product): string => {
    if (item.variants && item.variants.length > 0) {
      return `${item.variants[0].price.toLocaleString("vi-VN")}đ`;
    }
    const priceStr = item.price?.toString() || "0";
    const priceNumber = parseInt(priceStr.replace(/[^\d]/g, ""));
    return isNaN(priceNumber) || priceNumber === 0
      ? "0đ"
      : `${priceNumber.toLocaleString("vi-VN")}đ`;
  };

  const handleProductPress = (product: Product) => {
    onProductSelect(product);
    onClose();
  };

  if (!visible || !searchText.trim()) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.dropdown}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#F08080" />
            <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
          </View>
        ) : filteredProducts.length > 0 ? (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={true}
            scrollEnabled={true}
            nestedScrollEnabled={true}
            contentContainerStyle={styles.flatListContent}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.productItem,
                  index === filteredProducts.length - 1 && styles.lastItem,
                ]}
                onPress={() => handleProductPress(item)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: item.image }}
                  style={styles.productImage}
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.productPrice}>
                    {getDisplayPrice(item)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            )}
          />
        ) : searchText.trim() && !loading ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search" size={40} color="#ccc" />
            <Text style={styles.noResultsText}>Không tìm thấy sản phẩm</Text>
            <Text style={styles.noResultsSubtext}>
              Thử tìm kiếm với từ khóa khác
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60, // Position below the search bar
    left: 10,
    right: 10,
    zIndex: 1001,
  },
  dropdown: {
    backgroundColor: "white",
    borderRadius: 12,
    maxHeight: 400,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  flatListContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#666",
    fontSize: 14,
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#f5f5f5",
  },
  productInfo: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#F08080",
    marginBottom: 2,
  },
  noResultsContainer: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
    marginTop: 12,
    marginBottom: 4,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});

export default SearchDropdown;
