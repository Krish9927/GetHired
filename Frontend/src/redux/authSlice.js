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
    },
});

export const { setLoading, setUser, setVerification } = authSlice.actions;
export default authSlice.reducer;
