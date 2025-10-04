export const environment = {
  production: false,
  cognito: {
    region: 'eu-central-1',                // <-- your region
    userPoolId: 'eu-central-1_XXXXXXX',    // <-- your User Pool ID
    clientId: 'XXXXXXXXXXXXXXXXXXXXXX',    // <-- App client ID (no secret)
  }
};
