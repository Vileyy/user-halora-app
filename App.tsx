import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./src/redux/reducers/rootReducer";
import AppNavigator from "./src/navigation";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";
import { StripeProvider } from "@stripe/stripe-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const store = configureStore({
  reducer: rootReducer,
});

const CHAT_SESSION_KEY = "chatbot_session_id";

export default function App() {
  // Tạo session ID mới khi app khởi động (chỉ chạy một lần khi app start)
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Lấy session ID cũ (nếu có)
        const oldSessionId = await AsyncStorage.getItem(CHAT_SESSION_KEY);

        // Tạo session ID mới
        const newSessionId = Date.now().toString();

        if (oldSessionId && oldSessionId !== newSessionId) {
          // App được restart, xóa chat history
          await AsyncStorage.removeItem("chatbot_history");
        }

        // Lưu session ID mới
        await AsyncStorage.setItem(CHAT_SESSION_KEY, newSessionId);
      } catch (error) {
        console.error("Error initializing chat session:", error);
      }
    };

    initializeSession();
  }, []);

  return (
    <Provider store={store}>
      <StripeProvider
        publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <AppNavigator />
          <Toast />
        </SafeAreaView>
      </StripeProvider>
    </Provider>
  );
}
