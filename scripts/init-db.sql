CREATE DATABASE IF NOT EXISTS FHIR_Appointment_Medicine
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE FHIR_Appointment_Medicine;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  display_name VARCHAR(128) NOT NULL,
  fhir_patient_id VARCHAR(128) NULL COMMENT 'FHIR Patient ID e.g. 3935',
  google_sub VARCHAR(128) NULL UNIQUE COMMENT 'Google OAuth sub',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Patients_Appointment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  PatientID VARCHAR(255) NOT NULL,
  Prescription TEXT NOT NULL,
  prescription_id VARCHAR(128) NULL,
  AppointmentDate DATETIME NOT NULL,
  location VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_patient_date (PatientID, AppointmentDate)
);

-- Demo account: demo / demo1234
-- display_name is set via scripts/seed-demo-user.js to avoid Windows Docker UTF-8 issues
INSERT INTO users (username, password_hash, display_name, fhir_patient_id)
VALUES (
  'demo',
  '$2b$10$L1VIjwZdGYma9OhKepgn4ePrxGOrlX4JGBsoa1P.poy0/8r/oBgve',
  'Demo',
  '3935'
) ON DUPLICATE KEY UPDATE username = username;
