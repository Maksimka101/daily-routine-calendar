/**
 * @fileoverview Сервис для работы с засечками (бизнес-логика)
 */

import { MarkRepository } from '../repositories/MarkRepository.js';
import { MORNING_MARK_TEMPLATES, EVENING_MARK_TEMPLATES } from '../constants/defaultMarks.js';
import { parseTime, formatTime } from '../utils/TimeUtils.js';

/**
 * @typedef {import('../repositories/MarkRepository.js').Mark} Mark
 */

/**
 * Сервис для управления засечками
 */
export class MarkService {
  constructor() {
    this.repository = new MarkRepository();
  }

  /**
   * Возвращает засечки расписания, отсортированные по времени.
   * @param {string} scheduleId - ID расписания
   * @returns {Mark[]} Массив засечек, отсортированный по времени
   */
  getMarks(scheduleId) {
    const raw = this.repository.getByScheduleId(scheduleId);
    return [...raw].sort((a, b) => parseTime(a.time) - parseTime(b.time));
  }

  /**
   * Создаёт новую засечку
   * @param {string} scheduleId - ID расписания
   * @param {Object} data - Данные засечки
   * @param {string} data.emoji
   * @param {string} data.title
   * @param {string} data.description
   * @param {string} data.time
   * @returns {Mark} Созданная засечка
   */
  createMark(scheduleId, data) {
    const mark = {
      scheduleId,
      emoji: data.emoji || '📌',
      title: data.title || 'Новая засечка',
      description: data.description || '',
      time: data.time || '12:00'
    };

    return this.repository.save(mark);
  }

  /**
   * Обновляет засечку
   * @param {string} id - ID засечки
   * @param {Object} data - Данные для обновления
   * @param {string} [data.emoji]
   * @param {string} [data.title]
   * @param {string} [data.description]
   * @param {string} [data.time]
   * @returns {Mark} Обновлённая засечка
   */
  updateMark(id, data) {
    const allMarks = this.repository._getAll();
    const existingMark = allMarks.find(m => m.id === id);

    if (!existingMark) {
      throw new Error(`Засечка с id ${id} не найдена`);
    }

    const updatedMark = {
      ...existingMark,
      ...data
    };

    return this.repository.save(updatedMark);
  }

  /**
   * Удаляет засечку
   * @param {string} id - ID засечки
   */
  deleteMark(id) {
    this.repository.delete(id);
  }

  /**
   * Создаёт набор дефолтных засечек для нового расписания
   * @param {string} scheduleId - ID расписания
   * @param {string} wakeTime - Время пробуждения в формате 'HH:MM'
   * @param {string} bedtime - Время сна в формате 'HH:MM'
   * @returns {Mark[]} Массив созданных засечек
   */
  createDefaultMarks(scheduleId, wakeTime, bedtime) {
    const wakeMinutes = parseTime(wakeTime);
    const bedMinutes = parseTime(bedtime);

    const morningMarks = MORNING_MARK_TEMPLATES.map(template => ({
      id: template.id,
      scheduleId,
      emoji: template.emoji,
      title: template.title,
      description: template.description,
      time: formatTime(wakeMinutes + template.offsetMinutes)
    }));

    const eveningMarks = EVENING_MARK_TEMPLATES.map(template => ({
      id: template.id,
      scheduleId,
      emoji: template.emoji,
      title: template.title,
      description: template.description,
      time: formatTime(bedMinutes + template.offsetMinutes)
    }));

    const allMarks = [...morningMarks, ...eveningMarks];
    return this.repository.saveMany(allMarks);
  }
}
