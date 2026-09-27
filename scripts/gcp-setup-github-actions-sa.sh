#!/bin/bash
# 在 Google Cloud Shell 执行：建立 GitHub Actions 部署 Cloud Run 用的服务账号
# 用法：bash scripts/gcp-setup-github-actions-sa.sh

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-project-426dfc7e-533b-40af-a62}"
SA_NAME="github-actions-deploy"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
KEY_FILE="github-actions-key.json"

gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com artifactregistry.googleapis.com

if ! gcloud iam service-accounts describe "$SA_EMAIL" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$SA_NAME" \
    --display-name="GitHub Actions Cloud Run deploy"
fi

for ROLE in roles/run.admin roles/artifactregistry.writer roles/iam.serviceAccountUser; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="$ROLE" \
    --quiet
done

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/cloudsql.client" \
  --quiet

gcloud iam service-accounts keys create "$KEY_FILE" --iam-account="$SA_EMAIL"

echo ""
echo "=== 完成 ==="
echo "1. 复制下面 JSON 全文 → GitHub Secret: GCP_SA_KEY"
echo "2. 在 GitHub Variables 设 ENABLE_GCP_DEPLOY=true 及其他变量（见 docs/CI-CD.md）"
echo "3. push main 后 Actions 会自动 deploy 到 Cloud Run"
echo ""
cat "$KEY_FILE"
