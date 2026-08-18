# AATOS Deployment Guide
## Pilot Environment Setup

### Prerequisites
- Docker 24.0+ and Docker Compose 2.20+
- PostgreSQL 15+ (or use provided docker-compose)
- Node.js 20+ (for local development)
- Git

### Environment Variables

Create `.env` file:

```bash
# Database
DATABASE_URL=postgresql://aatos:aatos_prod@db:5432/aatos_prod

# JWT
JWT_SECRET=your-production-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars

# Flutterwave (sandbox for pilot)
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-...
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-...
FLUTTERWAVE_ENV=test

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxx
EMAIL_FROM=noreply@aatos.trade

# AWS S3 (for document storage)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET_NAME=aatos-documents-prod

# Application
NODE_ENV=production
PORT=3000
API_VERSION=v1
FRONTEND_URL=https://app.aatos.trade

# Security
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=3600
```

### Deployment Steps

1. **Clone and configure:**
```bash
git clone https://github.com/Mageto369/aatos.git
cd aatos
cp .env.example .env
# Edit .env with production values
```

2. **Build and start:**
```bash
docker compose -f docker-compose.prod.yml up -d
```

3. **Run migrations:**
```bash
docker compose -f docker-compose.prod.yml exec api npm run migration:run
```

4. **Verify health:**
```bash
curl https://api.aatos.trade/api/v1/health
```

### Services

| Service | Container | Port | Purpose |
|---------|-----------|------|---------|
| API | api | 3000 | NestJS backend |
| Web | web | 80 | Vite SPA |
| Database | db | 5432 | PostgreSQL |
| Redis | redis | 6379 | Caching/sessions |

### Backup

```bash
# Run backup manually
./scripts/backup.sh

# Or schedule via cron (runs daily at 2 AM UTC)
0 2 * * * /opt/aatos/scripts/backup.sh >> /var/log/aatos-backup.log 2>&1
```

### Monitoring

- Health check: `GET /api/v1/health`
- Database: `GET /api/v1/health/db`
- Logs: `docker compose -f docker-compose.prod.yml logs -f api`

### SSL/TLS

Use Traefik or Nginx as reverse proxy with Let's Encrypt:

```yaml
# Add to docker-compose.prod.yml
  traefik:
    image: traefik:v3.0
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@aatos.trade"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - letsencrypt:/letsencrypt
```

### Rollback

```bash
# Rollback to previous image
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Rollback migrations (careful!)
npm run migration:revert
```

### Troubleshooting

**Database connection refused:**
- Check `DATABASE_URL` format
- Ensure PostgreSQL container is healthy

**Migration failures:**
- Check migration order
- Verify schema drift: `npm run schema:drift`

**Build failures:**
- Check `VITE_API_URL` is set for CI
- Ensure all env vars are in `.env`
