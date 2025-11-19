import React, { useEffect } from "react";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/index";

import RouteScrollToTop from "./helper/RouteScrollToTop";
import { checkAuthRedirect } from "./api/client";

// Auth Pages
import SignInPage from "./pages/auth/SignInPage";
import SignUpPage from "./pages/auth/SignUpPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import TwoFactorEnable from "./pages/auth/TwoFactorEnable";
import TwoFactorAuthenticate from "./pages/auth/TwoFactorAuthenticate";

// Catalog Pages
import TagsPage from "./pages/catalog/TagsPage";
import AttributesPage from "./pages/catalog/AttributesPage";
import AttributeDetailsPage from "./pages/catalog/AttributeDetailsPage";
import BrandsPage from "./pages/catalog/BrandsPage";
import CategoriesPage from "./pages/catalog/CategoriesPage";
import ProductFaqPage from "./pages/catalog/ProductFaqPage";
import ProductSeoPage from "./pages/catalog/ProductSeoPage";
import ProductDesignPage from "./pages/catalog/ProductDesignPage";
import ProductPage from "./pages/catalog/ProductPage";
import ProductDetailsPage from "./pages/catalog/ProductDetailsPage";
import ProductVariantsPage from "./pages/catalog/ProductVariantsPage";
import StockLogsPage from "./pages/catalog/StockLogsPage";

// Orders Pages
import OrdersListPage from "./pages/orders/OrdersListPage";
import OrderDetailsPage from "./pages/orders/OrderDetailsPage";
import RefundsPage from "./pages/orders/RefundsPage";
import ReturnOrdersPage from "./pages/orders/ReturnOrdersPage";

// Pricing & Shipping
import ShippingPage from "./pages/shipping/ShippingPage";
import PricingPage from "./pages/pricing/PricingPage";
import TaxPage from "./pages/pricing/TaxPage";

// Offers & Discounts
import AutoDiscountPage from "./pages/offersAndDiscounts/AutoDiscountPage";
import BogoOffersPage from "./pages/offersAndDiscounts/BogoOffersPage";
import ComboOffersPage from "./pages/offersAndDiscounts/ComboOffersPage";
import CouponsPage from "./pages/offersAndDiscounts/CouponsPage";
import FlashSalesPage from "./pages/offersAndDiscounts/FlashSalesPage";

// Loyalty & Support
import LoyaltyProgramPage from "./pages/loyalty/LoyaltyProgramPage";
import EnquiriesList from "./pages/support/EnquiriesList";
import TicketsList from "./pages/support/TicketsList";

// Admin & Settings
import UsersList from "./pages/admin/UsersList";
import SettingsPage from "./pages/settings/SettingsPage";

// Home
import HomePageThree from "./pages/HomePageThree";
import BulkNegotiationListPage from "./pages/negotiation/BulkNegotiationListPage";

/**
 * Helper to check authentication
 */
const isAuthenticated = () => {
    const token = localStorage.getItem("auth_token");
    const expiresAt = localStorage.getItem("expires_at");
    if (!token || !expiresAt) return false;
    const expMs = /^\d+$/.test(expiresAt) ? Number(expiresAt) : Date.parse(expiresAt);
    return Date.now() < expMs;
};

/**
 * PrivateRoute — restricts access to authenticated users only
 */
const PrivateRoute = ({ children }) => {
    if (!isAuthenticated()) {
        return <Navigate to="/sign-in" replace />;
    }
    return children;
};

/**
 * AuthRoute — restricts access to login/signup pages if already authenticated
 */
const AuthRoute = ({ children }) => {
    if (isAuthenticated()) {
        return <Navigate to="/" replace />;
    }
    return children;
};

/**
 * Root App Component
 */
