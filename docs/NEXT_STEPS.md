# Next Steps: Implementing University-Specific Features 🎓

**Status**: Foundation Complete ✅  
**Branch**: `userRoleAssignment`  
**Date**: October 5, 2025

---

## 🎯 What We've Built (Current State)

### User Authentication & Classification
- ✅ Users classified as `student` or `regular` based on email domain
- ✅ Students assigned to their university with:
  - `custom:userType` = "student"
  - `custom:universityName` = "University of Manchester"
  - `custom:universityDomain` = "manchester.ac.uk"
  - `custom:universityCountry` = "United Kingdom"
- ✅ DynamoDB table with 9,000+ university domains
- ✅ Optimized Lambda with parallel queries and caching
- ✅ Clean, maintainable code (7.5/10 score)

### Architecture Foundation
```
┌─────────────┐
│   Cognito   │  Stores user identity + university
│  User Pool  │  - userType: student/regular
└──────┬──────┘  - universityName, universityDomain
       │
       ├─── Token contains all user attributes
       │
       ▼
┌─────────────┐
│   Frontend  │  Reads from token, shows appropriate UI
│   Angular   │  
└─────────────┘
```

---

## 🚀 Phase 1: University-Specific Communities (Next Branch)

**Branch Name**: `feature/university-communities`  
**Estimated Time**: 2-3 days  
**Priority**: HIGH

### Goals
Implement isolated university communities where:
- Manchester students only see Manchester content
- Stanford students only see Stanford content
- Separate from shared "Learn" section

### Backend Tasks

#### 1. Database Schema (DynamoDB)
Create tables for university-specific content:

**UniversityPosts Table:**
```javascript
{
  PK: "UNIV#manchester.ac.uk",           // Partition key
  SK: "POST#2025-10-05#uuid",            // Sort key
  id: "post_uuid",
  title: "Selling Biology Textbook",
  content: "...",
  authorId: "user_ali",
  authorName: "Ali",
  category: "marketplace" | "discussion" | "events",
  createdAt: "2025-10-05T10:00:00Z",
  updatedAt: "2025-10-05T10:00:00Z"
}
```

**GSI (Global Secondary Index):**
- `authorId-createdAt-index` - Get all posts by user
- `category-createdAt-index` - Filter by category

#### 2. API Endpoints
Create Lambda functions + API Gateway routes:

```
GET  /api/university/posts           - Get posts for user's university
POST /api/university/posts           - Create post (students only)
GET  /api/university/posts/{id}      - Get single post
PUT  /api/university/posts/{id}      - Update post (author only)
DELETE /api/university/posts/{id}    - Delete post (author only)

GET  /api/university/marketplace     - University marketplace
POST /api/university/marketplace     - Create marketplace listing

GET  /api/university/events          - University events
POST /api/university/events          - Create event
```

#### 3. Authorization Middleware
```typescript
// middleware/auth.ts
export async function requireStudent(event: APIGatewayProxyEvent) {
  const token = extractToken(event);
  const decoded = verifyJWT(token);
  
  if (decoded['custom:userType'] !== 'student') {
    throw new UnauthorizedError('Students only');
  }
  
  return {
    userId: decoded.sub,
    userType: decoded['custom:userType'],
    universityDomain: decoded['custom:universityDomain'],
    universityName: decoded['custom:universityName'],
  };
}

// Usage in Lambda
export async function handler(event: APIGatewayProxyEvent) {
  const user = await requireStudent(event);
  
  // Query only user's university
  const posts = await getPosts(user.universityDomain);
  
  return success(posts);
}
```

#### 4. Business Logic Layer
```typescript
// services/universityService.ts
export class UniversityService {
  async getPostsForUniversity(universityDomain: string, category?: string) {
    // Query DynamoDB with universityDomain filter
  }
  
  async createPost(userId: string, universityDomain: string, post: CreatePostDto) {
    // Validate user is student
    // Create post in user's university
  }
  
  async validateAccess(userId: string, postId: string) {
    // Ensure user can only access posts from their university
  }
}
```

### Frontend Tasks

