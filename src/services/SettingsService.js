/**
 * @fileoverview Сервис настроек приложения (активная вкладка и т.д.)
 */

import { SettingsRepository } from '../repositories/SettingsRepository.js';

/**
 * @typedef {import('../repositories/SettingsRepository.js').Settings} Settings
 */

/**
 * Сервис для работы с настройками
 */
export class SettingsService {
  constructor() {
    this.repository = new SettingsRepository();
  }

  /**
   * Загружает настройки из хранилища.
   * @returns {Settings}
   */
  load() {
    return this.repository.load();
  }

  /**
   * Обновляет ID активного расписания и сохраняет настройки.
   * @param {string} activeScheduleId - ID активного расписания
   * @returns {Settings}
   */
  updateActiveSchedule(activeScheduleId) {
    const settings = this.repository.load();
    settings.activeScheduleId = activeScheduleId;
    return this.repository.save(settings);
  }
}
