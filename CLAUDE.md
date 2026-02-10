# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FORCE is a React Native fitness tracking app built with Expo SDK 54. It provides workout tracking, exercise library, body measurements, recovery tracking, and volume analysis features.

## Development Commands

```bash
# Start development server
npm start

# Run on specific platforms
npm run android
npm run ios
npm run web

# Linting and formatting
npm run lint
npm run format              # Format all files
npm run format:check        # Check formatting without modifying

# Testing
npm test                    # Run all tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage report
```

## Architecture

### Routing
- **File-based routing** via expo-router (v6)
- Route groups use parentheses: `(home)`, `(auth)`, `(active-workout)`, etc.
- All routes defined in `app/_layout.tsx` using `<Stack.Screen>` components
- Routes are wrapped by `AuthCheck` component for authentication management

### State Management
- **Zustand** for all state management
- Stores located in `state/stores/`:
  - `userStore.ts` - User profile data
  - `workoutStore.ts` - Workout data and history
  - `activeWorkoutStore.ts` - Active workout session state
  - `homeStore.ts` - Home screen loading states
  - `dateStore.ts` - Calendar and date selection
  - `supplementStore.ts` - Supplement tracking
  - `todayStore.ts` - Today's workout data
- **IMPORTANT**: `state/userStore.ts` is a re-export shim for backward compatibility. All consumers import from `@/state/userStore`, not from barrel files.

### API Layer
- **Centralized API client** in `api/APIClient.ts` using axios
- Request interceptor automatically adds Bearer token to all requests
- Response interceptor handles 401 errors with automatic token refresh
- API services in `api/` directory: `Auth.ts`, `Workout.ts`, `Exercises.ts`, `Measurements.ts`, etc.
- Type definitions centralized in `api/types/`
- Base URL management in `api/ApiBase.ts` with dynamic URL switching support

### Authentication Flow
- `AuthCheck` component wraps entire app in `app/_layout.tsx`
- On app start, checks for tokens and validates refresh token
- If no tokens: shows hero screen (first launch) or auth screen
- If tokens exist: validates refresh token and routes to home
- Token refresh happens automatically via axios interceptor
- Global event emitter (`triggerTokenError`) forces re-authentication on token errors
- Tokens stored in secure storage via `api/Storage.ts`

### Import Pattern
**CRITICAL**: This codebase does NOT use barrel imports.
- ✅ Import directly from individual files: `import { useTimer } from '@/hooks/useTimer'`
- ❌ DO NOT import from index files: `import { useTimer } from '@/hooks'`
- All consumers must import from specific file paths
- Platform-specific files use `.web.ts` suffix for web-only implementations

### Path Aliases
- `@/*` maps to project root (configured in `tsconfig.json`)
- Examples: `@/api/Auth`, `@/components/AuthCheck`, `@/state/userStore`

### Testing
- Jest with React Native Testing Library
- Configuration in `jest.config.js` and `jest.setup.js`
- Tests co-located with source files in `__tests__/` directories
- Test files use `.test.ts` or `.test.tsx` extension

## Key Components

### AuthCheck (`components/AuthCheck.tsx`)
- Wraps entire app to manage authentication state
- Shows branded loading screen during auth validation
- Validates tokens on app start and after token errors
- Routes to hero screen (first launch), auth screen (no tokens), or home screen (authenticated)
- Exposes `triggerTokenError()` for forcing re-authentication from API interceptor

### BottomNavigator (`components/BottomNavigator.tsx`)
- Global bottom navigation bar
- Rendered at root level in `app/_layout.tsx` alongside routing stack

### SwipeAction
- Reusable swipe gesture component used across exercise cards
- Enables delete/edit actions via swipe gestures

## API Client Details

### Token Refresh Flow
1. Request fails with 401
2. Interceptor queues failed request
3. Attempts token refresh using refresh token
4. If successful: retries all queued requests with new token
5. If failed: clears tokens and triggers `triggerTokenError()` to re-authenticate

### Error Handling
- Network errors: keeps tokens, assumes valid, continues to home
- Auth errors (401/403): clears tokens, triggers re-authentication
- Centralized error handling in `api/errorHandler.ts`

## Platform-Specific Code

### iOS
- HealthKit integration via `react-native-health`
- Info.plist permissions for health data access

### Android
- Google Fit integration via `react-native-google-fit`
- Network security config for cleartext traffic (development)
- Edge-to-edge enabled, predictive back gesture disabled

### Web
- Platform-specific files use `.web.ts` suffix
- Static output configured in `app.json`

## Expo Configuration

### Plugins
- `react-native-health` - iOS HealthKit
- `expo-router` - File-based routing
- `expo-splash-screen` - Branded splash screen
- `expo-build-properties` - Android network config
- Custom plugins: `withImmersiveMode`, `withHealthKit`, `withGoogleFit`

### Experiments
- `typedRoutes: true` - Type-safe routing with expo-router
- `reactCompiler: true` - React Compiler enabled
- `newArchEnabled: true` - New React Native architecture

## Code Style

### Formatting
- Prettier for code formatting (config in `.prettierrc`)
- Run `npm run format` before committing
- ESLint with expo config and prettier integration

### State Updates
- Use Zustand actions for state mutations
- Keep state minimal and derived values computed
- Avoid duplicating state across multiple stores

### Type Safety
- TypeScript strict mode enabled
- Type all API responses using types from `api/types/`
- Avoid `any` types; use proper type definitions

## Common Patterns

### Making API Calls
```typescript
import apiClient from '@/api/APIClient';
import type { WorkoutResponse } from '@/api/types/workout';

const fetchWorkout = async (id: string) => {
  const response = await apiClient.get<WorkoutResponse>(`/workouts/${id}/`);
  return response.data;
};
```

### Using Zustand Stores
```typescript
import { useWorkoutStore } from '@/state/userStore';

// In component
const workouts = useWorkoutStore((state) => state.workouts);
const addWorkout = useWorkoutStore((state) => state.addWorkout);
```

### Navigation
```typescript
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/(active-workout)');
router.replace('/(auth)');
```

## Important Notes

- **Never commit tokens or API keys** - they belong in secure storage only
- **Never use barrel imports** - import directly from individual files
- **Test on both iOS and Android** - platform behaviors differ (especially health integrations)
- **Run format before committing** - automated formatting prevents style conflicts
- **Check auth flow changes carefully** - token refresh logic is critical and complex
