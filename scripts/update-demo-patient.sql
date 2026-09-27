-- 已部署 Cloud SQL：分开 demo 与 Google 登录绑定的 FHIR Patient
USE FHIR_Appointment_Medicine;

-- demo 账号 → Patient/20830（hapi 上 6 笔 active 处方）
UPDATE users
SET fhir_patient_id = '20830'
WHERE username = 'demo';

-- Google 登录用户 → Patient/15121（新 Google 用户默认亦同）
UPDATE users
SET fhir_patient_id = '15121'
WHERE google_sub IS NOT NULL;
