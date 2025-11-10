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
import { smartSearch } from "../utils/textUtils";

const { width } = Dimensions.get("window");

interface Variant {
  price: number;
  size: string;
  stockQty?: number;
  stock?: number;
}

interface Product {
  id: string;
  name: string;
  price?: string | number;
  image: string;
  description?: string;
  category?: string;
  variants?: Variant[] | { [key: string]: Variant };
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
          const productList = Object.keys(data)
            .map((key) => ({
              id: key,
              ...data[key],
            }))
            .filter((product) => product && product.name);
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
        // Skip products without a name
        if (!product?.name) return false;

        const searchTerm = searchText.trim();

        // Tìm kiếm trong tên sản phẩm
        const nameMatch = smartSearch(product.name, searchTerm);

        // Tìm kiếm trong danh mục
        const categoryMatch = product.category
          ? smartSearch(product.category, searchTerm)
          : false;

        // Tìm kiếm trong mô tả (nếu có)
        const descriptionMatch = product.description
          ? smartSearch(product.description, searchTerm)
          : false;

        return nameMatch || categoryMatch || descriptionMatch;
      })
      .slice(0, 3); // Limit to 3 results

    setFilteredProducts(filtered);
  }, [searchText, products]);

  // Format price range from variants or single price
  const formatPriceRange = (product: Product): string => {
    // Nếu có variants
    if (product.variants) {
      let variantsArray: Variant[] = [];
      if (Array.isArray(product.variants)) {
        variantsArray = product.variants;
      } else if (typeof product.variants === "object") {
        variantsArray = Object.values(product.variants);
      }

      if (variantsArray.length > 0) {
        const prices = variantsArray
          .map((v) => (typeof v === "object" && v.price ? v.price : 0))
          .filter((p) => p && p > 0);

        if (prices.length === 0) {
          return "0₫";
        }

        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        // Nếu chỉ có 1 giá hoặc min = max, hiển thị 1 giá
        if (prices.length === 1 || minPrice === maxPrice) {
          return `${minPrice.toLocaleString()}₫`;
        }

        // Nếu có nhiều giá khác nhau, hiển thị khoảng giá
        return `${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()}₫`;
      }
    }

    // Nếu không có variants, sử dụng price
    if (product.price) {
      const priceStr = product.price.toString();
      const priceNumber = parseInt(priceStr.replace(/[^\d]/g, ""));
      return isNaN(priceNumber) || priceNumber === 0
        ? "0₫"
        : `${priceNumber.toLocaleString()}₫`;
    }

    return "0₫";
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
            showsVerticalScrollIndicator={false}
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
                    {item.name || "Sản phẩm không tên"}
                  </Text>
                  <Text style={styles.productPrice}>
                    {formatPriceRange(item)}
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
    maxHeight: 300,
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
