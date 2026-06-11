<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Xin chào, {{ authStore.user?.email }}</div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium">Thông tin tài khoản</div>
        <q-list dense class="q-mt-sm">
          <q-item>
            <q-item-section>
              <q-item-label caption>Email</q-item-label>
              <q-item-label>{{ authStore.user?.email }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label caption>Vai trò</q-item-label>
              <q-item-label class="text-capitalize">
                {{ authStore.user?.role }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <q-banner rounded class="bg-blue-1 text-primary">
      Frontend foundation đã sẵn sàng. Các module (Dashboard, Employees, ...) sẽ được
      triển khai ở phase tiếp theo.
    </q-banner>
  </q-page>
</template>

<script setup lang="ts">
import { useAuthStore } from 'src/stores/auth.store';

const authStore = useAuthStore();
</script>