#### 1. University Hub Page
```typescript
// src/app/features/university-hub/university-hub.component.ts
@Component({
  selector: 'app-university-hub',
  template: `
    <h1>{{ universityName() }}</h1>
    <p class="text-muted">{{ universityCountry() }}</p>
    
    <nav class="tabs">
      <a routerLink="marketplace">Marketplace</a>
      <a routerLink="discussions">Discussions</a>
      <a routerLink="events">Events</a>
    </nav>
    
    <router-outlet></router-outlet>
  `
})
export class UniversityHubComponent {
  universityName = signal<string>('');
  universityCountry = signal<string>('');
  
  constructor(private authService: AuthService) {
    // Get from JWT token
    this.universityName.set(authService.getUniversityName());
    this.universityCountry.set(authService.getUniversityCountry());
  }
}
```

#### 2. Update Auth Service
```typescript
// src/app/core/auth/auth.service.ts
export class AuthService {
  getUniversityName(): string | null {
    const session = this.session();
    if (!session?.isValid()) return null;
    
    const payload = session.getIdToken().decodePayload();
    return payload['custom:universityName'] || null;
  }
  
  getUniversityDomain(): string | null {
    const session = this.session();
    if (!session?.isValid()) return null;
    
    const payload = session.getIdToken().decodePayload();
    return payload['custom:universityDomain'] || null;
  }
  
  getUniversityCountry(): string | null {
    const session = this.session();
    if (!session?.isValid()) return null;
    
    const payload = session.getIdToken().decodePayload();
    return payload['custom:universityCountry'] || null;
  }
}
```

#### 3. Navigation Guard
```typescript
// src/app/core/auth/university.guard.ts
@Injectable({ providedIn: 'root' })
export class UniversityGuard {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  canActivate(): Observable<boolean | UrlTree> {
    return from(this.authService.ensureSession()).pipe(
      map(() => {
        if (this.authService.getUserType() !== 'student') {
          // Redirect regular users to home
          return this.router.parseUrl('/home');
        }
        return true;
      })
    );
  }
}
```

#### 4. Update Routes
```typescript
// src/app/app.routes.ts
export const routes: Routes = [
  // ... existing routes
  {
    path: 'university',
    loadComponent: () => import('./features/university-hub/university-hub.component'),
    canActivate: [AuthGuard, UniversityGuard], // Must be authenticated student
    children: [
      {
        path: 'marketplace',
        loadComponent: () => import('./features/university-hub/marketplace/marketplace.component')
      },
      {
        path: 'discussions',
        loadComponent: () => import('./features/university-hub/discussions/discussions.component')
      },
      {
        path: 'events',
        loadComponent: () => import('./features/university-hub/events/events.component')
      }
    ]
  }
];
```

---

## 🌍 Phase 2: Shared "Learn" Section

**Branch Name**: `feature/learn-section`  
**Estimated Time**: 1-2 days  
**Priority**: MEDIUM

### Goals
Create public knowledge base accessible to ALL users (students + regular):
- Anyone can browse
- Anyone can contribute
- No university filtering

### Implementation
Similar to Phase 1, but:
- No university filtering in queries
- Different DynamoDB table: `SharedContent`
- Different API routes: `/api/learn/*`
- No student-only restriction

---

## 📊 Phase 3: Analytics & Moderation

**Branch Name**: `feature/analytics-moderation`  
**Estimated Time**: 2-3 days  
**Priority**: LOW (nice to have)

### Features
- View post statistics
- Flag inappropriate content
- University admin roles
- Content reporting system

---

## 🔐 Phase 4: Enhanced Security

**Branch Name**: `feature/security-enhancements`  
**Estimated Time**: 2 days  
**Priority**: HIGH (before production)

