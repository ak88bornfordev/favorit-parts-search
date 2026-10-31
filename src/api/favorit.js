import { ApiError, parseGoods } from './parse';
import { mockRequest } from './mock';

const API_URL = '/api/hsprice/';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// Один запрос к сервису "Проценка". Ключ добавляет прокси (см. vite.config.js).
export async function requestParts({ number, brand, analogues }, signal) {
  const params = new URLSearchParams({ number });
  if (brand) params.set('brand', brand);
  if (analogues) params.set('analogues', 'on');

  if (USE_MOCK) {
    return parseGoods(await mockRequest(Object.fromEntries(params), signal));
  }

  let response;
  try {
    response = await fetch(`${API_URL}?${params}`, { signal });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new ApiError('Нет связи с сервером. Проверьте подключение и попробуйте еще раз.');
  }

  if (!response.ok) {
    throw new ApiError(`Сервер ответил ошибкой ${response.status}. Попробуйте позже.`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError('Сервис вернул ответ в неожиданном формате.');
  }
  return parseGoods(data);
}

export const isMockMode = USE_MOCK;
