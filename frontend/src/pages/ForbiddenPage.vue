<template>
  <q-page class="flex flex-center column q-gutter-md">
    <q-icon name="block" size="64px" color="negative" />
    <div class="text-h6">Không có quyền truy cập</div>
    <q-btn color="primary" label="Về trang chủ" :to="{ name: 'home' }" unelevated />
  </q-page>
</template>
