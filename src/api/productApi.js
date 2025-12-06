import apiClient from "./client";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Helper to include auth token
const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

// Get token from localStorage
const getToken = () => localStorage.getItem('auth_token');

const productApi = {
  // ==================== PRODUCTS ====================

  // Get all products with pagination and search
  getProducts: async ({ page = 1, limit = 12, search = "", brandId, categoryId, status, isFeatured, type } = {}) => {
    const params = { page, limit };
    if (search && search.trim()) params.search = search.trim();
    if (brandId) params.brandId = brandId;
    if (categoryId) params.categoryId = categoryId;
    if (status !== undefined) params.status = status;
    if (isFeatured !== undefined) params.isFeatured = isFeatured;
    if (type) params.type = type;

    const { data } = await apiClient.get("/api/catalog/products", {
      params,
      headers: authHeaders(getToken()),
    });
    return data;
  },

  // Get single product by ID
  getProduct: async (id) => {
    const { data } = await apiClient.get(`/api/catalog/products/${id}`, {
      headers: authHeaders(getToken()),
    });
    return data;
  },

  // Alias for product details (per Admin requirement)
  getProductDetails: async (id) => {
    const { data } = await apiClient.get(`/api/catalog/products/${id}`, {
      headers: authHeaders(getToken()),
    });
    return data;
  },

  // Create new product with FormData (supports images)
  createProduct: async (formData) => {
    const { data } = await apiClient.post(`${API_BASE_URL}api/catalog/products`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return data;
  },

  // Update product with FormData (supports images)
  updateProduct: async (id, formData) => {

    const { data } = await apiClient.patch(`${API_BASE_URL}api/catalog/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return data;
  },

  // Update only shipping information (JSON PATCH)
  updateProductShipping: async (id, shipping) => {
    const { data } = await apiClient.patch(`/api/catalog/products/${id}`, { shipping }, {
      headers: authHeaders(getToken()),
    });
    return data;
  },

  // Delete product
  deleteProduct: async (id) => {
    const { data } = await apiClient.delete(`${API_BASE_URL}api/catalog/products/${id}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return data;
  },

  // ==================== BRANDS ====================

  // Get all brands
  getBrands: async () => {
    const { data } = await apiClient.get("/api/catalog/brands", {
      headers: authHeaders(getToken()),
    });

    return data;
  },

  // Create new brand
  createBrand: async (payload) => {
    const { data } = await apiClient.post("/api/catalog/brands", payload, {
      headers: authHeaders(getToken()),
    });
    return data;
  },

  // ==================== CATEGORIES ====================

  // Get all categories
  getCategories: async () => {
    const { data } = await apiClient.get("/api/catalog/categories", {
      headers: authHeaders(getToken()),
    });

    return data;
  },

  // Create new category
  createCategory: async (payload) => {
    const { data } = await apiClient.post("/api/catalog/categories", payload, {
      headers: authHeaders(getToken()),
    });
    return data;
  },

  // ==================== TAGS ====================

  // Get all tags
  getTags: async () => {
    const { data } = await apiClient.get("/api/catalog/tags", {
      headers: authHeaders(getToken()),
    });

    return data;
  },

  // Create new tag
  createTag: async (payload) => {
    const { data } = await apiClient.post("/api/catalog/tags", payload, {
      headers: authHeaders(getToken()),
    });
    return data;
  },

  // ==================== GENERIC ENTITY CREATION ====================

  // Generic entity creation helper
  createEntity: async (entity, payload) => {
    const { data } = await apiClient.post(`/api/catalog/${entity}`, payload, {
      headers: authHeaders(getToken()),
    });
    return data;
  },

  // ==================== PRODUCT GALLERY ====================

  // Get product gallery
  getProductGallery: async (productId) => {
    const { data } = await apiClient.get(`/api/catalog/product-gallery/${productId}`, {
      headers: authHeaders(getToken()),
    });
    return data;
  },

  // Add images to product gallery
  addGalleryImages: async (productId, formData) => {
    const { data } = await apiClient.post(`${API_BASE_URL}/api/catalog/product-gallery/${productId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return data;
  },

  // Replace product gallery images
  replaceGallery: async (productId, formData) => {
    const { data } = await apiClient.put(`${API_BASE_URL}/api/catalog/product-gallery/${productId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return data;
  },

  // Remove specific image from gallery
  removeGalleryImage: async (productId, imageIndex) => {
    const { data } = await apiClient.delete(`${API_BASE_URL}/api/catalog/product-gallery/${productId}/images/${imageIndex}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return data;
  },

  // Delete entire product gallery
  deleteGallery: async (productId) => {
    const { data } = await apiClient.delete(`${API_BASE_URL}/api/catalog/product-gallery/${productId}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return data;
  },

  // ==================== PRODUCT SEO ====================

  // Get product SEO
  getProductSeo: async (productId) => {
    const { data } = await apiClient.get(`/api/catalog/product-seo/${productId}`, {
      headers: authHeaders(getToken()),
    });
    return data;
  },

  // Create or update product SEO
  upsertProductSeo: async (productId, payload) => {
    const { data } = await apiClient.post(`/api/catalog/product-seo/${productId}`, payload, {
      headers: authHeaders(getToken()),
    });
    return data;
  },

  // Delete product SEO
  deleteProductSeo: async (productId) => {
    const { data } = await apiClient.delete(`/api/catalog/product-seo/${productId}`, {
      headers: authHeaders(getToken()),
    });
    return data;
  }
};

export default productApi;