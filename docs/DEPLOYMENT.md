# Production Deployment Guide

## Prerequisites

- Docker 24.0+
- Docker Compose 2.20+
- 4GB RAM minimum (8GB recommended)
- SSL certificates for HTTPS

## Environment Setup

Create a `.env` file:

```bash
# Database
DB_PASSWORD=your-secure-password-here

# JWT
JWT_SECRET=your-jwt-secret-min-32-characters

# Payments (Flutterwave)
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-...
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-...

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxx

# Monitoring (optional)
DATADOG_API_KEY=xxx
```

## Deployment Steps

### 1. Build and Start

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Run Migrations

```bash
docker-compose -f docker-compose.prod.yml exec api npm run migration:run
```

### 3. Seed Data (first time only)

```bash
docker-compose -f docker-compose.prod.yml exec api npm run seed
```

### 4. Verify Health

```bash
curl http://localhost:3000/health
```

### 5. SSL / HTTPS

Use nginx or traefik as reverse proxy with Let's Encrypt:

```yaml
# nginx-proxy service (add to docker-compose)
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
```

## Monitoring

- Health endpoint: `GET /health`
- Metrics: `GET /metrics` (Prometheus format)
- Logs: `docker-compose logs -f api`

## Backup

```bash
# Database backup
docker-compose exec postgres pg_dump -U aatos aatos_production > backup.sql

# Restore
docker-compose exec -T postgres psql -U aatos aatos_production < backup.sql
```

## Scaling

```bash
# Scale API instances
docker-compose up -d --scale api=3
```

## Troubleshooting

| Issue | Solution |
|---|---|
| Database connection refused | Check postgres container is running |
| JWT errors | Verify JWT_SECRET is set and 32+ chars |
| Payment failures | Check Flutterwave keys are valid |
| Memory issues | Increase Docker memory limit to 4GB+ |

---

*Last updated: 2026-08-04*
