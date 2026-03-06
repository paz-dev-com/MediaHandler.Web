export const environment = {
  production: true,
  apiBaseUrl: '{productionApiUrl}/api/v1',
  okta: {
    issuer: 'https://{yourOktaDomain}/oauth2/default',
    clientId: '{yourClientId}',
    redirectUri: '{productionUrl}/auth/callback',
    scopes: ['openid', 'profile', 'email'],
  },
};