function App() {
    const location = useLocation();

    useEffect(() => {
        checkAuthRedirect();
    }, [location]);

    return (
        <Routes>
            {/* Public Auth Routes */}
            <Route
                path="/sign-in"
                element={
                    <AuthRoute>
                        <SignInPage />
                    </AuthRoute>
                }
            />
            <Route
                path="/sign-up"
                element={
                    <AuthRoute>
                        <SignUpPage />
                    </AuthRoute>
                }
            />
            <Route
                path="/reset-password"
                element={
                    <AuthRoute>
                        <ResetPasswordPage />
                    </AuthRoute>
                }
            />

            {/* Two-Factor Authentication (protected) */}
            <Route
                path="/2fa/enable"
                element={
                    <PrivateRoute>
                        <TwoFactorEnable />
                    </PrivateRoute>
                }
            />
            <Route
                path="/2fa/authenticate"
                element={
                    <PrivateRoute>
                        <TwoFactorAuthenticate />
                    </PrivateRoute>
                }
            />

            {/* Protected Routes */}
            <Route
                path="/"
                element={
                    <PrivateRoute>
                        <HomePageThree />
                    </PrivateRoute>
                }
            />
            <Route
                path="/tags"
                element={
                    <PrivateRoute>
                        <TagsPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/attributes"
                element={
                    <PrivateRoute>
                        <AttributesPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/attributes/:id"
                element={
                    <PrivateRoute>
                        <AttributeDetailsPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/brands"
                element={
                    <PrivateRoute>
                        <BrandsPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/categories"
                element={
                    <PrivateRoute>
                        <CategoriesPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/product-faq"
                element={
                    <PrivateRoute>
                        <ProductFaqPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/product-seo"
                element={
                    <PrivateRoute>
                        <ProductSeoPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/product-design"
                element={
                    <PrivateRoute>
                        <ProductDesignPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/products"
                element={
                    <PrivateRoute>
                        <ProductPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/products/:id"
                element={
                    <PrivateRoute>
                        <ProductDetailsPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/orders"
                element={
                    <PrivateRoute>
                        <OrdersListPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/orders/pending"
                element={
                    <PrivateRoute>
                        <OrdersListPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/orders/returns"
                element={
                    <PrivateRoute>
                        <ReturnOrdersPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/orders/refunds"
                element={
                    <PrivateRoute>
                        <RefundsPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/orders/:id"
                element={
                    <PrivateRoute>
                        <OrderDetailsPage />
                    </PrivateRoute>
                }
            />
            {/* Bulk Negotiation Routes */}
            <Route
                path="/negotiation/all"
                element={
                    <PrivateRoute>
                        <BulkNegotiationListPage />
                    </PrivateRoute>
                }
            />

            <Route
                path="/shipping"
                element={
                    <PrivateRoute>
                        <ShippingPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/pricing"
                element={
                    <PrivateRoute>
                        <PricingPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/taxs"
                element={
                    <PrivateRoute>
                        <TaxPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/products/create"
                element={
                    <PrivateRoute>
                        <ProductDesignPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/product-variants"
                element={
                    <PrivateRoute>
                        <ProductVariantsPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/stock-logs"
                element={
                    <PrivateRoute>
                        <StockLogsPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/offers/auto-discounts"
                element={
                    <PrivateRoute>
                        <AutoDiscountPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/offers/bogo-offers"
                element={
                    <PrivateRoute>
                        <BogoOffersPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/offers/combo-offers"
                element={
                    <PrivateRoute>
                        <ComboOffersPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/offers/coupons"
                element={
                    <PrivateRoute>
                        <CouponsPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/offers/flash-sales"
                element={
                    <PrivateRoute>
                        <FlashSalesPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/loyalty/program"
                element={
                    <PrivateRoute>
                        <LoyaltyProgramPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/support/enquiries"
                element={
                    <PrivateRoute>
                        <EnquiriesList />
                    </PrivateRoute>
                }
            />
            <Route
                path="/support/tickets"
                element={
                    <PrivateRoute>
                        <TicketsList />
                    </PrivateRoute>
                }
            />
            <Route
                path="/admin/users"
                element={
                    <PrivateRoute>
                        <UsersList />
                    </PrivateRoute>
                }
            />
            <Route
                path="/settings"
                element={
                    <PrivateRoute>
                        <SettingsPage />
                    </PrivateRoute>
                }
            />
        </Routes>
    );
}

/**
 * Wrap the App with BrowserRouter and Redux Provider
 */
export default function AppWrapper() {
    return (
        <Provider store={store}>
            <BrowserRouter>
                <RouteScrollToTop />
                <App />
            </BrowserRouter>
        </Provider>
    );
}
