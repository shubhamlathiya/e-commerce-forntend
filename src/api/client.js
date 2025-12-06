import axios from "axios";

// Create Axios instance
const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || 'https://g2.brandinsa.com',
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

/**
 * UTILITIES
 */
const redirectToSignIn = () => {
    try {
        window.location.replace("/sign-in");
    } catch {
        window.location.href = "/sign-in";
    }
};

const redirectToDashboard = () => {
    try {
        window.location.replace("/dashboard");
    } catch {
        window.location.href = "/dashboard";
    }
};

const clearAuthStorage = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("expires_at");
};

const getExpiresAtMs = () => {
    const val = localStorage.getItem("expires_at");
    if (!val) return null;

    if (/^\d+$/.test(val)) {
        const num = Number(val);
        return Number.isFinite(num) ? num : null;
    }

    const parsed = Date.parse(val);
    return Number.isFinite(parsed) ? parsed : null;
};

/**
 * PREVENT ACCESS TO SIGN-IN IF LOGGED IN
 * (should be called in your App router or top-level component)
 */
export const checkAuthRedirect = () => {
    const token = localStorage.getItem("auth_token");
    const refreshToken = localStorage.getItem("refresh_token");
    const expMs = getExpiresAtMs();

    const currentPath = window.location.pathname;
    const isPublicRoute = [
        "/sign-in",
        "/sign-up",
        "/forgot-password",
        "/reset-password"
    ].includes(currentPath);

    // User has valid token
    if (token && expMs && Date.now() < expMs) {
        // Already on public route → redirect to dashboard
        if (isPublicRoute) {
            console.log('✅ Valid token, redirecting to dashboard');
            redirectToDashboard();
        }
        return true;
    }

    // Token expired but has refresh token → try refresh
    if (token && expMs && Date.now() >= expMs && refreshToken) {
        console.log('🔄 Token expired, attempting refresh...');
        attemptTokenRefresh().then(success => {
            if (success) {
                // Refresh successful, stay on current page
                console.log('✅ Token refreshed successfully');
            } else {
                // Refresh failed, redirect to sign-in if not already there
                if (!isPublicRoute) {
                    console.log('❌ Refresh failed, redirecting to sign-in');
                    redirectToSignIn();
                }
            }
        });
        return false;
    }

    // No valid token or refresh failed
    console.log('❌ No valid authentication');
    if (!isPublicRoute) {
        clearAuthStorage();
        redirectToSignIn();
    }
    return false;
};

// Helper function to attempt token refresh
const attemptTokenRefresh = async () => {
    try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) return false;

        const response = await axios.post(
            `${process.env.REACT_APP_API_BASE_URL || 'https://g2.brandinsa.com'}/api/auth/refresh-token`,
            { refreshToken },
            { headers: { "Content-Type": "application/json" } }
        );

        if (response.data?.accessToken) {
            localStorage.setItem("auth_token", response.data.accessToken);
            if (response.data.refreshToken) {
                localStorage.setItem("refresh_token", response.data.refreshToken);
            }
            if (response.data.expiresAt) {
                localStorage.setItem("expires_at", response.data.expiresAt);
            }
            return true;
        }
        return false;
    } catch (error) {
        console.error('❌ Token refresh failed:', error);
        return false;
    }
};
/**
 * REQUEST INTERCEPTOR
 */
apiClient.interceptors.request.use((config) => {
    const expMs = getExpiresAtMs();
    if (expMs && Date.now() > expMs) {
        clearAuthStorage();
        redirectToSignIn();
    }

    const token = localStorage.getItem("auth_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/**
 * REFRESH TOKEN HANDLING
 */
let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error, token = null) => {
    pendingQueue.forEach((p) => {
        if (error) p.reject(error);
        else p.resolve(token);
    });
    pendingQueue = [];
};

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error?.response?.status;
        const message =
            (error?.response?.data &&
                (error.response.data.message || error.response.data.error)) ||
            error?.message ||
            "";

        // Handle missing access token
        if (
            typeof message === "string" &&
            message.toLowerCase().includes("access token is required")
        ) {
            clearAuthStorage();
            redirectToSignIn();
            return Promise.reject(error);
        }

        // Handle unauthorized requests
        if (status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem("refresh_token");

            if (!refreshToken) {
                clearAuthStorage();
                redirectToSignIn();
                return Promise.reject(error);
            }

            // Wait for ongoing refresh
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    pendingQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (token)
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        return apiClient(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            isRefreshing = true;
            try {
                const { data } = await axios.post(
                    `${process.env.REACT_APP_API_BASE_URL}/api/auth/refresh-token`,
                    { refreshToken },
                    {
                        headers: { "Content-Type": "application/json" },
                    }
                );

                const newToken = data?.accessToken;
                const newRefresh = data?.refreshToken || refreshToken;
                const expiresAt = data?.expiresAt;

                if (newToken) localStorage.setItem("auth_token", newToken);
                if (newRefresh) localStorage.setItem("refresh_token", newRefresh);
                if (expiresAt) localStorage.setItem("expires_at", expiresAt);

                processQueue(null, newToken);

                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                clearAuthStorage();
                redirectToSignIn();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
