# CI/CD 说明

本项目使用 **GitHub Actions** 做持续集成 / 持续部署（CI/CD）。

---

## CI/CD 是什么？

| 缩写 | 中文 | 在本项目做什么 |
|------|------|----------------|
| **CI**（Continuous Integration） | 持续集成 | 每次 push / PR 自动 **build**，确认代码能编译 |
| **CD**（Continuous Deployment） | 持续部署 | push 到 `main` 后自动 **构建 Docker 镜像** 并（可选）**部署到 VPS** |

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

**Job 2：`deploy`（可选）**

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

> 使用 **GitHub Actions** 实现 CI/CD：PR 自动构建验证、main 分支自动构建 **Docker** 镜像并推送 **GHCR**，可选 **SSH** 零停机部署至 **VPS**（Caddy + HTTPS）。

---

## 常见问题

**Q: push 后 Actions 失败？**  
到 GitHub → Actions 页看 log，常见是 `npm run build` 失败。

**Q: 镜像 push 成功但网站没更新？**  
检查 `ENABLE_VPS_DEPLOY` 是否为 `true`，以及 VPS Secrets 是否正确。

**Q: 这和 GitHub Pages 有什么关系？**  
无关。GitHub Pages 只能放静态网站，本 App 需要 Node + MySQL，见 [GITHUB-PAGES.md](./GITHUB-PAGES.md)。
