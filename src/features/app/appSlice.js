import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    status: "idle",
    error: null,
};

const appSlice = createSlice({
    name: "app",
    initialState,
    reducers: {
        setStatus: (state, action) => {
            state.status = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
});

export const { setStatus, setError, clearError } = appSlice.actions;
export default appSlice.reducer;

