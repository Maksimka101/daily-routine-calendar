/**
 * @fileoverview Repository для работы с засечками в localStorage
 */

import { generateUUID, parseTime } from '../utils/TimeUtils.js';
import { DEFAULT_MARK_IDS } from '../constants/defaultMarks.js';

/**
 * @typedef {Object} Mark
 * @property {string} id - Специальный id для дефолтных или UUID для пользовательских
 * @property {string} scheduleId - ID расписания
 * @property {string} emoji
 * @property {string} title
 * @property {string} description
 * @property {string} time - Время в формате 'HH:MM'
 */

const STORAGE_KEY = 'marks';

/**
 * Repository для управления засечками
 */
export class MarkRepository {
  /**
   * Возвращает все засечки для указанного расписания, отсортированные по времени
   * @param {string} scheduleId - ID расписания
   * @returns {Mark[]} Массив засечек
   */
  getByScheduleId(scheduleId) {
    const allMarks = this._getAll();
    const marks = allMarks.filter(m => m.scheduleId === scheduleId);

    // Сортируем по времени
    return marks.sort((a, b) => parseTime(a.time) - parseTime(b.time));
  }

  /**
   * Сохраняет засечку (создаёт или обновляет)
   * @param {Mark} mark - Засечка для сохранения
   * @returns {Mark} Сохранённая засечка
   */
  save(mark) {
    const marks = this._getAll();

    // Если id нет, генерируем UUID (пользовательская засечка)
    if (!mark.id) {
      mark.id = generateUUID();
      marks.push(mark);
    } else {
      // Обновление существующей
      const index = marks.findIndex(m => m.id === mark.id);
      if (index !== -1) {
        marks[index] = { ...marks[index], ...mark };
      } else {
        // Если не найдено, добавляем как новую
        marks.push(mark);
      }
    }

    this._saveToStorage(marks);
    return mark;
  }

  /**
   * Сохраняет несколько засечек за один раз
   * @param {Mark[]} marksToSave - Массив засечек для сохранения
   * @returns {Mark[]} Массив сохранённых засечек
   */
  saveMany(marksToSave) {
    const marks = this._getAll();

    marksToSave.forEach(mark => {
      if (!mark.id) {
        mark.id = generateUUID();
        marks.push(mark);
      } else {
        const index = marks.findIndex(m => m.id === mark.id);
        if (index !== -1) {
          marks[index] = { ...marks[index], ...mark };
        } else {
          marks.push(mark);
        }
      }
    });

    this._saveToStorage(marks);
    return marksToSave;
  }

  /**
   * Удаляет засечку по id
   * @param {string} id - ID засечки
   */
  delete(id) {
    const marks = this._getAll();
    const filtered = marks.filter(m => m.id !== id);
    this._saveToStorage(filtered);
  }

  /**
   * Удаляет все засечки для указанного расписания
   * @param {string} scheduleId - ID расписания
   */
  deleteByScheduleId(scheduleId) {
    const marks = this._getAll();
    const filtered = marks.filter(m => m.scheduleId !== scheduleId);
    this._saveToStorage(filtered);
  }

  /**
   * Проверяет, является ли засечка дефолтной
   * @param {string} id - ID засечки
   * @returns {boolean} true если засечка дефолтная
   */
  isDefaultMark(id) {
    return DEFAULT_MARK_IDS.includes(id);
  }

  /**
   * Возвращает все засечки из localStorage
   * @private
   * @returns {Mark[]} Массив всех засечек
   */
  _getAll() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Ошибка при чтении засечек:', error);
      return [];
    }
  }

  /**
   * Сохраняет массив засечек в localStorage
   * @private
   * @param {Mark[]} marks
   */
  _saveToStorage(marks) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(marks));
    } catch (error) {
      console.error('Ошибка при сохранении засечек:', error);
    }
  }
}
