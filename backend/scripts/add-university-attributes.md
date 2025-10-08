# Add University Custom Attributes to Cognito User Pool

**⚠️ IMPORTANT**: Custom attributes cannot be added via AWS CLI to existing user pools. You must use the AWS Console.

## Steps to Add Custom Attributes

1. Go to [AWS Cognito Console](https://eu-central-1.console.aws.amazon.com/cognito/v2/idp/user-pools)
2. Select User Pool: `eu-central-1_QEBbXGvw4`
3. Go to **"Sign-up experience"** tab
4. Scroll to **"Custom attributes"**
5. Click **"Add custom attribute"**

### Add These 3 Attributes:

#### Attribute 1: University Name
- **Name**: `universityName`
- **Type**: `String`
- **Min length**: `1`
- **Max length**: `256`
- **Mutable**: `Yes` (users can update)

#### Attribute 2: University Domain
- **Name**: `universityDomain`
- **Type**: `String`
- **Min length**: `1`
- **Max length**: `128`
- **Mutable**: `No` (prevent tampering)

#### Attribute 3: University Country
- **Name**: `universityCountry`
- **Type**: `String`
- **Min length**: `1`
- **Max length**: `128`
- **Mutable**: `Yes`

## After Adding Attributes

Run the deployment script to test:
```bash
npm run deploy
```

## Testing

Test user registration:
```powershell
$body = @{
  email = "test@student.manchester.ac.uk"
  password = "TestPass123!"
  name = "Test Student"
  birthdate = "2000-01-01"
  phoneNumber = "+441234567890"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://abhyzb0eoe.execute-api.eu-central-1.amazonaws.com/prod/auth/register" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

## Verify Attributes

Check the created user:
```bash
aws cognito-idp admin-get-user \
  --user-pool-id eu-central-1_QEBbXGvw4 \
  --username "test@student.manchester.ac.uk" \
  --profile mwsoo3a \
  --region eu-central-1
```

You should see:
```json
{
  "Name": "custom:universityName",
  "Value": "University of Manchester"
},
{
  "Name": "custom:universityDomain",
  "Value": "manchester.ac.uk"
},
{
  "Name": "custom:universityCountry",
  "Value": "United Kingdom"
}
```
