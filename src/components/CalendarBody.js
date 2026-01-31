/**
 * CalendarBody Component
 * Компонент древовидного расписания с засечками
 */

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
    sortedMarks() {
      return [...this.marks].sort((a, b) => {
        const timeA = this.timeToMinutes(a.time);
        const timeB = this.timeToMinutes(b.time);
        return timeA - timeB;
      });
    },

    // Масштаб: пикселей на час
    pixelsPerHour() {
      return 60;
    },

    // Временной диапазон календаря
    timeRange() {
      if (!this.sortedMarks.length) return { start: 0, end: 1440 };

      const firstMarkTime = this.timeToMinutes(this.sortedMarks[0].time);
      const lastMarkTime = this.timeToMinutes(this.sortedMarks[this.sortedMarks.length - 1].time);

      // Добавляем по 30 минут в начале и конце
      return {
        start: Math.max(0, firstMarkTime - 30),
        end: Math.min(1440, lastMarkTime + 30)
      };
    },

    svgHeight() {
      const range = this.timeRange.end - this.timeRange.start;
      const hours = range / 60;
      return hours * this.pixelsPerHour + 100;
    },

    currentTimeYPosition() {
      if (!this.sortedMarks.length) return null;

      const now = this.currentTime.getHours() * 60 + this.currentTime.getMinutes();
      const startTime = this.timeRange.start;
      const endTime = this.timeRange.end;

      // Проверяем, попадает ли текущее время в диапазон
      if (now < startTime || now > endTime) return null;

      // Вычисляем позицию пропорционально времени
      const minutesFromStart = now - startTime;
      const hoursFromStart = minutesFromStart / 60;

      return hoursFromStart * this.pixelsPerHour + 50;
    }
  },

  methods: {
    getMarkYPosition(index) {
      const mark = this.sortedMarks[index];
      if (!mark) return 50;

      const markTime = this.timeToMinutes(mark.time);
      const startTime = this.timeRange.start;

      // Вычисляем позицию пропорционально времени
      const minutesFromStart = markTime - startTime;
      const hoursFromStart = minutesFromStart / 60;

      return hoursFromStart * this.pixelsPerHour + 50;
    },

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
