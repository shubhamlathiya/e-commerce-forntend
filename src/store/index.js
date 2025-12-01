import {configureStore} from "@reduxjs/toolkit";
import appReducer from "../features/app/appSlice";
import tagsReducer from "../features/catalog/tagsSlice";
import authReducer from "../features/auth/authSlice";
import attributesReducer from "../features/catalog/attributesSlice";
import brandsReducer from "../features/catalog/brandsSlice";
import categoriesReducer from "../features/catalog/categoriesSlice";
import productFaqsReducer from "../features/catalog/productFaqSlice";
import productSeoReducer from "../features/catalog/productSeoSlice";
import productsReducer from "../features/catalog/productsSlice";
import autoDiscountsReducer from "../features/offersAndDiscounts/autoDiscountSlice";
import bogoReducer from "../features/offersAndDiscounts/bogoSlice";
import comboReducer from "../features/offersAndDiscounts/comboSlice";
import couponsReducer from "../features/offersAndDiscounts/couponsSlice";
import flashSalesReducer from "../features/offersAndDiscounts/flashSalesSlice";
import loyaltyReducer from "../features/loyalty/loyaltySlice";
import tabCategoriesReducer from "../features/catalog/tabCategoriesSlice";

export const store = configureStore({
    reducer: {
        app: appReducer,
        auth: authReducer,
        tags: tagsReducer,
        attributes: attributesReducer,
        brands: brandsReducer,
        categories: categoriesReducer,
        products: productsReducer,
        productFaqs: productFaqsReducer,
        productSeo: productSeoReducer,
        autoDiscounts: autoDiscountsReducer,
        bogo: bogoReducer,
        combo: comboReducer,
        coupons: couponsReducer,
        flashSales: flashSalesReducer,
        loyalty: loyaltyReducer,
        tabCategories: tabCategoriesReducer,

    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false,
    }),
});
