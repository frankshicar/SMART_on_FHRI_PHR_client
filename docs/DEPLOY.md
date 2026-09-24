# 生产环境部署指南（Docker + VPS）

将 Demo 部署到外网，适合放进履历的 **Live Demo** 链接。

---

## 架构

```
Internet
   │
   ▼
┌─────────────┐
│   Caddy     │  :80 / :443  自动 HTTPS
└──────┬──────┘
       │
┌──────▼──────┐
│  Nuxt App   │  Docker（SSR + API）
└──────┬──────┘
       │
┌──────▼──────┐
│   MySQL 8   │  Docker volume 持久化
└─────────────┘
```

---

## 前置需求

- 一台 VPS（Hetzner / DigitalOcean / 阿里云等，1GB RAM 起）
- 域名（可选但推荐，Google OAuth 生产环境需要 HTTPS）
- 本机已安装 Docker 与 Docker Compose

---

## 步骤 1：购买 VPS 并安装 Docker

```bash
# Ubuntu 示例
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# 重新登录 SSH
```

---

## 步骤 2：克隆项目

```bash
sudo mkdir -p /opt/smart-phr-client
sudo chown $USER:$USER /opt/smart-phr-client
git clone https://github.com/frankshicar/SMART_on_FHRI_PHR_client.git /opt/smart-phr-client
cd /opt/smart-phr-client
```

---

## 步骤 3：配置环境变量

```bash
cp .env.production.example .env
nano .env
```

**必填项：**

```env
APP_URL=https://phr.yourdomain.com
APP_DOMAIN=phr.yourdomain.com
CADDY_EMAIL=you@example.com
JWT_SECRET=用 openssl rand -hex 32 生成
MYSQL_PASSWORD=强密码
```

**Google OAuth（可选）：**

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

并在 [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 新增：

```
https://phr.yourdomain.com/api/auth/google/callback
```

---

## 步骤 4：DNS 指向 VPS

| 类型 | 名称 | 值 |
|------|------|-----|
| A | phr | VPS 公网 IP |

---

## 步骤 5：启动

### 方式 A：本地构建（首次推荐）

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 方式 B：使用 GHCR 镜像（CI/CD 推送后）

```env
APP_IMAGE=ghcr.io/frankshicar/smart_on_fhri_phr_client:latest
```

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

---

## 步骤 6：验证

```bash
docker compose -f docker-compose.prod.yml ps
curl -s http://localhost/api/health
# 或
curl -s https://phr.yourdomain.com/api/health
```

预期：`{"ok":true,"db":"ok",...}`

浏览器打开 `https://phr.yourdomain.com/login`  
Demo 帐号：`demo` / `demo1234`

---

## 常用运维命令

```bash
# 查看日志
docker compose -f docker-compose.prod.yml logs -f app

# 重启
docker compose -f docker-compose.prod.yml restart app

# 停止
docker compose -f docker-compose.prod.yml down

# 清库重来（⚠️ 删除所有数据）
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 启用 GitHub Actions 自动部署

首次手动部署成功后，依 [CI-CD.md](./CI-CD.md) 设置 Secrets/Variables，之后 push `main` 会自动更新 VPS。

---

## 仅 IP、无域名（临时测试）

`.env`：

```env
APP_URL=http://YOUR_VPS_IP
APP_DOMAIN=:80
```

Google OAuth **无法**在此模式使用（需 HTTPS + 固定域名）。

---

## 故障排除

| 现象 | 处理 |
|------|------|
| `502 Bad Gateway` | `docker compose logs app` 看 Nuxt 是否启动 |
| 登入 503 | MySQL 未就绪，等 30s 或看 `docker compose logs mysql` |
| Google redirect_uri_mismatch | `APP_URL` 与 Google Console 必须完全一致 |
| 处方空白 | hapi.fhir.org 不可用或 Patient/3935 无资料 |

---

## 履历 Demo 链接建议

```
Live Demo: https://phr.yourdomain.com
GitHub:    https://github.com/frankshicar/SMART_on_FHRI_PHR_client
Stack:     Nuxt 3 · MySQL · Docker · GitHub Actions · Caddy HTTPS
```
