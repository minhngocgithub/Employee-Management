<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="min-width: 520px; max-width: 90vw">
      <q-card-section>
        <div class="text-h6">Tạo đơn xin nghỉ phép</div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-select
              v-model="form.leave_type"
              :options="LEAVE_TYPE_OPTIONS"
              label="Loại nghỉ phép *"
              outlined
              emit-value
              map-options
            />
          </div>

          <div class="col-12 col-md-6">
            <q-input
              v-model="form.start_date"
              type="date"
              label="Ngày bắt đầu *"
              outlined
              :min="minDate"
            />
          </div>

          <div class="col-12 col-md-6">
            <q-input
              v-model="form.end_date"
              type="date"
              label="Ngày kết thúc *"
              outlined
              :min="form.start_date || minDate"
            />
          </div>

          <div class="col-12" v-if="leaveDays > 0">
            <q-banner dense rounded class="bg-blue-1 text-blue-9">
              Số ngày nghỉ: <strong>{{ leaveDays }}</strong> ngày
            </q-banner>
          </div>

          <div class="col-12">
            <q-input
              v-model="form.reason"
              type="textarea"
              label="Lý do *"
              outlined
              autogrow
              counter
              maxlength="500"
              rows="3"
            />
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Hủy" @click="onDialogCancel" />
        <q-btn
          color="primary"
          label="Gửi đơn"
          :loading="loading"
          @click="submit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import axios from 'axios';
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { leaveRequestApi } from 'src/api/leave-request.api';
import {
  LEAVE_TYPE_OPTIONS,
  countLeaveDays,
  todayDateString,
} from 'src/composables/useLeaveRequestLabels';
import type { CreateLeaveRequestDto, LeaveType } from 'src/types/api.types';

defineEmits([...useDialogPluginComponent.emits]);

const {
  dialogRef,
  onDialogHide,
  onDialogOK,
  onDialogCancel,
} = useDialogPluginComponent();

const $q = useQuasar();
const loading = ref(false);
const minDate = todayDateString();

const form = ref<CreateLeaveRequestDto>({
  leave_type: 'annual' as LeaveType,
  start_date: minDate,
  end_date: minDate,
  reason: '',
});

const leaveDays = computed(() =>
  countLeaveDays(form.value.start_date, form.value.end_date),
);

async function submit(): Promise<void> {
  const startDate = form.value.start_date as string;
  const endDate = form.value.end_date as string;
  const reason = form.value.reason as string;

  if (!form.value.leave_type || !startDate || !endDate) {
    $q.notify({ type: 'warning', message: 'Vui lòng nhập đầy đủ thông tin' });
    return;
  }

  if (startDate < minDate) {
    $q.notify({
      type: 'warning',
      message: 'Ngày bắt đầu không được trước hôm nay',
    });
    return;
  }

  if (endDate < startDate) {
    $q.notify({
      type: 'warning',
      message: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu',
    });
    return;
  }

  if (!reason.trim()) {
    $q.notify({ type: 'warning', message: 'Vui lòng nhập lý do nghỉ phép' });
    return;
  }

  loading.value = true;
  try {
    const result = await leaveRequestApi.create({
      ...form.value,
      reason: reason.trim(),
    });
    onDialogOK(result);
  } catch (err: unknown) {
    let message = 'Không thể tạo đơn nghỉ phép';
    if (axios.isAxiosError(err)) {
      message = (err.response?.data as { message?: string })?.message ?? message;
    }
    $q.notify({ type: 'negative', message });
  } finally {
    loading.value = false;
  }
}
</script>
