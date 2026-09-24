import jwt from 'jsonwebtoken';
import { parseCookies, createError } from 'h3';

export function signToken(user) {
  if (!process.env.JWT_SECRET) {
    throw createError({ statusCode: 500, statusMessage: 'JWT_SECRET 未設定' });
  }
  return jwt.sign(
    { sub: String(user.id), username: user.username, name: user.display_name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function requireUser(event) {
  const token = parseCookies(event).token;
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: '請先登入' });
  }
  if (!process.env.JWT_SECRET) {
    throw createError({ statusCode: 500, statusMessage: 'JWT_SECRET 未設定' });
  }
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw createError({ statusCode: 403, statusMessage: '登入已過期，請重新登入' });
  }
}
