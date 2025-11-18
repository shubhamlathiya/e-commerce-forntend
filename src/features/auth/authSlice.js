import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../../api/client";


// Utilities
const persistAuth = ({ accessToken, refreshToken, expiresAt, user }) => {
    if (accessToken) localStorage.setItem("auth_token", accessToken);
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
    if (expiresAt) localStorage.setItem("expires_at", expiresAt);
    if (user) localStorage.setItem("auth_user", JSON.stringify(user));
};

const clearAuth = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("expires_at");
    localStorage.removeItem("auth_user");
};

const initialState = {
    user: (() => {
        try { return JSON.parse(localStorage.getItem("auth_user") || "null"); } catch { return null; }
    })(),
    accessToken: localStorage.getItem("auth_token") || null,
    refreshToken: localStorage.getItem("refresh_token") || null,
    expiresAt: localStorage.getItem("expires_at") || null,
    status: "idle",
    error: null,
    success: null,
    // 2FA flow flags from login
    requires2FA: false,
    twoFAMethod: null,
    twoFAUserId: null,
    // Forms
    loginForm: { email: "", phone: "", password: "" },
    registerForm: { name: "", email: "", phone: "", password: "" },
    forgotForm: { email: "" },
    resetForm: { token: "", password: "", confirmPassword: "" },
    otpForm: { otp: "" },
};

// Thunks
export const register = createAsyncThunk("auth/register", async (payload, { rejectWithValue }) => {
    try {
        const { data } = await apiClient.post("/api/auth/register", payload);
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data || err.message);
    }
});

export const verifyEmail = createAsyncThunk("auth/verifyEmail", async (payload, { rejectWithValue }) => {
    try {
        const { data } = await apiClient.post("/api/auth/verify-email", payload);
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data || err.message);
    }
});

export const verifyPhone = createAsyncThunk("auth/verifyPhone", async (payload, { rejectWithValue }) => {
    try {
        const { data } = await apiClient.post("/api/auth/verify-phone", payload);
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data || err.message);
    }
});

export const resendVerification = createAsyncThunk("auth/resendVerification", async (payload, { rejectWithValue }) => {
    try {
        const { data } = await apiClient.post("/api/auth/resend-verification", payload);
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data || err.message);
    }
});

export const login = createAsyncThunk("auth/login", async (payload, { rejectWithValue }) => {
    try {
        const { data } = await apiClient.post("/api/auth/login", payload);
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data || err.message);
    }
});

export const requestLoginOtp = createAsyncThunk("auth/requestLoginOtp", async (payload, { rejectWithValue }) => {
    try {
        const { data } = await apiClient.post("/api/auth/login-otp/request", payload);
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data || err.message);
    }
});

export const verifyLoginOtp = createAsyncThunk("auth/verifyLoginOtp", async (payload, { rejectWithValue }) => {
    try {
        const { data } = await apiClient.post("/api/auth/login-otp/verify", payload);
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data || err.message);
    }
});

export const refreshAccessToken = createAsyncThunk("auth/refreshAccessToken", async (_, { getState, rejectWithValue }) => {
    try {
        const rt = getState().auth?.refreshToken || localStorage.getItem("refresh_token");
        const { data } = await apiClient.post("/api/auth/refresh-token", { refreshToken: rt });
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data || err.message);
    }
});

export const logout = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
    try {
        const { data } = await apiClient.post("/api/auth/logout");
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data || err.message);
    }
});

export const forgotPassword = createAsyncThunk("auth/forgotPassword", async (payload, { rejectWithValue }) => {
    try {
        const { data } = await apiClient.post("/api/auth/forgot-password", payload);
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data || err.message);
    }
});

