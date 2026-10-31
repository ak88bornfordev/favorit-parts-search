import { describe, expect, it } from 'vitest';
import { ApiError, parseGoods, toBrands, toOffers } from '../src/api/parse';

describe('parseGoods', () => {
  it('выбрасывает понятную ошибку сервиса', () => {
    expect(() => parseGoods({ error: 'Invalid key client!' })).toThrow(ApiError);
    expect(() => parseGoods({ error: 'Invalid key client!' })).toThrow(/Неверный ключ/);
  });

  it('пустая структура "не найдено" превращается в пустой список', () => {
    const data = { goods: [{ goodsID: '', brand: '', number: '', name: '', count: 0 }] };
    expect(parseGoods(data)).toEqual([]);
  });

  it('некорректный ответ - ошибка, а не падение', () => {
    expect(() => parseGoods(null)).toThrow(ApiError);
    expect(parseGoods({})).toEqual([]);
  });
});

describe('toBrands', () => {
  it('оставляет уникальных производителей', () => {
    const goods = [
      { brand: 'ZEN', number: '0189', name: 'Бендикс', count: 2 },
      { brand: 'ZEN', number: '0189', name: 'Бендикс', count: 2 },
      { brand: 'CAFFARO', number: '0189', name: 'Бендикс', count: 0 },
    ];
    expect(toBrands(goods).map((b) => b.brand)).toEqual(['ZEN', 'CAFFARO']);
  });
});

describe('toOffers', () => {
  const goods = [{
    goodsID: 'a', brand: 'MEYLE', number: '7160500039S', name: 'Деталь', count: 20, price: 999,
    warehouses: [{ id: 'w1', code: 'МС2', own: true, price: 1500, stock: 20 }],
    analogues: [
      { goodsID: 'b', brand: 'FEBI', number: '1', name: 'Аналог', warehouses: [{ id: 'w1', price: 900, stock: 3, own: false }] },
      { goodsID: 'a', brand: 'MEYLE', number: '7160500039S', warehouses: [] },
      { goodsID: '', brand: '', number: '' },
    ],
  }];

  it('цена берется со склада, а не из устаревшего поля товара', () => {
    expect(toOffers(goods)[0].price).toBe(1500);
  });

  it('искомая деталь идет первой, дубли и пустышки отброшены', () => {
    const rows = toOffers(goods);
    expect(rows.map((r) => r.brand)).toEqual(['MEYLE', 'FEBI']);
    expect(rows[0].isAnalog).toBe(false);
    expect(rows[1].warehouse).toBe('Склад поставщика');
  });

  it('товар без складов показывается с нулевым остатком', () => {
    const rows = toOffers([{ goodsID: 'x', brand: 'B', number: 'N', warehouses: [] }]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ stock: 0, price: null });
  });
});
