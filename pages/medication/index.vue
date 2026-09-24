<template>
  <div class="page">
    <AppBackButton fallback="/appointment" />
    <h1>我的處方</h1>
    <p class="source">
      資料來自 FHIR 公開伺服器，僅顯示
      <strong>{{ fhirPatientLabel }}</strong> 的 active 處方。
    </p>

    <p v-if="loading" class="status">載入中…</p>
    <p v-else-if="loadError" class="error">{{ loadError }}</p>
    <p v-else-if="!prescriptions.length" class="empty">目前沒有 active 處方</p>

    <div v-else class="list">
      <article
        v-for="item in prescriptions"
        :key="item.id"
        class="card"
        :class="{ expanded: expandedId === item.id }"
      >
        <button type="button" class="card-header" @click="toggle(item.id)">
          <div class="card-title">
            <span class="date">{{ item.dateLabel }}</span>
            <span class="doctor">{{ item.doctor }}</span>
          </div>
          <span class="chevron">{{ expandedId === item.id ? '▲' : '▼' }}</span>
        </button>

        <p class="med-count">{{ item.medications[0] }}</p>

        <div v-if="expandedId === item.id" class="card-body">
          <ul class="med-list">
            <li v-for="(med, i) in item.medications" :key="i">
              <span>{{ med }}</span>
              <button type="button" class="speak-one" @click="readAloud(med)">🔊</button>
            </li>
          </ul>
          <div class="actions">
            <button type="button" class="action" @click="readAloudAll(item.medications)">
              🔊 朗讀全部
            </button>
            <button type="button" class="action" @click="copyMeds(item)">
              📋 複製藥單
            </button>
            <NuxtLink
              :to="`/appointment/make?prescription=${encodeURIComponent(item.label)}`"
              class="action action-primary"
            >
              📅 預約取藥
            </NuxtLink>
          </div>
        </div>
      </article>
    </div>

    <p v-if="copyFeedback" class="copy-ok">{{ copyFeedback }}</p>

    <AppTabBar active-tab="medication" />
  </div>
</template>

<script setup>
const prescriptions = ref([]);
const expandedId = ref('');
const loadError = ref('');
const loading = ref(true);
const fhirPatientLabel = ref('已綁定病人');
const copyFeedback = ref('');

async function loadRequests() {
  loading.value = true;
  loadError.value = '';
  try {
    const res = await fetch('/api/medication/list', { credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      loadError.value = data.statusMessage || '無法載入藥單';
      return;
    }
    prescriptions.value = data.prescriptions || [];
    if (data.fhirPatient?.name) {
      fhirPatientLabel.value = `${data.fhirPatient.name}（Patient/${data.fhirPatient.id}）`;
    } else if (data.fhirPatient?.id) {
      fhirPatientLabel.value = `Patient/${data.fhirPatient.id}`;
    }
    if (prescriptions.value.length === 1) {
      expandedId.value = prescriptions.value[0].id;
    }
  } catch {
    loadError.value = '載入失敗';
  } finally {
    loading.value = false;
  }
}

function toggle(id) {
  expandedId.value = expandedId.value === id ? '' : id;
}

function readAloud(text) {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-TW';
    window.speechSynthesis.speak(u);
  }
}

function readAloudAll(meds) {
  readAloud(meds.join('、'));
}

async function copyMeds(item) {
  const text = `${item.label}\n\n${item.medications.map((m, i) => `${i + 1}. ${m}`).join('\n')}`;
  try {
    await navigator.clipboard.writeText(text);
    copyFeedback.value = '已複製到剪貼簿';
    setTimeout(() => { copyFeedback.value = ''; }, 2000);
  } catch {
    copyFeedback.value = '複製失敗';
  }
}

onMounted(loadRequests);
</script>

<style scoped>
.page {
  padding: 20px 16px 88px;
  font-family: Arial, sans-serif;
  color: #2c3e50;
  max-width: 560px;
  margin: 0 auto;
}
.source {
  padding: 12px;
  background: #f0f4f8;
  border-radius: 8px;
  font-size: 13px;
  color: #555;
  line-height: 1.5;
  margin-bottom: 20px;
}
.status, .empty {
  color: #888;
  padding: 24px 0;
  text-align: center;
}
.error {
  color: #c0392b;
  text-align: center;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.card {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  text-align: left;
}
.card.expanded {
  border-color: #3498db;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.15);
}
.card-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: #f8f9fa;
  border: none;
  cursor: pointer;
  text-align: left;
}
.card-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.date {
  font-weight: 700;
  font-size: 16px;
  color: #2c3e50;
}
.doctor {
  font-size: 13px;
  color: #666;
}
.chevron {
  color: #999;
  font-size: 12px;
}
.med-count {
  margin: 0;
  padding: 0 16px 10px;
  font-size: 13px;
  color: #888;
}
.card-body {
  padding: 0 16px 16px;
  border-top: 1px solid #eee;
}
.med-list {
  list-style: none;
  padding: 12px 0;
  margin: 0;
}
.med-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #eef0ff;
  border-radius: 8px;
  margin-bottom: 8px;
  font-size: 15px;
}
.speak-one {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.action {
  flex: 1;
  min-width: 100px;
  padding: 10px 12px;
  font-size: 13px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  color: inherit;
}
.action-primary {
  background: #3498db;
  color: #fff;
  border-color: #3498db;
}
.copy-ok {
  text-align: center;
  color: #27ae60;
  font-size: 14px;
  margin-top: 12px;
}
</style>
