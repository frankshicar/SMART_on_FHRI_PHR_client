# CI/CD 说明

本项目使用 **GitHub Actions** 做持续集成 / 持续部署（CI/CD）。

---

## CI/CD 是什么？

| 缩写 | 中文 | 在本项目做什么 |
|------|------|----------------|
| **CI**（Continuous Integration） | 持续集成 | 每次 push / PR 自动 **build**，确认代码能编译 |
| **CD**（Continuous Deployment） | 持续部署 | push 到 `main` 后自动 **构建 Docker 镜像**，并（可选）**部署到 Cloud Run 或 VPS** |

**好处（可写进履历）：**

- 不用手动 SSH 上传代码
- 每次合并 main 自动产生可部署的 Docker 镜像
- 减少「在我电脑能跑、上線就坏」的风险

---

## 本仓库的两个 Workflow

### 1. `ci.yml` — 构建检查

**触发：** PR、push 到 `main`

**步骤：**

1. Checkout 代码
2. `npm ci`
3. `npm run build`（Nuxt 生产构建）

**目的：** 确保 TypeScript/Vue/Nitro 能成功编译。

---

### 2. `docker-deploy.yml` — Docker 镜像 + 可选部署

**触发：** push 到 `main`、或手动 `workflow_dispatch`

**Job 1：`build-and-push`**

1. 构建 Docker 镜像（多阶段 Dockerfile）
2. 推送到 **GitHub Container Registry（GHCR）**  
   镜像地址：`ghcr.io/frankshicar/smart_on_fhri_phr_client:latest`

**Job 2：`deploy-cloud-run`（可选，推荐）**

仅当仓库 Variable `ENABLE_GCP_DEPLOY=true` 时执行：

1. 从 GHCR 拉取刚 build 的镜像
2. 推送到 **Google Artifact Registry**
3. `gcloud run deploy` 更新 Cloud Run（绑定 Cloud SQL）
4. 自动设置 `APP_URL`

**Job 3：`deploy`（可选）**

仅当仓库 Variable `ENABLE_VPS_DEPLOY=true` 时执行：

1. SSH 连到 VPS
2. `docker compose pull` + `up -d`
3. 外网 Demo 自动更新

---

## 流程图

```
开发者 push 到 main
        │
        ▼
┌───────────────────┐
│  GitHub Actions   │
│  ci.yml: npm build│
└─────────┬─────────┘
          │
          ▼
┌───────────────────────────┐
│  docker-deploy.yml        │
│  docker build → push GHCR │
└─────────┬─────────────────┘
          │
          ▼（若 ENABLE_GCP_DEPLOY=true）
┌───────────────────────────┐
│  GHCR → Artifact Registry │
│  gcloud run deploy        │
└─────────┬─────────────────┘
          │
          ▼
   https://xxx.run.app

          ▼（若 ENABLE_VPS_DEPLOY=true）
┌───────────────────────────┐
│  SSH → VPS                │
│  docker compose up -d     │
└─────────┬─────────────────┘
          │
          ▼
   https://你的域名.com
```

---

## 如何启用自动部署到 Cloud Run（推荐）

### 1. 在 GCP 建立 GitHub Actions 用的服务账号

在 [Cloud Shell](https://shell.cloud.google.com) 执行：

```bash
git clone https://github.com/frankshicar/SMART_on_FHRI_PHR_client.git
cd SMART_on_FHRI_PHR_client
bash scripts/gcp-setup-github-actions-sa.sh
```

脚本会：启用 API、建立 `github-actions-deploy` 服务账号、授予 Cloud Run 运行时连 Cloud SQL 的权限、输出 `github-actions-key.json`。

复制输出的 JSON 全文，稍后要贴到 GitHub Secret `GCP_SA_KEY`。

### 2. GitHub Secrets（Settings → Secrets and variables → Actions）

| Name | 说明 |
|------|------|
| `GCP_SA_KEY` | 上一步 `github-actions-key.json` 的完整 JSON |
| `GCP_MYSQL_PASSWORD` | Cloud SQL 用户 `fhirdb` 的密码 |
| `GCP_JWT_SECRET` | 随机长字串（生产环境固定，不要每次改） |
| `GOOGLE_CLIENT_ID` | （可选）Google OAuth |
| `GOOGLE_CLIENT_SECRET` | （可选）Google OAuth |

### 3. GitHub Variables（同页 Variables 分栏）

| Name | 示例值 |
|------|--------|
| `ENABLE_GCP_DEPLOY` | `true` |
| `GCP_PROJECT_ID` | `project-426dfc7e-533b-40af-a62` |
| `GCP_REGION` | `asia-east1` |
| `GCP_SERVICE` | `smart-phr-client` |
| `GCP_SQL_INSTANCE` | `project-426dfc7e-533b-40af-a62:asia-east1:fhirdb` |
| `GCP_MYSQL_USER` | `fhirdb` |
| `GCP_MYSQL_DATABASE` | `FHIR_Appointment_Medicine` |

### 4. 首次验证

1. push 到 `main`（或 Actions 页手动 Run workflow）
2. 打开 **Actions → Docker Build & Deploy**
3. 确认 `build-and-push` 与 `deploy-cloud-run` 都成功
4. 访问 `https://你的CloudRun网址/api/health`，应看到 `"db":"ok"`

之后每次 merge 到 `main`，外网 Demo 会自动更新，无需再跑 Cloud Shell 脚本。

---

## 如何启用自动部署到 VPS

在 GitHub 仓库 **Settings → Secrets and variables → Actions** 设置：

### Secrets（敏感）

| Name | 说明 |
|------|------|
| `VPS_SSH_KEY` | VPS 的 SSH 私钥 |
| `GHCR_PAT` | GitHub PAT（`read:packages`），VPS 拉私有镜像时用 |

### Variables（非敏感）

| Name | 示例 | 说明 |
|------|------|------|
| `ENABLE_VPS_DEPLOY` | `true` | 开启 deploy job |
| `VPS_HOST` | `123.45.67.89` | VPS IP 或域名 |
| `VPS_USER` | `root` | SSH 用户 |
| `VPS_APP_DIR` | `/opt/smart-phr-client` | 项目目录 |

VPS 上需先依 [DEPLOY.md](./DEPLOY.md) 完成首次手动部署。

---

## 履历怎么写

> 使用 **GitHub Actions** 实现 CI/CD：PR 自动构建验证、main 分支自动构建 **Docker** 镜像并推送 **GHCR** / **Artifact Registry**，自动部署至 **Google Cloud Run + Cloud SQL**（或可选 **SSH** 部署 **VPS**）。

---

## 常见问题

**Q: push 后 Actions 失败？**  
到 GitHub → Actions 页看 log，常见是 `npm run build` 失败。

**Q: 镜像 push 成功但网站没更新？**  
检查 `ENABLE_VPS_DEPLOY` 是否为 `true`，以及 VPS Secrets 是否正确。

**Q: 这和 GitHub Pages 有什么关系？**  
无关。GitHub Pages 只能放静态网站，本 App 需要 Node + MySQL，见 [GITHUB-PAGES.md](./GITHUB-PAGES.md)。
