import { defineEventHandler, sendRedirect } from 'h3';
import { getGoogleOAuthClient } from '../../../utils/google-oauth.js';

export default defineEventHandler(async (event) => {
  const client = getGoogleOAuthClient();
  const authorizeUrl = client.generateAuthUrl({
    access_type: 'online',
    scope: ['openid', 'email', 'profile'],
    prompt: 'select_account',
  });
  return sendRedirect(event, authorizeUrl);
});
