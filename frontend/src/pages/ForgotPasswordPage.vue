<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page class="flex flex-center bg-grey-2">
        <q-card class="forgot-password-card q-pa-lg" flat bordered>
          <q-card-section class="text-center">
            <div class="text-h5 text-weight-bold text-primary">EMS</div>
            <div class="text-subtitle2 text-grey-7 q-mt-xs">
              {{ currentStep === 'email' ? 'Đặt lại mật khẩu' : 'Xác nhận OTP' }}
            </div>
          </q-card-section>

          <q-card-section>
            <!-- Step 1: Request OTP -->
            <q-form v-if="currentStep === 'email'" class="q-gutter-md" @submit.prevent="requestOtp">
              <div class="text-subtitle2 text-grey-7 q-mb-md">
                Nhập email công ty của bạn. Chúng tôi sẽ gửi mã OTP để xác minh.
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
                label="Gửi mã OTP"
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

            <!-- Step 2: Verify OTP & Reset Password -->
            <q-form v-else-if="currentStep === 'verify'" class="q-gutter-md" @submit.prevent="resetPassword">
              <div class="text-subtitle2 text-grey-7 q-mb-md">
                Nhập mã OTP từ email của bạn và mật khẩu mới.
              </div>

              <q-input
                v-model="otp"
                type="text"
                label="Mã OTP (6 chữ số)"
                outlined
                dense
                maxlength="6"
                :disable="loading"
                :rules="[
                  (v) => !!v || 'Vui lòng nhập mã OTP',
                  (v) => /^\d{6}$/.test(v) || 'Mã OTP phải là 6 chữ số',
                ]"
                @input="otp = otp.replace(/\D/g, '')"
              >
                <template #prepend>
                  <q-icon name="vpn_key" />
                </template>
              </q-input>

              <q-input
                v-model="newPassword"
                type="password"
                label="Mật khẩu mới"
                outlined
                dense
                :disable="loading"
                :rules="[
                  (v) => !!v || 'Vui lòng nhập mật khẩu mới',
                  (v) => v.length >= 8 || 'Mật khẩu phải có ít nhất 8 ký tự',
                ]"
              >
                <template #prepend>
                  <q-icon name="lock" />
                </template>
              </q-input>

              <q-input
                v-model="confirmPassword"
                type="password"
                label="Xác nhận mật khẩu"
                outlined
                dense
                :disable="loading"
                :rules="[
                  (v) => !!v || 'Vui lòng xác nhận mật khẩu',
                  (v) => v === newPassword || 'Mật khẩu không khớp',
                ]"
              >
                <template #prepend>
                  <q-icon name="lock" />
                </template>
              </q-input>

              <div class="text-caption text-grey-7">
                Mã OTP hết hạn sau: <strong>{{ otpExpiryTime }}</strong> giây
              </div>

              <q-btn
                type="submit"
                label="Đặt lại mật khẩu"
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
                  label="Quay lại"
                  @click="goBack"
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
import { ref, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { otpApi } from 'src/api/otp.api';
import type { AxiosError } from 'axios';

const $q = useQuasar();
const router = useRouter();

type Step = 'email' | 'verify';

const currentStep = ref<Step>('email');
const email = ref('');
const otp = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const otpExpiryTime = ref(120);
let otpCountdownInterval: number | null = null;

function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string | string[] }>;
  const message = axiosError.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  return 'Có lỗi xảy ra. Vui lòng thử lại.';
}

async function requestOtp(): Promise<void> {
  loading.value = true;
  try {
    const result = await otpApi.forgotPassword(email.value.trim().toLowerCase());
    $q.notify({
      type: 'positive',
      message: result.message,
    });
    currentStep.value = 'verify';
    otpExpiryTime.value = result.expires_in;
    startOtpCountdown();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getErrorMessage(error),
    });
  } finally {
    loading.value = false;
  }
}

async function resetPassword(): Promise<void> {
  if (newPassword.value !== confirmPassword.value) {
    $q.notify({
      type: 'negative',
      message: 'Mật khẩu không khớp',
    });
    return;
  }

  loading.value = true;
  try {
    const result = await otpApi.resetPassword({
      email: email.value.trim().toLowerCase(),
      code: otp.value.trim(),
      new_password: newPassword.value,
    });

    $q.notify({
      type: 'positive',
      message: result.message,
    });

    stopOtpCountdown();
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

function goBack(): void {
  stopOtpCountdown();
  currentStep.value = 'email';
  otp.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
}

function startOtpCountdown(): void {
  otpCountdownInterval = window.setInterval(() => {
    otpExpiryTime.value -= 1;
    if (otpExpiryTime.value <= 0) {
      stopOtpCountdown();
      $q.notify({
        type: 'warning',
        message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.',
      });
      goBack();
    }
  }, 1000);
}

function stopOtpCountdown(): void {
  if (otpCountdownInterval !== null) {
    clearInterval(otpCountdownInterval);
    otpCountdownInterval = null;
  }
}

onUnmounted(() => {
  stopOtpCountdown();
});
</script>

<style scoped>
.forgot-password-card {
  width: 100%;
  max-width: 420px;
}
</style>
