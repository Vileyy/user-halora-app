import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import MainTabs from "./tabs/MainTabs";
import ProductDetailScreen from "../screens/product/ProductDetailScreen";
import ViewAllScreen from "../screens/viewall/ViewAllScreen ";
import CartScreen from "../screens/cart/CartScreen";
import CheckoutScreen from "../screens/checkout/CheckoutScreen";
import OrderSuccessScreen from "../screens/order/OrderSuccessScreen";
import OrderDetailScreen from "../screens/order/OrderDetailScreen";
import OrderTrackingScreen from "../screens/order/OrderTrackingScreen";

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="MainTabs">
        <Stack.Screen
          name="LoginScreen"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RegisterScreen"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProductDetailScreen"
          component={ProductDetailScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ViewAllScreen"
          component={ViewAllScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CartScreen"
          component={CartScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CheckoutScreen"
          component={CheckoutScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="OrderSuccessScreen"
          component={OrderSuccessScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="OrderDetailScreen"
          component={OrderDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="OrderTrackingScreen"
          component={OrderTrackingScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
