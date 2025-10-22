# Test Suite Documentation

This directory contains all automated tests for the YouTube GPT application.

## 📁 Directory Structure

```
tests/
├── setup/              # Test configuration and setup files
│   └── vitest.setup.ts # Global test setup (mocks, environment)
├── unit/               # Unit tests for individual modules
│   ├── lib/           # Tests for utility functions and services
│   │   ├── auth.test.ts      # Auth helper functions tests
│   │   └── client.test.ts    # Supabase client configuration tests
│   ├── contexts/      # Tests for React contexts
│   │   └── AuthContext.test.tsx  # AuthContext provider and hooks tests
│   └── pages/         # Tests for page components
│       └── Index.test.tsx    # Protected route and layout tests
└── integration/       # Integration tests (future)
```

## 🧪 Test Types

### Unit Tests (`tests/unit/`)

Test individual components, functions, and modules in isolation.

**Current Coverage:**

- **Auth Helper Functions** (`lib/auth.test.ts`): Tests for `signInWithMagicLink`, `signOut`, `getCurrentUser`, `getCurrentSession`
- **Supabase Client** (`lib/client.test.ts`): Tests for client initialization and configuration
- **AuthContext** (`contexts/AuthContext.test.tsx`): Tests for authentication state management
- **Index Page** (`pages/Index.test.tsx`): Tests for protected route behavior

### Integration Tests (`tests/integration/`)

Test interactions between multiple components and services. (To be added in future)

## 🚀 Running Tests

### All Tests (Watch Mode)

```bash
npm test
```

### Run Once (CI Mode)

```bash
npm run test:run
```

### With UI Dashboard

```bash
npm run test:ui
```

### With Coverage Report

```bash
npm run test:coverage
```

### Watch Mode

```bash
npm run test:watch
```

## 📊 Coverage Goals

Based on CLAUDE.md guidelines, we target **80%+ code coverage** with focus on:

- ✅ Authentication flow (login, logout, session management)
- ✅ Auth helper functions
- ✅ Protected route redirects
- ✅ State management in contexts
- ✅ Error handling

## 🔧 Test Configuration

### Vitest Config (`vitest.config.ts`)

- **Environment**: jsdom (browser-like environment)
- **Setup Files**: `tests/setup/vitest.setup.ts`
- **Test Pattern**: `tests/**/*.test.{ts,tsx}`
- **Coverage Provider**: v8
- **Coverage Thresholds**: 80% for lines, functions, branches, statements

### Global Setup (`tests/setup/vitest.setup.ts`)

- Cleanup after each test
- Mock `window.location` for navigation tests
- Mock environment variables (Supabase credentials)
- Mock `localStorage`
- Suppress console noise in tests

## 📝 Writing Tests

### Test File Naming

- Unit tests: `[module-name].test.ts` or `[ComponentName].test.tsx`
- Place tests in corresponding directory structure under `tests/unit/`

### Example Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

// Mock dependencies
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    // mocked methods
  },
}));

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Feature A', () => {
    it('should do something specific', () => {
      // Arrange
      const props = { foo: 'bar' };

      // Act
      render(<MyComponent {...props} />);

      // Assert
      expect(screen.getByText('Expected Text')).toBeInTheDocument();
    });
  });
});
```

### Best Practices

1. **Test behavior, not implementation**: Focus on what the component does, not how it does it
2. **Use descriptive test names**: "should redirect to login when user is not authenticated"
3. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
4. **Mock external dependencies**: Use vi.mock() for Supabase client, API calls, etc.
5. **Clean up after each test**: Use beforeEach/afterEach hooks
6. **Test error cases**: Don't just test happy paths

## 🎯 Current Test Coverage

### Authentication Module

- ✅ **Auth Helpers** (100% coverage)
  - Magic link sending
  - Sign out
  - Get current user
  - Get current session
  - Error handling

- ✅ **AuthContext** (100% coverage)
  - Initial session loading
  - Auth state change listener
  - Login/logout methods
  - State transitions
  - Subscription cleanup

- ✅ **Supabase Client** (80% coverage)
  - Environment variable validation
  - Client initialization
  - Configuration (PKCE flow)

### Protected Routes

- ✅ **Index Page** (100% coverage)
  - Loading states
  - Redirect when unauthenticated
  - Render layout when authenticated
  - Auth state transitions

## 🔮 Future Test Additions

- [ ] Login page component tests
- [ ] Form validation tests
- [ ] Toast notification tests
- [ ] Error boundary tests
- [ ] E2E authentication flow test
- [ ] API integration tests
- [ ] Performance tests

## 🐛 Debugging Tests

### Run specific test file

```bash
npm test auth.test.ts
```

### Run tests matching pattern

```bash
npm test AuthContext
```

### Debug with UI

```bash
npm run test:ui
```

Then click on any test to see detailed output and logs.

### View coverage details

```bash
npm run test:coverage
```

Open `coverage/index.html` in browser for detailed coverage report.

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about/)
- [User Event API](https://testing-library.com/docs/user-event/intro)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

---

**Last Updated**: 2025-10-22
**Test Framework**: Vitest 3.2.4
**Total Test Files**: 4
**Total Test Cases**: 50+
