/**
 * @fileoverview Утилиты для работы со временем
 */

/**
 * Преобразует строку времени в минуты от полуночи
 * @param {string} time - Время в формате 'HH:MM' (например, '07:30')
 * @returns {number} Количество минут от полуночи
 * @example
 * parseTime('07:30') // 450
 * parseTime('00:00') // 0
 * parseTime('23:59') // 1439
 */
export function parseTime(time) {
  if (!time || typeof time !== 'string') {
    return 0;
  }

  const [hours, minutes] = time.split(':').map(Number);

  if (isNaN(hours) || isNaN(minutes)) {
    return 0;
  }

  return hours * 60 + minutes;
}

/**
 * Преобразует минуты от полуночи в строку времени
 * @param {number} minutes - Количество минут от полуночи
 * @returns {string} Время в формате 'HH:MM'
 * @example
 * formatTime(450) // '07:30'
 * formatTime(0) // '00:00'
 * formatTime(1439) // '23:59'
 */
export function formatTime(minutes) {
  // Нормализуем минуты (обработка отрицательных и больших значений)
  let normalizedMinutes = minutes % (24 * 60);
  if (normalizedMinutes < 0) {
    normalizedMinutes += 24 * 60;
  }

  const hours = Math.floor(normalizedMinutes / 60);
  const mins = normalizedMinutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Сдвигает время на указанное количество минут
 * @param {string} time - Исходное время в формате 'HH:MM'
 * @param {number} deltaMinutes - Количество минут для сдвига (может быть отрицательным)
 * @returns {string} Новое время в формате 'HH:MM'
 * @example
 * shiftTime('07:00', 120) // '09:00'
 * shiftTime('22:00', -30) // '21:30'
 * shiftTime('23:00', 120) // '01:00'
 */
export function shiftTime(time, deltaMinutes) {
  const minutes = parseTime(time);
  return formatTime(minutes + deltaMinutes);
}

/**
 * Возвращает разницу в минутах между двумя временами
 * @param {string} oldTime - Старое время в формате 'HH:MM'
 * @param {string} newTime - Новое время в формате 'HH:MM'
 * @returns {number} Разница в минутах (новое - старое)
 * @example
 * getTimeDelta('07:00', '09:00') // 120
 * getTimeDelta('09:00', '07:00') // -120
 * getTimeDelta('23:00', '01:00') // 120 (учитывает переход через полночь)
 */
export function getTimeDelta(oldTime, newTime) {
  const oldMinutes = parseTime(oldTime);
  const newMinutes = parseTime(newTime);
  let delta = newMinutes - oldMinutes;

  // Обрабатываем случай перехода через полночь
  // Если разница больше 12 часов, скорее всего это переход через полночь
  if (delta > 12 * 60) {
    delta -= 24 * 60;
  } else if (delta < -12 * 60) {
    delta += 24 * 60;
  }

  return delta;
}

/**
 * Проверяет, является ли строка валидным временем:
 * - одна цифра или два (час): 7, 12 → 07:00, 12:00
 * - HH:MM или H:MM (часы 0–23, минуты 0–59)
 * @param {string} time - Строка времени (например, '12', '07:30', '7:30')
 * @returns {boolean}
 */
export function isValidTime(time) {
  if (!time || typeof time !== 'string') {
    return false;
  }
  const trimmed = time.trim();
  // Только час: одна или две цифры, 0–23
  const onlyHour = trimmed.match(/^\d{1,2}$/);
  if (onlyHour) {
    const hours = parseInt(trimmed, 10);
    return hours >= 0 && hours <= 23;
  }
  // HH:MM или H:MM
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return false;
  }
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

/**
 * Нормализует строку времени к формату HH:MM; при невалидном вводе возвращает null.
 * Поддерживает: "12" → "12:00", "7" → "07:00", "07:30" → "07:30"
 * @param {string} time - Строка времени
 * @returns {string|null} 'HH:MM' или null
 */
export function normalizeTime(time) {
  if (!time || typeof time !== 'string') {
    return null;
  }
  const trimmed = time.trim();
  // Только час: одна или две цифры, 0–23
  const onlyHour = trimmed.match(/^\d{1,2}$/);
  if (onlyHour) {
    const hours = parseInt(trimmed, 10);
    if (hours < 0 || hours > 23) return null;
    return `${String(hours).padStart(2, '0')}:00`;
  }
  // HH:MM или H:MM
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Генерирует UUID v4
 * @returns {string} UUID
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
