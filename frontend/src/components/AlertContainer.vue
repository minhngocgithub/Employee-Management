<template>
  <div class="alert-container" :class="position">
    <AppAlert
      v-for="alert in alerts"
      :key="alert.id"
      v-bind="toAlertProps(alert)"
      @close="removeAlert(alert.id)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAlertStore, type Alert } from '../stores/alert.store'
import AppAlert from './Alert.vue'

interface Props {
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
}

withDefaults(defineProps<Props>(), {
  position: 'top-right',
})

const alertStore = useAlertStore()

const alerts = computed(() => alertStore.alerts)

function toAlertProps(alert: Alert) {
  return {
    variant: alert.variant,
    message: alert.message,
    dismissible: alert.dismissible ?? true,
    duration: alert.duration ?? 5000,
    ariaLive: alert.variant === 'error' ? ('assertive' as const) : ('polite' as const),
    ...(alert.title !== undefined ? { title: alert.title } : {}),
    ...(alert.description !== undefined ? { description: alert.description } : {}),
    ...(alert.actions !== undefined ? { actions: alert.actions } : {}),
  }
}

const removeAlert = (id: string) => {
  alertStore.removeAlert(id)
}
</script>

<style scoped>
.alert-container {
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;

  /* Padding from edges */
  padding: 16px;
}

/* Position variants */
.top-left {
  top: 0;
  left: 0;
}

.top-center {
  top: 0;
  left: 50%;
  transform: translateX(-50%);
}

.top-right {
  top: 0;
  right: 0;
}

.bottom-left {
  bottom: 0;
  left: 0;
}

.bottom-center {
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
}

.bottom-right {
  bottom: 0;
  right: 0;
}

/* Allow interactions on alerts */
:deep(.alert) {
  pointer-events: auto;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .alert-container {
    padding: 12px;
    gap: 8px;
  }

  .top-center,
  .bottom-center {
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 24px);
  }

  :deep(.alert) {
    margin: 0;
  }
}
</style>
