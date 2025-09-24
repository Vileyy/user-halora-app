import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./src/redux/reducers/rootReducer";
import AppNavigator from "./src/navigation";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";
import { StripeProvider } from "@stripe/stripe-react-native";

const store = configureStore({
  reducer: rootReducer,
});

export default function App() {
  return (
    <Provider store={store}>
      <StripeProvider
        publishableKey={
          process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
        }
      >
        <SafeAreaView style={{ flex: 1 }}>
          <AppNavigator />
          <Toast />
        </SafeAreaView>
      </StripeProvider>
    </Provider>
  );
}
