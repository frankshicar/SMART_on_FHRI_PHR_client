# Google Cloud 部署指南（Cloud Run + Cloud SQL + GHCR 镜像）

使用 **现有 GitHub Actions 打的 Docker 镜像**，部署到 **Cloud Run**，数据库用 **Cloud SQL（fhirdb）**。

---

## 架构

```
用户浏览器
    │
    ▼
Cloud Run（GHCR Docker 镜像：Nuxt App）
    │  unix socket
    ▼
Cloud SQL（fhirdb / MySQL 8.4）
```

---

## ⚠️ 费用提醒

若实例是 **Enterprise Plus + 高可用 + 2 vCPU / 16 GB**（或更大），固定费用偏高，Demo 用不到。

建议改为较小规格：**Enterprise（非 Plus）+ 单区（非 HA）+ 最小机器**（在「编辑」实例里改，或删掉重建）。

---

## 第一步：Cloud SQL 设置（你现在在这）

### 1. 记下连接名称

在 fhirdb 概览页找到 **连接名称**，格式：

```
你的PROJECT_ID:us-central1:fhirdb
```

（区域须与 Cloud SQL 实例一致；你目前截图是 **us-central1**。）

### 2. 建立数据库

左侧 **数据库** → **建立数据库**：

- 名称：`FHIR_Appointment_Medicine`

### 3. 建立使用者（不要用 root 连 App）

左侧 **使用者** → **新增使用者**：

- 用户名：`phr_app`
- 密码：强密码（记下来）

### 4. 导入初始表结构

左侧 **Cloud SQL Studio** → 连接 fhirdb → 执行项目里的 `scripts/init-db.sql` 内容（或只执行 `USE` 之后的 `CREATE TABLE` 部分）。

### 5. 确认实例状态

概览页显示 **正在运行** ✅

---

## 第二步：让 Cloud Run 能拉 GHCR 镜像

GitHub Actions 已推送镜像到：

```
ghcr.io/frankshicar/smart_on_fhri_phr_client:latest
```

### 若仓库 / Package 是公开的

Cloud Run 可直接拉，跳到第三步。

### 若是私有的

1. GitHub → Settings → Developer settings → PAT（`read:packages`）
2. GCP **Secret Manager** 建立 secret `ghcr-token`
3. Cloud Run 部署时指定 registry 认证（见 gcloud 命令）

---

## 第三步：部署到 Cloud Run（部署容器）

在本地安装 [Google Cloud SDK](https://cloud.google.com/sdk)，登录后执行：

```bash
gcloud auth login
gcloud config set project 你的PROJECT_ID

gcloud run deploy smart-phr-client \
  --image ghcr.io/frankshicar/smart_on_fhri_phr_client:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --add-cloudsql-instances 你的PROJECT_ID:us-central1:fhirdb \
  --set-env-vars "\
NODE_ENV=production,\
APP_URL=https://部署后CloudRun给的网址,\
JWT_SECRET=随机长字串,\
MYSQL_SOCKET_PATH=/cloudsql/你的PROJECT_ID:us-central1:fhirdb,\
MYSQL_USER=phr_app,\
MYSQL_PASSWORD=你的密码,\
MYSQL_DATABASE=FHIR_Appointment_Medicine,\
DEMO_FHIR_PATIENT_ID=3935,\
FHIR_SERVER_URL=https://hapi.fhir.org/baseR4"
```

部署完成后会给你一个 URL，例如：

```
https://smart-phr-client-xxxxx-de.a.run.app
```

把 `APP_URL` 改成这个网址后 **再部署一次**（或到 Console 改环境变量）。

---

## 第四步：Google OAuth（若要用）

Google Cloud Console → OAuth 客户端 → 新增 redirect URI：

```
https://smart-phr-client-xxxxx-de.a.run.app/api/auth/google/callback
```

Cloud Run 环境变量加上：

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## 第五步：验证

```bash
curl https://你的CloudRun网址/api/health
```

预期：`{"ok":true,"db":"ok",...}`

浏览器：`https://你的CloudRun网址/login`  
Demo：`demo` / `demo1234`

---

## 环境变量对照（Cloud Run）

| 变量 | 值 |
|------|-----|
| `MYSQL_SOCKET_PATH` | `/cloudsql/PROJECT:us-central1:fhirdb` |
| `MYSQL_USER` | `phr_app` |
| `MYSQL_PASSWORD` | Cloud SQL 用户密码 |
| `MYSQL_DATABASE` | `FHIR_Appointment_Medicine` |
| `APP_URL` | Cloud Run 完整 HTTPS URL |
| `JWT_SECRET` | 随机强密钥 |

**不要**在 Cloud Run 设 `MYSQL_HOST=127.0.0.1`（那是本机 Docker 用法）。

---

## 与 GitHub Actions 的关系

| 步骤 | 谁做 |
|------|------|
| push → build → Docker 镜像 | GitHub Actions（已有） |
| 镜像存 GHCR | GitHub Actions（已有） |
| Cloud Run 拉镜像 + 启动 | 你手动 `gcloud run deploy`（首次） |
| 更新版本 | 再 push → Actions 打新镜像 → 再 `gcloud run deploy` |

以后可加 GitHub Actions job 自动 `gcloud run deploy`（CD 到 GCP）。

---

## 常见问题

| 问题 | 处理 |
|------|------|
| **failed to listen on PORT=3000** | 旧镜像启动时会先等 MySQL 60s。新版已自动跳过（检测 `K_SERVICE`）。或 Console 设容器指令 `node`、引数 `.output/server/index.mjs` |
| Cloud Run 502 | 看 Logs → 常是 DB 连不上 |
| db error | 检查 `MYSQL_SOCKET_PATH` 与 Cloud SQL 连接 |
| 表不存在 | 在 Cloud SQL Studio 跑 `init-db.sql` |
| 镜像拉不到 | GHCR 改 public 或 Cloud Shell `gcloud builds submit` |
| 启动超时 | 容器 → 启动探针 → 延长「初始延迟」至 60s |

---

## 履历写法

> Nuxt PHR Demo 部署于 **Google Cloud Run**，数据库 **Cloud SQL**，镜像由 **GitHub Actions** 构建推送 **GHCR**，CI/CD 自动化 build。
