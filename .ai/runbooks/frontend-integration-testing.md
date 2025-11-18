# Frontend Connection & E2E Integration Testing Runbook

**Issue**: #1024
**Date**: 2025-11-18
**Environment**: Development
**Dependencies**: Issues #1021-#1023 (Full backend infrastructure deployed)
**Estimated Time**: 45-60 minutes

---

## 📋 Overview

This runbook guides you through connecting the Miyabi Console frontend to the deployed backend API and conducting comprehensive end-to-end integration testing.

**What you'll accomplish**:
1. Configure frontend to connect to backend API
2. Build and deploy production frontend
3. Execute 6 comprehensive E2E test scenarios
4. Verify browser compatibility
5. Setup CloudWatch monitoring dashboard
6. Validate all critical user flows

---

## ✅ Prerequisites

### Backend Services Running (5 min)

**Verify all backend services are healthy**:

```bash
# Get ALB DNS name
cd infrastructure/terraform/environments/dev
ALB_DNS=$(terraform output -raw alb_dns_name)
echo "ALB DNS: ${ALB_DNS}"

# Test backend health
curl -i "http://${ALB_DNS}/health"
# Expected: HTTP/1.1 200 OK

# Check ECS service
aws ecs describe-services \
  --cluster miyabi-cluster-dev \
  --services miyabi-service-dev \
  --region us-west-2 \
  --query 'services[0].{RunningCount:runningCount,DesiredCount:desiredCount,Status:status}'

# Expected: Running 2/2, Status: ACTIVE
```

**Prerequisites Checklist**:
- [ ] Backend API responding on ALB DNS
- [ ] ECS service running 2/2 tasks
- [ ] All tasks status: HEALTHY
- [ ] Database connected (check logs)
- [ ] Redis connected (check logs)

---

## 🔧 Phase 1: Frontend Configuration (10 min)

### Task 1.1: Update Environment Variables

**Navigate to frontend directory**:
```bash
cd miyabi-console
```

**Create production environment file**:
```bash
cat > .env.production <<ENVEOF
# API Configuration
VITE_API_BASE_URL=http://${ALB_DNS}
VITE_WS_URL=ws://${ALB_DNS}/ws

# Environment
VITE_ENV=production
VITE_DEBUG=false

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_NOTIFICATIONS=true
ENVEOF
```

**Verify file created**:
```bash
cat .env.production
```

**Expected output**:
```env
VITE_API_BASE_URL=http://miyabi-alb-dev-XXXXXXXXX.us-west-2.elb.amazonaws.com
VITE_WS_URL=ws://miyabi-alb-dev-XXXXXXXXX.us-west-2.elb.amazonaws.com/ws
VITE_ENV=production
VITE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_NOTIFICATIONS=true
```

---

### Task 1.2: Update API Client Configuration

**Verify API client uses environment variables**:
```bash
grep -n "VITE_API_BASE_URL" src/lib/api/client.ts
```

**Expected**: Should use `import.meta.env.VITE_API_BASE_URL`

---

## 🏗️ Phase 2: Build & Deploy Frontend (15 min)

### Task 2.1: Install Dependencies

```bash
# Check Node version
node --version
# Expected: v18+ or v20+

# Install dependencies
npm install
```

**Expected**: Dependencies installed without errors

---

### Task 2.2: Build Production Bundle

```bash
# Build for production
npm run build

# Check build output
ls -lh dist/
```

**Expected Output**:
```
total 1.2M
-rw-r--r-- 1 user staff  512B Nov 18 10:00 index.html
drwxr-xr-x 3 user staff   96B Nov 18 10:00 assets/
```

**Build Success Criteria**:
- [ ] Build completes without errors
- [ ] No TypeScript compilation errors
- [ ] dist/ directory created
- [ ] index.html exists
- [ ] assets/ directory contains JS/CSS bundles
- [ ] Total bundle size < 5 MB

---

### Task 2.3: Test Build Locally

```bash
# Preview production build
npm run preview
```

**Expected**:
```
  ➜  Local:   http://localhost:4173/
  ➜  Network: use --host to expose
```

**Open browser**: http://localhost:4173

**Verify**:
- [ ] Page loads without errors
- [ ] No console errors
- [ ] Application renders correctly

---

### Task 2.4: Deploy Frontend

**Option A: Local Development Testing**

Use npm preview (already running from Task 2.3)

**Option B: S3 + CloudFront (Production)**

