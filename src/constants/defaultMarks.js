/**
 * @fileoverview Константы для дефолтных засечек
 */

/**
 * Шаблон дефолтной засечки
 * @typedef {Object} DefaultMarkTemplate
 * @property {string} id
 * @property {string} emoji
 * @property {string} title
 * @property {string} description
 * @property {number} offsetMinutes - смещение в минутах от базового времени
 */

/**
 * Утренние засечки (относительно wakeTime)
 * @type {DefaultMarkTemplate[]}
 */
export const MORNING_MARK_TEMPLATES = [
  {
    id: 'wake',
    emoji: '☀️',
    title: 'Подъём',
    description: '',
    offsetMinutes: 0 // ровно в wakeTime
  },
  {
    id: 'breakfast',
    emoji: '🍳',
    title: 'Завтрак',
    description: '',
    offsetMinutes: 30 // через 30 минут после подъёма
  },
  {
    id: 'coffee',
    emoji: '☕',
    title: 'Последний кофе',
    description: 'Кофеин выводится ~10 часов',
    offsetMinutes: 300 // через 5 часов после подъёма
  },
  {
    id: 'lunch',
    emoji: '🍽️',
    title: 'Обед, Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.',
    description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.',
    offsetMinutes: 360 // через 6 часов после подъёма
  }
];

/**
 * Вечерние засечки (относительно bedtime)
 * @type {DefaultMarkTemplate[]}
 */
export const EVENING_MARK_TEMPLATES = [
  {
    id: 'gym',
    emoji: '🏋️',
    title: 'Спортзал, Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.',
    description: 'Поесть углеводы за 1.5ч до тренировки. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.',
    offsetMinutes: -240 // за 4 часа до сна
  },
  {
    id: 'dinner',
    emoji: '🍲',
    title: 'Ужин',
    description: 'Не есть за 2-3 часа до сна',
    offsetMinutes: -180 // за 3 часа до сна
  },
  {
    id: 'no-screens',
    emoji: '📵',
    title: 'Без экранов',
    description: 'Синий свет мешает мелатонину',
    offsetMinutes: -60 // за час до сна
  },
  {
    id: 'sleep',
    emoji: '🌙',
    title: 'Сон',
    description: 'Спокойной ночи!',
    offsetMinutes: 0 // ровно в bedtime
  }
];

/**
 * Все дефолтные засечки
 * @type {DefaultMarkTemplate[]}
 */
export const DEFAULT_MARK_TEMPLATES = [
  ...MORNING_MARK_TEMPLATES,
  ...EVENING_MARK_TEMPLATES
];

/**
 * ID утренних засечек (генерируется динамически)
 * @type {string[]}
 */
export const MORNING_MARKS = MORNING_MARK_TEMPLATES.map(t => t.id);

/**
 * ID вечерних засечек (генерируется динамически)
 * @type {string[]}
 */
export const EVENING_MARKS = EVENING_MARK_TEMPLATES.map(t => t.id);

/**
 * Все ID дефолтных засечек
 * @type {string[]}
 */
export const DEFAULT_MARK_IDS = [...MORNING_MARKS, ...EVENING_MARKS];
