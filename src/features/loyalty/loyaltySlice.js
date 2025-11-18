import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "react-hot-toast";
import { getAccount, upsertAccount, addTransaction, getHistory } from "../../api/loyaltyApi";

const initialState = {
  selectedUserId: "",
  account: null, // { points, tier, updatedAt }
  history: [],
  loading: false,
  error: null,
};

export const fetchAccount = createAsyncThunk("loyalty/fetchAccount", async (userId, { rejectWithValue }) => {
  try {
    if (!userId) throw new Error("User is required");
    const data = await getAccount(userId);
    return data;
  } catch (e) {
    return rejectWithValue(e?.response?.data?.message || e.message || "Failed to fetch account");
  }
});

export const upsertPoints = createAsyncThunk("loyalty/upsertPoints", async ({ userId, points }, { rejectWithValue }) => {
  try {
    if (!userId) throw new Error("User is required");
    if (points == null || Number(points) < 0) throw new Error("Points must be >= 0");
    const data = await upsertAccount(userId, { points: Number(points) });
    toast.success("Points updated");
    return data;
  } catch (e) {
    toast.error(e?.response?.data?.message || e.message || "Failed to update points");
    return rejectWithValue(e?.response?.data?.message || e.message);
  }
});

export const addHistoryTransaction = createAsyncThunk("loyalty/addHistoryTransaction", async ({ userId, payload }, { rejectWithValue }) => {
  try {
    if (!userId) throw new Error("User is required");
    const data = await addTransaction(userId, payload);
    toast.success("Transaction added");
    return data;
  } catch (e) {
    toast.error(e?.response?.data?.message || e.message || "Failed to add transaction");
    return rejectWithValue(e?.response?.data?.message || e.message);
  }
});

export const fetchHistory = createAsyncThunk("loyalty/fetchHistory", async (userId, { rejectWithValue }) => {
  try {
    if (!userId) throw new Error("User is required");
    const list = await getHistory(userId);
    return list;
  } catch (e) {
    return rejectWithValue(e?.response?.data?.message || e.message || "Failed to fetch history");
  }
});

const loyaltySlice = createSlice({
  name: "loyalty",
  initialState,
  reducers: {
    setSelectedUserId(state, action) {
      state.selectedUserId = action.payload;
    },
    clear(state) {
      state.account = null;
      state.history = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccount.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAccount.fulfilled, (state, action) => { state.loading = false; state.account = action.payload; })
      .addCase(fetchAccount.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(upsertPoints.pending, (state) => { state.loading = true; })
      .addCase(upsertPoints.fulfilled, (state, action) => { state.loading = false; state.account = action.payload; })
      .addCase(upsertPoints.rejected, (state) => { state.loading = false; })

      .addCase(fetchHistory.pending, (state) => { state.loading = true; })
      .addCase(fetchHistory.fulfilled, (state, action) => { state.loading = false; state.history = Array.isArray(action.payload) ? action.payload : []; })
      .addCase(fetchHistory.rejected, (state) => { state.loading = false; })

      .addCase(addHistoryTransaction.fulfilled, (state, action) => {
        const created = action.payload;
        state.history = [created, ...state.history];
      });
  },
});

export const { setSelectedUserId, clear } = loyaltySlice.actions;
export default loyaltySlice.reducer;