```bash
# Set bucket name
S3_BUCKET="miyabi-console-dev"

# Upload to S3
aws s3 sync dist/ s3://${S3_BUCKET}/ \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html"

# Upload index.html separately (no cache)
aws s3 cp dist/index.html s3://${S3_BUCKET}/index.html \
  --cache-control "no-cache, no-store, must-revalidate"

# Get CloudFront distribution ID
DIST_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Origins.Items[?DomainName=='${S3_BUCKET}.s3.amazonaws.com']].Id | [0]" \
  --output text)

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id ${DIST_ID} \
  --paths "/*"
```

**Option C: Vercel/Netlify**

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod --dir=dist
```

---

## 🧪 Phase 3: E2E Integration Testing (20 min)

### Test 1: Login Flow (3 min)

**Test Steps**:
1. Open browser to frontend URL
2. Should auto-redirect to `/login` page
3. Enter credentials:
   - Email: `admin@miyabi.ai`
   - Password: `password123`
4. Click "Login" button
5. Watch network tab for API call
6. Should redirect to `/dashboard`

**Expected Results**:
- [ ] Login page renders correctly
- [ ] API POST to `/api/v1/auth/login`
- [ ] Response: 200 OK with JWT token
- [ ] Token stored in localStorage
- [ ] Redirect to dashboard successful
- [ ] No console errors

**Troubleshooting**:
- If 401: Check credentials in backend
- If 500: Check backend logs
- If CORS error: Verify ALB allows frontend origin

---

### Test 2: Dashboard Loading (3 min)

**Test Steps**:
1. After login, verify dashboard loads
2. Check all components render
3. Verify API calls complete

**Components to Verify**:
- [ ] Agent hierarchy tree displays
- [ ] System metrics cards show data
- [ ] Recent alerts section renders
- [ ] Activity feed displays
- [ ] No loading spinners stuck

**Network Tab**:
- [ ] GET `/api/v1/agents` - 200 OK
- [ ] GET `/api/v1/metrics` - 200 OK
- [ ] GET `/api/v1/alerts` - 200 OK
- [ ] No 4xx or 5xx errors

**Console Errors**:
- [ ] No JavaScript errors
- [ ] No React warnings
- [ ] No API errors

---

### Test 3: Task Management (5 min)

**Test Steps**:
1. Navigate to `/tasks`
2. Click "+ New Task" button
3. Fill form:
   - Title: "Test Integration Task"
   - Description: "E2E testing from frontend"
   - Priority: "High"
   - Assignee: "MUGEN"
4. Click "Create Task"
5. Verify task appears in list

**Expected Results**:
- [ ] Tasks page loads with task list
- [ ] New task modal opens
- [ ] Form validation works
- [ ] API POST `/api/v1/tasks` - 201 Created
- [ ] New task appears in list
- [ ] Can edit task
- [ ] Can delete task

---

### Test 4: Real-time Logs (3 min)

**Test Steps**:
1. Navigate to `/logs`
2. Verify logs streaming
3. Test filters
4. Test search

**Expected Results**:
- [ ] Logs page renders
- [ ] Real-time log stream connects
- [ ] Logs appear without refresh
- [ ] Filter by level works (INFO, WARN, ERROR)
- [ ] Search functionality works
- [ ] Timestamp formatting correct
- [ ] Can pause/resume stream

**WebSocket Connection**:
- [ ] WS connection established
- [ ] No connection errors in console
- [ ] Logs update in real-time

---

### Test 5: Analytics & Charts (3 min)

**Test Steps**:
1. Navigate to `/analytics`
2. Verify charts render
3. Test date range selector
4. Test metric selection

**Expected Results**:
- [ ] Analytics page renders
- [ ] All charts display data
- [ ] No chart rendering errors
- [ ] Date range selector works
- [ ] Metric dropdowns populate
- [ ] Data updates on filter change
- [ ] Loading states display correctly

---

### Test 6: WebSocket Real-time Updates (3 min)

**Test Steps**:
1. Open dashboard in Browser Tab 1
2. Open new Browser Tab 2
3. In Tab 2: Create a new task
4. Switch to Tab 1: Verify task appears without refresh

**Expected Results**:
- [ ] WebSocket connects on page load
- [ ] Task created in Tab 2
- [ ] Dashboard in Tab 1 updates automatically
- [ ] No page refresh needed
- [ ] Updates appear within 1-2 seconds

**Additional WebSocket Tests**:
- [ ] Agent status changes reflect in real-time
- [ ] System metrics update automatically
- [ ] Alerts appear immediately

---

## 🌐 Phase 4: Browser Compatibility (10 min)

### Test on Multiple Browsers

**Browsers to Test**:
1. **Chrome** (latest)
2. **Firefox** (latest)
3. **Safari** (latest)

**Test Matrix**:

| Feature | Chrome | Firefox | Safari |
|---------|--------|---------|--------|
| Login flow | ⬜ | ⬜ | ⬜ |
| Dashboard render | ⬜ | ⬜ | ⬜ |
| Task creation | ⬜ | ⬜ | ⬜ |
| Charts/Analytics | ⬜ | ⬜ | ⬜ |
| WebSocket | ⬜ | ⬜ | ⬜ |
| No console errors | ⬜ | ⬜ | ⬜ |

**Acceptance Criteria**:
- [ ] All features work in all 3 browsers
- [ ] No browser-specific errors
- [ ] UI renders consistently
- [ ] Performance acceptable in all browsers

---

## 📊 Phase 5: Performance Validation (10 min)

### Task 5.1: Lighthouse Audit

**Run Lighthouse**:
```bash
# Install Lighthouse if needed
npm install -g lighthouse

