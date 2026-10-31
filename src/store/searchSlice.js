import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { requestParts } from '../api/favorit';
import { toBrands, toOffers } from '../api/parse';

// Этап 1: производители по артикулу.
export const fetchBrands = createAsyncThunk(
  'search/fetchBrands',
  async (number, { signal, rejectWithValue }) => {
    try {
      return toBrands(await requestParts({ number }, signal));
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      return rejectWithValue(e.message);
    }
  },
);

// Этап 2: предложения и аналоги по паре "номер + бренд".
export const fetchOffers = createAsyncThunk(
  'search/fetchOffers',
  async ({ number, brand }, { signal, rejectWithValue }) => {
    try {
      return toOffers(await requestParts({ number, brand, analogues: true }, signal));
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      return rejectWithValue(e.message);
    }
  },
);

const emptyRequest = { status: 'idle', items: [], error: null, requestId: null };

const initialState = {
  query: '',
  brands: { ...emptyRequest },
  selected: null, // { brand, number }
  offers: { ...emptyRequest },
};

// Общая логика трех состояний запроса. Устаревшие ответы (requestId не совпал) игнорируем,
// чтобы медленный старый запрос не перетер результат нового.
function trackRequest(builder, thunk, key, onPending) {
  builder
    .addCase(thunk.pending, (state, action) => {
      state[key] = { status: 'loading', items: [], error: null, requestId: action.meta.requestId };
      onPending?.(state);
    })
    .addCase(thunk.fulfilled, (state, action) => {
      if (state[key].requestId !== action.meta.requestId) return;
      state[key].status = 'succeeded';
      state[key].items = action.payload;
    })
    .addCase(thunk.rejected, (state, action) => {
      if (state[key].requestId !== action.meta.requestId) return;
      if (action.meta.aborted) {
        state[key].status = 'idle';
        return;
      }
      state[key].status = 'failed';
      state[key].error = action.payload || 'Что-то пошло не так. Попробуйте еще раз.';
    });
}

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery(state, action) {
      state.query = action.payload;
    },
    selectBrand(state, action) {
      state.selected = action.payload;
    },
    // Очистка результатов, когда поле артикула стало пустым или слишком коротким.
    clearResults(state) {
      state.brands = { ...emptyRequest };
      state.selected = null;
      state.offers = { ...emptyRequest };
    },
  },
  extraReducers: (builder) => {
    // Новый поиск по артикулу сбрасывает выбор бренда и таблицу предложений.
    trackRequest(builder, fetchBrands, 'brands', (state) => {
      state.selected = null;
      state.offers = { ...emptyRequest };
    });
    trackRequest(builder, fetchOffers, 'offers');
  },
});

export const { setQuery, selectBrand, clearResults } = searchSlice.actions;
export default searchSlice.reducer;
