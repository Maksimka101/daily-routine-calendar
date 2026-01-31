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
    /**
     * Переключает активную вкладку расписания.
     * @param {number} index - Индекс расписания в списке
     */
    selectSchedule(index) {
      this.$emit('update:activeScheduleIndex', index);
    },

    /**
     * Включает режим создания новой вкладки: показывает input и фокусирует его.
     */
    startCreatingSchedule() {
      this.isCreatingSchedule = true;
      this.newScheduleName = '';
      this.$nextTick(() => {
        this.$refs.newScheduleInput?.focus();
      });
    },

    /**
     * Отменяет создание новой вкладки: закрывает input и сбрасывает имя.
     */
    cancelCreation() {
      this.isCreatingSchedule = false;
      this.newScheduleName = '';
    },

    /**
     * Создаёт новое расписание с введённым именем и эмитит createSchedule; при пустом имени — отмена.
     */
    createNewSchedule() {
      const name = this.newScheduleName.trim();
      if (!name) {
        this.cancelCreation();
        return;
      }

      this.$emit('createSchedule', name);
      this.cancelCreation();
    },

    /**
     * Удаляет расписание по индексу; эмитит deleteSchedule. Останавливает всплытие, чтобы не переключить вкладку.
     * @param {number} index - Индекс расписания в списке
     * @param {Event} event - Событие клика (для stopPropagation)
     */
    deleteSchedule(index, event) {
      event.stopPropagation();
      this.$emit('deleteSchedule', index);
    },

    /**
     * Включает режим редактирования времени (bedtime или wakeTime): подставляет текущее значение и фокусирует input.
     * @param {'bedtime'|'wakeTime'} field - Поле времени для редактирования
     */
    startEditingTime(field) {
      if (!this.activeSchedule) return;
      this.editingTimeField = field;
      this.editingTimeValue = this.activeSchedule[field] || '07:00';
      this.$nextTick(() => {
        const ref = field === 'bedtime' ? 'bedtimeInput' : 'wakeTimeInput';
        this.$refs[ref]?.focus();
      });
    },

    /**
     * Отменяет редактирование времени: сбрасывает поле и значение.
     */
    cancelEditingTime() {
      this.editingTimeField = null;
      this.editingTimeValue = '';
    },

    /**
     * Применяет отредактированное время: нормализует строку, эмитит updateSchedule с новым значением; при невалидном вводе — отмена.
     */
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
    <header class="header">
      <div class="container header__inner">
        <!-- Вкладки расписаний -->
        <div class="header__tabs">
          <button
            v-for="(schedule, index) in schedules"
            :key="schedule.id"
            @click="selectSchedule(index)"
            :class="[
              'header-tab',
              activeScheduleIndex === index ? 'header-tab--active' : 'header-tab--inactive'
            ]"
          >
            <span>{{ schedule.name }}</span>
            <span
              @click="deleteSchedule(index, $event)"
              class="header-tab__delete"
              title="Удалить расписание"
            >
              🗑️
            </span>
          </button>

          <!-- Создание новой вкладки -->
          <div v-if="!isCreatingSchedule">
            <button
              @click="startCreatingSchedule"
              class="header-add"
              title="Создать новое расписание"
            >
              <span>+</span>
              <span>добавить</span>
            </button>
          </div>
          <div v-else class="header-create">
            <input
              ref="newScheduleInput"
              v-model="newScheduleName"
              @keyup.enter="createNewSchedule"
              @keyup.escape="cancelCreation"
              type="text"
              placeholder="Название..."
              class="header-create__input"
            />
            <button
              @click="createNewSchedule"
              class="header-create__btn header-create__btn--confirm"
              title="Создать"
            >
              ✓
            </button>
            <button
              @click="cancelCreation"
              class="header-create__btn header-create__btn--cancel"
              title="Отмена"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Настройки времени сна -->
        <div class="header__times">
          <!-- Время сна -->
          <div class="header-time">
            <template v-if="editingTimeField === 'bedtime'">
              <div class="header-time-edit">
                <span class="header-time__emoji header-time__emoji--spaced">🌙</span>
                <input
                  ref="bedtimeInput"
                  v-model="editingTimeValue"
                  @keyup.enter="applyTimeEdit"
                  @keyup.escape="cancelEditingTime"
                  type="text"
                  placeholder="22:00"
                  maxlength="5"
                  class="header-time-edit__input time-display"
                />
                <button type="button" @click="applyTimeEdit" class="header-time-edit__btn header-time-edit__btn--apply" title="Применить">✓</button>
                <button type="button" @click="cancelEditingTime" class="header-time-edit__btn header-time-edit__btn--cancel" title="Отмена">✕</button>
              </div>
            </template>
            <button v-else @click="startEditingTime('bedtime')" class="header-time__btn">
              <span class="header-time__emoji">🌙</span>
              <span class="time-display">{{ activeSchedule?.bedtime }}</span>
            </button>
          </div>
          <!-- Время подъёма -->
          <div class="header-time">
            <template v-if="editingTimeField === 'wakeTime'">
              <div class="header-time-edit">
                <span class="header-time__emoji header-time__emoji--spaced">☀️</span>
                <input
                  ref="wakeTimeInput"
                  v-model="editingTimeValue"
                  @keyup.enter="applyTimeEdit"
                  @keyup.escape="cancelEditingTime"
                  type="text"
                  placeholder="07:00"
                  maxlength="5"
                  class="header-time-edit__input time-display"
                />
                <button type="button" @click="applyTimeEdit" class="header-time-edit__btn header-time-edit__btn--apply" title="Применить">✓</button>
                <button type="button" @click="cancelEditingTime" class="header-time-edit__btn header-time-edit__btn--cancel" title="Отмена">✕</button>
              </div>
            </template>
            <button v-else @click="startEditingTime('wakeTime')" class="header-time__btn">
              <span class="header-time__emoji">☀️</span>
              <span class="time-display">{{ activeSchedule?.wakeTime }}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  `
};
