# AATOS Staging Environment

## Deployment Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vercel        │────▶│   NestJS API    │────▶│   Supabase      │
│   (Frontend)    │     │   (Backend)     │     │   (PostgreSQL)  │
│   aatos-web     │     │   aatos-api     │     │   aatos-db      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## URLs

| Service | Staging URL |
|---------|-------------|
| Frontend | `https://aatos-staging.vercel.app` |
| API | `https://aatos-api-staging.vercel.app` |
| Supabase DB | `https://xxxxxxxxxxxx.supabase.co` |

## Environment Variables

### Frontend (`web/.env.staging`)
```
VITE_API_URL=https://aatos-api-staging.vercel.app
VITE_WS_URL=wss://aatos-api-staging.vercel.app
```

### Backend (`backend/.env.staging`)
```
NODE_ENV=production
PORT=4000
DATABASE_URL=<supabase-pooler-url>
REDIS_URL=<redis-url>
JWT_SECRET=<generate-strong-secret>
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=<generate-strong-secret>
FRONTEND_URL=https://aatos-staging.vercel.app
AWS_S3_BUCKET=aatos-staging-documents
AWS_REGION=us-east-1
```

## Deployment Steps

### 1. Supabase Setup
```bash
# Link to Supabase project
supabase login
supabase link --project-ref <project-ref>

# Run migrations
supabase db push

# Seed data (optional, for staging)
supabase db seed
```

### 2. Backend Deployment (Vercel Serverless)
```bash
cd backend
vercel --target=staging
```

### 3. Frontend Deployment
```bash
cd web
vercel --target=staging
```

## Verification Checklist

- [ ] Frontend loads without errors
- [ ] API health check returns 200
- [ ] Database connection successful
- [ ] Authentication works (register/login)
- [ ] WebSocket connections work
- [ ] File upload works
- [ ] All pages load correctly

## Commands

```bash
# Local staging simulation
npm run build:staging    # Build frontend with staging env
npm run start:staging    # Start backend with staging env

# Logs
vercel logs aatos-staging --tail
```
