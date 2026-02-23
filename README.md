# FORCE

FORCE is a mobile fitness tracker built with Expo + React Native. It helps users log workouts, monitor progress, and review training insights over time.

## Core Features

- Workout logging with sets, reps, weight, and rest timers
- Exercise browsing and search
- Reusable workout templates
- Body measurements and body-fat estimation (US Navy method)
- Volume analysis and recovery status insights
- Calendar/activity views and workout history
- Supabase-backed authentication and session handling

## Tech Stack

- Expo / React Native / React
- Expo Router + React Navigation
- Supabase (`@supabase/supabase-js`)
- Zustand + TanStack React Query
- TypeScript

## Prerequisites

- Node.js 18+ (recommended)
- npm
- Xcode / Android Studio (for native device builds)

## Setup

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Configure environment variables:

   ```bash
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
   RC_TEST_API=...
   ```

3. Start the app:

   ```bash
   npm start
   ```

## Available Scripts

```bash
npm start              # Start Expo
npm run start:dev-client
npm run android
npm run ios
npm run web
npm run lint
npm run format
npm run format:check
```
