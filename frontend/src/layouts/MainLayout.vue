<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>Employee Management System</q-toolbar-title>

        <q-chip v-if="authStore.user" dense color="white" text-color="primary" class="q-mr-sm">
          <span class="text-capitalize">{{ authStore.user.role }}</span>
        </q-chip>

        <q-btn flat dense icon="logout" label="Đăng xuất" @click="onLogout" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list padding>
        <q-item-label header>Menu</q-item-label>

        <q-item clickable v-ripple :to="{ name: 'home' }" exact>
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Trang chủ</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth.store';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

const leftDrawerOpen = ref(false);

function toggleLeftDrawer(): void {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

async function onLogout(): Promise<void> {
  try {
    await authStore.logout();
    $q.notify({ type: 'positive', message: 'Đã đăng xuất' });
  } finally {
    await router.replace({ name: 'login' });
  }
}
</script>
