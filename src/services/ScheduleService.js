/**
 * @fileoverview Сервис для работы с расписаниями (бизнес-логика)
 */

import { ScheduleRepository } from '../repositories/ScheduleRepository.js';
import { MarkRepository } from '../repositories/MarkRepository.js';
import { MarkService } from './MarkService.js';
import { MORNING_MARKS, EVENING_MARKS } from '../constants/defaultMarks.js';
import { getTimeDelta, shiftTime } from '../utils/TimeUtils.js';

/**
 * @typedef {import('../repositories/ScheduleRepository.js').Schedule} Schedule
 */

/**
 * Сервис для управления расписаниями
 */
export class ScheduleService {
  constructor() {
    this.scheduleRepository = new ScheduleRepository();
    this.markRepository = new MarkRepository();
    this.markService = new MarkService();
  }

  /**
   * Возвращает все расписания
   * @returns {Schedule[]} Массив расписаний
   */
  getSchedules() {
    return this.scheduleRepository.getAll();
  }

  /**
   * Создаёт новое расписание с дефолтными засечками
   * @param {string} name - Название расписания
   * @param {string} wakeTime - Время пробуждения в формате 'HH:MM'
   * @param {string} bedtime - Время сна в формате 'HH:MM'
   * @returns {Schedule} Созданное расписание
   */
  createSchedule(name, wakeTime = '07:00', bedtime = '22:00') {
    const schedule = {
      name: name || 'Новое расписание',
      wakeTime,
      bedtime
    };

    const savedSchedule = this.scheduleRepository.save(schedule);

    // Создаём дефолтные засечки
    this.markService.createDefaultMarks(savedSchedule.id, wakeTime, bedtime);

    return savedSchedule;
  }

  /**
   * Обновляет расписание
   * @param {string} id - ID расписания
   * @param {Object} data - Данные для обновления
   * @param {string} [data.name]
   * @param {string} [data.wakeTime]
   * @param {string} [data.bedtime]
   * @returns {Schedule} Обновлённое расписание
   */
  updateSchedule(id, data) {
    // Получаем текущее расписание
    const schedules = this.scheduleRepository.getAll();
    const currentSchedule = schedules.find(s => s.id === id);

    if (!currentSchedule) {
      throw new Error(`Расписание с id ${id} не найдено`);
    }

    const oldWakeTime = currentSchedule.wakeTime;
    const oldBedtime = currentSchedule.bedtime;

    // Обновляем расписание
    const updatedSchedule = {
      ...currentSchedule,
      ...data
    };

    const savedSchedule = this.scheduleRepository.save(updatedSchedule);

    // Если изменились времена, сдвигаем дефолтные засечки
    const wakeTimeChanged = data.wakeTime && data.wakeTime !== oldWakeTime;
    const bedtimeChanged = data.bedtime && data.bedtime !== oldBedtime;

    if (wakeTimeChanged || bedtimeChanged) {
      this.shiftDefaultMarks(
        id,
        oldWakeTime,
        savedSchedule.wakeTime,
        oldBedtime,
        savedSchedule.bedtime
      );
    }

    return savedSchedule;
  }

  /**
   * Удаляет расписание и все его засечки
   * @param {string} id - ID расписания
   */
  deleteSchedule(id) {
    // Сначала удаляем все засечки
    this.markRepository.deleteByScheduleId(id);
    // Затем удаляем само расписание
    this.scheduleRepository.delete(id);
  }

  /**
   * Сдвигает время дефолтных засечек при изменении времени сна/пробуждения
   * @param {string} scheduleId - ID расписания
   * @param {string} oldWakeTime - Старое время пробуждения
   * @param {string} newWakeTime - Новое время пробуждения
   * @param {string} oldBedtime - Старое время сна
   * @param {string} newBedtime - Новое время сна
   */
  shiftDefaultMarks(scheduleId, oldWakeTime, newWakeTime, oldBedtime, newBedtime) {
    const marks = this.markRepository.getByScheduleId(scheduleId);

    // Вычисляем сдвиги
    const wakeDelta = getTimeDelta(oldWakeTime, newWakeTime);
    const bedDelta = getTimeDelta(oldBedtime, newBedtime);

    // Обрабатываем каждую засечку
    marks.forEach(mark => {
      // Проверяем, является ли засечка дефолтной
      if (!this.markRepository.isDefaultMark(mark.id)) {
        // Пользовательская засечка — не трогаем
        return;
      }

      // Определяем, к какой группе относится засечка
      let delta = 0;

      if (MORNING_MARKS.includes(mark.id)) {
        // Утренняя засечка — сдвигаем на wakeDelta
        delta = wakeDelta;
      } else if (EVENING_MARKS.includes(mark.id)) {
        // Вечерняя засечка — сдвигаем на bedDelta
        delta = bedDelta;
      }

      // Сдвигаем время, только если есть изменение
      if (delta !== 0) {
        const newTime = shiftTime(mark.time, delta);
        mark.time = newTime;
        this.markRepository.save(mark);
      }
    });
  }
}
