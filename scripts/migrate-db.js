import mysql from 'mysql2/promise';
import { getMysqlConfig } from './db-config.mjs';

const pool = mysql.createPool(getMysqlConfig());

try {
  await pool.query(`
    ALTER TABLE Patients_Appointment
    MODIFY Prescription TEXT NOT NULL
  `);
} catch (e) {
  console.warn('Prescription TEXT:', e.message);
}

try {
  const [cols] = await pool.query(
    "SHOW COLUMNS FROM Patients_Appointment LIKE 'prescription_id'"
  );
  if (!cols.length) {
    await pool.query(`
      ALTER TABLE Patients_Appointment
      ADD COLUMN prescription_id VARCHAR(128) NULL AFTER Prescription
    `);
  }
} catch (e) {
  console.warn('prescription_id column:', e.message);
}

try {
  const [cols] = await pool.query("SHOW COLUMNS FROM users LIKE 'google_sub'");
  if (!cols.length) {
    await pool.query(
      'ALTER TABLE users ADD COLUMN google_sub VARCHAR(128) NULL UNIQUE AFTER fhir_patient_id'
    );
  }
} catch (e) {
  console.warn('google_sub column:', e.message);
}

try {
  await pool.query('ALTER TABLE users MODIFY password_hash VARCHAR(255) NULL');
} catch (e) {
  console.warn('password_hash nullable:', e.message);
}

console.log('Database migration complete.');
await pool.end();