### Tasks
1. **Input Validation & Sanitization** (from Code Review Issue #2)
   - Install `validator` and `DOMPurify`
   - Validate all user inputs
   - Sanitize HTML content

2. **Rate Limiting**
   - Add API Gateway throttling
   - Implement per-user rate limits

3. **University Email Verification**
   - Send verification code to university email
   - Prevent fake student accounts

4. **Token Security**
   - Move from localStorage to httpOnly cookies
   - Implement refresh token rotation

---

## 🗂️ Recommended File Structure

```
mwsoo3a/
├── backend/
│   ├── docs/
│   │   ├── API_GATEWAY_SETUP.md
│   │   ├── CORS_FIX_SUMMARY.md
│   │   └── ARCHITECTURE.md (new)
│   ├── lambda/
│   │   ├── register-user/
│   │   ├── university-posts/         (Phase 1)
│   │   ├── shared-content/           (Phase 2)
│   │   └── common/
│   │       ├── middleware/
│   │       ├── services/
│   │       └── utils/
│   └── scripts/
│       ├── import-domains.js
│       └── add-university-attributes.md
│
├── frontend/
│   ├── docs/
│   │   └── ROUTING.md (new)
│   └── src/
│       └── app/
│           ├── core/
│           │   └── auth/
│           ├── features/
│           │   ├── auth/
│           │   ├── home/
│           │   ├── university-hub/   (Phase 1)
│           │   │   ├── marketplace/
│           │   │   ├── discussions/
│           │   │   └── events/
│           │   └── learn/             (Phase 2)
│           └── shared/
│               ├── components/
│               └── services/
│
└── CODE_REVIEW_REPORT.md
```

---

## 🎨 UI/UX Recommendations

### Navigation Example
```
┌─────────────────────────────────────┐
│  Logo    Home   University   Learn  │  ← Students see "University"
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Logo    Home   Learn               │  ← Regular users don't
└─────────────────────────────────────┘
```

### University Hub UI Mockup
```
╔════════════════════════════════════════╗
║  University of Manchester 🏛️           ║
║  United Kingdom                        ║
╠════════════════════════════════════════╣
║  [Marketplace] [Discussions] [Events]  ║
╠════════════════════════════════════════╣
║                                        ║
║  📚 Selling: Introduction to Biology   ║
║  Posted by: Ali • 2 hours ago          ║
║                                        ║
║  💬 Study Group for Math 101           ║
║  Posted by: Sarah • 5 hours ago        ║
║                                        ║
║  🎉 Campus Event: Tech Talk            ║
║  Posted by: Events Team • 1 day ago    ║
║                                        ║
╚════════════════════════════════════════╝
```

---

## 📝 Testing Strategy

### Unit Tests
```typescript
// Lambda tests
describe('UniversityService', () => {
  it('should only return posts from user university', async () => {
    const posts = await service.getPostsForUniversity('manchester.ac.uk');
    expect(posts.every(p => p.universityDomain === 'manchester.ac.uk')).toBe(true);
  });
  
  it('should prevent cross-university access', async () => {
    await expect(
      service.accessPost('stanford-user', 'manchester-post-id')
    ).rejects.toThrow('Unauthorized');
  });
});
```

### E2E Tests
```typescript
// Cypress/Playwright
describe('University Hub', () => {
  it('Manchester student sees only Manchester content', () => {
    cy.login('ali@student.manchester.ac.uk');
    cy.visit('/university/marketplace');
    cy.get('[data-testid="post"]').should('have.attr', 'data-university', 'manchester.ac.uk');
  });
  
  it('Regular user cannot access university hub', () => {
    cy.login('regular@gmail.com');
    cy.visit('/university');
    cy.url().should('include', '/home'); // Redirected
  });
});
```

---

## 🚦 Deployment Checklist

Before deploying university features to production:

- [ ] All custom attributes added to Cognito
- [ ] DynamoDB tables created with proper indexes
- [ ] Lambda functions deployed with correct permissions
- [ ] API Gateway routes configured
- [ ] CORS headers updated
- [ ] Frontend environment variables set
- [ ] Unit tests passing (>80% coverage)
- [ ] E2E tests passing
- [ ] Security review completed
- [ ] Load testing completed
- [ ] CloudWatch alarms configured
- [ ] Backup strategy in place

---

## 📚 Resources

- [AWS Cognito Custom Attributes](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-attributes.html)
- [DynamoDB Single Table Design](https://www.alexdebrie.com/posts/dynamodb-single-table/)
- [Angular Route Guards](https://angular.io/guide/router#preventing-unauthorized-access)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

## 💬 Questions?

If you need help implementing any of these phases, refer to:
1. `backend/docs/` - Backend architecture docs
2. `frontend/docs/` - Frontend routing & component docs
3. `CODE_REVIEW_REPORT.md` - Technical debt & code quality

---

**Happy coding! 🚀**
