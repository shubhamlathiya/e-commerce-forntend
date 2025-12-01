import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../../api/client";

const API_URL = "/api/catalog/categories";

// --- Async thunks ---
export const getAllCategories = createAsyncThunk(
  "categories/getAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, search } = params || {};
      const { data } = await apiClient.get(API_URL, { params: { page, limit, search } });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const getCategoryTree = createAsyncThunk(
  "categories/getTree",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(`${API_URL}/tree`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createCategory = createAsyncThunk(
  "categories/create",
  async (payload, { rejectWithValue }) => {
    try {
      const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
      let response;
      if (isFormData) {
        response = await apiClient.post(API_URL, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        const body = {
          name: payload?.name,
          slug: payload?.slug,
          parentId: payload?.parentId || undefined,
          icon: payload?.icon,
          image: payload?.image,
          isOnSale: !!payload?.isOnSale,
          saleBanner: payload?.saleBanner,
          tabCategory: payload?.tabCategory,
          status: typeof payload?.status === "string" ? payload.status === "active" : !!payload?.status,
          isFeatured: typeof payload?.isFeatured === "string" ? payload.isFeatured === "true" : !!payload?.isFeatured,
          sortOrder: Number(payload?.sortOrder) || 0,
          metaTitle: payload?.metaTitle,
          metaDescription: payload?.metaDescription,
        };
        response = await apiClient.post(API_URL, body);
      }
      const { data } = response;
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const getCategoryById = createAsyncThunk(
  "categories/getById",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(`${API_URL}/${id}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateCategory = createAsyncThunk(
  "categories/update",
  async ({ id, data: body }, { rejectWithValue }) => {
    try {
      const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
      let response;
      if (isFormData) {
        response = await apiClient.patch(`${API_URL}/${id}`, body, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        const patchBody = {
          ...(body?.name !== undefined ? { name: body.name } : {}),
          ...(body?.slug !== undefined ? { slug: body.slug } : {}),
          ...(body?.parentId !== undefined ? { parentId: body.parentId || undefined } : {}),
          ...(body?.icon !== undefined ? { icon: body.icon } : {}),
          ...(body?.image !== undefined ? { image: body.image } : {}),
          ...(body?.isOnSale !== undefined ? { isOnSale: !!body.isOnSale } : {}),
          ...(body?.saleBanner !== undefined ? { saleBanner: body.saleBanner } : {}),
          ...(body?.tabCategory !== undefined ? { tabCategory: body.tabCategory } : {}),
          ...(body?.status !== undefined
            ? { status: typeof body.status === "string" ? body.status === "active" : !!body.status }
            : {}),
          ...(body?.isFeatured !== undefined
            ? { isFeatured: typeof body.isFeatured === "string" ? body.isFeatured === "true" : !!body.isFeatured }
            : {}),
          ...(body?.sortOrder !== undefined ? { sortOrder: Number(body.sortOrder) || 0 } : {}),
          ...(body?.metaTitle !== undefined ? { metaTitle: body.metaTitle } : {}),
          ...(body?.metaDescription !== undefined ? { metaDescription: body.metaDescription } : {}),
        };
        response = await apiClient.patch(`${API_URL}/${id}`, patchBody);
      }
      const { data } = response;
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteCategory = createAsyncThunk(
  "categories/delete",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`${API_URL}/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const initialState = {
  items: [],
  current: null,
  categoryTree: [],
  form: {
    name: "",
    slug: "",
    parentId: "",
    icon: "",
    image: "",
    isOnSale: false,
    saleBanner: "",
    tabCategory: "",
    status: true,
    isFeatured: false,
    sortOrder: 0,
    metaTitle: "",
    metaDescription: "",
  },
  modalOpen: false,
  status: "idle",
  error: null,
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    openCreateModal(state) {
      state.modalOpen = true;
      state.current = null;
      state.form = {
        name: "",
        slug: "",
        parentId: "",
        icon: "",
        image: "",
        isOnSale: false,
        saleBanner: "",
        tabCategory: "",
        status: true,
        isFeatured: false,
        sortOrder: 0,
        metaTitle: "",
        metaDescription: "",
      };
    },
    openEditModal(state, action) {
      state.modalOpen = true;
      state.current = action.payload;
      state.form = {
        name: action.payload?.name || "",
        slug: action.payload?.slug || "",
        parentId: action.payload?.parentId || "",
        icon: action.payload?.icon || "",
        image: action.payload?.image || "",
        isOnSale: !!action.payload?.isOnSale,
        saleBanner: action.payload?.saleBanner || "",
        tabCategory: action.payload?.tabCategory || "",
        status: !!action.payload?.status,
        isFeatured: !!action.payload?.isFeatured,
        sortOrder: Number(action.payload?.sortOrder) || 0,
        metaTitle: action.payload?.metaTitle || "",
        metaDescription: action.payload?.metaDescription || "",
      };
    },
    closeModal(state) {
      state.modalOpen = false;
    },
    setFormField(state, action) {
      const { field, value } = action.payload;
      state.form[field] = value;
    },
    resetForm(state) {
      state.form = {
        name: "",
        slug: "",
        parentId: "",
        icon: "",
        image: "",
        isOnSale: false,
        saleBanner: "",
        tabCategory: "",
        status: true,
        isFeatured: false,
        sortOrder: 0,
        metaTitle: "",
        metaDescription: "",
      };
    },
    setPage(state, action) {
      state.page = action.payload || 1;
    },
    setLimit(state, action) {
      state.limit = action.payload || 10;
    },
  },
  extraReducers: (builder) => {
    builder
      // getAllCategories
      .addCase(getAllCategories.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(getAllCategories.fulfilled, (state, action) => {
        state.status = "succeeded";
        const payload = action.payload || {};
        const items = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.items)
          ? payload.items
          : [];
        state.items = items;
        const page = payload?.page ?? payload?.meta?.page ?? state.page;
        const limit = payload?.limit ?? payload?.meta?.limit ?? state.limit;
        const total = payload?.total ?? payload?.meta?.total ?? items.length;
        const totalPages = payload?.totalPages ?? payload?.meta?.totalPages ?? Math.max(1, Math.ceil(total / (limit || 1)));
        state.page = page;
        state.limit = limit;
        state.total = total;
        state.totalPages = totalPages;
      })
      .addCase(getAllCategories.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      // getCategoryTree
      .addCase(getCategoryTree.pending, (state) => {
        state.error = null;
      })
      .addCase(getCategoryTree.fulfilled, (state, action) => {
        const tree = action.payload?.data || action.payload || [];
        state.categoryTree = tree;
      })
      .addCase(getCategoryTree.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      // createCategory
      .addCase(createCategory.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.status = "succeeded";
        const created = action.payload?.data || action.payload;
        if (created) state.items.push(created);
        state.modalOpen = false;
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      // getCategoryById
      .addCase(getCategoryById.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(getCategoryById.fulfilled, (state, action) => {
        state.status = "succeeded";
        const cat = action.payload?.data || action.payload;
        state.current = cat;
      })
      .addCase(getCategoryById.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      // updateCategory
      .addCase(updateCategory.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updated = action.payload?.data || action.payload;
        const idx = state.items.findIndex((t) => (t.id || t._id) === (updated?.id || updated?._id));
        if (idx >= 0) state.items[idx] = updated;
        state.modalOpen = false;
        state.current = null;
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      // deleteCategory
      .addCase(deleteCategory.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.status = "succeeded";
        const id = action.payload;
        state.items = state.items.filter((t) => (t.id || t._id) !== id);
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      });
  },
});

export const { openCreateModal, openEditModal, closeModal, setFormField, resetForm, setPage, setLimit } =
  categoriesSlice.actions;
export default categoriesSlice.reducer;

