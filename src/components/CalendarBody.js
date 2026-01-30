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
    <main class="max-w-3xl mx-auto px-8 py-12">
      <div class="relative" :style="{ minHeight: svgHeight + 'px' }">
        <!-- SVG для ствола и веток -->
        <svg
          class="absolute inset-0 w-full pointer-events-none"
          :style="{ height: svgHeight + 'px' }"
          style="z-index: 1;"
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
          class="absolute left-0 right-0 h-px current-time-indicator pointer-events-none"
          :style="{ top: (currentTimeYPosition - 0.5) + 'px', zIndex: 0 }"
        >
        </div>

        <!-- Точка текущего времени (над деревом) -->
        <div
          v-if="currentTimeYPosition !== null"
          class="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          :style="{ top: currentTimeYPosition + 'px', zIndex: 3 }"
        >
          <!-- Точка на пересечении со стволом -->
          <div class="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]">
          </div>
        </div>

        <!-- Засечки -->
        <div class="relative" style="z-index: 2;">
          <div
            v-for="(mark, index) in sortedMarks"
            :key="mark.id"
            :class="[
              'absolute w-[37%]',
              index % 2 === 0 ? 'right-[9.5%]' : 'left-[9.5%]'
            ]"
            :style="{ top: (getMarkYPosition(index) - 25) + 'px' }"
          >
            <!-- НАД линией: emoji + время + название -->
            <div class="flex items-center gap-2 mb-2 min-w-0 px-2">
              <span class="text-[18px] leading-none flex-shrink-0">{{ mark.emoji }}</span>
              <span class="text-[12px] text-stone-400 time-display leading-none flex-shrink-0">{{ mark.time }}</span>
              <span class="text-[14px] text-stone-600 font-medium leading-tight truncate min-w-0">{{ mark.title }}</span>
            </div>

            <!-- ПОД линией: описание -->
            <div
              v-if="mark.description"
              class="text-[12px] text-stone-400 leading-relaxed pl-2.5 pr-2 mt-2 line-clamp-3 break-words"
            >
              {{ mark.description }}
            </div>
          </div>
        </div>
      </div>
    </main>
  `
};
