import apiClient from "./client";

// List stock logs (paginated)
export const listStockLogs = async ({ page = 1, limit = 10, productId } = {}) => {
  const params = { page, limit };
  if (productId) params.productId = productId;
  const { data } = await apiClient.get("/api/catalog/stock", { params });
  return data;
};

// Create a stock log entry
export const createStockLog = async (payload) => {
  const { data } = await apiClient.post("/api/catalog/stock", payload);
  return data;
};

export default {
  listStockLogs,
  createStockLog,
};
