import type { Router } from 'vue-router';
import { useAuthStore } from 'src/stores/auth.store';
import { getDefaultRouteName } from 'src/composables/useNavigation';

export function setupRouterGuards(router: Router): void {
  router.beforeEach((to, _from, next) => {
    const authStore = useAuthStore();
    const isPublic = to.meta.public === true;
    const guestOnly = to.meta.guestOnly === true;
    const requiresAuth = to.meta.requiresAuth === true || to.matched.some((r) => r.meta.requiresAuth);
    const allowedRoles = to.meta.roles;

    if (guestOnly && authStore.isAuthenticated) {
      if (authStore.mustChangePassword) {
        return next({ name: 'change-password' });
      }
      return next({ name: getDefaultRouteName(authStore.role) });
    }

    if (requiresAuth && !authStore.isAuthenticated) {
      return next({
        name: 'login',
        query: { redirect: to.fullPath },
      });
    }

    if (
      authStore.isAuthenticated &&
      authStore.mustChangePassword &&
      to.name !== 'change-password'
    ) {
      return next({ name: 'change-password' });
    }

    if (isPublic) {
      return next();
    }

    if (allowedRoles?.length && authStore.role) {
      if (!allowedRoles.includes(authStore.role)) {
        return next({ name: 'forbidden' });
      }
    }

    return next();
  });
}
