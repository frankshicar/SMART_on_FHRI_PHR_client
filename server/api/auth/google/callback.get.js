import { defineEventHandler, sendRedirect, setCookie, createError, getQuery } from 'h3';
import { getGoogleOAuthClient } from '../../../utils/google-oauth.js';
import { getDbPool } from '../../../utils/db.js';
import { signToken } from '../../../utils/auth.js';

const DEFAULT_FHIR_PATIENT_ID = process.env.DEMO_FHIR_PATIENT_ID || '3935';

async function findOrCreateGoogleUser(profile) {
  const pool = getDbPool();
  const googleSub = profile.sub;
  const email = profile.email || `google_${googleSub}`;
  const displayName = profile.name || profile.email || 'Google 使用者';

  const [rows] = await pool.query(
    'SELECT id, username, display_name FROM users WHERE google_sub = ? OR username = ? LIMIT 1',
    [googleSub, email]
  );

  if (rows[0]) {
    await pool.query(
      'UPDATE users SET google_sub = ?, display_name = ? WHERE id = ?',
      [googleSub, displayName, rows[0].id]
    );
    return { ...rows[0], display_name: displayName };
  }

  const [result] = await pool.query(
    `INSERT INTO users (username, password_hash, display_name, google_sub, fhir_patient_id)
     VALUES (?, NULL, ?, ?, ?)`,
    [email, displayName, googleSub, DEFAULT_FHIR_PATIENT_ID]
  );

  return {
    id: result.insertId,
    username: email,
    display_name: displayName,
  };
}

async function getGoogleProfile(client, tokens) {
  if (tokens.id_token) {
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const profile = ticket.getPayload();
    if (profile?.sub) return profile;
  }

  const res = await client.request({ url: 'https://www.googleapis.com/oauth2/v3/userinfo' });
  const data = res.data || {};
  const sub = data.sub || data.id;
  if (!sub) {
    throw createError({ statusCode: 400, statusMessage: '無法取得 Google 使用者資訊' });
  }
  return { sub, email: data.email, name: data.name };
}

function isDbUnavailable(err) {
  const code = err?.code || err?.errno;
  const msg = String(err?.message || '');
  return code === 'ECONNREFUSED' || code === 'ER_ACCESS_DENIED_ERROR' || msg.includes('ECONNREFUSED');
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const code = query.code;
  const error = query.error;

  if (error) {
    return sendRedirect(event, `/login?error=${encodeURIComponent(String(error))}`);
  }

  if (!code) {
    throw createError({ statusCode: 400, statusMessage: '缺少 Google 授權 code' });
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return sendRedirect(event, '/login?error=google_not_configured');
  }

  try {
    const client = getGoogleOAuthClient();
    const { tokens } = await client.getToken(String(code));
    client.setCredentials(tokens);

    const profile = await getGoogleProfile(client, tokens);
    const user = await findOrCreateGoogleUser(profile);
    const token = signToken(user);

    setCookie(event, 'token', token, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return sendRedirect(event, '/appointment');
  } catch (err) {
    console.error('Google OAuth callback error:', err?.message || err);
    if (err.statusCode) throw err;
    if (isDbUnavailable(err)) {
      return sendRedirect(event, '/login?error=db_unavailable');
    }
    return sendRedirect(event, '/login?error=google_auth_failed');
  }
});
