# ==============================================================================
# Deploy Script for 3D Model React App (S3 + CloudFront)
# 
# Creates all AWS resources from scratch using CLI commands:
#   - S3 bucket (static website hosting)
#   - CloudFront distribution (CDN + HTTPS)
#   - Builds and uploads the app
#
# Prerequisites:
#   - AWS CLI installed and configured (aws configure)
#   - Node.js 18+ installed
#
# Usage (run in PowerShell):
#   cd 3dmodel_react
#   .\deploy.ps1
# ==============================================================================

$ErrorActionPreference = "Stop"

# ─── Configuration ────────────────────────────────────────────────────────────
$APP_NAME = "3dmodel-react-app"
$AWS_REGION = "ap-south-1"

# Generate unique bucket name
$TIMESTAMP = Get-Date -Format "yyyyMMddHHmmss"
$S3_BUCKET = "$APP_NAME-$TIMESTAMP"

# If you already have a bucket, uncomment and set it here:
# $S3_BUCKET = "your-existing-bucket-name"

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "  3D Model React App - AWS Deployment Script" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

# ─── Check prerequisites ──────────────────────────────────────────────────────
Write-Host "[1/7] Checking prerequisites..." -ForegroundColor Yellow

# Check AWS CLI
try {
    $null = Get-Command aws -ErrorAction Stop
} catch {
    Write-Host "ERROR: AWS CLI is not installed." -ForegroundColor Red
    Write-Host "Install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
}

# Check Node.js
try {
    $null = Get-Command node -ErrorAction Stop
} catch {
    Write-Host "ERROR: Node.js is not installed." -ForegroundColor Red
    exit 1
}

# Verify AWS credentials
try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Host "  [OK] AWS CLI configured (Account: $($identity.Account))" -ForegroundColor Green
} catch {
    Write-Host "ERROR: AWS credentials not configured. Run: aws configure" -ForegroundColor Red
    exit 1
}

$nodeVersion = node --version
Write-Host "  [OK] Node.js $nodeVersion" -ForegroundColor Green
Write-Host ""

# ─── Install dependencies & build ────────────────────────────────────────────
Write-Host "[2/7] Installing dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: npm install failed" -ForegroundColor Red; exit 1 }
Write-Host ""

Write-Host "[3/7] Building production bundle..." -ForegroundColor Yellow
$env:CI = "false"
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Build failed" -ForegroundColor Red; exit 1 }
Write-Host "  [OK] Build complete (dist/)" -ForegroundColor Green
Write-Host ""

# ─── Create S3 bucket ─────────────────────────────────────────────────────────
Write-Host "[4/7] Creating S3 bucket: $S3_BUCKET ..." -ForegroundColor Yellow

$bucketExists = $false
try {
    aws s3api head-bucket --bucket $S3_BUCKET 2>$null
    $bucketExists = ($LASTEXITCODE -eq 0)
} catch {
    $bucketExists = $false
}

if ($bucketExists) {
    Write-Host "  [OK] Bucket already exists, skipping creation" -ForegroundColor Green
} else {
    if ($AWS_REGION -eq "us-east-1") {
        aws s3api create-bucket --bucket $S3_BUCKET --region $AWS_REGION
    } else {
        aws s3api create-bucket --bucket $S3_BUCKET --region $AWS_REGION --create-bucket-configuration LocationConstraint=$AWS_REGION
    }
    if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Failed to create bucket" -ForegroundColor Red; exit 1 }
    Write-Host "  [OK] Bucket created" -ForegroundColor Green
}

# Configure static website hosting (SPA: error doc also points to index.html)
aws s3 website "s3://$S3_BUCKET" --index-document index.html --error-document index.html
Write-Host "  [OK] Static website hosting enabled" -ForegroundColor Green

# Disable block public access
aws s3api put-public-access-block `
    --bucket $S3_BUCKET `
    --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Set bucket policy for public read
