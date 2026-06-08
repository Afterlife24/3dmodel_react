# Deployment Guide - 3D Model React App (S3 + CloudFront)

## Architecture

```
User Browser  →  CloudFront (CDN + HTTPS)  →  S3 Bucket (static files)
```

- **S3**: Hosts the built static files (HTML, JS, CSS, assets)
- **CloudFront**: CDN for global caching, HTTPS, and SPA routing (404 → index.html)
- **GitHub Actions**: Auto-deploys on push to `main`

---

## Prerequisites

1. **AWS CLI** installed and configured
2. **Node.js 18+** installed
3. **AWS IAM User** with these permissions:
   - `s3:*` (or scoped to your bucket)
   - `cloudfront:*`
   - `sts:GetCallerIdentity`

### Install AWS CLI

```bash
# Windows (MSI installer)
# Download from: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

# Or via winget
winget install Amazon.AWSCLI

# Verify
aws --version
```

### Configure AWS CLI

```bash
aws configure
# AWS Access Key ID: <your-access-key>
# AWS Secret Access Key: <your-secret-key>
# Default region name: ap-south-1
# Default output format: json
```

---

## Step-by-Step Deployment (CLI Only)

### Option A: First-Time Deployment (Creates Everything)

```cmd
cd 3dmodel_react

REM Run the full deployment (Windows CMD)
deploy.bat
```

This will:
1. Check prerequisites (AWS CLI, Node.js, credentials)
2. Install dependencies and build the app
3. Create an S3 bucket with static hosting enabled
4. Upload the `dist/` folder to S3
5. Create a CloudFront distribution with SPA error handling
6. Invalidate the CloudFront cache
7. Print the live URL

**Save the output!** You'll need the S3 bucket name and CloudFront Distribution ID for subsequent deploys and GitHub Actions secrets.

### Option B: Quick Re-deploy (After First Deploy)

After the initial setup, use the faster script for subsequent deploys:

1. Edit `deploy-update.bat` and set your bucket name and distribution ID
2. Run:

```cmd
deploy-update.bat
```

### Option C: Manual Commands (Step by Step)

If you prefer running each command yourself:

```cmd
REM 1. Build
npm install --legacy-peer-deps
set CI=false
npm run build

REM 2. Upload to S3
aws s3 sync dist\ s3://YOUR_BUCKET_NAME --delete --region ap-south-1

REM 3. Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## GitHub Actions Pipeline (Auto-Deploy on Push)

The pipeline is at `.github/workflows/deploy.yml`. It triggers on every push to `main`.

### Setup GitHub Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

| Secret Name | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | Your IAM access key |
| `AWS_SECRET_ACCESS_KEY` | Your IAM secret key |
| `AWS_REGION` | `ap-south-1` (or your region) |
| `S3_BUCKET` | Your S3 bucket name (from deploy.sh output) |
| `DISTRIBUTION_ID` | Your CloudFront distribution ID (from deploy.sh output) |
| `VITE_GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |
| `VITE_LIVEKIT_URL` | Your LiveKit server URL (e.g., `wss://...livekit.cloud`) |
| `VITE_TOKEN_SERVER` | Your token server URL |
| `VITE_BACKEND_URL` | Your backend API URL |

### How It Works

1. You push code to `main` branch
2. GitHub Actions picks it up automatically
3. Installs deps → Builds with env vars → Uploads to S3 → Invalidates CloudFront
4. Live in ~2-3 minutes

---

## Environment Variables

The app uses these `VITE_` environment variables (set in `.env` locally or as GitHub secrets for CI):

| Variable | Description |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID for login |
| `VITE_LIVEKIT_URL` | LiveKit WebSocket URL |
| `VITE_TOKEN_SERVER` | Flask token server URL for LiveKit tokens |
| `VITE_BACKEND_URL` | Backend API base URL |

Create a `.env` file locally:

```bash
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_LIVEKIT_URL=wss://your-app.livekit.cloud
VITE_TOKEN_SERVER=https://your-token-server.com
VITE_BACKEND_URL=https://your-backend.com
```

---

## Custom Domain (Optional)

To use a custom domain with CloudFront:

```bash
# 1. Request an ACM certificate (must be in us-east-1 for CloudFront)
aws acm request-certificate \
    --domain-name yourdomain.com \
    --validation-method DNS \
    --region us-east-1

# 2. Add the CNAME record shown in ACM to your DNS

# 3. Update CloudFront distribution with the domain alias
aws cloudfront update-distribution \
    --id YOUR_DIST_ID \
    --distribution-config file://cf-config-with-alias.json
```

---

## Troubleshooting

### "Access Denied" when visiting CloudFront URL
- Wait 5-15 minutes for the distribution to fully deploy
- Check bucket policy allows public read

### SPA routes return 404
- CloudFront custom error responses should redirect 403/404 to `/index.html`
- The deploy script sets this up automatically

### Build fails in GitHub Actions
- Check that all `VITE_` secrets are set in GitHub
- Ensure `--legacy-peer-deps` is used for install

### CloudFront shows stale content
```bash
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## File Structure

```
3dmodel_react/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD pipeline
├── deploy.bat                  # First-time full deployment script (Windows)
├── deploy-update.bat           # Quick re-deploy script (Windows)
├── deploy.sh                   # First-time full deployment script (Linux/Mac/Git Bash)
├── deploy-update.sh            # Quick re-deploy script (Linux/Mac/Git Bash)
├── .env.example                # Environment variable reference
├── DEPLOYMENT_GUIDE.md         # This file
├── dist/                       # Build output (auto-generated)
├── public/                     # Static assets
├── src/                        # Source code
└── package.json
```
