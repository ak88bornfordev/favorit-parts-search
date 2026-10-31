// Демо-данные в формате документации API. Включаются через npm run dev:mock,
// чтобы интерфейс можно было посмотреть без ключа покупателя.
// Цены и остатки выдуманы.
//
// Спец-артикулы для проверки ошибок:
//   ERROR  - сбой сети
//   QUOTA  - ошибка сервиса "Request quota exceeded!"
//   любой другой неизвестный - пустой ответ ("ничего не найдено")

import { ApiError } from './parse';

const wh = (id, code, own, price, stock, date) => ({
  id, code, own, price, stock, shipmentDate: date,
});

const CATALOG = {
  OC90: [
    {
      goodsID: 'g-1', brand: 'KNECHT', number: 'OC90', name: 'Фильтр масляный', count: 14,
      warehouses: [wh('w1', 'МС1', true, 612.4, 9, '2026-10-30T15:00:00'), wh('w2', '', false, 589, 5, '2026-11-02T12:00:00')],
      analogues: [
        {
          goodsID: 'g-2', brand: 'MANN-FILTER', number: 'W712/52', name: 'Фильтр масляный', count: 31,
          warehouses: [wh('w1', 'МС1', true, 498.9, 21, '2026-10-30T15:00:00'), wh('w3', 'МС2', true, 505, 10, '2026-10-31T11:00:00')],
        },
        {
          goodsID: 'g-3', brand: 'BOSCH', number: '0451103316', name: 'Фильтр масляный', count: 4,
          warehouses: [wh('w2', '', false, 540.5, 4, '2026-11-03T12:00:00')],
        },
        {
          goodsID: 'g-4', brand: 'FILTRON', number: 'OP526', name: 'Фильтр масляный', count: 0,
          warehouses: [],
        },
      ],
    },
    {
      goodsID: 'g-5', brand: 'MAHLE', number: 'OC90', name: 'Фильтр масляный', count: 6,
      warehouses: [wh('w1', 'МС1', true, 655, 6, '2026-10-30T15:00:00')],
      analogues: [
        {
          goodsID: 'g-2', brand: 'MANN-FILTER', number: 'W712/52', name: 'Фильтр масляный', count: 31,
          warehouses: [wh('w1', 'МС1', true, 498.9, 21, '2026-10-30T15:00:00')],
        },
      ],
    },
  ],
};

const EMPTY = { goods: [{ goodsID: '', brand: '', number: '', name: '', count: 0, warehouses: [] }] };

export function mockRequest({ number, brand, analogues }, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const key = String(number).toUpperCase();
      if (key === 'ERROR') {
        // Имитируем сбой сети так же, как его сообщает fetch-слой.
        return reject(new ApiError('Нет связи с сервером. Проверьте подключение и попробуйте еще раз.'));
      }
      if (key === 'QUOTA') return resolve({ error: 'Request quota exceeded!' });

      const items = CATALOG[key];
      if (!items) return resolve(EMPTY);

      if (!brand) {
        // Как в API: без бренда - список деталей разных производителей, без аналогов.
        return resolve({ goods: items.map(({ analogues: _, ...rest }) => rest) });
      }
      const found = items.filter((i) => i.brand === brand);
      if (!found.length) return resolve(EMPTY);
      return resolve({
        goods: found.map((i) => (analogues === 'on' ? i : { ...i, analogues: undefined })),
      });
    }, 700);

    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}
