#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Verifies DynamoDB tables for the Encyclopedia feature

.DESCRIPTION
    Checks if all three encyclopedia tables exist and are ACTIVE

.PARAMETER Profile
    AWS CLI profile to use (default: mwsoo3a)

.PARAMETER Region
    AWS region (default: eu-central-1)

.EXAMPLE
    .\verify-tables.ps1
#>

param(
    [string]$Profile = "mwsoo3a",
    [string]$Region = "eu-central-1"
)

$ErrorActionPreference = "Stop"

Write-Host "Verifying Encyclopedia DynamoDB Tables..." -ForegroundColor Cyan
Write-Host ""

$tables = @("UniversityDegrees", "DegreeCourses", "CourseNotes")
$allActive = $true

foreach ($tableName in $tables) {
    Write-Host "Checking $tableName..." -NoNewline
    
    try {
        $result = aws dynamodb describe-table `
            --table-name $tableName `
            --region $Region `
            --profile $Profile `
            --query 'Table.TableStatus' `
            --output text 2>&1
        
        if ($result -eq "ACTIVE") {
            Write-Host " ✓ ACTIVE" -ForegroundColor Green
        } else {
            Write-Host " ⏳ $result" -ForegroundColor Yellow
            $allActive = $false
        }
    } catch {
        Write-Host " ✗ NOT FOUND" -ForegroundColor Red
        $allActive = $false
    }
}

Write-Host ""

if ($allActive) {
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host "All tables are ACTIVE and ready! ✓" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Cyan
} else {
    Write-Host "=====================================" -ForegroundColor Yellow
    Write-Host "Some tables are not ready yet" -ForegroundColor Yellow
    Write-Host "=====================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Wait a few seconds and run this script again."
}

Write-Host ""
