<template>
  <div class="page">
    <AppBackButton fallback="/appointment" />
    <h1>我的預約</h1>
    <div class="form-container">
      <label>選擇日期</label>
      <DatePicker v-model="selectedDate" @update:model-value="fetchAppointments" />
    </div>

    <p v-if="loading" class="status">載入中…</p>
    <ul v-else-if="appointments.length" class="list">
      <li v-for="item in appointments" :key="item.id" class="item">
        <div class="item-body">
          <div class="date">{{ formatDisplay(item.AppointmentDate) }}</div>
          <div class="location">📍 {{ item.location }}</div>
          <div class="prescription">{{ item.Prescription }}</div>
        </div>
        <button
          type="button"
          class="delete-btn"
          :disabled="deletingId === item.id"
          @click="deleteAppointment(item.id)"
        >
          {{ deletingId === item.id ? '刪除中…' : '取消預約' }}
        </button>
      </li>
    </ul>
    <p v-else class="empty">此日期沒有預約</p>

    <p v-if="feedback" :class="['feedback', feedbackOk ? 'ok' : 'err']">{{ feedback }}</p>

    <AppTabBar active-tab="appointments" />
  </div>
</template>

<script setup>
import DatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

const selectedDate = ref(new Date());
const appointments = ref([]);
const loading = ref(false);
const deletingId = ref(null);
const feedback = ref('');
const feedbackOk = ref(false);

function formatQueryDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplay(value) {
  return new Date(value).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function fetchAppointments() {
  loading.value = true;
  feedback.value = '';
  try {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ date: formatQueryDate(selectedDate.value) }),
    });
    if (res.ok) {
      appointments.value = await res.json();
    } else {
      appointments.value = [];
    }
  } catch {
    appointments.value = [];
  } finally {
    loading.value = false;
  }
}

async function deleteAppointment(id) {
  if (!confirm('確定要取消這筆預約嗎？')) return;

  deletingId.value = id;
  feedback.value = '';
  try {
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      feedback.value = data.message || '已取消預約';
      feedbackOk.value = true;
      appointments.value = appointments.value.filter((a) => a.id !== id);
    } else {
      feedback.value = data.statusMessage || '刪除失敗';
      feedbackOk.value = false;
    }
  } catch {
    feedback.value = '無法連線伺服器';
    feedbackOk.value = false;
  } finally {
    deletingId.value = null;
  }
}

onMounted(fetchAppointments);
</script>

<style scoped>
.page {
  max-width: 560px;
  margin: 0 auto;
  padding: 20px 16px 88px;
  text-align: center;
  font-family: Arial, sans-serif;
  color: #2c3e50;
}
.form-container {
  margin-bottom: 20px;
  text-align: left;
}
.form-container label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}
.list {
  list-style: none;
  padding: 0;
  text-align: left;
}
.item {
  background: #f8f4ff;
  border: 1px solid #e8dff5;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 12px;
}
.item-body {
  margin-bottom: 12px;
}
.date {
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 6px;
}
.location {
  font-size: 14px;
  color: #555;
  margin-bottom: 6px;
}
.prescription {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
  word-break: break-word;
}
.delete-btn {
  width: 100%;
  padding: 10px;
  background: #fff;
  border: 1px solid #e74c3c;
  color: #e74c3c;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}
.delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.empty, .status {
  color: #888;
  padding: 24px 0;
}
.feedback {
  margin-top: 12px;
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
}
.feedback.ok {
  background: #d4edda;
  color: #155724;
}
.feedback.err {
  background: #f8d7da;
  color: #721c24;
}
</style>
