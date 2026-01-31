/**
 * @fileoverview Repository для работы с расписаниями в localStorage
 */

import { generateUUID } from '../utils/TimeUtils.js';

/**
 * @typedef {Object} Schedule
 * @property {string} id
 * @property {string} name
 * @property {string} wakeTime - Время пробуждения в формате 'HH:MM'
 * @property {string} bedtime - Время отхода ко сну в формате 'HH:MM'
 */

const STORAGE_KEY = 'schedules';

/**
 * Repository для управления расписаниями
 */
export class ScheduleRepository {
  /**
   * Возвращает все расписания из localStorage
   * @returns {Schedule[]} Массив расписаний
   */
  getAll() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Ошибка при чтении расписаний:', error);
      return [];
    }
  }

  /**
   * Сохраняет расписание (создаёт или обновляет)
   * @param {Schedule} schedule - Расписание для сохранения
   * @returns {Schedule} Сохранённое расписание
   */
  save(schedule) {
    const schedules = this.getAll();

    if (!schedule.id) {
      schedule.id = generateUUID();
      schedules.push(schedule);
    } else {
      const index = schedules.findIndex(s => s.id === schedule.id);
      if (index !== -1) {
        schedules[index] = { ...schedules[index], ...schedule };
      } else {
        schedules.push(schedule);
      }
    }

    this._saveToStorage(schedules);
    return schedule;
  }

  /**
   * Удаляет расписание по id
   * @param {string} id - ID расписания
   */
  delete(id) {
    const schedules = this.getAll();
    const filtered = schedules.filter(s => s.id !== id);
    this._saveToStorage(filtered);
  }

  /**
   * Сохраняет массив расписаний в localStorage
   * @private
   * @param {Schedule[]} schedules
   */
  _saveToStorage(schedules) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
    } catch (error) {
      console.error('Ошибка при сохранении расписаний:', error);
    }
  }
}
