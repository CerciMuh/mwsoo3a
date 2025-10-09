# Admin Role Setup Guide

## Overview

The admin role is used to control access to administrative features like managing degrees and courses for all universities.

## Required Cognito Custom Attribute

You need to add a `custom:role` attribute to your Cognito User Pool to support admin functionality.

---

## Step 1: Add Custom Attribute to Cognito User Pool

### AWS Console Method (Recommended)

1. Open [AWS Cognito Console](https://eu-central-1.console.aws.amazon.com/cognito/v2/idp/user-pools)
2. Select User Pool: `eu-central-1_QEBbXGvw4`
3. Go to **"Sign-up experience"** tab → **"Custom attributes"**
4. Click **"Add custom attribute"**
5. Configure:
   - **Attribute name:** `role`
   - **Type:** String
   - **Min length:** 1
   - **Max length:** 32
   - **Mutable:** Yes (allow updates)
6. Click **"Save changes"**

### CLI Method (Alternative)

⚠️ **Note:** You cannot add custom attributes to existing user pools via CLI. This must be done through the AWS Console.

---

## Step 2: Assign Admin Role to Your User

After adding the `custom:role` attribute, assign it to your user account:

### PowerShell Command

```powershell
aws cognito-idp admin-update-user-attributes `
  --user-pool-id eu-central-1_QEBbXGvw4 `
  --username YOUR_EMAIL@example.com `
  --user-attributes Name=custom:role,Value=admin `
  --profile mwsoo3a `
  --region eu-central-1
```

Replace `YOUR_EMAIL@example.com` with your actual email address.

### Verify Assignment

```powershell
aws cognito-idp admin-get-user `
  --user-pool-id eu-central-1_QEBbXGvw4 `
  --username YOUR_EMAIL@example.com `
  --profile mwsoo3a `
  --region eu-central-1
```

You should see:
```json
{
  "Name": "custom:role",
  "Value": "admin"
}
```

---

## Step 3: Frontend Integration

The frontend will check for the admin role in the JWT token:

```typescript
// auth.service.ts
isAdmin(): boolean {
  const currentSession = this.session();
  if (!currentSession || !currentSession.isValid()) {
    return false;
  }

  try {
    const payload = currentSession.getIdToken().decodePayload();
    return payload['custom:role'] === 'admin';
  } catch (error) {
    console.error('Failed to decode ID token:', error);
    return false;
  }
}
```

---

## Step 4: Backend Authorization

Lambda functions will verify admin role from the JWT token:

```typescript
// middleware/admin.middleware.ts
export async function requireAdmin(event: APIGatewayProxyEvent) {
  const token = extractToken(event);
  const decoded = verifyJWT(token);
  
  if (decoded['custom:role'] !== 'admin') {
    throw new UnauthorizedError('Admin access required');
  }
  
  return {
    userId: decoded.sub,
    email: decoded.email,
    role: decoded['custom:role']
  };
}
```

---

## Security Considerations

1. **Limited Admin Accounts:** Only assign admin role to trusted users
2. **Token Verification:** Always verify JWT signature on backend
3. **Audit Logging:** Log all admin actions (who created/modified what)
4. **No Client-Side Trust:** Never trust frontend claims - always verify on backend

---

## Future Enhancements

- **Multi-level roles:** `admin`, `moderator`, `student`
- **University-specific admins:** Admins who can only manage their own university
- **Permissions system:** Granular permissions (can_manage_degrees, can_manage_courses, etc.)

---

## Troubleshooting

### "Attribute does not exist" Error

- Make sure you added `custom:role` in Cognito Console first
- Attribute name is case-sensitive: must be exactly `role` (not `Role` or `ROLE`)

### Role Not Appearing in Token

- Log out and log back in to get fresh token with new attribute
- Clear browser localStorage
- Check token payload in [jwt.io](https://jwt.io)

### "User does not exist" Error

- Double-check the email/username is correct
- Ensure user is confirmed (not in UNCONFIRMED state)
