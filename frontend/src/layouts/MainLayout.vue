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

        <q-btn 
          flat 
          dense 
          :label="currentLocale === 'en' ? 'EN' : 'VI'"
          @click="toggleLanguage"
          class="q-mr-md"
          :style="{ minWidth: '40px' }"
        />

        <q-btn flat dense icon="logout" :label="$t('common.logout')" @click="onLogout" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list padding>
        <q-item-label header>{{ $t('common.actions') }}</q-item-label>

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
          <q-item-label header>{{ $t('navigation.management') }}</q-item-label>

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
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'src/stores/auth.store';
import { getNavItemsForRole } from 'src/composables/useNavigation';
import { setLocale, getLocale } from 'src/plugins/i18n';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();
const { locale } = useI18n();

const leftDrawerOpen = ref(false);
const currentLocale = ref(getLocale());

function toggleLanguage(): void {
  const newLocale = currentLocale.value === 'en' ? 'vi' : 'en';
  setLocale(newLocale);
  currentLocale.value = newLocale;
}

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
    title: 'Confirm Logout',
    message: 'Are you sure you want to exit the system?',
    ok: { label: 'Yes', color: 'primary' },
    cancel: { label: 'No', color: 'grey-8', flat: true },
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await authStore.logout();
        $q.notify({ type: 'positive', message: 'Logged out successfully' });
      } finally {
        await router.replace({ name: 'login' });
      }
    })();
  });
}
</script>

