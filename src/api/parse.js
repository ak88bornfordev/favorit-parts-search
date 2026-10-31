// Чистые функции разбора ответа API. Без сети и без Redux - их легко тестировать.

const KNOWN_ERRORS = {
  'Empty key!': 'Не указан ключ покупателя (FAVORIT_API_KEY).',
  'Invalid key client!': 'Неверный ключ покупателя: сервис его не узнал.',
  'Empty number goods!': 'Не указан номер детали.',
  'Request quota exceeded!': 'Превышен лимит запросов. Попробуйте позже.',
};

export class ApiError extends Error {}

// Если товар не найден, сервис возвращает массив с одной пустой структурой.
// Такие "пустышки" отбрасываем.
export const isRealItem = (item) =>
  Boolean(item && typeof item === 'object' && (item.goodsID || item.number || item.brand));

export function translateError(raw) {
  const messages = Array.isArray(raw) ? raw : [raw];
  return messages.map((m) => KNOWN_ERRORS[String(m).trim()] || String(m)).join(' ');
}

// Общий разбор: ошибка сервиса -> исключение, иначе список реальных товаров.
export function parseGoods(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError('Сервис вернул некорректный ответ.');
  }
  if (data.error) {
    throw new ApiError(translateError(data.error));
  }
  const goods = Array.isArray(data.goods) ? data.goods : [];
  return goods.filter(isRealItem);
}

// Этап 1: уникальные производители по артикулу.
export function toBrands(goods) {
  const seen = new Map();
  goods.forEach((g) => {
    if (!g.brand || seen.has(g.brand)) return;
    seen.set(g.brand, {
      brand: g.brand,
      number: g.number,
      name: g.name || '',
      count: Number(g.count) || 0,
    });
  });
  return [...seen.values()];
}

function warehouseTitle(w) {
  if (w.code) return w.code;
  return w.own ? 'Наш склад' : 'Склад поставщика';
}

// Этап 2: плоский список предложений. Одна строка = товар на конкретном складе.
// Цену берем со склада: поле price у товара по документации использовать нельзя.
export function toOffers(goods) {
  const rows = [];
  const usedIds = new Set();

  const addItem = (item, isAnalog) => {
    const id = item.goodsID || `${item.brand}|${item.number}`;
    if (usedIds.has(id)) return;
    usedIds.add(id);

    const base = {
      goodsId: id,
      brand: item.brand || '',
      number: item.number || '',
      name: item.name || '',
      isAnalog,
    };
    const warehouses = Array.isArray(item.warehouses) ? item.warehouses : [];

    if (warehouses.length === 0) {
      rows.push({ ...base, key: `${id}|none`, price: null, stock: 0, warehouse: null, shipmentDate: null });
      return;
    }
    warehouses.forEach((w, i) => {
      rows.push({
        ...base,
        key: `${id}|${w.id || i}`,
        price: typeof w.price === 'number' ? w.price : Number(w.price) || null,
        stock: Number(w.stock) || 0,
        warehouse: warehouseTitle(w),
        shipmentDate: w.shipmentDate || null,
      });
    });
  };

  goods.forEach((item) => {
    addItem(item, false);
    (item.analogues || []).filter(isRealItem).forEach((a) => addItem(a, true));
  });

  // Сначала искомая деталь, потом аналоги; внутри группы - по возрастанию цены.
  return rows.sort((a, b) => {
    if (a.isAnalog !== b.isAnalog) return a.isAnalog ? 1 : -1;
    return (a.price ?? Infinity) - (b.price ?? Infinity);
  });
}
