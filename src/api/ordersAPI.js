import apiClient from "./client";

// Helpers
const only = (obj, keys) => keys.reduce((acc, k) => {
  if (obj[k] !== undefined && obj[k] !== null) acc[k] = obj[k];
  return acc;
}, {});

// User endpoints
export const getUserOrders = async (params = {}) => {
  const { page = 1, limit = 20, search, status } = params;
  const { data } = await apiClient.get("/api/orders", {
    params: { page, limit, search: search?.trim() || undefined, status: status || undefined },
  });
  return data;
};

export const getOrderById = async (id) => {
  const { data } = await apiClient.get(`/api/orders/${id}`);
  return data;
};

export const createOrder = async (payload) => {
  // Required: cartId, paymentMethod, shippingAddress
  const required = only(payload || {}, ["cartId", "paymentMethod", "shippingAddress"]);
  const { data } = await apiClient.post("/api/orders", required);
  return data;
};

export const requestReturn = async (payload) => {
  // Required: orderId, items[], reason
  const required = only(payload || {}, ["orderId", "items", "reason"]);
  const { data } = await apiClient.post("/api/orders/return", required);
  return data;
};

export const requestReplacement = async (payload) => {
  // Required: orderId, items[], reason
  const required = only(payload || {}, ["orderId", "items", "reason"]);
  const { data } = await apiClient.post("/api/orders/replacement", required);
  return data;
};

// Admin endpoints
export const getAllAdminOrders = async (params = {}) => {
  const { page = 1, limit = 50, search, status } = params;
  const { data } = await apiClient.get("/api/orders/admin/all", {
    params: { page, limit, search: search?.trim() || undefined, status: status || undefined },
  });
  return data;
};

export const updateOrderStatus = async (id, payload) => {
  try {
    // Simple validation instead of 'only' function
    if (!payload || !payload.status) {
      throw new Error('Status is required');
    }

    // Extract only status from payload (simple version of 'only')
    const required = { status: payload.status };

    // Log request (simpler version)
    console.log(`🔵 PUT Request: /api/orders/admin/${id}/status`);
    console.log('Payload:', JSON.stringify(required));

    // Make the request
    const response = await apiClient.put(
        `/api/orders/admin/${id}/status`,
        required
    );

    // Log response
    console.log(`✅ Response: ${response.status}`);
    console.log('Response Data:', response.data);

    return response.data;
  } catch (err) {
    // Enhanced error logging
    const errorDetails = {
      message: err.message,
      url: err.config?.url,
      method: err.config?.method?.toUpperCase(),
    };

    if (err.response) {
      // Server responded with error
      errorDetails.status = err.response.status;
      errorDetails.data = err.response.data;
      errorDetails.headers = err.response.headers;

      console.error('❌ Server Error:', errorDetails);
    } else if (err.request) {
      // Request made but no response
      errorDetails.request = err.request;
      console.error('❌ Network Error - No Response:', errorDetails);
    } else {
      // Error setting up request
      console.error('❌ Request Setup Error:', errorDetails);
    }

    // Check specifically for CORS error
    if (err.message && err.message.includes('Network Error') && !err.response) {
      console.error('🚨 CORS/BLOCKED: Request blocked by browser CORS policy');
      console.error('Try: 1. Check server CORS headers');
      console.error('     2. Try with Postman/curl to verify API works');
      console.error('     3. Check browser console for CORS errors');
    }

    throw err;
  }
};

export const processReturnReplacement = async (type, id, payload) => {
  // type: "return" | "replacement"
  const required = only(payload || {}, ["items", "reason"]);
  const { data } = await apiClient.put(`/api/orders/admin/${type}/${id}`, required);
  return data;
};

export const getOrderSummary = async (payload) => {
  // Required: cartId
  const required = only(payload || {}, ["cartId"]);
  const { data } = await apiClient.post("/api/orders/summary", required);
  return data;
};

// Admin: create order directly
export const createAdminOrder = async (payload = {}) => {
  const required = only(payload || {}, [
    "userId",
    "items",
    "paymentMethod",
    "shippingAddress",
    "billingAddress",
    "totals",
    "couponCode",
    "status"
  ]);
  const { data } = await apiClient.post("/api/orders/admin", required);
  return data;
};

// Admin: send invoice
export const sendInvoice = async (id) => {
  const { data } = await apiClient.post(`/api/orders/admin/${id}/invoice/send`);
  return data;
};

export default {
  getUserOrders,
  getOrderById,
  createOrder,
  requestReturn,
  requestReplacement,
  getAllAdminOrders,
  updateOrderStatus,
  processReturnReplacement,
  getOrderSummary,
  createAdminOrder,
  sendInvoice,
};
