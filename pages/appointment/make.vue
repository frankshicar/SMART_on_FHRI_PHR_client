<template>
  <div class="page">
    <AppBackButton fallback="/appointment" />
    <h1>預約取藥</h1>
    <p class="hint">選擇處方、取藥日期與地點後按確定。</p>
    <div class="form-container">
      <label for="prescription">處方</label>
      <select id="prescription" v-model="selectedRxId" @change="onRxChange">
        <option disabled value="">請選擇</option>
        <option v-for="item in prescriptionOptions" :key="item.id" :value="item.id">
          {{ item.label }}
        </option>
      </select>
      <p v-if="loadingRx" class="note">載入處方中…</p>
      <p v-else-if="!prescriptionOptions.length" class="note warn">{{ loadError || '尚無可預約處方' }}</p>

      <label for="date">取藥日期</label>
      <DatePicker v-model="selectedDate" />

      <label for="location">取藥地點</label>
      <select id="location" v-model="location">
        <option disabled value="">請選擇</option>
        <option v-for="loc in locations" :key="loc" :value="loc">{{ loc }}</option>
      </select>
    </div>

    <button type="button" class="submit" :disabled="submitting" @click="submit">
      {{ submitting ? '送出中…' : '確定' }}
    </button>

    <div v-if="feedback" ref="feedbackEl" :class="['feedback', feedbackOk ? 'ok' : 'err']">
      {{ feedback }}
      <NuxtLink v-if="feedbackOk" to="/appointment/view" class="view-link">→ 查看我的預約</NuxtLink>
    </div>

    <AppTabBar active-tab="home" />
  </div>
</template>

<script setup>
import DatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

const route = useRoute();
const selectedRxId = ref('');
const selectedLabel = ref('');
const selectedDate = ref(new Date());
const location = ref('');
const prescriptionOptions = ref([]);
const loadingRx = ref(true);
const loadError = ref('');
const submitting = ref(false);
const feedback = ref('');
const feedbackOk = ref(false);
const feedbackEl = ref(null);

const locations = ['一樓藥局', '二樓藥局', '急診藥局'];

function onRxChange() {
  const item = prescriptionOptions.value.find((p) => p.id === selectedRxId.value);
  selectedLabel.value = item?.label || '';
}

async function loadPrescriptions() {
  loadingRx.value = true;
  loadError.value = '';
  try {
    const res = await fetch('/api/medication/list', { credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      loadError.value = data.statusMessage || '無法載入處方';
      prescriptionOptions.value = [];
      return;
    }
    prescriptionOptions.value = data.prescriptions || [];

    const preselectLabel = route.query.prescription
      ? decodeURIComponent(String(route.query.prescription))
      : '';
    const match = prescriptionOptions.value.find((p) => p.label === preselectLabel);
    if (match) {
      selectedRxId.value = match.id;
      selectedLabel.value = match.label;
    }
  } catch {
    loadError.value = '載入處方失敗';
  } finally {
    loadingRx.value = false;
  }
}

function toIsoDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

async function submit() {
  feedback.value = '';
  feedbackOk.value = false;

  if (!selectedRxId.value || !selectedLabel.value) {
    feedback.value = '請選擇處方';
    scrollToFeedback();
    return;
  }
  if (!location.value) {
    feedback.value = '請選擇取藥地點';
    scrollToFeedback();
    return;
  }
  const isoDate = toIsoDate(selectedDate.value);
  if (!isoDate) {
    feedback.value = '請選擇有效的取藥日期';
    scrollToFeedback();
    return;
  }

  submitting.value = true;
  try {
    const res = await fetch('/api/appointments/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        prescription: selectedLabel.value,
        prescriptionId: selectedRxId.value,
        appointmentDate: isoDate,
        location: location.value,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      feedback.value = data.message || '預約成功！';
      feedbackOk.value = true;
    } else {
      feedback.value = data.statusMessage || data.message || `儲存失敗 (${res.status})`;
      feedbackOk.value = false;
    }
    scrollToFeedback();
  } catch {
    feedback.value = '無法連線伺服器，請確認 npm run dev 與 npm run db:up 已啟動';
    feedbackOk.value = false;
    scrollToFeedback();
  } finally {
    submitting.value = false;
  }
}

function scrollToFeedback() {
  nextTick(() => {
    feedbackEl.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

onMounted(loadPrescriptions);
</script>

<style scoped>
.page {
  text-align: center;
  padding-bottom: 100px;
  font-family: Arial, sans-serif;
  color: #2c3e50;
}
.hint {
  color: #666;
  font-size: 14px;
  max-width: 480px;
  margin: 0 auto 16px;
}
.form-container {
  display: grid;
  gap: 10px;
  width: 90%;
  max-width: 520px;
  margin: 24px auto;
  text-align: left;
}
.form-container label {
  font-weight: bold;
  margin-top: 8px;
}
.form-container select,
.form-container :deep(.dp__main) {
  padding: 8px;
  font-size: 14px;
  width: 100%;
}
.note {
  font-size: 13px;
  color: #666;
  margin: 0;
}
.note.warn {
  color: #c0392b;
}
.submit {
  padding: 15px 40px;
  font-size: 18px;
  background: #3498db;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
.submit:disabled {
  opacity: 0.6;
}
.feedback {
  margin: 20px auto 0;
  padding: 14px;
  max-width: 520px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
}
.feedback.ok {
  background: #d4edda;
  color: #155724;
}
.feedback.err {
  background: #f8d7da;
  color: #721c24;
}
.view-link {
  display: block;
  margin-top: 8px;
  color: #155724;
  font-weight: 600;
}
</style>
