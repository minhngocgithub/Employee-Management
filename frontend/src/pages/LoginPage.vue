<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page class="flex flex-center bg-grey-2">
        <q-card class="login-card q-pa-lg" flat bordered>
          <q-card-section class="text-center">
            <div class="text-h5 text-weight-bold text-primary">EMS</div>
            <div class="text-subtitle2 text-grey-7 q-mt-xs">
              Employee Management System
            </div>
          </q-card-section>

          <q-card-section>
            <q-form class="q-gutter-md" @submit.prevent="onSubmit">
              <q-input
                v-model="email"
                type="email"
                label="Email công ty"
                autocomplete="username"
                outlined
                dense
                :disable="loading"
                :rules="[(v) => !!v || 'Vui lòng nhập email']"
              >
                <template #prepend>
                  <q-icon name="email" />
                </template>
              </q-input>

              <q-input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                label="Mật khẩu"
                autocomplete="current-password"
                outlined
                dense
                :disable="loading"
                :rules="[(v) => !!v || 'Vui lòng nhập mật khẩu']"
              >
                <template #prepend>
                  <q-icon name="lock" />
                </template>
                <template #append>
                  <q-icon
                    :name="showPassword ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </q-input>

              <q-btn
                type="submit"
                label="Đăng nhập"
                color="primary"
                class="full-width"
                unelevated
                :loading="loading"
              />
            </q-form>
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth.store';
import type { AxiosError } from 'axios';

const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);

function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string | string[] }>;
  const message = axiosError.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  return 'Đăng nhập thất bại. Vui lòng thử lại.';
}

async function onSubmit(): Promise<void> {
  loading.value = true;
  try {
    await authStore.login({
      email: email.value.trim().toLowerCase(),
      password: password.value,
    });

    $q.notify({ type: 'positive', message: 'Đăng nhập thành công' });

    if (authStore.mustChangePassword) {
      await router.replace({ name: 'change-password' });
      return;
    }

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
    await router.replace(redirect);
  } catch (error) {
    $q.notify({ type: 'negative', message: getErrorMessage(error) });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-card {
  width: 100%;
  max-width: 400px;
}
</style>
