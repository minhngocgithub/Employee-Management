<template>
  <router-view />
  <AlertContainer position="top-right" />
</template>

<script setup lang="ts">
import AlertContainer from 'src/components/AlertContainer.vue';
</script>