$bucketPolicy = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$S3_BUCKET/*"
        }
    ]
}
"@

[System.IO.File]::WriteAllText("$PWD\bucket-policy.json", $bucketPolicy, [System.Text.UTF8Encoding]::new($false))
aws s3api put-bucket-policy --bucket $S3_BUCKET --policy file://bucket-policy.json
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Failed to apply bucket policy" -ForegroundColor Red; exit 1 }
Remove-Item "bucket-policy.json"
Write-Host "  [OK] Bucket policy applied" -ForegroundColor Green
Write-Host ""

# ─── Upload build to S3 ──────────────────────────────────────────────────────
Write-Host "[5/7] Uploading build to S3..." -ForegroundColor Yellow
aws s3 sync dist/ "s3://$S3_BUCKET" --delete --region $AWS_REGION
Write-Host "  [OK] Files uploaded" -ForegroundColor Green
Write-Host ""

# ─── Create CloudFront distribution ──────────────────────────────────────────
Write-Host "[6/7] Creating CloudFront distribution..." -ForegroundColor Yellow

$cfConfig = @"
{
    "CallerReference": "$APP_NAME-$TIMESTAMP",
    "Comment": "3D Model React App",
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-$S3_BUCKET",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"],
            "CachedMethods": {
                "Quantity": 2,
                "Items": ["GET", "HEAD"]
            }
        },
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": { "Forward": "none" }
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000,
        "Compress": true
    },
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-$S3_BUCKET",
                "DomainName": "$S3_BUCKET.s3.$AWS_REGION.amazonaws.com",
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                }
            }
        ]
    },
    "Enabled": true,
    "DefaultRootObject": "index.html",
    "CustomErrorResponses": {
        "Quantity": 2,
        "Items": [
            {
                "ErrorCode": 403,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 10
            },
            {
                "ErrorCode": 404,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 10
            }
        ]
    },
    "PriceClass": "PriceClass_All"
}
"@

[System.IO.File]::WriteAllText("$PWD\cf-config.json", $cfConfig, [System.Text.UTF8Encoding]::new($false))
$DISTRIBUTION_ID = aws cloudfront create-distribution --distribution-config file://cf-config.json --query "Distribution.Id" --output text
Remove-Item "cf-config.json"

if (-not $DISTRIBUTION_ID) {
    Write-Host "ERROR: Failed to create CloudFront distribution" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] CloudFront distribution created: $DISTRIBUTION_ID" -ForegroundColor Green

$CF_DOMAIN = aws cloudfront get-distribution --id $DISTRIBUTION_ID --query "Distribution.DomainName" --output text
Write-Host ""

# ─── Invalidate CloudFront cache ─────────────────────────────────────────────
Write-Host "[7/7] Invalidating CloudFront cache..." -ForegroundColor Yellow
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*" | Out-Null
Write-Host "  [OK] Cache invalidation created" -ForegroundColor Green
Write-Host ""

# ─── Summary ──────────────────────────────────────────────────────────────────
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  S3 Bucket:         $S3_BUCKET" -ForegroundColor Green
Write-Host "  CloudFront ID:     $DISTRIBUTION_ID" -ForegroundColor Green
Write-Host "  CloudFront URL:    https://$CF_DOMAIN" -ForegroundColor Green
Write-Host "  S3 Website URL:    http://$S3_BUCKET.s3-website.$AWS_REGION.amazonaws.com" -ForegroundColor Green
Write-Host ""
Write-Host "  -- GitHub Actions Secrets Needed --" -ForegroundColor Cyan
Write-Host "  AWS_ACCESS_KEY_ID       = (your IAM access key)"
Write-Host "  AWS_SECRET_ACCESS_KEY   = (your IAM secret key)"
Write-Host "  AWS_REGION              = $AWS_REGION"
Write-Host "  S3_BUCKET               = $S3_BUCKET"
Write-Host "  DISTRIBUTION_ID         = $DISTRIBUTION_ID"
Write-Host "  VITE_GOOGLE_CLIENT_ID   = (your Google OAuth client ID)"
Write-Host "  VITE_LIVEKIT_URL        = (your LiveKit server URL)"
Write-Host "  VITE_TOKEN_SERVER       = (your token server URL)"
Write-Host "  VITE_BACKEND_URL        = (your backend API URL)"
Write-Host ""
Write-Host "  NOTE: CloudFront may take 5-15 minutes to fully deploy." -ForegroundColor Yellow
Write-Host ""