export const resetPassword = createAsyncThunk("auth/resetPassword", async (payload, { rejectWithValue }) => {
    try {
        const { data } = await apiClient.post("/api/auth/reset-password", payload);
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data || err.message);
    }
});

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setLoginField: (state, { payload }) => {
            const { field, value } = payload; state.loginForm[field] = value;
        },
        setRegisterField: (state, { payload }) => {
            const { field, value } = payload; state.registerForm[field] = value;
        },
        setForgotField: (state, { payload }) => {
            const { field, value } = payload; state.forgotForm[field] = value;
        },
        setResetField: (state, { payload }) => {
            const { field, value } = payload; state.resetForm[field] = value;
        },
        clearMessages: (state) => { state.error = null; state.success = null; },
    },
    extraReducers: (builder) => {
        const pending = (state) => { state.status = "loading"; state.error = null; state.success = null; };
        const rejected = (state, { payload }) => { state.status = "failed"; state.error = payload || "Request failed"; };

        builder
            // Register
            .addCase(register.pending, pending)
            .addCase(register.fulfilled, (state, { payload }) => {
                state.status = "succeeded"; state.success = payload?.message || "Registered";
            })
            .addCase(register.rejected, rejected)

            // Verify email/phone
            .addCase(verifyEmail.pending, pending)
            .addCase(verifyEmail.fulfilled, (state, { payload }) => {
                state.status = "succeeded"; state.success = payload?.message || "Email verified";
            })
            .addCase(verifyEmail.rejected, rejected)
            .addCase(verifyPhone.pending, pending)
            .addCase(verifyPhone.fulfilled, (state, { payload }) => {
                state.status = "succeeded"; state.success = payload?.message || "Phone verified";
            })
            .addCase(verifyPhone.rejected, rejected)
            .addCase(resendVerification.pending, pending)
            .addCase(resendVerification.fulfilled, (state, { payload }) => {
                state.status = "succeeded"; state.success = payload?.message || "OTP resent";
            })
            .addCase(resendVerification.rejected, rejected)

            // Login
            .addCase(login.pending, pending)
            .addCase(login.fulfilled, (state, { payload }) => {
                state.status = "succeeded";
                const requires2FA = !!payload?.requires2FA;
                state.requires2FA = requires2FA;
                state.twoFAMethod = payload?.method || null;
                state.twoFAUserId = payload?.userId || payload?.user?._id || null;
                if (requires2FA) {
                    // Do not set tokens/user yet; await 2FA authentication
                    state.user = null;
                    state.accessToken = null;
                    state.refreshToken = null;
                    state.expiresAt = null;
                    state.success = payload?.message || "Two-factor authentication required";
                } else {
                    state.user = payload?.user || null;
                    state.accessToken = payload?.accessToken || null;
                    state.refreshToken = payload?.refreshToken || null;
                    state.expiresAt = payload?.expiresAt || null;
                    state.success = payload?.message || "Login successful";
                    persistAuth({ accessToken: state.accessToken, refreshToken: state.refreshToken, expiresAt: state.expiresAt, user: state.user });
                    // Clear any stale 2FA flags
                    state.requires2FA = false;
                    state.twoFAMethod = null;
                    state.twoFAUserId = null;
                }
            })
            .addCase(login.rejected, rejected)

            // Login OTP
            .addCase(requestLoginOtp.pending, pending)
            .addCase(requestLoginOtp.fulfilled, (state, { payload }) => {
                state.status = "succeeded"; state.success = payload?.message || "OTP sent";
            })
            .addCase(requestLoginOtp.rejected, rejected)
            .addCase(verifyLoginOtp.pending, pending)
            .addCase(verifyLoginOtp.fulfilled, (state, { payload }) => {
                state.status = "succeeded";
                state.user = payload?.user || null;
                state.accessToken = payload?.accessToken || null;
                state.refreshToken = payload?.refreshToken || null;
                state.expiresAt = payload?.expiresAt || null;
                state.success = payload?.message || "Login successful";
                persistAuth({ accessToken: state.accessToken, refreshToken: state.refreshToken, expiresAt: state.expiresAt, user: state.user });
                // Clear 2FA pending flags if any
                state.requires2FA = false;
                state.twoFAMethod = null;
                state.twoFAUserId = null;
            })
            .addCase(verifyLoginOtp.rejected, rejected)

            // Refresh token
            .addCase(refreshAccessToken.pending, pending)
            .addCase(refreshAccessToken.fulfilled, (state, { payload }) => {
                state.status = "succeeded";
                state.accessToken = payload?.accessToken || state.accessToken;
                state.refreshToken = payload?.refreshToken || state.refreshToken;
                state.expiresAt = payload?.expiresAt || state.expiresAt;
                persistAuth({ accessToken: state.accessToken, refreshToken: state.refreshToken, expiresAt: state.expiresAt });
                state.success = payload?.message || "Token refreshed";
            })
            .addCase(refreshAccessToken.rejected, rejected)

            // Logout
            .addCase(logout.pending, pending)
            .addCase(logout.fulfilled, (state, { payload }) => {
                state.status = "succeeded"; state.success = payload?.message || "Logged out";
                state.user = null; state.accessToken = null; state.refreshToken = null; state.expiresAt = null;
                clearAuth();
            })
            .addCase(logout.rejected, rejected)

            // Forgot/Reset password
            .addCase(forgotPassword.pending, pending)
            .addCase(forgotPassword.fulfilled, (state, { payload }) => {
                state.status = "succeeded"; state.success = payload?.message || "Reset link sent";
            })
            .addCase(forgotPassword.rejected, rejected)
            .addCase(resetPassword.pending, pending)
            .addCase(resetPassword.fulfilled, (state, { payload }) => {
                state.status = "succeeded"; state.success = payload?.message || "Password reset";
            })
            .addCase(resetPassword.rejected, rejected);
    }
});

export const { setLoginField, setRegisterField, setForgotField, setResetField, clearMessages } = authSlice.actions;
export default authSlice.reducer;

