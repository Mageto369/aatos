# Production Environment Configuration

## Architecture
```
Browser
  ↓ HTTPS
Vercel (Frontend)
  ↓ HTTPS API
NestJS Backend (Persistent Host)
  ↓
PostgreSQL / Redis / S3 / External APIs
```

## Frontend (Vercel)
- **Framework:** Vite + React
- **Domain:** TBD after Vercel connection
- **Environment Variables:**
  - `VITE_API_URL`
  - `VITE_WS_URL`

## Backend (Persistent Host Required)
The NestJS backend requires:
- Persistent process (not serverless)
- Socket.IO for real-time messaging
- PostgreSQL connections
- Background job capability
- File processing
- Payment webhooks

**Recommended:** Railway, Render, Fly.io, or AWS ECS — not Vercel.

## CORS Configuration
Allowed origins (backend must configure):
- Local development: `http://localhost:3000`
- Vercel previews: `https://*.vercel.app`
- Production: TBD

## Pilot Restrictions (Enforced)
- Corridor: Kenya → US only
- Commodity: Green coffee only
- Org cap: 20 max
- Payments: Sandbox only

## Database
- PostgreSQL with TypeORM migrations
- `synchronize: false` in production
- Migration-only schema changes

## Security Headers
- Helmet: CSP, HSTS, X-Content-Type-Options, X-Frame-Options
- Rate limiting: `@Throttle('strict')` on auth endpoints
- RBAC: Role guards on all sensitive controllers

## Authentication
- JWT access tokens (short-lived)
- Opaque refresh tokens with rotation
- IP/User-Agent tracking
- Login lockout (5 attempts)
