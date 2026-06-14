import { defineStore } from 'pinia'
import { ref } from 'vue'

export type AlertVariant = 'success' | 'error' | 'warning' | 'info'

export interface AlertAction {
  label: string
  callback: () => void
}

export interface Alert {
  id: string
  variant: AlertVariant
  title?: string
  message: string
  description?: string
  dismissible?: boolean
  duration?: number
  actions?: AlertAction[]
  timestamp: number
}

export const useAlertStore = defineStore('alert', () => {
  const alerts = ref<Alert[]>([])
  let alertIdCounter = 0

  /**
   * Add alert to the store
   */
  const addAlert = (
    message: string,
    options: Partial<Omit<Alert, 'id' | 'message' | 'timestamp'>> = {}
  ): string => {
    const id = `alert-${++alertIdCounter}-${Date.now()}`
    const alert: Alert = {
      id,
      message,
      variant: options.variant || 'info',
      dismissible: options.dismissible !== false,
      duration: options.duration ?? 5000,
      timestamp: Date.now(),
    }

    if (options.title !== undefined) {
      alert.title = options.title
    }
    if (options.description !== undefined) {
      alert.description = options.description
    }
    if (options.actions !== undefined) {
      alert.actions = options.actions
    }

    alerts.value.push(alert)
    return id
  }

  /**
   * Remove alert by ID
   */
  const removeAlert = (id: string) => {
    const index = alerts.value.findIndex((alert) => alert.id === id)
    if (index !== -1) {
      alerts.value.splice(index, 1)
    }
  }

  /**
   * Clear all alerts
   */
  const clearAlerts = () => {
    alerts.value = []
  }

  /**
   * Convenience methods for common alert types
   */
  const success = (
    message: string,
    options: Partial<Omit<Alert, 'id' | 'variant' | 'message' | 'timestamp'>> = {}
  ): string => {
    return addAlert(message, { ...options, variant: 'success' })
  }

  const error = (
    message: string,
    options: Partial<Omit<Alert, 'id' | 'variant' | 'message' | 'timestamp'>> = {}
  ): string => {
    return addAlert(message, { ...options, variant: 'error' })
  }

  const warning = (
    message: string,
    options: Partial<Omit<Alert, 'id' | 'variant' | 'message' | 'timestamp'>> = {}
  ): string => {
    return addAlert(message, { ...options, variant: 'warning' })
  }

  const info = (
    message: string,
    options: Partial<Omit<Alert, 'id' | 'variant' | 'message' | 'timestamp'>> = {}
  ): string => {
    return addAlert(message, { ...options, variant: 'info' })
  }

  return {
    alerts,
    addAlert,
    removeAlert,
    clearAlerts,
    success,
    error,
    warning,
    info,
  }
})
