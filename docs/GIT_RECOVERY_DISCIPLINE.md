# AATOS Git and Recovery Discipline

**Version:** 1.0
**Date:** 2026-08-05
**Branch:** phase-3/production-scale

---

## Repository Status

| Check | Status | Evidence |
|---|---|---|
| Remote configured | Yes | origin: github.com/Mageto369/aatos.git |
| Active branch | phase-3/production-scale | `git branch` |
| Clean working tree | Yes | No uncommitted changes |
| Backup bundle exists | Yes | aatos-release-candidate.bundle (416KB) |
| Secrets in history | Unknown | Scan required (see below) |

---

## Backup Procedure

### Daily Backup (Automated)
```bash
# Create dated backup bundle
git bundle create aatos-backup-$(date +%Y%m%d).bundle --all

# Verify bundle
git bundle verify aatos-backup-$(date +%Y%m%d).bundle
```

### Pre-Deployment Backup (Manual)
```bash
# Tag current state
git tag -a pre-deploy-$(date +%Y%m%d-%H%M) -m "Pre-deployment snapshot"

# Push tag
git push origin pre-deploy-$(date +%Y%m%d-%H%M)

# Create full bundle
git bundle create aatos-deploy-$(date +%Y%m%d-%H%M).bundle --all
```

### Remote Backup
```bash
# Push to origin
git push origin phase-3/production-scale

# Push all tags
git push origin --tags
```

---

## Recovery Procedure

### From Bundle
```bash
# Clone from bundle
git clone aatos-backup-YYYYMMDD.bundle aatos-recovery

# Fetch all branches
cd aatos-recovery
git fetch origin
```

### From Remote
```bash
# Clone fresh
git clone https://github.com/Mageto369/aatos.git aatos-recovery

# Checkout working branch
cd aatos-recovery
git checkout phase-3/production-scale
```

### Rollback to Previous Commit
```bash
# View history
git log --oneline -20

# Rollback (soft — keeps changes)
git reset --soft HEAD~1

# Rollback (hard — discards changes)
git reset --hard <commit-hash>

# Push rollback (force required)
git push origin phase-3/production-scale --force
```

---

## Commit Policy

### Message Format
```
<type>(<scope>): <subject>

<body>
```

### Types
| Type | Use For |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `sprint` | Sprint work package |
| `test` | Adding or fixing tests |
| `refactor` | Code change that neither fixes nor adds |
| `ops` | Infrastructure, deployment |

### Requirements
- Every work package must have at least one commit
- Commits must be atomic (one logical change)
- No secrets in commits
- No large binary files without justification

---

## Secret Scan

### Manual Scan
```bash
# Search for common patterns
grep -r "password\|secret\|token\|key" --include="*.ts" --include="*.json" backend/src/ | grep -v "node_modules" | grep -v "dist"

# Check for private keys
grep -r "BEGIN.*PRIVATE KEY" backend/src/

# Check for API keys in comments
grep -r "sk-" backend/src/  # Stripe pattern
grep -r "FLWSECK-" backend/src/  # Flutterwave pattern
```

### Automated Scan
```bash
# Using gitleaks (if installed)
gitleaks detect --source . --verbose

# Using git-secrets (if installed)
git secrets --scan
```

### Current Status
- No obvious secrets found in `backend/src/` source files
- Configuration uses environment variables (good)
- `.env.local` is in `.gitignore` (good)
- **Action:** Run full secret scan before production deployment

---

## Recovery Validation Checklist

| Step | Command | Expected Result |
|---|---|---|
| Clone from backup | `git clone <bundle>` | Success |
| Install dependencies | `cd backend && npm install` | No errors |
| Build backend | `npm run build` | No TypeScript errors |
| Build frontend | `cd ../web && npm install && npm run build` | No errors |
| Start database | `docker-compose up -d` | PostgreSQL running |
| Run migrations | `cd backend && npm run migration:run` | All migrations applied |
| Start application | `npm run start:dev` | Application starts |
| Verify API | `curl http://localhost:4000/health` | 200 OK |

---

*Document created per AATOS 4-Week Trust and Pilot Readiness Directive, WP 1.8.*
