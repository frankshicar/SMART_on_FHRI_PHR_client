#!/bin/bash
# 在 Google Cloud Shell 执行（浏览器 Console 右上角 >_）
# 用法：bash scripts/gcp-cloud-shell-deploy.sh '你的fhirdb密码'

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-project-426dfc7e-533b-40af-a62}"
REGION="asia-east1"
SERVICE="smart-phr-client"
SQL_INSTANCE="${PROJECT_ID}:${REGION}:fhirdb"
DB_PASSWORD="${1:?请传入 fhirdb 密码，例如: bash scripts/gcp-cloud-shell-deploy.sh 'your-password'}"

gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

gcloud artifacts repositories describe smart-phr --location="$REGION" >/dev/null 2>&1 \
  || gcloud artifacts repositories create smart-phr \
    --repository-format=docker \
    --location="$REGION"

echo "Building Docker image on Cloud Build..."
gcloud builds submit --config cloudbuild.yaml .

IMAGE="asia-east1-docker.pkg.dev/${PROJECT_ID}/smart-phr/app:latest"

echo "Deploying to Cloud Run..."
gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --cpu-boost \
  --add-cloudsql-instances "$SQL_INSTANCE" \
  --set-env-vars "^|^NODE_ENV=production|JWT_SECRET=phr-demo-jwt-$(date +%s)|MYSQL_SOCKET_PATH=/cloudsql/${SQL_INSTANCE}|MYSQL_USER=fhirdb|MYSQL_PASSWORD=${DB_PASSWORD}|MYSQL_DATABASE=FHIR_Appointment_Medicine|DEMO_FHIR_PATIENT_ID=3935|FHIR_SERVER_URL=https://hapi.fhir.org/baseR4"

URL="$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')"
gcloud run services update "$SERVICE" --region "$REGION" \
  --update-env-vars "APP_URL=${URL}"

echo ""
echo "Done! Test:"
echo "  ${URL}/api/health"
echo "  ${URL}/login  (demo / demo1234)"
