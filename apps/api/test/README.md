# DNA API Testing Guide

## Overview
This test suite provides comprehensive end-to-end (e2e) testing for all DNA API endpoints.

## Test Files

### 1. **auth.e2e-spec.ts**
Tests authentication endpoints:
- Login with valid/invalid credentials
- Password reset flow
- Token generation

### 2. **users.e2e-spec.ts**
Tests user management:
- Create users with different roles
- Get all users
- Update user information
- Toggle user status
- Authorization checks

### 3. **referees.e2e-spec.ts**
Tests referee management:
- Create referee profiles (two-step process)
- Get referees with filters (category, region)
- Update referee information
- Duplicate matricule handling

### 4. **matches.e2e-spec.ts**
Tests match management:
- Create matches
- Get matches with filters
- Update match information
- Validation of competition and category

### 5. **designations.e2e-spec.ts**
Tests designation system:
- Create designations
- Get AI referee suggestions
- Override designations (NEW ADDON)
- View override history

### 6. **training-resources.e2e-spec.ts** (NEW ADDON)
Tests training resources:
- Create training videos/documents
- Track video views
- Rate resources
- Filter by type and category

### 7. **inspector-reports.e2e-spec.ts** (NEW ADDON)
Tests inspector evaluation system:
- Create inspector reports with technical scores
- Calculate overall scores automatically
- Submit and validate reports
- Get latest report for referee

### 8. **statistics.e2e-spec.ts** (NEW ADDON)
Tests statistics endpoints:
- Get rankings by category
- Speed chart data for radar charts
- Comparative analysis
- Progression tracking

## Running Tests

### Run All Tests
```bash
npm run test:e2e
```

### Run Specific Test File
```bash
npm run test:e2e -- auth.e2e-spec.ts
npm run test:e2e -- referees.e2e-spec.ts
npm run test:e2e -- designations.e2e-spec.ts
```

### Run with Coverage
```bash
npm run test:e2e -- --coverage
```

### Watch Mode (for development)
```bash
npm run test:e2e -- --watch
```

## Test Structure

Each test file follows this pattern:

```typescript
describe('Module (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    // Setup app
  });

  afterAll(async () => {
    // Cleanup
  });

  beforeEach(async () => {
    // Reset database
    // Create admin user
    // Get auth token
  });

  describe('/api/endpoint (METHOD)', () => {
    it('should handle success case', async () => {
      // Test implementation
    });

    it('should handle error case', async () => {
      // Test implementation
    });
  });
});
```

## Test Coverage

### Core Modules (100% endpoint coverage)
- ✅ Authentication (3 endpoints)
- ✅ Users (7 endpoints)
- ✅ Referees (8 endpoints)
- ✅ Matches (7 endpoints)
- ✅ Designations (12 endpoints including overrides)

### NEW ADDON Modules (100% endpoint coverage)
- ✅ Training Resources (9 endpoints)
- ✅ Inspector Reports (9 endpoints)
- ✅ Statistics (5 endpoints)

## Key Test Scenarios

### 1. Authentication Flow
```typescript
// Create user -> Login -> Get token -> Use token for requests
```

### 2. Two-Step Profile Creation
```typescript
// Create User (role: ARBITRE)
// Create Referee (userId from step 1)
```

### 3. Designation Override (ADDON Feature)
```typescript
// Create designation
// Override with new referees
// Check override history
// Revert if needed
```

### 4. Inspector Report Scoring
```typescript
// Create report with 5 technical scores
// Verify overall score = average of 5 scores
// Check composite with commissioner reports (60/40)
```

### 5. Training Resource Tracking
```typescript
// Create resource
// Track view (increment viewsCount)
// Rate resource (1-5 stars)
// Calculate average rating
```

## Database Setup

Tests use in-memory or test database:
- Each test file cleans up before/after
- `beforeEach` resets collections
- Creates fresh admin user for each test
- Isolated test data

## Environment Variables

Create `.env.test` file:
```env
MONGODB_URI=mongodb://localhost:27017/dna-test
JWT_SECRET=test-secret-key
JWT_EXPIRATION=1h
```

## Common Assertions

```typescript
// Success response
expect(response.status).toBe(200);
expect(response.body).toHaveProperty('_id');

// Array response
expect(response.body).toBeInstanceOf(Array);
expect(response.body.length).toBeGreaterThan(0);

// Validation error
expect(response.status).toBe(400);

// Not found
expect(response.status).toBe(404);

// Unauthorized
expect(response.status).toBe(401);

// Forbidden
expect(response.status).toBe(403);

// Conflict (duplicate)
expect(response.status).toBe(409);
```

## Testing Best Practices

1. **Isolation**: Each test is independent
2. **Cleanup**: Always clean up after tests
3. **Real Data**: Use realistic test data
4. **Edge Cases**: Test invalid inputs
5. **Authorization**: Test permission checks
6. **Validation**: Test DTO validation
7. **Business Logic**: Test complex scenarios

## Continuous Integration

Add to `.github/workflows/test.yml`:
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:e2e
```

## Troubleshooting

### Tests Failing?
1. Check MongoDB connection
2. Verify environment variables
3. Clear test database
4. Check for port conflicts
5. Update dependencies

### Slow Tests?
1. Use in-memory database
2. Reduce test data size
3. Parallel test execution
4. Mock external services

## Next Steps

To add more tests:
1. Create new test file: `test/module-name.e2e-spec.ts`
2. Follow existing test structure
3. Test all CRUD operations
4. Test authorization
5. Test edge cases
6. Run and verify

## Test Coverage Report

After running tests with coverage:
```bash
npm run test:e2e -- --coverage
```

View report in `coverage/lcov-report/index.html`
