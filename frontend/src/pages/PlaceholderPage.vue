<template>
  <q-page class="q-pa-md page-container">
    <q-card flat bordered class="hover-lift animate-fade-in">
      <q-card-section>
        <div class="text-h6">{{ pageTitle }}</div>

        <p class="text-body2 text-grey-7 q-mt-sm">
          Module này sẽ được triển khai ở phase tiếp theo.
        </p>
      </q-card-section>

      <q-card-actions>
        <q-btn
          flat
          color="primary"
          label="Về trang chủ"
          :to="{ name: 'home' }"
        />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const pageTitle = computed(() => route.meta.title ?? 'Đang phát triển')
</script>