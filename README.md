# SMART on FHIR PHR Client（病患端 Demo）

Nuxt 3 病患端个人健康记录（PHR）原型：登入 → 查看 FHIR 处方 → 预约取药 → 管理预约。

> **Live Demo：** 部署后填入你的 URL（见 [docs/DEPLOY.md](./docs/DEPLOY.md)）  
> **仓库：** https://github.com/frankshicar/SMART_on_FHRI_PHR_client

---

## 功能概览

| 模块 | 说明 |
|------|------|
| 登入 | Demo 帐密（`demo` / `demo1234`）或 Google OAuth |
| 处方 | 从 hapi.fhir.org 读取 `MedicationRequest`（Demo 绑定 Patient/3935） |
| 预约 | 建立 / 查询 / 取消取药预约（MySQL） |
| 导航 | 底部 Tab + 返回键 |

详细功能清单：[docs/FEATURES.md](./docs/FEATURES.md)

---

## 技术栈

- **前端：** Nuxt 3、Vue 3
- **后端：** Nitro Server API、JWT Cookie
- **数据库：** MySQL 8（Docker）
- **FHIR：** HAPI FHIR 公开 Sandbox（`baseR4`）
- **部署：** Docker Compose、Caddy HTTPS、GitHub Actions CI/CD

---

## 本地开发

### 前置

- Node.js 20+
- Docker Desktop

### 快速开始

```powershell
git clone https://github.com/frankshicar/SMART_on_FHRI_PHR_client.git
cd SMART_on_FHRI_PHR_client

cp .env.example .env          # Windows: copy .env.example .env
# 编辑 .env，填入 JWT_SECRET、Google OAuth（可选）

npm install
npm run db:up                 # 启动 MySQL + migrate + seed
npm run dev                   # http://localhost:3000
```

Demo 登入：`demo` / `demo1234`

---

## 生产部署（Docker + 外网）

```bash
cp .env.production.example .env
# 编辑 APP_URL、JWT_SECRET、MYSQL_PASSWORD、APP_DOMAIN

docker compose -f docker-compose.prod.yml up -d --build
```

完整步骤：[docs/DEPLOY.md](./docs/DEPLOY.md)

---

## CI/CD

| Workflow | 说明 |
|----------|------|
| `ci.yml` | PR / push 自动 `npm run build` |
| `docker-deploy.yml` | push `main` → 构建 Docker 镜像 → 推送 GHCR →（可选）SSH 部署 VPS |

说明文档：[docs/CI-CD.md](./docs/CI-CD.md)

---

## 为什么不用 GitHub Pages？

本 App 需要 Node.js 服务器 + MySQL + API，**无法**部署在 `github.io` 静态托管。  
说明：[docs/GITHUB-PAGES.md](./docs/GITHUB-PAGES.md)

---

## 项目结构

```
pages/              # 登录、首页、预约、处方
server/api/         # Auth、Appointments、Medication API
server/utils/       # DB、JWT、FHIR、Google OAuth
components/         # AppTabBar、AppBackButton
scripts/            # DB init、migrate、seed
docs/               # 功能、数据库、部署、CI/CD 文档
docker-compose.yml          # 开发：仅 MySQL
docker-compose.prod.yml     # 生产：App + MySQL + Caddy
Dockerfile
.github/workflows/  # CI/CD
```

---

## 文档索引

| 文件 | 内容 |
|------|------|
| [docs/FEATURES.md](./docs/FEATURES.md) | 功能完整度 |
| [docs/DATABASE.md](./docs/DATABASE.md) | 数据库设计 |
| [docs/DEPLOY.md](./docs/DEPLOY.md) | VPS / Docker 部署 |
| [docs/CI-CD.md](./docs/CI-CD.md) | GitHub Actions 说明 |
| [docs/GITHUB-PAGES.md](./docs/GITHUB-PAGES.md) | 为何不用 github.io |

---

## Demo 演示路径（5 分钟）

1. 登入（Demo 或 Google）
2. 首页 → 查看近期预约
3. **处方** Tab → 展开药单 → 一键预约
4. **我的预约** Tab → 查询日期 → 取消预约

---

## 授权

Private demo project.
