/**
 * AppHeader Component
 * Компонент шапки с вкладками расписаний и настройками времени
 */

export default {
  name: 'AppHeader',

  props: {
    schedules: {
      type: Array,
      required: true
    },
    activeScheduleIndex: {
      type: Number,
      required: true
    },
    activeSchedule: {
      type: Object,
      default: null
    }
  },

  emits: ['update:activeScheduleIndex', 'createSchedule'],

  data() {
    return {
      isCreatingSchedule: false,
      newScheduleName: ''
    };
  },

  methods: {
    selectSchedule(index) {
      this.$emit('update:activeScheduleIndex', index);
    },

    startCreatingSchedule() {
      this.isCreatingSchedule = true;
      this.newScheduleName = '';
      // Focus на input после рендера
      this.$nextTick(() => {
        this.$refs.newScheduleInput?.focus();
      });
    },

    cancelCreation() {
      this.isCreatingSchedule = false;
      this.newScheduleName = '';
    },

    createNewSchedule() {
      const name = this.newScheduleName.trim();
      if (!name) {
        this.cancelCreation();
        return;
      }

      this.$emit('createSchedule', name);
      this.cancelCreation();
    }
  },

  template: `
    <header class="border-b border-stone-200">
      <div class="max-w-3xl mx-auto px-8 h-[52px] flex justify-between items-center">
        <!-- Вкладки расписаний -->
        <div class="flex gap-1 items-center">
          <button
            v-for="(schedule, index) in schedules"
            :key="schedule.id"
            @click="selectSchedule(index)"
            :class="[
              'header-btn px-3 py-1 text-[13px] font-medium transition-all duration-150',
              activeScheduleIndex === index
                ? 'text-stone-700'
                : 'text-stone-400'
            ]"
          >
            {{ schedule.name }}
          </button>

          <!-- Создание новой вкладки -->
          <div v-if="!isCreatingSchedule">
            <button
              @click="startCreatingSchedule"
              class="header-btn px-2 py-1 text-[13px] text-stone-400 transition-all duration-150 flex items-center gap-1.5"
              title="Создать новое расписание"
            >
              <span>+</span>
              <span>добавить</span>
            </button>
          </div>
          <div v-else class="flex items-center gap-1 h-[28px]">
            <input
              ref="newScheduleInput"
              v-model="newScheduleName"
              @keyup.enter="createNewSchedule"
              @keyup.escape="cancelCreation"
              type="text"
              placeholder="Название..."
              class="px-2 py-1 h-[28px] text-[13px] bg-stone-50 rounded focus:outline-none focus:bg-stone-100 w-36 transition-colors"
            />
            <!-- Кнопки рядом -->
            <button
              @click="createNewSchedule"
              class="px-2 h-full text-[13px] text-stone-600 hover:text-stone-700 transition-colors"
              title="Создать"
            >
              ✓
            </button>
            <button
              @click="cancelCreation"
              class="px-2 h-full text-[13px] text-stone-400 hover:text-stone-600 transition-colors"
              title="Отмена"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Настройки времени сна -->
        <div class="flex gap-6 items-center text-[13px] text-stone-600">
          <div class="flex items-center gap-1.5">
            <span class="text-base">🌙</span>
            <span class="time-display">{{ activeSchedule?.bedtime }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-base">☀️</span>
            <span class="time-display">{{ activeSchedule?.wakeTime }}</span>
          </div>
        </div>
      </div>
    </header>
  `
};
