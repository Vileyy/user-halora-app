import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { getDatabase, ref, onValue } from "firebase/database";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { TabParamList } from "../types/navigation";

interface CategoryItem {
  id: string;
  title: string;
  image: string;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();

  useEffect(() => {
    const db = getDatabase();
    const categoriesRef = ref(db, "categories");

    const unsubscribe = onValue(categoriesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const categoriesArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        setCategories(categoriesArray);
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ Xử lý khi bấm vào danh mục
  const handleCategoryPress = (categoryTitle: string) => {
    console.log("Category pressed:", categoryTitle);
    navigation.navigate("SearchScreen");
  };

  const renderItem = ({ item }: { item: CategoryItem }) => (
    <TouchableOpacity
      style={styles.categoryBox}
      onPress={() => handleCategoryPress(item.title)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.image }} style={styles.image} />
      <Text style={styles.title} numberOfLines={2}>
        {item.title?.trim() || "Không có tên"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titleHeader}>📌 Danh Mục</Text>
        <TouchableOpacity
          onPress={() => {
            console.log("View all categories pressed");
            // navigation.navigate("ViewAllScreen", {
            //   category: "categories",
            //   title: "Tất cả danh mục",
            // });
          }}
        >
          <Text style={styles.viewAll}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesBackground}>
        <FlatList
          data={categories}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  titleHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  viewAll: {
    fontSize: 16,
    color: "black",
  },
  categoriesBackground: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  flatListContent: {
    paddingRight: 10,
  },
  categoryBox: {
    width: 120,
    height: 180,
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: "center",
    marginRight: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
    resizeMode: "cover",
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 5,
    color: "#333",
    textAlign: "center",
    padding: 5,
  },
});

export default Categories;
