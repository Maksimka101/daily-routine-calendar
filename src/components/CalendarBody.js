/**
 * CalendarBody Component
 * Компонент древовидного расписания с засечками
 */

import { MORNING_MARKS, SLEEP_MARK_ID } from '../constants/defaultMarks.js';

/** Для сортировки: время после полуночи + MINUTES_PER_DAY = «следующий день». */
const MINUTES_PER_DAY = 24 * 60;

/** Время до которого считаем «сегодня»; после — «следующий день» для порядка. */
const DAY_CUTOFF_MINUTES = 6 * 60;

export default {
  name: 'CalendarBody',

  props: {
    marks: {
      type: Array,
      required: true
    },
    currentTime: {
      type: Date,
      required: true
    }
  },

  computed: {
    /**
     * Засечки для отображения: утро всегда первое, сон всегда последний, остальные между ними в порядке дня.
     * @returns {import('../repositories/MarkRepository.js').Mark[]}
     */
    sortedMarks() {
      const morning = this.marks
        .filter(m => MORNING_MARKS.includes(m.id))
        .sort((a, b) => this.timeToMinutes(a.time) - this.timeToMinutes(b.time));

      const sleep = this.marks.find(m => m.id === SLEEP_MARK_ID);

      const middle = this.marks.filter(
        m => !MORNING_MARKS.includes(m.id) && m.id !== SLEEP_MARK_ID
      );
      middle.sort((a, b) => {
        const ta = this.timeToMinutes(a.time);
        const tb = this.timeToMinutes(b.time);
        const keyA = ta < DAY_CUTOFF_MINUTES ? ta + MINUTES_PER_DAY : ta;
        const keyB = tb < DAY_CUTOFF_MINUTES ? tb + MINUTES_PER_DAY : tb;
        return keyA - keyB;
      });

      return sleep ? [...morning, ...middle, sleep] : [...morning, ...middle];
    },

    /**
     * Масштаб: пикселей на один час (60px = 1ч).
     * @returns {number}
     */
    pixelsPerHour() {
      return 60;
    },

    /**
     * Временной диапазон в минутах: от первой засечки −30 мин до последней +30 мин.
     * При переходе через полночь (сон в 01:00, подъём в 10:00) end < start.
     * @returns {{ start: number, end: number }}
     */
    timeRange() {
      if (!this.sortedMarks.length) return { start: 0, end: MINUTES_PER_DAY };

      const firstMarkTime = this.timeToMinutes(this.sortedMarks[0].time);
      const lastMarkTime = this.timeToMinutes(this.sortedMarks[this.sortedMarks.length - 1].time);

      return {
        start: Math.max(0, firstMarkTime - 30),
        end: Math.min(MINUTES_PER_DAY, lastMarkTime + 30)
      };
    },

    /** true, если диапазон переходит через полночь (сон в начале суток). */
    rangeWraps() {
      return this.timeRange.end < this.timeRange.start;
    },

    /** Длина диапазона в минутах (с учётом перехода через полночь). */
    totalRangeMinutes() {
      const { start, end } = this.timeRange;
      return this.rangeWraps ? (MINUTES_PER_DAY - start) + end : end - start;
    },

    /**
     * Высота SVG календаря в пикселях.
     * @returns {number}
     */
    svgHeight() {
      const hours = this.totalRangeMinutes / 60;
      return hours * this.pixelsPerHour + 100;
    },

    /**
     * Y-позиция красной линии текущего времени; null, если вне диапазона.
     * @returns {number|null}
     */
    currentTimeYPosition() {
      if (!this.sortedMarks.length) return null;

      const now = this.currentTime.getHours() * 60 + this.currentTime.getMinutes();
      const { start, end } = this.timeRange;

      const inRange = this.rangeWraps
        ? (now >= start && now < MINUTES_PER_DAY) || (now >= 0 && now <= end)
        : (now >= start && now <= end);
      if (!inRange) return null;

      const minutesFromStart = this.minutesFromRangeStart(now);
      return (minutesFromStart / 60) * this.pixelsPerHour + 50;
    }
  },

  methods: {
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
     * Возвращает Y-координату засечки на SVG (пиксели от верха).
     * @param {number} index - Индекс засечки в sortedMarks
     * @returns {number}
     */
    getMarkYPosition(index) {
      const mark = this.sortedMarks[index];
      if (!mark) return 50;

      const markTime = this.timeToMinutes(mark.time);
      const minutesFromStart = this.minutesFromRangeStart(markTime);
      return (minutesFromStart / 60) * this.pixelsPerHour + 50;
    },

    /**
     * Преобразует строку времени 'HH:MM' в минуты от полуночи.
     * @param {string} [time] - Время в формате 'HH:MM'
     * @returns {number}
     */
    timeToMinutes(time) {
      if (!time) return 0;
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    }
  },

  template: `
    <main class="container calendar">
      <div class="calendar__wrap" :style="{ minHeight: svgHeight + 'px' }">
        <!-- SVG для ствола и веток -->
        <svg
          class="calendar__svg"
          :style="{ height: svgHeight + 'px' }"
        >
          <!-- Вертикальный ствол -->
          <line class="trunk-line" x1="50%" y1="0" x2="50%" :y2="svgHeight" />

          <!-- Горизонтальные ветки -->
          <line
            v-for="(mark, index) in sortedMarks"
            :key="mark.id"
            class="branch-line"
            :x1="index % 2 === 0 ? '50%' : '8%'"
            :y1="getMarkYPosition(index)"
            :x2="index % 2 === 0 ? '92%' : '50%'"
            :y2="getMarkYPosition(index)"
          />
        </svg>

        <!-- Красная линия текущего времени (под деревом) -->
        <div
          v-if="currentTimeYPosition !== null"
          class="current-time-indicator"
          :style="{ top: (currentTimeYPosition - 0.5) + 'px' }"
        >
        </div>

        <!-- Точка текущего времени (над деревом) -->
        <div
          v-if="currentTimeYPosition !== null"
          class="current-time-dot-wrap"
          :style="{ top: currentTimeYPosition + 'px' }"
        >
          <div class="current-time-dot"></div>
        </div>

        <!-- Засечки -->
        <div class="calendar__marks">
          <div
            v-for="(mark, index) in sortedMarks"
            :key="mark.id"
            :class="['calendar-mark', index % 2 === 0 ? 'calendar-mark--right' : 'calendar-mark--left']"
            :style="{ top: (getMarkYPosition(index) - 25) + 'px' }"
          >
            <!-- НАД линией: emoji + время + название -->
            <div class="calendar-mark__row">
              <span class="calendar-mark__emoji">{{ mark.emoji }}</span>
              <span class="calendar-mark__time time-display">{{ mark.time }}</span>
              <span class="calendar-mark__title">{{ mark.title }}</span>
            </div>

            <!-- ПОД линией: описание -->
            <div v-if="mark.description" class="calendar-mark__desc">
              {{ mark.description }}
            </div>
          </div>
        </div>
      </div>
    </main>
  `
};
