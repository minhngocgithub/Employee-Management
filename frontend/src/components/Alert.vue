<template>
  <transition name="slide-down">
    <div
      v-if="isVisible"
      :class="[
        'alert',
        `alert-${variant}`,
      ]"
      role="alert"
      :aria-live="ariaLive"
      :aria-atomic="true"
    >
      <div class="alert-wrapper">
        <!-- Icon -->
        <div class="alert-icon">
          <svg
            v-if="variant === 'success'"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <svg
            v-else-if="variant === 'error'"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <svg
            v-else-if="variant === 'warning'"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <svg
            v-else
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>

        <!-- Content -->
        <div class="alert-content">
          <h3 v-if="title" class="alert-title">{{ title }}</h3>
          <p class="alert-message">{{ message }}</p>
          <p v-if="description" class="alert-description">{{ description }}</p>
        </div>

        <!-- Close button -->
        <button
          v-if="dismissible"
          class="alert-close"
          aria-label="Close alert"
          @click="handleClose"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- Action buttons -->
      <div v-if="actions && actions.length > 0" class="alert-actions">
        <button
          v-for="(action, index) in actions"
          :key="index"
          class="alert-action-btn"
          @click="handleAction(action)"
        >
          {{ action.label }}
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

defineOptions({ name: 'AppAlert' })

interface AlertAction {
  label: string
  callback: () => void
}

interface Props {
  variant?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  description?: string
  dismissible?: boolean
  duration?: number // milliseconds (0 = never auto-dismiss)
  actions?: AlertAction[]
  ariaLive?: 'polite' | 'assertive'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info',
  dismissible: true,
  duration: 5000,
  ariaLive: 'polite',
})

const emit = defineEmits<{
  close: []
}>()

const isVisible = ref(true)

const handleClose = () => {
  isVisible.value = false
  emit('close')
}

const handleAction = (action: AlertAction) => {
  action.callback()
  handleClose()
}

onMounted(() => {
  if (props.duration > 0) {
    setTimeout(() => {
      handleClose()
    }, props.duration)
  }
})
</script>

<style scoped>
/* ─── Alert Component – Zapier-inspired Design ─── */

.alert {
  --alert-bg: var(--color-canvas-soft, #f8f4f0);
  --alert-text: var(--color-ink, #201515);
  --alert-border: var(--color-body-mid, #939084);
  --alert-icon: var(--color-ink, #201515);

  background-color: var(--alert-bg);
  border-left: 4px solid var(--alert-border);
  border-radius: 12px;
  padding: 16px 24px;
  margin-bottom: 16px;
  color: var(--alert-text);
  font-family: Inter, system-ui, -apple-system, sans-serif;
  font-size: 16px;
  line-height: 24px;
  box-shadow: 0 1px 3px rgba(32, 21, 21, 0.1);
  animation: slideDown 0.3s ease-out;
}

/* Variants */
.alert-success {
  --alert-bg: #e8f5e9;
  --alert-text: #1b5e20;
  --alert-border: #4caf50;
  --alert-icon: #4caf50;
}

.alert-error {
  --alert-bg: #ffebee;
  --alert-text: #c62828;
  --alert-border: #f44336;
  --alert-icon: #f44336;
}

.alert-warning {
  --alert-bg: #fff3e0;
  --alert-text: #e65100;
  --alert-border: #ff9800;
  --alert-icon: #ff9800;
}

.alert-info {
  --alert-bg: #e3f2fd;
  --alert-text: #0d47a1;
  --alert-border: #2196f3;
  --alert-icon: #2196f3;
}

.alert-wrapper {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.alert-icon {
  flex-shrink: 0;
  color: var(--alert-icon);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-title {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: var(--alert-text);
}

.alert-message {
  margin: 0;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: var(--alert-text);
}

.alert-description {
  margin: 8px 0 0 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 21px;
  color: rgba(var(--alert-text-rgb), 0.75);
  opacity: 0.8;
}

.alert-close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--alert-text);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
  margin-top: 2px;

  &:hover {
    background-color: rgba(var(--alert-text-rgb), 0.1);
  }

  &:active {
    background-color: rgba(var(--alert-text-rgb), 0.15);
  }
}

.alert-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(var(--alert-text-rgb), 0.1);
}

.alert-action-btn {
  padding: 8px 16px;
  background-color: rgba(var(--alert-text-rgb), 0.1);
  border: 1px solid rgba(var(--alert-text-rgb), 0.2);
  color: var(--alert-text);
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: Inter, system-ui, -apple-system, sans-serif;

  &:hover {
    background-color: rgba(var(--alert-text-rgb), 0.15);
    border-color: rgba(var(--alert-text-rgb), 0.3);
  }

  &:active {
    background-color: rgba(var(--alert-text-rgb), 0.2);
  }
}

/* Animations */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-down-enter-active {
  animation: slideDown 0.3s ease-out;
}

.slide-down-leave-active {
  animation: slideDown 0.3s ease-in reverse;
}
</style>
