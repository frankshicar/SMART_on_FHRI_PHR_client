-- 已部署的 Cloud SQL：把 demo 用户改绑有处方的 FHIR Patient
USE FHIR_Appointment_Medicine;

UPDATE users
SET fhir_patient_id = '15121'
WHERE username = 'demo';
