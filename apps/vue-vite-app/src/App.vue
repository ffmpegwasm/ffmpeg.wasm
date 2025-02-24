<script setup lang="ts">
import FFmpegDemo from '@/components/FFmpegDemo.vue';
</script>

<template>
  <main>
    <Suspense>
      <FFmpegDemo />

      <template #fallback>
        <div class="loading-message">Loading FFmpeg…</div>
      </template>
    </Suspense>
  </main>
</template>

<style scoped>
main {
  position: absolute;
  inset: 0;
  display: grid;
  align-content: center;
}

.loading-message {
  display: flex;
  justify-content: center;
}
</style>
