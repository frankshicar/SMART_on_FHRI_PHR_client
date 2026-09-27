#!/bin/bash
# 在 Google Cloud Shell 执行：GitHub Actions 用 Workload Identity 连 GCP（无需 JSON 密钥）
# 用法：bash scripts/gcp-setup-github-actions-wif.sh

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-project-426dfc7e-533b-40af-a62}"
GITHUB_REPO="${GITHUB_REPO:-frankshicar/SMART_on_FHRI_PHR_client}"
POOL_ID="github"
PROVIDER_ID="github"
SA_NAME="github-actions-deploy"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud config set project "$PROJECT_ID"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com

REGION="${GCP_REGION:-asia-east1}"
gcloud artifacts repositories describe smart-phr \
  --location="$REGION" \
  --project="$PROJECT_ID" >/dev/null 2>&1 \
  || gcloud artifacts repositories create smart-phr \
    --repository-format=docker \
    --location="$REGION" \
    --project="$PROJECT_ID"

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

if ! gcloud iam workload-identity-pools describe "$POOL_ID" \
  --location=global --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools create "$POOL_ID" \
    --project="$PROJECT_ID" \
    --location=global \
    --display-name="GitHub Actions"
fi

if ! gcloud iam workload-identity-pools providers describe "$PROVIDER_ID" \
  --location=global \
  --workload-identity-pool="$POOL_ID" \
  --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID" \
    --project="$PROJECT_ID" \
    --location=global \
    --workload-identity-pool="$POOL_ID" \
    --display-name="GitHub" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
    --attribute-condition="assertion.repository_owner == 'frankshicar'"
fi

gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --project="$PROJECT_ID" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/attribute.repository/${GITHUB_REPO}" \
  --quiet

WIF_PROVIDER="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/providers/${PROVIDER_ID}"

echo ""
echo "=== 完成（Workload Identity，无需 JSON 密钥）==="
echo ""
echo "到 GitHub → Settings → Secrets and variables → Actions → Variables 新增："
echo ""
echo "  GCP_WORKLOAD_IDENTITY_PROVIDER"
echo "  ${WIF_PROVIDER}"
echo ""
echo "  GCP_SERVICE_ACCOUNT"
echo "  ${SA_EMAIL}"
echo ""
echo "（其余 Secrets / Variables 见 docs/CI-CD.md）"
