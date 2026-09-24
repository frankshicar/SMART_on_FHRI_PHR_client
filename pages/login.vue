<template>
  <div class="login-container">
    <h1>登入</h1>
    <p class="hint">PHR 病患端 — 預約取藥 Demo</p>

    <a href="/api/auth/google" class="google-button">
      <img src="https://developers.google.com/identity/images/g-logo.png" alt="" class="google-logo" />
      用 Google 登入
    </a>

    <div class="divider"><span>或</span></div>

    <form @submit.prevent="handleLogin">
      <label for="username">Demo 帳號</label>
      <input id="username" v-model="username" type="text" autocomplete="username" />
      <label for="password">密碼</label>
      <input id="password" v-model="password" type="password" autocomplete="current-password" />
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" class="submit-button" :disabled="loading">
        {{ loading ? '登入中…' : 'Demo 帳密登入' }}
      </button>
    </form>
    <p class="demo">Demo 帳號：demo / demo1234</p>
  </div>
</template>

<script setup>
const route = useRoute();
const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const ERROR_MESSAGES = {
  google_auth_failed: 'Google 登入失敗，請確認 .env 設定或稍後再試',
  google_not_configured: 'Google OAuth 未設定，請在 .env 填入 GOOGLE_CLIENT_ID 與 GOOGLE_CLIENT_SECRET',
  db_unavailable: '資料庫未啟動。請先開啟 Docker Desktop，再執行 npm run db:up',
};

onMounted(() => {
  const err = route.query.error;
  if (err && ERROR_MESSAGES[err]) {
    error.value = ERROR_MESSAGES[err];
  } else if (err) {
    error.value = '登入已取消或失敗';
  }
});

async function handleLogin() {
  error.value = '';
  if (!username.value || !password.value) {
    error.value = '請輸入 Demo 帳號與密碼';
    return;
  }
  loading.value = true;
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: username.value, password: password.value }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      error.value = data.statusMessage || '登入失敗';
      return;
    }
    await navigateTo('/appointment');
  } catch {
    error.value = '無法連線至伺服器';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 80px auto;
  padding: 24px;
  border-radius: 8px;
  background: #f7f7f7;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
h1 {
  text-align: center;
  margin-bottom: 8px;
}
.hint, .demo {
  text-align: center;
  color: #666;
  font-size: 14px;
}
.demo {
  margin-top: 16px;
  font-size: 13px;
}
.google-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 12px;
  margin-top: 20px;
  background: #fff;
  border: 1px solid #dadce0;
  border-radius: 4px;
  color: #3c4043;
  font-size: 16px;
  text-decoration: none;
  cursor: pointer;
}
.google-button:hover {
  background: #f8f9fa;
}
.google-logo {
  width: 20px;
  height: 20px;
}
.divider {
  display: flex;
  align-items: center;
  margin: 20px 0;
  color: #999;
  font-size: 13px;
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-top: 1px solid #ddd;
}
.divider span {
  padding: 0 12px;
}
form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
label {
  font-size: 14px;
  color: #333;
}
input {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
}
.submit-button {
  margin-top: 12px;
  padding: 12px;
  background: #3498db;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}
.submit-button:disabled {
  opacity: 0.6;
}
.error {
  color: #c0392b;
  font-size: 14px;
  margin: 0;
}
</style>
