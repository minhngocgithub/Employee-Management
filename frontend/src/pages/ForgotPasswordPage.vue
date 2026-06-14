<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page class="flex flex-center bg-grey-2">
        <q-card class="forgot-password-card q-pa-lg" flat bordered>
          <q-card-section class="text-center">
            <div class="text-h5 text-weight-bold text-primary">EMS</div>
            <div class="text-subtitle2 text-grey-7 q-mt-xs">
              Đặt lại mật khẩu
            </div>
          </q-card-section>

          <q-card-section>
            <q-form class="q-gutter-md" @submit.prevent="onSubmit">
              <div class="text-subtitle2 text-grey-7 q-mb-md">
                Nhập email công ty của bạn. Quản trị viên sẽ gửi mật khẩu mới cho bạn.
              </div>

              <q-input
                v-model="email"
                type="email"
                label="Email công ty"
                outlined
                dense
                :disable="loading"
                :rules="[
                  (v) => !!v || 'Vui lòng nhập email',
                  (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Email không hợp lệ',
                ]"
              >
                <template #prepend>
                  <q-icon name="email" />
                </template>
              </q-input>

              <q-btn
                type="submit"
                label="Cấp mật khẩu mới"
                color="primary"
                class="full-width"
                unelevated
                :loading="loading"
              />

              <div class="text-center q-mt-md">
                <q-btn
                  flat
                  dense
                  color="primary"
                  label="Quay lại đăng nhập"
                  :to="{ name: 'login' }"
                />
              </div>
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
import { accountsApi } from 'src/api/account.api';
import type { AxiosError } from 'axios';

const $q = useQuasar();
const router = useRouter();

const email = ref('');
const loading = ref(false);

function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string | string[] }>;
  const message = axiosError.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  return 'Có lỗi xảy ra. Vui lòng thử lại.';
}

async function onSubmit(): Promise<void> {
  loading.value = true;
  try {
    // Get all accounts to find the one with this email
    const accounts = await accountsApi.list({
      search: email.value.trim().toLowerCase(),
      limit: 100,
    });

    const account = accounts.data.find(
      (acc) => acc.email.toLowerCase() === email.value.trim().toLowerCase(),
    );

    if (!account) {
      $q.notify({
        type: 'warning',
        message: 'Email không tìm thấy trong hệ thống',
      });
      return;
    }

    // Reset password with temporary password
    const tempPassword = generateTemporaryPassword();
    await accountsApi.resetPassword(account._id, {
      newPassword: tempPassword,
    });

    $q.notify({
      type: 'positive',
      message: 'Mật khẩu đã được đặt lại thành công. Admin sẽ gửi mật khẩu mới cho bạn.',
    });

    await router.replace({ name: 'login' });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getErrorMessage(error),
    });
  } finally {
    loading.value = false;
  }
}

function generateTemporaryPassword(): string {
  // Generate temporary password: Temp@<current_timestamp>
  // Format: Temp@123456 (meets requirements: uppercase, lowercase, numbers)
  const timestamp = Date.now().toString().slice(-6);
  return `Temp@${timestamp}`;
}
</script>

<style scoped>
.forgot-password-card {
  width: 100%;
  max-width: 420px;
}
</style>
