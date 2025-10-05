export const environment = {
  production: false,
  // TODO: Update this URL after deploying API Gateway
  apiUrl: 'https://your-api-gateway-url.execute-api.eu-central-1.amazonaws.com/prod',
  cognito: {
    region: 'eu-central-1',
    userPoolId: 'eu-central-1_QEBbXGvw4',
    clientId: 'ugt1cvik5idpv0i3l0ds675so',
  },
} as const;
