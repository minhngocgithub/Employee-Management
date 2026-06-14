import { useAlertStore } from '../stores/alert.store';
import type {  AlertAction } from '../stores/alert.store'

/**
 * Composable for managing alerts throughout the application
 *
 * Usage:
 * ```ts
 * const { success, error, warning, info } = useAlert()
 *
 * success('Operation completed successfully!')
 * error('An error occurred', { title: 'Error', duration: 0 })
 * ```
 */
export function useAlert() {
  const alertStore = useAlertStore()

  return {
    /**
     * Show success alert
     */
    success: (
      message: string,
      options?: {
        title?: string
        description?: string
        duration?: number
        dismissible?: boolean
        actions?: AlertAction[]
      }
    ) => {
      return alertStore.success(message, options)
    },

    /**
     * Show error alert
     */
    error: (
      message: string,
      options?: {
        title?: string
        description?: string
        duration?: number
        dismissible?: boolean
        actions?: AlertAction[]
      }
    ) => {
      return alertStore.error(message, options)
    },

    /**
     * Show warning alert
     */
    warning: (
      message: string,
      options?: {
        title?: string
        description?: string
        duration?: number
        dismissible?: boolean
        actions?: AlertAction[]
      }
    ) => {
      return alertStore.warning(message, options)
    },

    /**
     * Show info alert
     */
    info: (
      message: string,
      options?: {
        title?: string
        description?: string
        duration?: number
        dismissible?: boolean
        actions?: AlertAction[]
      }
    ) => {
      return alertStore.info(message, options)
    },

    /**
     * Remove alert by ID
     */
    remove: (id: string) => {
      alertStore.removeAlert(id)
    },

    /**
     * Clear all alerts
     */
    clearAll: () => {
      alertStore.clearAlerts()
    },
  }
}
