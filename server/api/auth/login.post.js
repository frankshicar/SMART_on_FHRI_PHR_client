import { defineEventHandler, readBody, setCookie, createError } from 'h3';
import bcrypt from 'bcryptjs';
import { getDbPool } from '../../utils/db.js';
import { signToken } from '../../utils/auth.js';

export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event);

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: '請輸入帳號與密碼' });
  }

  try {
    const pool = getDbPool();
    const [rows] = await pool.query(
      'SELECT id, username, password_hash, display_name FROM users WHERE username = ? LIMIT 1',
      [username]
    );

    const user = rows[0];
    if (!user?.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
      throw createError({ statusCode: 401, statusMessage: '帳號或密碼錯誤' });
    }

    const token = signToken(user);
    setCookie(event, 'token', token, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return {
      id: user.id,
      username: user.username,
      name: user.display_name,
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: error.code === 'ECONNREFUSED' ? 503 : 500,
      statusMessage: error.code === 'ECONNREFUSED'
        ? 'MySQL 未啟動，請執行 docker compose up -d'
        : error.message,
    });
  }
});
