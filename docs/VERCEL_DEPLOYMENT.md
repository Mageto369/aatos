# Vercel Deployment Configuration

## Repository
- **GitHub:** `Mageto369/aatos`
- **Production Branch:** `main`
- **Deploy Commit:** `8b79220`

## Frontend Structure
| Property | Value |
|----------|-------|
| **Root Directory** | `web/` |
| **Framework** | Vite + React + TypeScript |
| **Package Manager** | npm |
| **Install Command** | `cd web && npm ci` |
| **Build Command** | `cd web && npm run build` |
| **Output Directory** | `web/dist` |
| **Node Version** | 18+ (Vite 5.3.4) |

## Environment Variables

### Required (Browser-Safe Only)
| Variable | Purpose | Required | Public/Secret |
|----------|---------|----------|---------------|
| `VITE_API_URL` | Backend REST API base URL | Yes | Public |
| `VITE_WS_URL` | WebSocket/Socket.IO base URL | Yes | Public |

### Forbidden in Frontend
- `DATABASE_URL`
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`
- `AWS_SECRET_ACCESS_KEY`
- Payment provider secrets
- SMTP passwords
- Private API credentials

## SPA Routing
React Router SPA with fallback to `index.html` for all routes.

## Vercel Configuration
See `vercel.json` in repository root.

## Local Build Verification
```bash
cd web
npm ci
npm run lint
npm run build
```

## Status
- [x] GitHub clean
- [x] Local build passes
- [x] Lint passes
- [x] No localhost fallbacks
- [x] vercel.json configured
- [ ] Vercel authentication required
