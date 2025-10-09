# DynamoDB Setup Scripts

Scripts to create and manage DynamoDB tables for the Encyclopedia feature.

## Scripts

### create-tables.ps1
Creates all three encyclopedia tables:
- UniversityDegrees
- DegreeCourses
- CourseNotes

**Usage:**
```powershell
.\create-tables.ps1
```

**With custom profile/region:**
```powershell
.\create-tables.ps1 -Profile myprofile -Region us-east-1
```

### verify-tables.ps1
Verifies that all tables exist and are ACTIVE.

**Usage:**
```powershell
.\verify-tables.ps1
```

## Setup Instructions

1. **Create tables:**
   ```powershell
   cd backend/scripts
   .\create-tables.ps1
   ```

2. **Wait ~30 seconds for tables to become ACTIVE**

3. **Verify tables:**
   ```powershell
   .\verify-tables.ps1
   ```

4. **Expected output:**
   ```
   Checking UniversityDegrees... ✓ ACTIVE
   Checking DegreeCourses... ✓ ACTIVE
   Checking CourseNotes... ✓ ACTIVE
   
   All tables are ACTIVE and ready! ✓
   ```

## Table Configuration

- **Billing Mode:** PAY_PER_REQUEST (on-demand)
- **Region:** eu-central-1
- **Encryption:** AWS managed keys (default)

## Troubleshooting

### "Table already exists" error
This is safe to ignore. The script will skip existing tables.

### Tables stuck in "CREATING" status
Wait 1-2 minutes. DynamoDB tables with GSIs can take time to create.

### "Access Denied" error
Ensure your AWS profile has DynamoDB permissions:
- `dynamodb:CreateTable`
- `dynamodb:DescribeTable`

## Cleanup (Optional)

To delete all encyclopedia tables:

```powershell
aws dynamodb delete-table --table-name UniversityDegrees --profile mwsoo3a --region eu-central-1
aws dynamodb delete-table --table-name DegreeCourses --profile mwsoo3a --region eu-central-1
aws dynamodb delete-table --table-name CourseNotes --profile mwsoo3a --region eu-central-1
```

⚠️ **Warning:** This will permanently delete all data!
