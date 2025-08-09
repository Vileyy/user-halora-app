import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { TabParamList } from "../../types/navigation";
import HomeScreen from "../../screens/home/HomeScreen";
import SearchScreen from "../../screens/search/SearchScreen";
import NotifyScreen from "../../screens/notify/NotifyScreen";
import ProfileScreen from "../../screens/profile/ProfileScreen";

// Nếu bạn có Redux để lấy badge số thông báo:
import { useSelector } from "react-redux";
import { RootState } from "../../redux/reducers/rootReducer";

const Tab = createBottomTabNavigator<TabParamList>();

export default function MainTabs() {
  const notifyCount = useSelector((s: RootState) => s.notify?.unreadCount ?? 0);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#FF99CC",
        tabBarInactiveTintColor: "#9E9E9E",
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: "#fff",
          borderTopColor: "#eee",
        },
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ focused, color, size }) => {
          // icon theo từng tab
          switch (route.name) {
            case "HomeScreen":
              return (
                <Ionicons
                  name={focused ? "home" : "home-outline"}
                  size={size}
                  color={color}
                />
              );
            case "SearchScreen":
              return (
                <Ionicons
                  name={focused ? "search" : "search-outline"}
                  size={size}
                  color={color}
                />
              );
            case "NotifyScreen":
              return (
                <Ionicons
                  name={focused ? "notifications" : "notifications-outline"}
                  size={size}
                  color={color}
                />
              );
            case "ProfileScreen":
              return (
                <MaterialIcons
                  name={focused ? "person" : "person-outline"}
                  size={size}
                  color={color}
                />
              );
            default:
              return null;
          }
        },
      })}
      initialRouteName="HomeScreen"
      backBehavior="initialRoute"
    >
      <Tab.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ title: "Home" }}
      />
      <Tab.Screen
        name="SearchScreen"
        component={SearchScreen}
        options={{ title: "Tìm kiếm" }}
      />
      <Tab.Screen
        name="NotifyScreen"
        component={NotifyScreen}
        options={{
          title: "Thông báo",
          tabBarBadge: notifyCount > 0 ? notifyCount : undefined,
          tabBarBadgeStyle: { backgroundColor: "#FF4D6D" },
        }}
      />
      <Tab.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{ title: "Cá nhân" }}
      />
    </Tab.Navigator>
  );
}
