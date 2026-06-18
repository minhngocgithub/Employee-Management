<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="min-width: 480px; max-width: 90vw">
      <q-card-section>
        <div class="text-h6">Duyệt đơn nghỉ phép</div>
      </q-card-section>

      <q-card-section>
        <q-list dense>
          <q-item>
            <q-item-section>
              <q-item-label caption>Loại nghỉ</q-item-label>
              <q-item-label>{{ getLeaveTypeLabel(leaveRequest.leave_type) }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label caption>Thời gian</q-item-label>
              <q-item-label>
                {{ formatDate(leaveRequest.start_date) }}
                →
                {{ formatDate(leaveRequest.end_date) }}
                ({{ countLeaveDays(leaveRequest.start_date, leaveRequest.end_date) }} ngày)
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label caption>Lý do</q-item-label>
              <q-item-label>{{ leaveRequest.reason }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <q-input
          v-if="action === 'reject'"
          v-model="rejectionReason"
          class="q-mt-md"
          type="textarea"
          label="Lý do từ chối *"
          outlined
          autogrow
          counter
          maxlength="500"
          rows="3"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Hủy" @click="onDialogCancel" />
        <q-btn
          v-if="action === 'approve'"
          color="positive"
          label="Duyệt"
          :loading="loading"
          @click="submit('approved')"
        />
        <q-btn
          v-if="action === 'reject'"
          color="negative"
          label="Từ chối"
          :loading="loading"
          @click="submit('rejected')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { leaveRequestApi } from 'src/api/leave-request.api';
import {
  getLeaveTypeLabel,
  formatDate,
  countLeaveDays,
} from 'src/composables/useLeaveRequestLabels';
import type { LeaveRequest } from 'src/types/api.types';

const props = defineProps<{
  leaveRequest: LeaveRequest;
  action: 'approve' | 'reject';
}>();

defineEmits([...useDialogPluginComponent.emits]);

const {
  dialogRef,
  onDialogHide,
  onDialogOK,
  onDialogCancel,
} = useDialogPluginComponent();

const $q = useQuasar();
const loading = ref(false);
const rejectionReason = ref('');

async function submit(status: 'approved' | 'rejected'): Promise<void> {
  if (status === 'rejected' && !rejectionReason.value.trim()) {
    $q.notify({ type: 'warning', message: 'Vui lòng nhập lý do từ chối' });
    return;
  }

  loading.value = true;
  try {
    const result = await leaveRequestApi.review(props.leaveRequest._id, {
      status,
      ...(status === 'rejected'
        ? { rejection_reason: rejectionReason.value.trim() }
        : {}),
    });
    onDialogOK(result);
  } catch (err: unknown) {
    let message = 'Không thể duyệt đơn nghỉ phép';
    if (axios.isAxiosError(err)) {
      message = (err.response?.data as { message?: string })?.message ?? message;
    }
    $q.notify({ type: 'negative', message });
  } finally {
    loading.value = false;
  }
}
</script>
