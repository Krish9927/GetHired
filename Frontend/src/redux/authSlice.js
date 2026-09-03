import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
    name: "auth",
    initialState: {
        loading: false,
        user: null,
        verification: null,
    },
    reducers: {
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setUser: (state, action) => {
            state.user = action.payload;
        },
        setVerification: (state, action) => {
            state.verification = action.payload;
        },
        logout: (state) => {
            state.user = null;
            state.loading = false;
            state.verification = null;
        },
    },
});

export const { setLoading, setUser, setVerification, logout } = authSlice.actions;
export default authSlice.reducer;
