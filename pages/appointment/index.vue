<template>
  <div class="page">
    <header class="header">
      <div>
        <h1>預約取藥</h1>
        <p v-if="userName" class="welcome">你好，{{ userName }}</p>
        <p v-if="fhirLabel" class="fhir-tag">FHIR {{ fhirLabel }}</p>
      </div>
      <button type="button" class="logout" @click="logout">登出</button>
    </header>

    <div class="dashboard">
      <NuxtLink to="/appointment/make" class="tile tile-primary">
        <span class="tile-icon">➕</span>
        <span class="tile-title">建立預約</span>
        <span class="tile-desc">選擇處方、日期與取藥地點</span>
      </NuxtLink>

      <NuxtLink to="/medication" class="tile">
        <span class="tile-icon">💊</span>
        <span class="tile-title">查看處方</span>
        <span class="tile-desc">
          {{ rxSummary || '載入中…' }}
        </span>
      </NuxtLink>

      <NuxtLink to="/appointment/view" class="tile">
        <span class="tile-icon">📅</span>
        <span class="tile-title">查看預約</span>
        <span class="tile-desc">
          {{ apptSummary || '載入中…' }}
        </span>
      </NuxtLink>
    </div>

    <section class="upcoming">
      <h2>近期預約</h2>
      <ul v-if="upcoming.length">
        <li v-for="item in upcoming" :key="item.id">
          <div class="upcoming-main">
            <span class="upcoming-date">{{ formatDisplay(item.AppointmentDate) }}</span>
            <span class="upcoming-loc">{{ item.location }}</span>
          </div>
          <span class="upcoming-rx">{{ shortRx(item.Prescription) }}</span>
        </li>
      </ul>
      <p v-else class="upcoming-empty">目前沒有 upcoming 預約，點上方「建立預約」新增</p>
    </section>

    <AppTabBar active-tab="home" />
  </div>
</template>

<script setup>
const userName = ref('');
const fhirLabel = ref('');
const rxSummary = ref('');
const apptSummary = ref('');
const upcoming = ref([]);

function formatDisplay(value) {
  return new Date(value).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shortRx(text) {
  if (!text) return '';
  return text.length > 36 ? `${text.slice(0, 36)}…` : text;
}

onMounted(async () => {
  try {
    const meRes = await fetch('/api/auth/me', { credentials: 'include' });
    if (meRes.ok) {
      const data = await meRes.json();
      userName.value = data.name || data.username;
      if (data.fhirPatientId) {
        fhirLabel.value = data.fhirPatientName
          ? `${data.fhirPatientName} (Patient/${data.fhirPatientId})`
          : `Patient/${data.fhirPatientId}`;
      }
    }

    const rxRes = await fetch('/api/medication/list', { credentials: 'include' });
    if (rxRes.ok) {
      const rx = await rxRes.json();
      const count = rx.prescriptions?.length || 0;
      rxSummary.value = count ? `${count} 張 active 處方` : '目前無 active 處方';
    }

    const apptRes = await fetch('/api/appointments/upcoming', { credentials: 'include' });
    if (apptRes.ok) {
      const list = await apptRes.json();
      upcoming.value = list.slice(0, 5);
      apptSummary.value = list.length
        ? `共 ${list.length} 筆 upcoming 預約`
        : '尚無 upcoming 預約';
    } else {
      apptSummary.value = '點擊查看所有預約';
    }
  } catch { /* ignore */ }
});

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  await navigateTo('/login');
}
</script>

<style scoped>
.page {
  padding: 20px 16px 88px;
  font-family: Arial, sans-serif;
  color: #2c3e50;
  max-width: 560px;
  margin: 0 auto;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}
h1 {
  margin: 0 0 4px;
  font-size: 24px;
}
.welcome {
  margin: 0;
  color: #666;
  font-size: 15px;
}
.fhir-tag {
  margin: 4px 0 0;
  font-size: 12px;
  color: #999;
}
.logout {
  padding: 6px 12px;
  font-size: 13px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  flex-shrink: 0;
}
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.tile {
  display: block;
  padding: 18px 20px;
  border-radius: 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s, box-shadow 0.15s;
}
.tile:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.tile-primary {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: #fff;
  border: none;
}
.tile-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 6px;
}
.tile-title {
  display: block;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}
.tile-desc {
  display: block;
  font-size: 13px;
  opacity: 0.85;
}
.tile-primary .tile-desc {
  opacity: 0.9;
}
.upcoming {
  margin-top: 28px;
  text-align: left;
}
.upcoming h2 {
  font-size: 16px;
  margin-bottom: 12px;
  color: #555;
}
.upcoming ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.upcoming li {
  padding: 12px 14px;
  background: #f3e8ff;
  border-radius: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}
.upcoming-main {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}
.upcoming-date {
  font-weight: 600;
}
.upcoming-loc {
  color: #666;
}
.upcoming-rx {
  display: block;
  font-size: 12px;
  color: #888;
}
.upcoming-empty {
  color: #888;
  font-size: 14px;
  margin: 0;
}
</style>
