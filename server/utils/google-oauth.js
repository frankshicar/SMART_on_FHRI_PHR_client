import { OAuth2Client } from 'google-auth-library';
import { createError } from 'h3';

export function getGoogleOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  if (!clientId || !clientSecret) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Google OAuth 未設定，請在 .env 填入 GOOGLE_CLIENT_ID 與 GOOGLE_CLIENT_SECRET',
    });
  }

  return new OAuth2Client({
    clientId,
    clientSecret,
    redirectUri: `${appUrl}/api/auth/google/callback`,
  });
}
