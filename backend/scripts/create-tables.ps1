#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Creates DynamoDB tables for the Encyclopedia feature

.DESCRIPTION
    This script creates three DynamoDB tables:
    1. UniversityDegrees - Degree programs at universities
    2. DegreeCourses - Courses within degree programs
    3. CourseNotes - Student-uploaded notes

.PARAMETER Profile
    AWS CLI profile to use (default: mwsoo3a)

.PARAMETER Region
    AWS region (default: eu-central-1)

.EXAMPLE
    .\create-tables.ps1
    .\create-tables.ps1 -Profile myprofile -Region us-east-1
#>

param(
    [string]$Profile = "mwsoo3a",
    [string]$Region = "eu-central-1"
)

$ErrorActionPreference = "Stop"

Write-Host "Creating Encyclopedia DynamoDB Tables..." -ForegroundColor Cyan
Write-Host "Profile: $Profile" -ForegroundColor Gray
Write-Host "Region: $Region" -ForegroundColor Gray
Write-Host ""

# Table 1: UniversityDegrees
Write-Host "[1/3] Creating UniversityDegrees table..." -ForegroundColor Yellow

try {
    aws dynamodb create-table `
        --table-name UniversityDegrees `
        --attribute-definitions `
            AttributeName=universityDomain,AttributeType=S `
            AttributeName=degreeSlug,AttributeType=S `
            AttributeName=id,AttributeType=S `
        --key-schema `
            AttributeName=universityDomain,KeyType=HASH `
            AttributeName=degreeSlug,KeyType=RANGE `
        --global-secondary-indexes `
            "[
                {
                    \"IndexName\": \"degreeId-index\",
                    \"KeySchema\": [{\"AttributeName\":\"id\",\"KeyType\":\"HASH\"}],
                    \"Projection\": {\"ProjectionType\":\"ALL\"},
                    \"ProvisionedThroughput\": {\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}
                }
            ]" `
        --billing-mode PAY_PER_REQUEST `
        --region $Region `
        --profile $Profile `
        --no-cli-pager

    Write-Host "✓ UniversityDegrees table created successfully" -ForegroundColor Green
} catch {
    if ($_ -match "ResourceInUseException") {
        Write-Host "⚠ UniversityDegrees table already exists" -ForegroundColor Yellow
    } else {
        Write-Host "✗ Failed to create UniversityDegrees table: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Table 2: DegreeCourses
Write-Host "[2/3] Creating DegreeCourses table..." -ForegroundColor Yellow

try {
    aws dynamodb create-table `
        --table-name DegreeCourses `
        --attribute-definitions `
            AttributeName=degreeId,AttributeType=S `
            AttributeName=courseSlug,AttributeType=S `
            AttributeName=id,AttributeType=S `
            AttributeName=universityDomain,AttributeType=S `
            AttributeName=courseCode,AttributeType=S `
        --key-schema `
            AttributeName=degreeId,KeyType=HASH `
            AttributeName=courseSlug,KeyType=RANGE `
        --global-secondary-indexes `
            "[
                {
                    \"IndexName\": \"courseId-index\",
                    \"KeySchema\": [{\"AttributeName\":\"id\",\"KeyType\":\"HASH\"}],
                    \"Projection\": {\"ProjectionType\":\"ALL\"},
                    \"ProvisionedThroughput\": {\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}
                },
                {
                    \"IndexName\": \"universityDomain-courseCode-index\",
                    \"KeySchema\": [
                        {\"AttributeName\":\"universityDomain\",\"KeyType\":\"HASH\"},
                        {\"AttributeName\":\"courseCode\",\"KeyType\":\"RANGE\"}
                    ],
                    \"Projection\": {\"ProjectionType\":\"ALL\"},
                    \"ProvisionedThroughput\": {\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}
                }
            ]" `
        --billing-mode PAY_PER_REQUEST `
        --region $Region `
        --profile $Profile `
        --no-cli-pager

    Write-Host "✓ DegreeCourses table created successfully" -ForegroundColor Green
} catch {
    if ($_ -match "ResourceInUseException") {
        Write-Host "⚠ DegreeCourses table already exists" -ForegroundColor Yellow
    } else {
        Write-Host "✗ Failed to create DegreeCourses table: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Table 3: CourseNotes
Write-Host "[3/3] Creating CourseNotes table..." -ForegroundColor Yellow

try {
    aws dynamodb create-table `
        --table-name CourseNotes `
        --attribute-definitions `
            AttributeName=courseId,AttributeType=S `
            AttributeName=createdAtId,AttributeType=S `
            AttributeName=id,AttributeType=S `
            AttributeName=uploadedBy,AttributeType=S `
            AttributeName=createdAt,AttributeType=S `
            AttributeName=upvotes,AttributeType=N `
        --key-schema `
            AttributeName=courseId,KeyType=HASH `
            AttributeName=createdAtId,KeyType=RANGE `
        --global-secondary-indexes `
            "[
                {
                    \"IndexName\": \"noteId-index\",
                    \"KeySchema\": [{\"AttributeName\":\"id\",\"KeyType\":\"HASH\"}],
                    \"Projection\": {\"ProjectionType\":\"ALL\"},
                    \"ProvisionedThroughput\": {\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}
                },
                {
                    \"IndexName\": \"uploadedBy-createdAt-index\",
                    \"KeySchema\": [
                        {\"AttributeName\":\"uploadedBy\",\"KeyType\":\"HASH\"},
                        {\"AttributeName\":\"createdAt\",\"KeyType\":\"RANGE\"}
                    ],
                    \"Projection\": {\"ProjectionType\":\"ALL\"},
                    \"ProvisionedThroughput\": {\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}
                },
                {
                    \"IndexName\": \"courseId-upvotes-index\",
                    \"KeySchema\": [
                        {\"AttributeName\":\"courseId\",\"KeyType\":\"HASH\"},
                        {\"AttributeName\":\"upvotes\",\"KeyType\":\"RANGE\"}
                    ],
                    \"Projection\": {\"ProjectionType\":\"ALL\"},
                    \"ProvisionedThroughput\": {\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}
                }
            ]" `
        --billing-mode PAY_PER_REQUEST `
        --region $Region `
        --profile $Profile `
        --no-cli-pager

    Write-Host "✓ CourseNotes table created successfully" -ForegroundColor Green
} catch {
    if ($_ -match "ResourceInUseException") {
        Write-Host "⚠ CourseNotes table already exists" -ForegroundColor Yellow
    } else {
        Write-Host "✗ Failed to create CourseNotes table: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "All tables created successfully! ✓" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Wait ~30 seconds for tables to become ACTIVE"
Write-Host "  2. Run: .\verify-tables.ps1"
Write-Host "  3. Start adding degrees via admin panel"
Write-Host ""
