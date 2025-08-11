import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./src/redux/reducers/rootReducer";
import AppNavigator from "./src/navigation";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";

const store = configureStore({
  reducer: rootReducer,
});

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaView style={{ flex: 1 }}>
        <AppNavigator />
        <Toast />
      </SafeAreaView>
    </Provider>
  );
}
