/**
 * @fileoverview Данные и логика приложения для Alpine.js (шапка + календарь)
 * Регистрируется как Alpine.data('app'). Сохраняет 1:1 поведение и UI бывшего Vue-приложения.
 */

import { ScheduleService } from './services/ScheduleService.js';
import { MarkService } from './services/MarkService.js';
import { SettingsService } from './services/SettingsService.js';
import { normalizeTime, parseTime } from './utils/TimeUtils.js';
import { SLEEP_MARK_ID } from './constants/defaultMarks.js';

/**
 * @typedef {Object} Schedule
 * @property {string} id
 * @property {string} name
 * @property {string} wakeTime - 'HH:MM'
 * @property {string} bedtime - 'HH:MM'
 */

/**
 * @typedef {Object} Mark
 * @property {string} id
 * @property {string} scheduleId
 * @property {string} emoji
 * @property {string} title
 * @property {string} description
 * @property {string} time - 'HH:MM'
 */

/**
 * @typedef {{ start: number, end: number }} TimeRangeMinutes - диапазон в минутах от полуночи
 */

/** Минуты в сутках (для диапазонов времени). */
const MINUTES_PER_DAY = 24 * 60;

/**
 * Возвращает объект состояния и методов для Alpine.data('app').
 * @returns {Object} Состояние, геттеры и методы приложения
 * @returns {Schedule[]} return.schedules - список расписаний
 * @returns {number} return.activeScheduleIndex - индекс активной вкладки
 * @returns {Mark[]} return.marks - засечки активного расписания
 * @returns {Date} return.currentTime - текущее время (обновляется раз в минуту)
 * @returns {boolean} return.isCreatingSchedule - режим создания новой вкладки
 * @returns {string} return.newScheduleName - вводимое имя новой вкладки
 * @returns {null|'bedtime'|'wakeTime'} return.editingTimeField - какое поле времени редактируется
 * @returns {string} return.editingTimeValue - значение в поле редактирования времени
 */
