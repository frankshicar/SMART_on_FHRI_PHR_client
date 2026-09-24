<template>
  <nav class="tab-bar">
    <NuxtLink to="/appointment" :class="{ active: activeTab === 'home' }">
      <span class="icon">🏠</span>
      <span class="label">首頁</span>
    </NuxtLink>
    <NuxtLink to="/appointment/view" :class="{ active: activeTab === 'appointments' }">
      <span class="icon">📅</span>
      <span class="label">我的預約</span>
    </NuxtLink>
    <NuxtLink to="/medication" :class="{ active: activeTab === 'medication' }">
      <span class="icon">💊</span>
      <span class="label">處方</span>
    </NuxtLink>
  </nav>
</template>

<script setup>
defineProps({
  activeTab: {
    type: String,
    required: true,
  },
});
</script>

<style scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 64px;
  background: #fff;
  display: flex;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.06);
  z-index: 100;
}
.tab-bar a {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #7f8c8d;
  text-decoration: none;
  font-size: 11px;
  padding: 6px 0;
}
.tab-bar a.active {
  color: #3498db;
  font-weight: 600;
}
.icon {
  font-size: 20px;
  line-height: 1;
}
.label {
  line-height: 1.2;
}
</style>
