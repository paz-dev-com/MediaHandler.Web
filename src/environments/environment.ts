export const environment = {
  production: false,
  apiBaseUrl: 'https://localhost:7001/api/v1',
  okta: {
    issuer: 'https://{yourOktaDomain}/oauth2/default',
    clientId: '{yourClientId}',
    redirectUri: 'http://localhost:4200/auth/callback',
    scopes: ['openid', 'profile', 'email'],
  },
};
