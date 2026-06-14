<template>
  <q-page class="q-pa-md page-container">
    <div class="animate-fade-in">
      <div class="text-h5 q-mb-md">Xin chào, {{ authStore.user?.email }}</div>

      <q-card flat bordered class="hover-lift q-mb-md">
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

      <div v-if="quickLinks.length" class="row q-col-gutter-md">
        <div
          v-for="link in quickLinks"
          :key="link.name"
          class="col-12 col-sm-6 col-md-4"
        >
          <q-card class="hover-lift cursor-pointer" @click="router.push(link.to)">
            <q-card-section class="row items-center no-wrap">
              <q-icon :name="link.icon" size="32px" color="primary" class="q-mr-md" />
              <div>
                <div class="text-subtitle1">{{ link.label }}</div>
                <div class="text-caption text-grey-7">Mở module</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth.store';
import {
  getDefaultRouteName,
  getNavItemsForRole,
} from 'src/composables/useNavigation';

const router = useRouter();
const authStore = useAuthStore();

const quickLinks = computed(() =>
  getNavItemsForRole(authStore.role).filter((item) => item.name !== 'home'),
);

onMounted(() => {
  const role = authStore.role;
  if (role === 'admin' || role === 'manager') {
    void router.replace({ name: getDefaultRouteName(role) });
  }
});
</script>
