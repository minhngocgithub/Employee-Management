<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page class="flex flex-center bg-grey-2">
        <q-card class="login-card q-pa-lg" flat bordered>
          <q-card-section class="text-center">
            <div class="text-h6 text-weight-bold">Đổi mật khẩu</div>
            <div class="text-body2 text-grey-7 q-mt-sm">
              Bạn cần đổi mật khẩu trước khi tiếp tục sử dụng hệ thống.
            </div>
          </q-card-section>

          <q-card-section>
            <q-form class="q-gutter-md" @submit.prevent="onSubmit">
              <q-input
                v-model="currentPassword"
                :type="showCurrent ? 'text' : 'password'"
                label="Mật khẩu hiện tại"
                outlined
                dense
                :disable="loading"
                :rules="[(v) => !!v || 'Bắt buộc']"
              >
                <template #append>
                  <q-icon
                    :name="showCurrent ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="showCurrent = !showCurrent"
                  />
                </template>
              </q-input>

              <q-input
                v-model="newPassword"
                :type="showNew ? 'text' : 'password'"
                label="Mật khẩu mới"
                outlined
                dense
                :disable="loading"
                :rules="[
                  (v) => !!v || 'Bắt buộc',
                  (v) => v.length >= 8 || 'Tối thiểu 8 ký tự',
                  (v) =>
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(v) ||
                    'Cần chữ hoa, chữ thường và số',
                ]"
              >
                <template #append>
                  <q-icon
                    :name="showNew ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="showNew = !showNew"
                  />
                </template>
              </q-input>

              <q-input
                v-model="confirmPassword"
                :type="showConfirm ? 'text' : 'password'"
                label="Xác nhận mật khẩu mới"
                outlined
                dense
                :disable="loading"
                :rules="[
                  (v) => !!v || 'Bắt buộc',
                  (v) => v === newPassword || 'Mật khẩu không khớp',
                ]"
              >
                <template #append>
                  <q-icon
                    :name="showConfirm ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="showConfirm = !showConfirm"
                  />
                </template>
              </q-input>

              <q-btn
                type="submit"
                label="Cập nhật mật khẩu"
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
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { authApi } from 'src/api';
import { useAuthStore } from 'src/stores/auth.store';
import type { AxiosError } from 'axios';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const showCurrent = ref(false);
const showNew = ref(false);
const showConfirm = ref(false);
const loading = ref(false);

function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string | string[] }>;
  const message = axiosError.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  return 'Đổi mật khẩu thất bại.';
}

async function onSubmit(): Promise<void> {
  loading.value = true;
  try {
    await authApi.changePassword({
      current_password: currentPassword.value,
      new_password: newPassword.value,
    });

    authStore.markPasswordChanged();
    $q.notify({
      type: 'positive',
      message: 'Đổi mật khẩu thành công.',
    });

    await router.replace({ name: 'home' });
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
  max-width: 420px;
}
</style>
