import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "../slices/authSlice";
import notifyReducer from "../slices/notifySlice";
import cartReducer from "../slices/cartSlice";
import favoritesReducer from "../slices/favoritesSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  notify: notifyReducer,
  cart: cartReducer,
  favorites: favoritesReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
