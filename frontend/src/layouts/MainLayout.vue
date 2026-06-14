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

        <q-chip
          v-if="authStore.user"
          dense
          color="white"
          text-color="primary"
          class="q-mr-sm"
        >
          <span class="text-capitalize">{{ authStore.user.role }}</span>
        </q-chip>

        <q-btn flat dense icon="logout" label="Đăng xuất" @click="onLogout" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list padding>
        <q-item-label header>Menu</q-item-label>

        <q-item
          v-for="item in primaryMenuItems"
          :key="item.name"
          clickable
          v-ripple
          :to="item.to"
          :exact="item.name === 'home'"
        >
          <q-item-section avatar>
            <q-icon :name="item.icon" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ item.label }}</q-item-label>
          </q-item-section>
        </q-item>

        <template v-if="managementMenuItems.length">
          <q-separator class="q-my-sm" />
          <q-item-label header>Quản lý</q-item-label>

          <q-item
            v-for="item in managementMenuItems"
            :key="item.name"
            clickable
            v-ripple
            :to="item.to"
          >
            <q-item-section avatar>
              <q-icon :name="item.icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ item.label }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth.store';
import { getNavItemsForRole } from 'src/composables/useNavigation';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

const leftDrawerOpen = ref(false);

const primaryMenuItems = computed(() => {
  const names = new Set(['home', 'admin-dashboard', 'manager-dashboard']);
  return getNavItemsForRole(authStore.role).filter((item) => names.has(item.name));
});

const managementMenuItems = computed(() => {
  const names = new Set(['home', 'admin-dashboard', 'manager-dashboard']);
  return getNavItemsForRole(authStore.role).filter((item) => !names.has(item.name));
});

function toggleLeftDrawer(): void {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function onLogout(): void {
  $q.dialog({
    title: 'Xác nhận đăng xuất',
    message: 'Bạn muốn thoát khỏi hệ thống?',
    ok: { label: 'Đồng ý', color: 'primary' },
    cancel: { label: 'Không', color: 'grey-8', flat: true },
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await authStore.logout();
        $q.notify({ type: 'positive', message: 'Đã đăng xuất' });
      } finally {
        await router.replace({ name: 'login' });
      }
    })();
  });
}
</script>
