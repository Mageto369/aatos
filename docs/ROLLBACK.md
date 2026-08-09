# Rollback Procedure

## Frontend Rollback (Vercel)
1. Go to Vercel dashboard → Project → Deployments
2. Find previous known-good deployment
3. Click "Promote to Production"
4. Verify new production deployment

## Backend Rollback
1. Identify previous container/image:
   ```bash
   docker pull aatos/backend:<previous-tag>
   ```
2. Redeploy previous version
3. Verify health endpoint

## Database Rollback
**WARNING:** Do not automatically reverse destructive migrations.

1. Create backup before any migration
2. If rollback needed:
   - For additive migrations: reverse SQL manually
   - For destructive migrations: restore from backup
3. Verify schema consistency
4. Run application health checks

## Emergency Rollback
If both frontend and backend need immediate rollback:
1. Frontend: Promote previous Vercel deployment
2. Backend: Redeploy previous container
3. Database: If schema changed, restore from backup
4. Verify all smoke tests pass

## Verification After Rollback
- [ ] Homepage loads
- [ ] Authentication works
- [ ] API health responds
- [ ] Database connection OK
- [ ] No 500 errors in logs
