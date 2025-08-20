import { createSlice } from "@reduxjs/toolkit";

interface UserData {
  uid: string;
  email: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  displayName?: string;
  photoURL?: string;
  provider?: string;
}

interface AuthState {
  email: string;
  password: string;
  error: string | null;
  user: UserData | null;
  isGoogleSigningIn: boolean;
}

const initialState: AuthState = {
  email: "",
  password: "",
  error: null,
  user: null,
  isGoogleSigningIn: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setEmail: (state, action) => {
      state.email = action.payload;
    },
    setPassword: (state, action) => {
      state.password = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
    },
    setGoogleSigningIn: (state, action) => {
      state.isGoogleSigningIn = action.payload;
    },
  },
});

export const {
  setEmail,
  setPassword,
  setError,
  setUser,
  clearUser,
  setGoogleSigningIn,
} = authSlice.actions;
export default authSlice.reducer;
