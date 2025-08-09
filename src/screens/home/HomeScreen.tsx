import React, { useState } from "react";
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
import Header from "../../components/Header";
import Banner from "../../components/Banner";
import FlashDeals from "../../components/FlashDeals";
import Categories from "../../components/Categories";
import NewProducts from "../../components/NewProducts";

type HomeNavProp = BottomTabNavigationProp<TabParamList, "HomeScreen">;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const [searchText, setSearchText] = useState("");

  const handleSearchSubmit = () => {
    if (searchText.trim()) {
      navigation.navigate("SearchScreen");
    }
  };

  const handleViewMorePress = () => {
    console.log("View more pressed");
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

        {/* Flash Deals */}
        <FlashDeals />

        {/* Categories */}
        <Categories />

        {/* New Products */}
        <NewProducts />
      </ScrollView>
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
