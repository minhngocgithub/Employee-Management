import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('pages/LoginPage.vue'),
    meta: { public: true, guestOnly: true },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('pages/ForgotPasswordPage.vue'),
    meta: { public: true, guestOnly: true },
  },
  {
    path: '/change-password',
    name: 'change-password',
    component: () => import('pages/ChangePasswordPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('pages/IndexPage.vue'),
      },
      {
        path: 'admin-dashboard',
        name: 'admin-dashboard',
        component: () => import('pages/dashboard/AdminDashboard.vue'),
        meta: { roles: ['admin'] },
      },
      {
        path: 'manager-dashboard',
        name: 'manager-dashboard',
        component: () => import('pages/dashboard/ManagerDashboard.vue'),
        meta: { roles: ['manager'] },
      },
      {
        path: 'employees',
        name: 'employees',
        component: () => import('pages/employee/EmployeesPage.vue'),
        meta: { roles: ['admin', 'hr', 'manager'] },
      },
      {
        path: 'departments',
        name: 'departments',
        component: () => import('pages/department/DepartmentsPage.vue'),
        meta: { roles: ['admin', 'manager'] },
      },
      {
        path: 'leave-requests',
        name: 'leave-requests',
        component: () => import('pages/leave-request/LeaveRequestsPage.vue'),
        meta: { roles: ['admin', 'hr', 'manager'] },
      },
      {
        path: 'audit-logs',
        name: 'audit-logs',
        component: () => import('pages/ErrorNotFound.vue'),
        meta: { roles: ['admin'] },
      },
      {
        path: 'create-employee',
        name: 'create-employee',
        component: () => import('pages/ErrorNotFound.vue'),
        meta: { roles: ['admin', 'hr'] },
      },
      {
        path: 'create-department',
        name: 'create-department',
        component: () => import('pages/ErrorNotFound.vue'),
        meta: { roles: ['admin'] },
      },
      {
        path: 'forbidden',
        name: 'forbidden',
        component: () => import('pages/ForbiddenPage.vue'),
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
