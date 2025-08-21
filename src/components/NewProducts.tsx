import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { getDatabase, ref, onValue } from "firebase/database";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";

interface NewProductItem {
  id: string;
  name: string;
  price: string;
  description: string;
  image: string;
  category: string;
}

const NewProducts: React.FC = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState<NewProductItem[]>([]);

  useEffect(() => {
    const db = getDatabase();
    const productsRef = ref(db, "products");

    const unsubscribe = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const productList = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          .filter((item) => item.category === "new_product");

        setProducts(productList);
      } else {
        setProducts([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }: { item: NewProductItem }) => (
    <TouchableOpacity
      style={styles.productContainer}
      onPress={() => {
        // console.log("Product pressed:", item);
        (navigation as any).navigate("ProductDetailScreen", { product: item });
      }}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <Text style={styles.productName} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.productPrice}>
        {parseInt(item.price).toLocaleString("vi-VN")} VNĐ
      </Text>
      <Text style={styles.productDescription} numberOfLines={2}>
        {item.description}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🆕 Sản phẩm mới</Text>
        <TouchableOpacity
          onPress={() => {
            console.log("View all new products pressed");
            (navigation as any).navigate("ViewAllScreen", {
              category: "new_product",
              title: "Sản phẩm mới",
            });
          }}
        >
          <Text style={styles.viewAll}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        scrollEnabled={false}
        contentContainerStyle={{ paddingBottom: 65 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    marginTop: 15,
    marginBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 21,
    fontWeight: "bold",
    color: "black",
  },
  viewAll: {
    fontSize: 16,
    color: "black",
  },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },
  productContainer: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "flex-start",
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
    height: 300,
  },
  productImage: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    resizeMode: "cover",
    backgroundColor: "#f8f8f8",
  },
  productName: {
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 8,
    textAlign: "left",
    color: "#333",
    height: 40,
  },
  productPrice: {
    fontSize: 16,
    color: "#FF6B6B",
    fontWeight: "bold",
    marginTop: 8,
    textAlign: "left",
    height: 24,
  },
  productDescription: {
    fontSize: 13,
    color: "#666",
    marginTop: 8,
    textAlign: "left",
    lineHeight: 16,
    height: 32,
  },
});

export default NewProducts;
