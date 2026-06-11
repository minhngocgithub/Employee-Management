import type { Role } from 'src/types/auth.types';

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean;
    guestOnly?: boolean;
    requiresAuth?: boolean;
    roles?: Role[];
  }
}

export {};
