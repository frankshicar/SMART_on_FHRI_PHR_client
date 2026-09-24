import { defineEventHandler, deleteCookie } from 'h3';

export default defineEventHandler(async (event) => {
  deleteCookie(event, 'token', { path: '/' });
  return { success: true };
});
