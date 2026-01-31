/**
 * @fileoverview Точка входа для всех сервисов и утилит
 */

export { ScheduleRepository } from './repositories/ScheduleRepository.js';
export { MarkRepository } from './repositories/MarkRepository.js';

export { ScheduleService } from './services/ScheduleService.js';
export { MarkService } from './services/MarkService.js';

export {
  parseTime,
  formatTime,
  shiftTime,
  getTimeDelta,
  generateUUID
} from './utils/TimeUtils.js';

export {
  MORNING_MARKS,
  EVENING_MARKS,
  DEFAULT_MARK_IDS,
  MORNING_MARK_TEMPLATES,
  EVENING_MARK_TEMPLATES,
  DEFAULT_MARK_TEMPLATES
} from './constants/defaultMarks.js';
