import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "react-hot-toast";
import {
  listFlashSales,
  createFlashSale as apiCreateFlashSale,
  updateFlashSale as apiUpdateFlashSale,
  deleteFlashSale as apiDeleteFlashSale,
} from "../../api/flashSalesApi";

const initialState = {
  items: [],
  loading: false,
  error: null,
  statusFilter: "all", // all | scheduled | running | expired
  search: "",
  page: 1,
  limit: 20,
  total: 0,
};

export const getAllFlashSales = createAsyncThunk(
  "flashSales/getAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await listFlashSales(params);
      return data;
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load flash sales";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const createFlashSale = createAsyncThunk(
  "flashSales/create",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await apiCreateFlashSale(payload);
      toast.success("Flash sale created");
      return data;
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to create flash sale";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const updateFlashSale = createAsyncThunk(
  "flashSales/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const data = await apiUpdateFlashSale(id, payload);
      toast.success("Flash sale updated");
      return data;
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to update flash sale";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const deleteFlashSale = createAsyncThunk(
  "flashSales/delete",
  async (id, { rejectWithValue }) => {
    try {
      const data = await apiDeleteFlashSale(id);
      toast.success("Flash sale deleted");
      return { id, data };
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to delete flash sale";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

const flashSalesSlice = createSlice({
  name: "flashSales",
  initialState,
  reducers: {
    setStatusFilter(state, action) {
      state.statusFilter = action.payload;
    },
    setSearch(state, action) {
      state.search = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllFlashSales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllFlashSales.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload || {};
        state.items = Array.isArray(payload.items) ? payload.items : Array.isArray(payload) ? payload : [];
        state.total = payload.total || state.items.length;
      })
      .addCase(getAllFlashSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load flash sales";
      })
      .addCase(createFlashSale.fulfilled, (state, action) => {
        const created = action.payload;
        if (created && created._id) {
          state.items = [created, ...state.items];
        }
      })
      .addCase(updateFlashSale.fulfilled, (state, action) => {
        const updated = action.payload;
        state.items = state.items.map((x) => (x._id === updated._id ? updated : x));
      })
      .addCase(deleteFlashSale.fulfilled, (state, action) => {
        const { id } = action.payload || {};
        state.items = state.items.filter((x) => x._id !== id);
      });
  },
});

export const { setStatusFilter, setSearch } = flashSalesSlice.actions;
export default flashSalesSlice.reducer;

