# To-Do List - Encyclopedia Feature

**Date:** October 10, 2025  
**Current Status:** Admin Encyclopedia ✅ Complete & Deployed

---

## 🔴 HIGH PRIORITY - Student Encyclopedia Lambda Security Fixes

**Status:** ⚠️ CRITICAL VULNERABILITIES FOUND

### Issues Found in Student Lambda:

1. **🔴 CRITICAL: JWT Not Verified**
   - Currently: `jwt.decode(token)` - only Base64 decoding (same vulnerability as Admin had!)
   - Risk: Anyone can forge student tokens
   - Fix: Install `aws-jwt-verify` and verify cryptographically
   - Time: 30 min

2. **🟡 No Input Validation**
   - No validation layer for note uploads
   - Risk: Injection attacks, invalid data
   - Fix: Create validation.ts (copy from admin-encyclopedia)
   - Time: 20 min

3. **🟡 No Soft Delete Filtering**
   - Queries don't filter `active = true`
   - Risk: Deleted items appear in results
   - Fix: Add FilterExpression to all queries
   - Time: 15 min

4. **🟢 Missing Environment Variables**
   - Needs USER_POOL_ID and CLIENT_ID
   - Fix: Update environment.ts and Lambda config
   - Time: 10 min

**Total Time:** ~1.5 hours to secure Student Lambda

---

## 📋 Complete To-Do List

### Phase 1: Student Lambda Security (URGENT)
- [ ] Install aws-jwt-verify package
- [ ] Update auth.ts with CognitoJwtVerifier
- [ ] Add USER_POOL_ID and CLIENT_ID to environment.ts
- [ ] Create validation.ts for note uploads
- [ ] Add soft delete filtering to browse queries
- [ ] Build and deploy to AWS
- [ ] Configure environment variables in Lambda

### Phase 2: Student Frontend UI (HIGH)
- [ ] Create StudentEncyclopediaComponent
- [ ] Create BrowseDegreesComponent (list degrees by university)
- [ ] Create BrowseCoursesComponent (list courses by degree)
- [ ] Create CourseNotesComponent (view/upload notes)
- [ ] Add routes to app.routes.ts
- [ ] Create student encyclopedia service
- [ ] Add navigation links
- [ ] Test full flow

### Phase 3: Notes Management (MEDIUM)
- [ ] Student can upload notes (PDF, DOCX, images)
- [ ] Student can download notes
- [ ] Student can view note previews
- [ ] Note categorization (lecture, lab, assignment, exam)
- [ ] Note search and filtering
- [ ] S3 integration for file storage

### Phase 4: University Onboarding (MEDIUM)
- [ ] Admin can register their university
- [ ] Verify email domain matches university
- [ ] University logo upload
- [ ] University profile page
- [ ] List of all universities

### Phase 5: Testing & Polish (MEDIUM)
- [ ] Integration testing with real Cognito tokens
- [ ] Test admin creates degree → student sees it
- [ ] Test authorization (403 responses)
- [ ] CloudWatch monitoring and alarms
- [ ] Error tracking setup
- [ ] Performance testing

### Phase 6: Documentation (LOW)
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Admin user guide
- [ ] Student user guide
- [ ] Deployment guide for new environments
- [ ] Architecture diagrams

### Phase 7: Production Hardening (OPTIONAL)
- [ ] Rate limiting on API Gateway
- [ ] CloudFront CDN for frontend
- [ ] Database backups and disaster recovery
- [ ] Security headers (CSP, HSTS)
- [ ] WAF rules for DDoS protection
- [ ] Cost monitoring and alerts

---

## 🎯 Next Immediate Steps (In Order)

### TODAY (2-3 hours):
1. ✅ Fix Student Lambda JWT verification (30 min) - **CRITICAL**
2. ✅ Add validation and soft delete filtering (35 min)
3. ✅ Deploy Student Lambda (15 min)
4. ✅ Build Student UI - Browse Degrees (30 min)
5. ✅ Build Student UI - Browse Courses (30 min)

### THIS WEEK:
6. ⏳ Notes upload/download functionality (2-3 hours)
7. ⏳ University onboarding (1 hour)
8. ⏳ Integration testing (2 hours)

### NEXT WEEK:
9. ⏳ Documentation and polish
10. ⏳ Production hardening

---

## 📊 Progress Tracker

| Feature | Backend | Frontend | Tested | Deployed | Status |
|---------|---------|----------|--------|----------|--------|
| **ADMIN** |
| Admin Degrees | ✅ | ✅ | ⏳ | ✅ | Complete |
| Admin Courses | ✅ | ✅ | ⏳ | ✅ | Complete |
| **STUDENT** |
| Browse Degrees | ⚠️ | ❌ | ❌ | ❌ | Vulnerable |
| Browse Courses | ⚠️ | ❌ | ❌ | ❌ | Vulnerable |
| View Notes | ⚠️ | ❌ | ❌ | ❌ | Vulnerable |
| Upload Notes | ⚠️ | ❌ | ❌ | ❌ | Vulnerable |
| **OTHER** |
| University Setup | ❌ | ❌ | ❌ | ❌ | Not Started |
| Note Search | ❌ | ❌ | ❌ | ❌ | Not Started |

**Overall Progress:** 40% Complete  
**Security Status:** ⚠️ Student Lambda has critical JWT vulnerability  

---

## 🚨 Critical Security Note

**IMPORTANT:** Student Lambda has the SAME critical JWT vulnerability we just fixed in Admin Lambda!

The current code does:
```typescript
const decoded = jwt.decode(token) as TokenPayload;
```

This is **NOT SECURE** - it only Base64 decodes without verifying the signature. Anyone can forge a token!

**Must fix before allowing students to use the app.**

---

## 💰 Time Estimates

- **Student Lambda Security:** 1.5 hours
- **Student Frontend UI:** 2-3 hours
- **Notes Management:** 2-3 hours
- **University Onboarding:** 1 hour
- **Testing:** 2-3 hours
- **Documentation:** 2 hours

**Total to MVP:** ~10-13 hours of focused work  
**Total to Production:** ~15-20 hours

---

## 🎯 Recommended Next Action

**Start with Student Lambda Security Fixes** (RIGHT NOW)

This is critical because:
1. Same vulnerability as Admin Lambda had
2. Students could forge tokens and access any university's data
3. Only takes 1.5 hours to fix
4. Blocks progress on frontend until secured

After that, build the student UI and you'll have a working MVP!
