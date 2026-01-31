/**
 * @fileoverview Repository для настроек приложения в localStorage
 */

/**
 * @typedef {Object} Settings
 * @property {string|null} activeScheduleId - ID активного расписания
 */

const STORAGE_KEY = 'settings';

const DEFAULT_SETTINGS = Object.freeze({
  activeScheduleId: null
});

/**
 * Repository для настроек приложения
 */
export class SettingsRepository {
  /**
   * Загружает настройки из localStorage.
   * @returns {Settings} Сохранённые настройки или дефолт
   */
  load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return { ...DEFAULT_SETTINGS };
      const parsed = JSON.parse(data);
      return {
        activeScheduleId: typeof parsed.activeScheduleId === 'string' && parsed.activeScheduleId
          ? parsed.activeScheduleId
          : DEFAULT_SETTINGS.activeScheduleId
      };
    } catch (error) {
      console.error('Ошибка при чтении настроек:', error);
      return { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Сохраняет настройки в localStorage.
   * @param {Settings} settings - Настройки для сохранения
   * @returns {Settings} Переданный объект
   */
  save(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      return settings;
    } catch (error) {
      console.error('Ошибка при сохранении настроек:', error);
      return settings;
    }
  }
}
