import type { Router } from 'vue-router'
import { useAuthStore } from 'src/stores/auth.store'
import { getDefaultRouteName } from 'src/composables/useNavigation'

export function setupRouterGuards(router: Router): void {
  router.beforeEach((to) => {
    const authStore = useAuthStore()
    const guestOnly = to.meta.guestOnly === true
    const requiresAuth =
      to.meta.requiresAuth === true ||
      to.matched.some((r) => r.meta.requiresAuth)

    const allowedRoles = to.meta.roles

    // Guest only pages
    if (guestOnly && authStore.isAuthenticated) {
      if (authStore.mustChangePassword) {
        return { name: 'change-password' }
      }

      return {
        name: getDefaultRouteName(authStore.role),
      }
    }

    // Login required
    if (requiresAuth && !authStore.isAuthenticated) {
      return {
        name: 'login',
        query: {
          redirect: to.fullPath,
        },
      }
    }

    // Force change password
    if (
      authStore.isAuthenticated &&
      authStore.mustChangePassword &&
      to.name !== 'change-password'
    ) {
      return {
        name: 'change-password',
      }
    }

    // Role check
    if (allowedRoles?.length && authStore.role) {
      if (!allowedRoles.includes(authStore.role)) {
        return {
          name: 'forbidden',
        }
      }
    }

    // Allow navigation
    return true
  })
}