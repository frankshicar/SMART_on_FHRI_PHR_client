<template>
  <button type="button" class="back-btn" @click="goBack">
    <span class="arrow">←</span>
    <span>{{ label }}</span>
  </button>
</template>

<script setup>
const props = defineProps({
  label: {
    type: String,
    default: '返回',
  },
  fallback: {
    type: String,
    default: '/appointment',
  },
});

const router = useRouter();

function goBack() {
  if (import.meta.client && window.history.length > 1) {
    router.back();
  } else {
    navigateTo(props.fallback);
  }
}
</script>

<style scoped>
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px 8px 8px;
  margin-bottom: 12px;
  background: none;
  border: none;
  color: #3498db;
  font-size: 15px;
  cursor: pointer;
  border-radius: 6px;
}
.back-btn:hover {
  background: #f0f7ff;
}
.arrow {
  font-size: 18px;
  line-height: 1;
}
</style>