export function appData() {
  const scheduleService = new ScheduleService();
  const markService = new MarkService();
  const settingsService = new SettingsService();

  let timeIntervalId = null;

  return {
    schedules: [],
    activeScheduleIndex: 0,
    marks: [],
    currentTime: new Date(),
    isCreatingSchedule: false,
    newScheduleName: '',
    editingTimeField: null,
    editingTimeValue: '',

    /** @returns {Schedule|null} Текущее активное расписание */
    get activeSchedule() {
      return this.schedules[this.activeScheduleIndex] || null;
    },

    /** Засечки: утро → середина дня → сон. Если сон по времени раньше подъёма — сон и всё до него в конец. @returns {Mark[]} */
    get sortedMarks() {
      const wakeIndex = this.marks.findIndex(m => m.id === 'wake');
      const sleepIndex = this.marks.findIndex(m => m.id === SLEEP_MARK_ID);
      if (sleepIndex >= 0 && wakeIndex >= 0 && sleepIndex < wakeIndex) {
        return [...this.marks.slice(sleepIndex + 1), ...this.marks.slice(0, sleepIndex + 1)];
      }
      return this.marks;
    },

    /** Масштаб: пикселей на один час (CONCEPT: 60px = 1ч). @returns {number} */
    get pixelsPerHour() {
      return 60;
    },

    /** Диапазон от первой засечки −30 мин до последней +30 мин. @returns {TimeRangeMinutes} */
    get timeRange() {
      if (!this.sortedMarks.length) return { start: 0, end: MINUTES_PER_DAY };
      const firstMarkTime = parseTime(this.sortedMarks[0].time);
      const lastMarkTime = parseTime(this.sortedMarks[this.sortedMarks.length - 1].time);
      return {
        start: Math.max(0, firstMarkTime - 30),
        end: Math.min(MINUTES_PER_DAY, lastMarkTime + 30)
      };
    },

    /** true, если диапазон переходит через полночь. @returns {boolean} */
    get rangeWraps() {
      return this.timeRange.end < this.timeRange.start;
    },

    /** Длина диапазона в минутах (с учётом перехода через полночь). @returns {number} */
    get totalRangeMinutes() {
      const { start, end } = this.timeRange;
      return this.rangeWraps ? (MINUTES_PER_DAY - start) + end : end - start;
    },

    /** Высота SVG календаря в пикселях (totalRangeHours * pixelsPerHour + 100). @returns {number} */
    get svgHeight() {
      const hours = this.totalRangeMinutes / 60;
      return hours * this.pixelsPerHour + 100;
    },

    /** Y-позиция красной линии текущего времени; null, если вне диапазона. @returns {number|null} */
    get currentTimeYPosition() {
      if (!this.sortedMarks.length) return null;
      const now = this.currentTime.getHours() * 60 + this.currentTime.getMinutes();
      const { start, end } = this.timeRange;
      const inRange = this.rangeWraps
        ? (now >= start && now < MINUTES_PER_DAY) || (now >= 0 && now <= end)
        : (now >= start && now <= end);
      if (!inRange) return null;
      const minutesFromStart = this.minutesFromRangeStart(now);
      return (minutesFromStart / 60) * this.pixelsPerHour + 50;
    },

    /** Загружает расписания и засечки из сервисов; при пустом списке создаёт дефолтное «Обычный день». */
    loadData() {
      const loadedSchedules = scheduleService.getSchedules();
      if (loadedSchedules.length === 0) {
        const defaultSchedule = scheduleService.createSchedule('Обычный день', '07:00', '22:00');
        this.schedules = [defaultSchedule];
      } else {
        this.schedules = loadedSchedules;
      }

      const settings = settingsService.load();
      const idx = settings.activeScheduleId
        ? this.schedules.findIndex(s => s.id === settings.activeScheduleId)
        : -1;
      this.activeScheduleIndex = idx >= 0 ? idx : 0;

      if (this.activeSchedule) {
        this.marks = markService.getMarks(this.activeSchedule.id);
      }
    },

    /**
     * Переключает активную вкладку и сохраняет ID в настройках.
     * @param {number} index - Индекс расписания в списке
     */
    handleActiveScheduleIndexChange(index) {
      this.activeScheduleIndex = index;
      const schedule = this.schedules[index];
      if (schedule) settingsService.updateActiveSchedule(schedule.id);
    },

    /** Запускает обновление currentTime каждую минуту; очищает interval при beforeunload. */
    startTimeUpdates() {
      timeIntervalId = setInterval(() => {
        this.currentTime = new Date();
      }, 60000);
      window.addEventListener('beforeunload', () => {
        if (timeIntervalId) clearInterval(timeIntervalId);
      });
    },

    /**
     * Обновляет активное расписание (имя, wakeTime, bedtime) и перезагружает засечки.
     * @param {{ name?: string, wakeTime?: string, bedtime?: string }} data - Поля для обновления
     */
    handleUpdateSchedule(data) {
      if (!this.activeSchedule) return;
      const updated = scheduleService.updateSchedule(this.activeSchedule.id, data);
      const index = this.activeScheduleIndex;
      this.schedules = this.schedules.map((s, i) => (i === index ? updated : s));
      this.marks = markService.getMarks(updated.id);
    },

    /**
     * Создаёт новое расписание с заданным именем, копируя wakeTime и bedtime из текущей вкладки.
     * @param {string} name - Название нового расписания
     */
    handleCreateSchedule(name) {
      const currentSchedule = this.activeSchedule;
      const wakeTime = currentSchedule?.wakeTime || '07:00';
      const bedtime = currentSchedule?.bedtime || '22:00';
      const newSchedule = scheduleService.createSchedule(name, wakeTime, bedtime);
      this.schedules = [...this.schedules, newSchedule];
      this.activeScheduleIndex = this.schedules.length - 1;
      settingsService.updateActiveSchedule(newSchedule.id);
    },

    /**
     * Удаляет расписание по индексу; при удалении последнего создаёт дефолтное «Обычный день».
     * @param {number} index - Индекс удаляемого расписания
     * @param {Event} [event] - Событие (stopPropagation при наличии)
     */
    handleDeleteSchedule(index, event) {
      if (event) event.stopPropagation();
      const scheduleToDelete = this.schedules[index];
      scheduleService.deleteSchedule(scheduleToDelete.id);
      this.schedules = this.schedules.filter((_, i) => i !== index);

      if (this.schedules.length === 0) {
        const defaultSchedule = scheduleService.createSchedule('Обычный день', '07:00', '22:00');
        this.schedules = [defaultSchedule];
        this.activeScheduleIndex = 0;
        this.marks = markService.getMarks(defaultSchedule.id);
        settingsService.updateActiveSchedule(defaultSchedule.id);
      } else {
        if (this.activeScheduleIndex >= this.schedules.length) {
          this.activeScheduleIndex = this.schedules.length - 1;
        } else if (this.activeScheduleIndex > index) {
          this.activeScheduleIndex--;
        }
        const newActive = this.schedules[this.activeScheduleIndex];
        if (newActive) {
          this.marks = markService.getMarks(newActive.id);
          settingsService.updateActiveSchedule(newActive.id);
        }
      }
    },

    /** @param {string} scheduleId - ID расписания
     * @returns {number} Индекс в schedules или -1
     */
    scheduleIndex(scheduleId) {
      return this.schedules.findIndex(s => s.id === scheduleId);
    },

    /** Переключает вкладку по ID расписания. @param {string} scheduleId */
    selectScheduleById(scheduleId) {
      const index = this.scheduleIndex(scheduleId);
      if (index >= 0) this.handleActiveScheduleIndexChange(index);
    },

    /** Удаляет расписание по ID (для Alpine x-for, без index в scope). @param {string} scheduleId @param {Event} [event] */
    deleteScheduleById(scheduleId, event) {
      const index = this.scheduleIndex(scheduleId);
      if (index >= 0) this.handleDeleteSchedule(index, event);
    },

    /** @param {Mark} mark - Засечка
     * @returns {number} Индекс в sortedMarks или -1
     */
    markIndex(mark) {
      return this.sortedMarks.findIndex(m => m.id === mark.id);
    },

    /** Y-координата засечки на SVG (для Alpine x-for по mark). @param {Mark} mark @returns {number} */
    getMarkYPositionByMark(mark) {
      return this.getMarkYPosition(this.markIndex(mark));
    },

    /** Включает режим создания вкладки: показывает input и фокусирует его. */
    startCreatingSchedule() {
      this.isCreatingSchedule = true;
      this.newScheduleName = '';
      this.$nextTick(() => {
        this.$refs.newScheduleInput?.focus();
      });
    },

    /** Отменяет создание вкладки: закрывает input и сбрасывает имя. */
    cancelCreation() {
      this.isCreatingSchedule = false;
      this.newScheduleName = '';
    },

    /** Создаёт расписание с введённым именем; при пустом имени — отмена. */
    createNewSchedule() {
      const name = this.newScheduleName.trim();
      if (!name) {
        this.cancelCreation();
        return;
      }
      this.handleCreateSchedule(name);
      this.cancelCreation();
    },

    /**
     * Включает режим редактирования времени (bedtime или wakeTime).
     * @param {'bedtime'|'wakeTime'} field - Поле времени для редактирования
     */
    startEditingTime(field) {
      if (!this.activeSchedule) return;
      this.editingTimeField = field;
      this.editingTimeValue = this.activeSchedule[field] || '07:00';
      this.$nextTick(() => {
        const refName = field === 'bedtime' ? 'bedtimeInput' : 'wakeTimeInput';
        this.$refs[refName]?.focus();
      });
    },

    /** Отменяет редактирование времени. */
    cancelEditingTime() {
      this.editingTimeField = null;
      this.editingTimeValue = '';
    },

    /** Применяет отредактированное время: нормализует, эмитит updateSchedule; при невалидном вводе — отмена. */
    applyTimeEdit() {
      const normalized = normalizeTime(this.editingTimeValue);
      if (!normalized) {
        this.cancelEditingTime();
        return;
      }
      const field = this.editingTimeField;
      this.handleUpdateSchedule({ [field]: normalized });
      this.cancelEditingTime();
    },

    /**
     * Минуты от начала визуального диапазона (учёт перехода через полночь).
     * @param {number} timeMinutes - Время в минутах от полуночи
     * @returns {number}
     */
    minutesFromRangeStart(timeMinutes) {
      const { start } = this.timeRange;
      if (this.rangeWraps) {
        return timeMinutes >= start ? timeMinutes - start : (MINUTES_PER_DAY - start) + timeMinutes;
      }
      return timeMinutes - start;
    },

    /**
     * Y-координата засечки на SVG (пиксели от верха).
     * @param {number} index - Индекс засечки в sortedMarks
     * @returns {number}
     */
    getMarkYPosition(index) {
      const mark = this.sortedMarks[index];
      if (!mark) return 50;
      const markTime = parseTime(mark.time);
      const minutesFromStart = this.minutesFromRangeStart(markTime);
      return (minutesFromStart / 60) * this.pixelsPerHour + 50;
    },

    /** Вызывается Alpine при инициализации: loadData, startTimeUpdates, $watch activeScheduleIndex. */
    init() {
      this.loadData();
      this.startTimeUpdates();
      this.$watch('activeScheduleIndex', () => {
        if (this.activeSchedule) {
          this.marks = markService.getMarks(this.activeSchedule.id);
        }
      });
    }
  };
}
