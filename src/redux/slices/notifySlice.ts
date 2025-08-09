import { createSlice } from "@reduxjs/toolkit";

interface NotifyState {
  unreadCount: number;
}

const initialState: NotifyState = {
  unreadCount: 0,
};

const notifySlice = createSlice({
  name: "notify",
  initialState,
  reducers: {
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },
    decrementUnreadCount: (state) => {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
    clearUnreadCount: (state) => {
      state.unreadCount = 0;
    },
  },
});

export const {
  setUnreadCount,
  incrementUnreadCount,
  decrementUnreadCount,
  clearUnreadCount,
} = notifySlice.actions;
export default notifySlice.reducer;
