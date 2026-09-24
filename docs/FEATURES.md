# 功能完整度盤點（2026-09-24）

## 已完成功能 ✅

| 模組 | 功能 | 路由 / API | 狀態 |
|------|------|------------|------|
| 認證 | 帳密登入 | `/login`, `POST /api/auth/login` | ✅ |
| 認證 | Google OAuth 登入 | `/api/auth/google`, callback | ✅ |
| 認證 | 登出 | `POST /api/auth/logout` | ✅ |
| 認證 | 目前使用者 | `GET /api/auth/me` | ✅ |
| 首頁 | Dashboard + 近期預約 | `/appointment` | ✅ |
| 首頁 | Upcoming 預約 | `GET /api/appointments/upcoming` | ✅ |
| 預約 | 建立預約 | `/appointment/make`, `POST /api/appointments/save` | ✅ |
| 預約 | 依日期查詢 | `/appointment/view`, `POST /api/appointments` | ✅ |
| 預約 | 取消預約 | `DELETE /api/appointments/:id` | ✅ |
| 處方 | FHIR 藥單（依 Patient 過濾） | `/medication`, `GET /api/medication/list` | ✅ |
| 處方 | 朗讀 / 複製 / 一鍵預約 | 前端 | ✅ |
| 導覽 | 底部 Tab + 返回 | AppTabBar, AppBackButton | ✅ |

## 半成品 / 已知限制 ⚠️

| 項目 | 說明 |
|------|------|
| 取藥地點 | 前端 hardcode，未入庫 `pickup_locations` |
| 取消預約 | 硬刪除，無 `status=cancelled` 軟刪 |
| 註冊帳號 | 僅 demo 種子，無註冊 UI |
| FHIR 資料 | 公開 sandbox，非真實病歷 |
| Admin 後台 | 未實作 |
| 表名命名 | `Patients_Appointment.PatientID` 實為 `user_id` |

## 未實作（可選下一階段）❌

| 項目 | 說明 |
|------|------|
| SMART on FHIR Launch | 目前非 EHR 正式授權流程 |
| 用藥提醒 / 互動檢查 | 處方延伸功能 |
| 預約修改 | 僅能刪除後重建 |
| 多 FHIR Server | 每 user 固定一個 server URL |
| 稽核 log | 誰何時取消/建立預約 |

## 結論

**MVP 可演示：** 登入 → 看處方 → 預約 → 查 upcoming → 取消。  
**尚未達產品級：** 需正規化 DB、地點表、預約狀態、註冊與 Admin。

## 部署 / DevOps ✅（2026-09-24 新增）

| 項目 | 狀態 | 說明 |
|------|------|------|
| Dockerfile 多階段建置 | ✅ | `Dockerfile` |
| 生產 Compose（App+MySQL+Caddy） | ✅ | `docker-compose.prod.yml` |
| GitHub Actions CI | ✅ | `.github/workflows/ci.yml` |
| Docker 镜像推送 GHCR + 可选 VPS 部署 | ✅ | `.github/workflows/docker-deploy.yml` |
| 健康检查 | ✅ | `GET /api/health` |
| 部署文档 | ✅ | [DEPLOY.md](./DEPLOY.md)、[CI-CD.md](./CI-CD.md) |

詳細 DB 設計見 [DATABASE.md](./DATABASE.md)。
