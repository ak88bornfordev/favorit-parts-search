import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  clearResults, fetchBrands, fetchOffers, selectBrand, setQuery,
} from './store/searchSlice';
import { isMockMode } from './api/favorit';
import SearchForm from './components/SearchForm';
import BrandList from './components/BrandList';
import OffersTable from './components/OffersTable';

const MIN_LENGTH = 3;
const DEBOUNCE_MS = 600;

export default function App() {
  const dispatch = useDispatch();
  const { query, brands, selected, offers } = useSelector((s) => s.search);

  // Ссылки на текущие запросы - чтобы отменять их, когда пользователь ввел новое.
  const brandsReq = useRef(null);
  const offersReq = useRef(null);
  const timer = useRef(null);

  const searchBrands = useCallback((value) => {
    clearTimeout(timer.current);
    offersReq.current?.abort();
    brandsReq.current?.abort();
    brandsReq.current = dispatch(fetchBrands(value));
  }, [dispatch]);

  // Поиск "по факту ввода": ждем паузу в наборе, потом запрашиваем производителей.
  useEffect(() => {
    const value = query.trim();
    if (value.length < MIN_LENGTH) {
      clearTimeout(timer.current);
      brandsReq.current?.abort();
      offersReq.current?.abort();
      dispatch(clearResults());
      return undefined;
    }
    timer.current = setTimeout(() => searchBrands(value), DEBOUNCE_MS);
    return () => clearTimeout(timer.current);
  }, [query, searchBrands, dispatch]);

  const handleSubmit = () => {
    const value = query.trim();
    if (value.length >= MIN_LENGTH) searchBrands(value);
  };

  const chooseBrand = useCallback((item) => {
    const params = { brand: item.brand, number: item.number };
    offersReq.current?.abort();
    dispatch(selectBrand(params));
    offersReq.current = dispatch(fetchOffers(params));
  }, [dispatch]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="container py-4">
          <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
            <h1 className="h3 mb-0">Подбор запчастей и аналогов</h1>
            {isMockMode && <span className="badge text-bg-warning">демо-данные</span>}
          </div>
          <p className="text-body-secondary mb-3">
            Введите артикул, выберите производителя - и получите цены и остатки по детали и ее аналогам.
          </p>
          <SearchForm
            value={query}
            minLength={MIN_LENGTH}
            loading={brands.status === 'loading'}
            onChange={(v) => dispatch(setQuery(v))}
            onSubmit={handleSubmit}
          />
        </div>
      </header>

      <main className="container py-4">
        <div className="row g-4">
          <div className="col-lg-4 col-xl-3">
            <BrandList
              state={brands}
              query={query.trim()}
              selected={selected}
              onSelect={chooseBrand}
              onRetry={() => searchBrands(query.trim())}
            />
          </div>
          <div className="col-lg-8 col-xl-9">
            <OffersTable
              state={offers}
              selected={selected}
              onRetry={() => selected && chooseBrand(selected)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
