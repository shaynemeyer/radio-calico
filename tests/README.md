# RadioCalico Testing Framework

This directory contains comprehensive tests for the RadioCalico rating system, covering both frontend and backend functionality.

## Test Structure

```
tests/
├── api/               # Backend API tests using Jest + Supertest
│   └── ratings.test.js
├── frontend/          # Frontend unit tests using Jest + jsdom
│   └── rating-system.test.js
├── integration/       # E2E tests using Playwright
│   └── rating-e2e.spec.js
├── setup/            # Test configuration and utilities
│   ├── backend-setup.js
│   ├── frontend-setup.js
│   ├── test-db.js
│   └── msw-server.js
├── mocks/            # Mock data for tests
│   └── metadata.json
└── README.md
```

## Running Tests

### All Tests
```bash
npm test              # Run Jest tests (backend + frontend)
npm run test:all      # Run Jest + Playwright tests
```

### Specific Test Suites
```bash
npm run test:backend     # Backend API tests only
npm run test:frontend    # Frontend unit tests only
npm run test:integration # Playwright E2E tests only
```

### Development
```bash
npm run test:watch      # Watch mode for Jest tests
npm run test:coverage   # Generate coverage reports
```

## Test Coverage

### Backend API Tests (`tests/api/ratings.test.js`)
- **POST /api/songs/rate** - Rating submission validation
- **GET /api/songs/:songId/ratings** - Rating aggregation
- **GET /api/songs/:songId/user-rating/:userSession** - User-specific ratings
- Database constraints and error handling
- In-memory SQLite for isolated testing

### Frontend Unit Tests (`tests/frontend/rating-system.test.js`)
- Song ID generation and consistency
- User session management with localStorage
- Rating submission API calls
- Rating display updates
- DOM interactions and event handling
- Error handling for network failures

### Integration Tests (`tests/integration/rating-e2e.spec.js`)
- Complete user rating flows
- Multi-user scenarios
- Session persistence across page reloads
- UI element interactions
- Network error handling
- Data persistence verification

## Key Features

### Test Database
- In-memory SQLite for fast, isolated backend tests
- Automatic setup/teardown between test runs
- Same schema as production database

### API Mocking
- Mock Service Worker (MSW) for frontend tests
- Consistent mock responses for external APIs
- Graceful error scenario testing

### Cross-Browser Testing
- Playwright tests run on Chromium, Firefox, and WebKit
- Automated browser installation and management
- Parallel test execution

### Coverage Reporting
- Line, branch, and function coverage
- HTML and LCOV report formats
- Focus on rating system components

## Configuration Files

- `jest.config.js` - Jest configuration for multiple projects
- `playwright.config.js` - Playwright E2E test configuration
- `tests/setup/` - Shared test utilities and mocks

## Test Data

All tests use consistent mock data for:
- Song metadata from external API
- User sessions and rating submissions
- Database records and API responses

This ensures predictable test behavior and easy maintenance.