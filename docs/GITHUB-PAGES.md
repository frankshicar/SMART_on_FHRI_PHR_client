# 为什么不能用 GitHub Pages（github.io）？

很多人会把 Demo 放在 `username.github.io`，但 **本项目不适合 GitHub Pages**。

---

## GitHub Pages 能做什么

- 只托管 **静态文件**（HTML / CSS / JS）
- 没有 Node.js 服务器
- 没有数据库
- 不能跑 API

---

## 本项目需要什么

| 需求 | GitHub Pages | 本项目 |
|------|--------------|--------|
| Nuxt SSR 服务器 | ❌ | ✅ |
| `/api/auth/login` 等 API | ❌ | ✅ |
| MySQL 数据库 | ❌ | ✅ |
| Google OAuth callback | ❌ | ✅ |
| JWT Cookie 登入 | ❌ | ✅ |

若强行 `nuxt generate` 静态化：

- 所有 `server/api/*` **全部失效**
- 登入、预约、处方 **都无法使用**
- 只剩空壳 UI

---

## 推荐替代方案（可写进履历）

| 方案 | 外网 Demo | Docker | CI/CD | 成本 |
|------|-----------|--------|-------|------|
| **VPS + Docker Compose**（推荐） | ✅ | ✅ | ✅ GitHub Actions | ~$5/月 |
| Railway / Render | ✅ | ✅ | ✅ 内建 | 有免费额度 |
| GitHub Pages | ✅ | ❌ | ❌ | 免费但**不适用** |

---

## 可以怎么用 github.io？

若仍想要 `github.io` 域名，可以：

1. **主 Demo** 放在 VPS（Docker + HTTPS）
2. **GitHub Pages** 只放一页静态介绍，链接到真实 Demo

例如 Pages 内容：

```markdown
# SMART PHR Demo
Live Demo: https://phr.yourdomain.com
GitHub: https://github.com/frankshicar/SMART_on_FHRI_PHR_client
```

这样履历可写两个链接：GitHub 仓库 + Live Demo。

---

## 结论

| 目标 | 建议 |
|------|------|
| 完整 PHR Demo（登入/处方/预约） | **Docker + VPS**（见 [DEPLOY.md](./DEPLOY.md)） |
| 仅展示项目介绍页 | 可用 GitHub Pages 作跳转页 |
| 展现 Docker + CI/CD | **GitHub Actions + GHCR + VPS**（见 [CI-CD.md](./CI-CD.md)） |
