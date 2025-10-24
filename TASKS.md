# YouTube-GPT Test Cases

## Aspect 1: Authentication & User Management

### 1.1 AuthContext Provider Tests
**File**: `tests/unit/contexts/AuthContext.test.tsx`

#### Test Cases:
- **1.1.1** Provider renders children correctly
- **1.1.2** Initial state is correct (user: null, session: null, isLoading: true)
- **1.1.3** Hydration state management works correctly
- **1.1.4** Context throws error when used outside AuthProvider
- **1.1.5** Context provides correct interface (user, session, login, logout, isLoading)

### 1.2 Authentication Flow Tests
**File**: `tests/unit/contexts/AuthContext.test.tsx`

#### Login Function Tests:
- **1.2.1** Login with valid email calls supabase.auth.signInWithOtp correctly (use test@example.com)
- **1.2.2** Login with valid email sets correct redirect URL
- **1.2.3** Login with invalid email format throws error
- **1.2.4** Login with empty email throws error
- **1.2.5** Login with null/undefined email throws error
- **1.2.6** Login handles Supabase auth errors correctly
- **1.2.7** Login handles network errors gracefully
- **1.2.8** Login updates loading state during process

#### Logout Function Tests:
- **1.2.9** Logout calls supabase.auth.signOut correctly
- **1.2.10** Logout handles Supabase auth errors correctly
- **1.2.11** Logout handles network errors gracefully
- **1.2.12** Logout updates loading state during process

### 1.3 Session Management Tests
**File**: `tests/unit/contexts/AuthContext.test.tsx`

#### Initial Session Loading:
- **1.3.1** getSession() is called on component mount
- **1.3.2** Loading state is true during initial session fetch
- **1.3.3** Loading state becomes false after session fetch completes
- **1.3.4** User and session are set correctly when valid session exists
- **1.3.5** User and session are null when no session exists
- **1.3.6** Error handling when getSession() fails

#### Auth State Change Listener:
- **1.3.7** onAuthStateChange listener is set up correctly
- **1.3.8** SIGNED_IN event updates user and session correctly
- **1.3.9** SIGNED_OUT event clears user and session correctly
- **1.3.10** TOKEN_REFRESHED event updates session correctly
- **1.3.11** Auth state changes update loading state correctly
- **1.3.12** Listener cleanup on component unmount

### 1.4 useAuth Hook Tests
**File**: `tests/unit/hooks/useAuth.test.ts`

#### Hook Behavior:
- **1.4.1** Hook returns correct context values
- **1.4.2** Hook throws error when used outside AuthProvider
- **1.4.3** Hook updates when context values change
- **1.4.4** Hook maintains referential stability for stable values

### 1.5 Supabase Client Configuration Tests
**File**: `tests/unit/lib/supabase/client.test.ts`

#### Environment Variables:
- **1.5.1** Client creation succeeds with valid environment variables
- **1.5.2** Client creation throws error when NEXT_SUPABASE_URL is missing
- **1.5.3** Client creation throws error when NEXT_SUPABASE_ANON_KEY is missing
- **1.5.4** Client creation throws error when both environment variables are missing
- **1.5.5** Error message includes helpful instructions for missing variables

#### Client Configuration:
- **1.5.6** Client is configured with correct auth options (persistSession: true)
- **1.5.7** Client is configured with correct auth options (autoRefreshToken: true)
- **1.5.8** Client is configured with correct auth options (detectSessionInUrl: true)
- **1.5.9** Client is configured with correct auth options (flowType: 'pkce')
- **1.5.10** Client is a singleton instance

### 1.6 Integration Tests
**File**: `tests/integration/auth-flow.test.ts`

#### Complete Authentication Flow:
- **1.6.1** User can complete full login flow (email → magic link → authenticated)
- **1.6.2** User can complete full logout flow (authenticated → logout → unauthenticated)
- **1.6.3** Session persists across page refreshes
- **1.6.4** Session persists across browser restarts (localStorage)
- **1.6.5** Multiple tabs maintain consistent auth state
- **1.6.6** Auth state updates propagate across tabs
- **1.6.7** Magic link callback URL handling works correctly
- **1.6.8** Token refresh happens automatically before expiration
- **1.6.9** Auth state is restored correctly on app initialization

### 1.7 Error Handling Tests
**File**: `tests/unit/contexts/AuthContext.test.tsx`

#### Network Errors:
- **1.7.1** Login handles network timeout errors
- **1.7.2** Login handles connection refused errors
- **1.7.3** Logout handles network timeout errors
- **1.7.4** Session fetch handles network errors
- **1.7.5** Auth state change listener handles network errors

#### Supabase Errors:
- **1.7.6** Login handles invalid email errors
- **1.7.7** Login handles rate limiting errors
- **1.7.8** Login handles server errors (500, 503)
- **1.7.9** Logout handles server errors
- **1.7.10** Session fetch handles server errors

### 1.8 Edge Cases Tests
**File**: `tests/unit/contexts/AuthContext.test.tsx`

#### Edge Cases:
- **1.8.1** Component unmounts during login process
- **1.8.2** Component unmounts during logout process
- **1.8.3** Component unmounts during session fetch
- **1.8.4** Multiple rapid login attempts
- **1.8.5** Multiple rapid logout attempts
- **1.8.6** Login with very long email addresses
- **1.8.7** Login with special characters in email
- **1.8.8** Session expires during app usage
- **1.8.9** Invalid session data handling
- **1.8.10** Corrupted localStorage data handling

### 1.9 Performance Tests
**File**: `tests/unit/contexts/AuthContext.test.tsx`

#### Performance:
- **1.9.1** Auth context doesn't cause unnecessary re-renders
- **1.9.2** Auth state changes are batched correctly
- **1.9.3** Memory leaks are prevented on component unmount
- **1.9.4** Auth listener cleanup prevents memory leaks
- **1.9.5** Multiple AuthProvider instances don't conflict

---

## Next Aspect: YouTube URL Processing & Detection
