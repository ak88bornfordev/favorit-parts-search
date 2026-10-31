import { Empty, ErrorAlert, Loader } from './Status';

const money = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' });

// В shipmentDate дата - это день отгрузки, время - до скольки нужно заказать.
function formatShipment(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const date = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  const hasTime = d.getHours() || d.getMinutes();
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return hasTime ? <>{date}<br /><span className="text-body-secondary">заказ до {time}</span></> : date;
}

export default function OffersTable({ state, selected, onRetry }) {
  const { status, items, error } = state;

  let body;
  if (!selected) {
    body = <Empty>Выберите производителя слева - покажем предложения и аналоги.</Empty>;
  } else if (status === 'loading') {
    body = <Loader text="Загружаем предложения и аналоги..." />;
  } else if (status === 'failed') {
    body = <ErrorAlert message={error} onRetry={onRetry} />;
  } else if (items.length === 0) {
    body = <Empty>Для {selected.brand} {selected.number} предложений не найдено.</Empty>;
  } else {
    body = (
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0 offers-table">
          <thead>
            <tr>
              <th>Производитель / номер</th>
              <th className="d-none d-md-table-cell">Наименование</th>
              <th className="text-end">Цена</th>
              <th className="text-end">Остаток</th>
              <th className="d-none d-md-table-cell">Склад</th>
              <th className="d-none d-md-table-cell">Отгрузка</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.key} className={row.isAnalog ? '' : 'table-primary'}>
                <td>
                  <div className="fw-semibold">{row.brand}</div>
                  <div className="small text-body-secondary">
                    {row.number}
                    {!row.isAnalog && <span className="badge text-bg-primary ms-2">искомая</span>}
                  </div>
                  <div className="small d-md-none">{row.name}</div>
                </td>
                <td className="d-none d-md-table-cell">{row.name || '-'}</td>
                <td className="text-end text-nowrap fw-semibold">
                  {row.price != null ? money.format(row.price) : '-'}
                </td>
                <td className="text-end text-nowrap">
                  {row.stock > 0
                    ? `${row.stock} шт.`
                    : <span className="text-body-secondary">нет</span>}
                </td>
                <td className="d-none d-md-table-cell">{row.warehouse || '-'}</td>
                <td className="d-none d-md-table-cell small text-nowrap">{formatShipment(row.shipmentDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const positions = new Set(items.map((r) => r.goodsId)).size;

  return (
    <section className="card shadow-sm h-100">
      <div className="card-header bg-body">
        <span className="step">2</span> Предложения и аналоги
        {selected && <span className="text-body-secondary small ms-2">{selected.brand} {selected.number}</span>}
        {status === 'succeeded' && items.length > 0 && (
          <span className="text-body-secondary small ms-2">
            · позиций: {positions}, предложений: {items.length}
          </span>
        )}
      </div>
      <div className="card-body p-0">
        <div className={status === 'succeeded' && items.length ? '' : 'p-3'}>{body}</div>
      </div>
    </section>
  );
}
