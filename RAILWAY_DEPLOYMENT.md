# Railway Deployment Guide for RoboVibe Turbo Template

## Overview

This guide explains how to deploy the RoboVibe Turbo Template monorepo to Railway. The application consists of:
- **API Service**: Express.js backend with Socket.IO, tRPC, and isolated-vm
- **Web Service**: React frontend with Vite
- **PostgreSQL Database**: For persistent data storage

## What We've Prepared

### 1. Configuration Updates
- **Environment Variable Support**: Updated `packages/config` to use environment variables with fallbacks
- **Client-Safe Config**: Created browser-compatible configuration in `packages/config/src/client-env.ts`
- **Dynamic CORS**: API now dynamically configures CORS based on environment

### 2. Deployment Files Created
- **railway.json**: Railway configuration for the monorepo
- **Dockerfile**: Multi-stage build with isolated-vm support
- **.env.example files**: Documentation of required environment variables
- **deploy-railway.sh**: Step-by-step deployment script

## Manual Deployment Steps

### Prerequisites
1. Install Railway CLI: `brew install railway`
2. Have your Railway account ready
3. Have your API keys ready (Clerk, OpenAI)

### Step 1: Login to Railway
```bash
railway login
```

### Step 2: Create Railway Project
```bash
railway init --name robovibe-turbo
```

### Step 3: Create PostgreSQL Database
```bash
railway add
# Select: PostgreSQL
```

### Step 4: Deploy API Service

1. Create the service:
```bash
railway service create api
```

2. Link to the service:
```bash
railway link api
```

3. Configure environment variables:
```bash
# Essential variables
railway variables set NODE_ENV=production
railway variables set PORT=\${{PORT}}
railway variables set DATABASE_URL=\${{POSTGRES_URL}}

# Authentication
railway variables set CLERK_SECRET_KEY=<your-clerk-secret>
railway variables set CLERK_WEBHOOK_SECRET=<your-webhook-secret>
railway variables set CLERK_PUBLISHABLE_KEY=<your-publishable-key>

# API Keys
railway variables set OPENAI_API_KEY=<your-openai-key>
railway variables set JWT_SECRET=<generate-secure-secret>

# URLs (update after deployment)
railway variables set CLIENT_URL=<web-service-url>
railway variables set SERVER_URL=\${{RAILWAY_PUBLIC_DOMAIN}}
railway variables set API_URL=\${{RAILWAY_PUBLIC_DOMAIN}}
```

4. Configure build settings in Railway UI:
   - **Root Directory**: `/`
   - **Build Command**: `pnpm install --frozen-lockfile && pnpm build --filter=@repo/api...`
   - **Start Command**: `cd apps/api && node dist/index.js`

### Step 5: Deploy Web Service

1. Create the service:
```bash
railway service create web
```

2. Link to the service:
```bash
railway link web
```

3. Configure environment variables:
```bash
railway variables set VITE_API_URL=<api-service-url>
railway variables set VITE_CLERK_PUBLISHABLE_KEY=<your-publishable-key>
```

4. Configure build settings in Railway UI:
   - **Root Directory**: `/`
   - **Build Command**: `pnpm install --frozen-lockfile && pnpm build --filter=@repo/web...`
   - **Start Command**: `cd apps/web && pnpm preview --port $PORT --host 0.0.0.0`

### Step 6: Deploy Both Services
```bash
railway up
```

### Step 7: Run Database Migrations
After the API service is deployed:
```bash
railway run --service api pnpm db:push
```

### Step 8: Get Service URLs
```bash
railway domain
```

### Step 9: Update Environment Variables
Update the URL environment variables with the actual deployed URLs:
1. Update API service's `CLIENT_URL`
2. Update Web service's `VITE_API_URL`
3. Redeploy both services

## Using Docker (Alternative)

If Railway's default builder has issues with isolated-vm:

1. Update railway.json to use Docker:
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "./Dockerfile"
  }
}
```

2. Deploy with Docker build arguments:
```bash
# For API
railway up --build-arg APP_NAME=api

# For Web
railway up --build-arg APP_NAME=web
```

## Troubleshooting

### isolated-vm Build Failures
- The Dockerfile includes build dependencies for native modules
- If issues persist, consider using the Docker deployment method

### CORS Issues
- Ensure CLIENT_URL environment variable is set correctly on the API service
- Check that the API URL is correct in the web service environment

### WebSocket Connection Issues
- Railway supports WebSockets by default
- Ensure the client is connecting to the correct server URL

### Database Connection
- Use the POSTGRES_URL provided by Railway's PostgreSQL plugin
- Run migrations after deployment

## Environment Variables Reference

### API Service
- `NODE_ENV`: production
- `PORT`: $PORT (provided by Railway)
- `DATABASE_URL`: PostgreSQL connection string
- `CLERK_SECRET_KEY`: Clerk secret key
- `CLERK_WEBHOOK_SECRET`: Clerk webhook secret
- `CLIENT_URL`: Frontend URL
- `SERVER_URL`: API URL
- `OPENAI_API_KEY`: OpenAI API key
- `JWT_SECRET`: JWT signing secret

### Web Service
- `VITE_API_URL`: API service URL
- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk publishable key

## Next Steps

1. Configure Clerk webhooks to point to your API URL
2. Set up monitoring and logging
3. Configure custom domains if needed
4. Enable auto-scaling for production traffic