# Run audit
lighthouse http://localhost:4173 \
  --only-categories=performance,accessibility,best-practices \
  --output=html \
  --output-path=./lighthouse-report.html

# Open report
open lighthouse-report.html
```

**Performance Targets**:
- Performance Score: > 85
- Accessibility: > 90
- Best Practices: > 85
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s

---

### Task 5.2: Load Testing

**Test API endpoints**:
```bash
# Install Apache Bench if needed
brew install apache-bench  # macOS

# Test health endpoint
ab -n 1000 -c 10 "http://${ALB_DNS}/health"

# Test auth endpoint (POST)
ab -n 100 -c 5 -p login.json -T application/json \
  "http://${ALB_DNS}/api/v1/auth/login"
```

**Performance Expectations**:
- Throughput: > 50 requests/sec
- Average latency: < 200ms
- 95th percentile: < 500ms
- Error rate: < 1%

---

## 🔧 Troubleshooting

### Problem 1: Frontend Can't Connect to Backend

**Symptoms**: Network errors, CORS errors, connection refused

**Check**:
```bash
# Test backend directly
curl -i "http://${ALB_DNS}/health"

# Check CORS headers
curl -i -H "Origin: http://localhost:4173" \
  "http://${ALB_DNS}/api/v1/agents"
```

**Solutions**:
1. Verify ALB DNS in .env.production
2. Check backend CORS configuration
3. Verify ALB security group allows HTTP
4. Check ECS tasks are running

---

### Problem 2: Login Fails (401 Unauthorized)

**Check Backend Logs**:
```bash
aws logs tail /ecs/miyabi-dev --follow --filter-pattern "auth"
```

**Common Causes**:
- Wrong credentials
- Database not seeded with user
- JWT secret mismatch

**Solution**:
```bash
# Check if admin user exists
# Connect to database and verify users table
```

---

### Problem 3: WebSocket Won't Connect

**Check**:
1. WebSocket URL correct in .env (`ws://` not `wss://`)
2. Backend supports WebSocket connections
3. ALB configured for WebSocket (sticky sessions)

**Debug**:
```javascript
// In browser console
const ws = new WebSocket('ws://YOUR_ALB_DNS/ws');
ws.onopen = () => console.log('Connected');
ws.onerror = (e) => console.error('Error:', e);
```

---

### Problem 4: Charts Not Rendering

**Check**:
1. API returning data: Check network tab
2. Data format matches chart expectations
3. No JavaScript errors in console

**Debug**:
```javascript
// Check API response
fetch('http://YOUR_ALB_DNS/api/v1/metrics')
  .then(r => r.json())
  .then(console.log);
```

---

## 📋 Post-Testing Checklist

### Functional Tests
- [ ] All 6 E2E tests passing
- [ ] No console errors
- [ ] No network errors
- [ ] WebSocket connected
- [ ] Real-time updates working

### Performance
- [ ] Lighthouse score > 85
- [ ] Page load < 3 seconds
- [ ] API latency < 200ms
- [ ] No memory leaks

### Browser Compatibility
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Responsive on mobile

### Security
- [ ] HTTPS enabled (if production)
- [ ] XSS protection active
- [ ] CORS configured correctly
- [ ] Auth tokens secure
- [ ] Sensitive data not logged

---

## 🎯 Success Criteria

✅ **Integration Complete** when:
1. All 6 E2E tests pass
2. No critical bugs found
3. Performance targets met
4. Browser compatibility verified
5. WebSocket real-time updates working
6. CloudWatch monitoring active
7. Documentation updated

---

## 📝 Next Steps

After successful integration testing:

1. **Document Test Results** - Create test report
2. **Fix Any Issues** - Address bugs found during testing
3. **Setup Production** - Apply to production environment
4. **User Acceptance Testing** - Conduct UAT with stakeholders
5. **Go Live** - Deploy to production

---

**Runbook Version**: 1.0  
**Last Updated**: 2025-11-18  
**Owner**: Miyabi DevOps Team  
**Status**: Ready for Execution
