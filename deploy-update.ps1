# ==============================================================================
# Quick Re-deploy Script (Build + Upload + Invalidate)
#
# Use this after deploy.ps1 has already created the S3 bucket and CloudFront.
# This just rebuilds and uploads.
#
# Usage:
#   .\deploy-update.ps1
# ==============================================================================

$ErrorActionPreference = "Stop"

# ─── Configuration (UPDATE THESE after first deploy) ──────────────────────────
$S3_BUCKET = "3dmodel-react-app-20260608201227"
$DISTRIBUTION_ID = "E2D870U0EHMJT8"
$AWS_REGION = "ap-south-1"

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "  3D Model React App - Quick Re-deploy" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

if ($S3_BUCKET -eq "your-bucket-name") {
    Write-Host "ERROR: Please edit deploy-update.ps1 and set your S3_BUCKET and DISTRIBUTION_ID" -ForegroundColor Red
    Write-Host "These values were printed at the end of your first deploy.ps1 run."
    exit 1
}

# ─── Build ────────────────────────────────────────────────────────────────────
Write-Host "[1/3] Building production bundle..." -ForegroundColor Yellow
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: npm install failed" -ForegroundColor Red; exit 1 }

$env:CI = "false"
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Build failed" -ForegroundColor Red; exit 1 }
Write-Host "  [OK] Build complete" -ForegroundColor Green
Write-Host ""

# ─── Upload to S3 ────────────────────────────────────────────────────────────
Write-Host "[2/3] Uploading to S3..." -ForegroundColor Yellow
aws s3 sync dist/ "s3://$S3_BUCKET" --delete --region $AWS_REGION
Write-Host "  [OK] Files synced" -ForegroundColor Green
Write-Host ""

# ─── Invalidate CloudFront ────────────────────────────────────────────────────
Write-Host "[3/3] Invalidating CloudFront cache..." -ForegroundColor Yellow
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*" | Out-Null
Write-Host "  [OK] Cache invalidation started" -ForegroundColor Green
Write-Host ""

Write-Host "  REDEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "  CloudFront may take 1-2 minutes to serve new content."
Write-Host ""
