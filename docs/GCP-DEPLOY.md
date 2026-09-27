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

## 第二步：构建镜像（推荐在 GCP 上 build，避免 GHCR 私有拉取失败）

**若 Cloud Run 报 `failed to listen on PORT=3000`，常见原因是 GHCR 私有镜像拉不到或启动脚本超时。**

在 **Cloud Shell** 执行（把密码换成你的 fhirdb 密码）：

```bash
git clone https://github.com/frankshicar/SMART_on_FHRI_PHR_client.git
cd SMART_on_FHRI_PHR_client
bash scripts/gcp-cloud-shell-deploy.sh '你的fhirdb密码'
```

脚本会：Cloud Build 打镜像 → 推 Artifact Registry → 部署 Cloud Run → 绑定 Cloud SQL → 设置 `APP_URL`。

### 备选：GHCR 镜像（仅当 Package 为 public 时）

```
ghcr.io/frankshicar/smart_on_fhri_phr_client:latest
```

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
DEMO_FHIR_PATIENT_ID=20830,\
GOOGLE_FHIR_PATIENT_ID=15121,\
FHIR_SERVER_URL=https://hapi.fhir.org/baseR4"
```

部署完成后会给你一个 URL，例如：

```
https://smart-phr-client-xxxxx-de.a.run.app
```

把 `APP_URL` 改成这个网址后 **再部署一次**（或到 Console 改环境变量）。

---

## 第四步：Google OAuth（若要用）

### 4.1 先取得 Cloud Run 网址

Cloud Shell：

```bash
gcloud run services describe smart-phr-client \
  --region asia-east1 \
  --format='value(status.url)'
```

记下输出，例如：`https://smart-phr-client-xxxxx-de.a.run.app`（以下称 `{APP_URL}`）。

GitHub Actions 部署后会自动设 `APP_URL`；若 OAuth 报错，确认 Cloud Run 环境变量里 `APP_URL` 与上面网址 **完全一致**（含 `https://`，末尾不要 `/`）。

### 4.2 到 Google Cloud Console 改 OAuth 客户端

1. 打开 [API 和服务 → 凭据](https://console.cloud.google.com/apis/credentials)
2. 确认项目是 `project-426dfc7e-533b-40af-a62`
3. 点你的 **OAuth 2.0 客户端 ID**（类型通常是「网页应用」）
4. 在 **已授权的 JavaScript 来源** 新增：

   ```
   {APP_URL}
   ```

   例：`https://smart-phr-client-xxxxx-de.a.run.app`

5. 在 **已授权的重定向 URI** 新增：

   ```
   {APP_URL}/api/auth/google/callback
   ```

   例：`https://smart-phr-client-xxxxx-de.a.run.app/api/auth/google/callback`

6. **保存**

本地开发若也要测，额外保留：

| 用途 | JavaScript 来源 | 重定向 URI |
|------|-----------------|------------|
| 本机 | `http://localhost:3000` | `http://localhost:3000/api/auth/google/callback` |
| Cloud Run | `{APP_URL}` | `{APP_URL}/api/auth/google/callback` |

### 4.3 把 Client ID / Secret 设进 Cloud Run

**方式 A（CI/CD，推荐）：** GitHub → Settings → Secrets → 新增：

| Secret | 值 |
|--------|-----|
| `GOOGLE_CLIENT_ID` | OAuth 客户端 ID |
| `GOOGLE_CLIENT_SECRET` | OAuth 客户端密钥 |

再 push 到 `main` 或 Re-run workflow，部署时会写入 Cloud Run。

**方式 B（手动）：** Cloud Console → Cloud Run → `smart-phr-client` → 修订版本 → 变量与密钥 → 新增 `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`。

### 4.4 常见错误

| 错误 | 原因 | 处理 |
|------|------|------|
| `redirect_uri_mismatch` | Google Console 的重定向 URI 与 App 不一致 | 必须完全是 `{APP_URL}/api/auth/google/callback` |
| `google_not_configured` | 未设 Client ID/Secret | 完成 4.3 |
| 登录后跳错域名 | `APP_URL` 还是 localhost | 更新 Cloud Run 的 `APP_URL` 为 Cloud Run 网址 |

App 使用的回调路径固定为 **`/api/auth/google/callback`**（见 `server/utils/google-oauth.js`）。

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
| push → build → Docker 镜像 | GitHub Actions |
| 镜像存 GHCR | GitHub Actions |
| 镜像同步到 Artifact Registry | GitHub Actions（`ENABLE_GCP_DEPLOY=true` 时） |
| Cloud Run 部署 + 绑定 Cloud SQL | GitHub Actions 自动 `gcloud run deploy` |

设置方式见 [CI-CD.md](./CI-CD.md) 的「如何启用自动部署到 Cloud Run」。

**首次**若 Cloud Run 还不存在，可先跑 Cloud Shell 脚本，或直接设好 GitHub Secrets/Variables 后 push 到 main，Actions 会创建/更新服务。

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
