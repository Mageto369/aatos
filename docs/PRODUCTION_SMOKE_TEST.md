# Production Smoke Test

## Pre-Deployment Checks
- [ ] Git commit `8b79220` or later
- [ ] Vercel build passes
- [ ] Backend health endpoint responds
- [ ] Database migrations applied

## Smoke Test Sequence

### 1. Homepage
- [ ] Loads without errors
- [ ] No console errors

### 2. Authentication
- [ ] Login page loads
- [ ] Register works (if enabled)
- [ ] JWT token received
- [ ] Refresh token rotation works
- [ ] Logout works

### 3. Dashboard
- [ ] Loads with real data
- [ ] Stats cards display

### 4. Products
- [ ] List loads
- [ ] Search/filter works

### 5. RFQs
- [ ] List loads
- [ ] Create RFQ works
- [ ] Submit quotation works

### 6. Deals
- [ ] List loads
- [ ] Deal room loads
- [ ] Socket.IO connects
- [ ] Messages send/receive

### 7. Documents
- [ ] Upload via presigned URL works
- [ ] Download works

### 8. Inspections
- [ ] List loads
- [ ] Book inspection works

### 9. Payments
- [ ] Page loads
- [ ] Sandbox mode confirmed

### 10. Compliance
- [ ] Checklist generates
- [ ] Items trackable

### 11. Settings
- [ ] Profile loads
- [ ] Notification preferences save

### 12. Pilot Guard Verification
- [ ] Kenya → US corridor accepted
- [ ] Other corridors rejected
- [ ] Green coffee accepted
- [ ] Other commodities rejected
- [ ] Org cap enforced

### 13. Security
- [ ] HTTPS enforced
- [ ] HSTS present
- [ ] CSP headers present
- [ ] No secrets in browser bundle
- [ ] API calls not to localhost

## Post-Deployment
- [ ] Frontend logs checked
- [ ] Backend logs checked
- [ ] No 500 errors
- [ ] Rate limiting active
