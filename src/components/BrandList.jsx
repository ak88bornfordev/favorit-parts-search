import { Empty, ErrorAlert, Loader } from './Status';

export default function BrandList({ state, query, selected, onSelect, onRetry }) {
  const { status, items, error } = state;

  let body;
  if (status === 'idle') {
    body = <Empty>Начните вводить артикул - здесь появятся производители.</Empty>;
  } else if (status === 'loading') {
    body = <Loader text="Ищем производителей..." />;
  } else if (status === 'failed') {
    body = <ErrorAlert message={error} onRetry={onRetry} />;
  } else if (items.length === 0) {
    body = <Empty>По артикулу <b>{query}</b> ничего не найдено. Проверьте номер.</Empty>;
  } else {
    body = (
      <div className="list-group">
        {items.map((item) => {
          const active = selected?.brand === item.brand && selected?.number === item.number;
          return (
            <button
              key={`${item.brand}|${item.number}`}
              type="button"
              className={`list-group-item list-group-item-action d-flex justify-content-between align-items-start gap-2 ${active ? 'active' : ''}`}
              aria-pressed={active}
              onClick={() => onSelect(item)}
            >
              <div className="text-start">
                <div className="fw-semibold">{item.brand}</div>
                <div className={`small ${active ? '' : 'text-body-secondary'}`}>
                  {item.number}{item.name ? ` · ${item.name}` : ''}
                </div>
              </div>
              <span className={`badge rounded-pill ${item.count > 0 ? 'text-bg-success' : 'text-bg-secondary'}`}>
                {item.count > 0 ? `${item.count} шт.` : 'нет'}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <section className="card shadow-sm h-100">
      <div className="card-header bg-body">
        <span className="step">1</span> Производитель
        {status === 'succeeded' && items.length > 0 && (
          <span className="badge rounded-pill text-bg-light border ms-1">{items.length}</span>
        )}
      </div>
      <div className="card-body">{body}</div>
    </section>
  );
}
