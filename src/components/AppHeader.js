/**
 * AppHeader Component
 * Компонент шапки с вкладками расписаний и настройками времени
 */

import { normalizeTime } from '../utils/TimeUtils.js';

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

  emits: ['update:activeScheduleIndex', 'createSchedule', 'deleteSchedule', 'updateSchedule'],

  data() {
    return {
      isCreatingSchedule: false,
      newScheduleName: '',
      editingTimeField: null, // null | 'bedtime' | 'wakeTime'
      editingTimeValue: ''
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
    },

    deleteSchedule(index, event) {
      event.stopPropagation(); // Предотвращаем переключение на вкладку
      this.$emit('deleteSchedule', index);
    },

    startEditingTime(field) {
      if (!this.activeSchedule) return;
      this.editingTimeField = field;
      this.editingTimeValue = this.activeSchedule[field] || '07:00';
      this.$nextTick(() => {
        const ref = field === 'bedtime' ? 'bedtimeInput' : 'wakeTimeInput';
        this.$refs[ref]?.focus();
      });
    },

    cancelEditingTime() {
      this.editingTimeField = null;
      this.editingTimeValue = '';
    },

    applyTimeEdit() {
      const normalized = normalizeTime(this.editingTimeValue);
      if (!normalized) {
        this.cancelEditingTime();
        return;
      }
      const field = this.editingTimeField;
      this.$emit('updateSchedule', { [field]: normalized });
      this.cancelEditingTime();
    }
  },

  template: `
    <header class="border-b border-stone-200">
      <div class="max-w-3xl mx-auto px-8 h-[52px] flex justify-between items-center">
        <!-- Вкладки расписаний -->
        <div class="flex items-center">
          <button
            v-for="(schedule, index) in schedules"
            :key="schedule.id"
            @click="selectSchedule(index)"
            :class="[
              'header-btn px-3 py-1 text-[13px] font-medium transition-all duration-150 flex items-center gap-1 group',
              activeScheduleIndex === index
                ? 'text-stone-700'
                : 'text-stone-400'
            ]"
          >
            <span>{{ schedule.name }}</span>
            <!-- Кнопка удаления - место всегда зарезервировано, показывается при hover на любую вкладку -->
            <span
              @click="deleteSchedule(index, $event)"
              class="text-[11px] transition-all duration-150 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 cursor-pointer"
              title="Удалить расписание"
            >
              🗑️
            </span>
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
          <!-- Время сна -->
          <div class="flex items-center">
            <template v-if="editingTimeField === 'bedtime'">
              <span class="text-base mr-1.5">🌙</span>
              <input
                ref="bedtimeInput"
                v-model="editingTimeValue"
                @keyup.enter="applyTimeEdit"
                @keyup.escape="cancelEditingTime"
                type="text"
                placeholder="22:00"
                maxlength="5"
                class="px-2 py-1 h-[28px] text-[13px] bg-stone-50 rounded focus:outline-none focus:bg-stone-100 w-14 transition-colors time-display"
              />
              <button type="button" @click="applyTimeEdit" class="px-1.5 h-[28px] text-[13px] text-stone-600 hover:text-stone-700 transition-colors" title="Применить">✓</button>
              <button type="button" @click="cancelEditingTime" class="px-1.5 h-[28px] text-[13px] text-stone-400 hover:text-stone-600 transition-colors" title="Отмена">✕</button>
            </template>
            <button v-else @click="startEditingTime('bedtime')" class="header-btn flex items-center gap-1.5 px-1 py-1 cursor-pointer rounded">
              <span class="text-base">🌙</span>
              <span class="time-display">{{ activeSchedule?.bedtime }}</span>
            </button>
          </div>
          <!-- Время подъёма -->
          <div class="flex items-center">
            <template v-if="editingTimeField === 'wakeTime'">
              <span class="text-base mr-1.5">☀️</span>
              <input
                ref="wakeTimeInput"
                v-model="editingTimeValue"
                @keyup.enter="applyTimeEdit"
                @keyup.escape="cancelEditingTime"
                type="text"
                placeholder="07:00"
                maxlength="5"
                class="px-2 py-1 h-[28px] text-[13px] bg-stone-50 rounded focus:outline-none focus:bg-stone-100 w-14 transition-colors time-display"
              />
              <button type="button" @click="applyTimeEdit" class="px-1.5 h-[28px] text-[13px] text-stone-600 hover:text-stone-700 transition-colors" title="Применить">✓</button>
              <button type="button" @click="cancelEditingTime" class="px-1.5 h-[28px] text-[13px] text-stone-400 hover:text-stone-600 transition-colors" title="Отмена">✕</button>
            </template>
            <button v-else @click="startEditingTime('wakeTime')" class="header-btn flex items-center gap-1.5 px-1 py-1 cursor-pointer rounded">
              <span class="text-base">☀️</span>
              <span class="time-display">{{ activeSchedule?.wakeTime }}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  `
};
