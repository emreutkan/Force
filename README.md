# FORCE — AI-Powered Fitness Tracker

A full-featured mobile fitness application built for iOS and Android. FORCE goes beyond basic rep and weight logging — it tracks recovery, analyzes training volume against evidence-based targets, diagnoses workout sessions, and includes an AI coaching assistant that understands your training context.

---

## What the App Does

### Active Workout Tracking

The core of the app is a real-time workout session experience. While training, users can log sets with weight, reps, and reps-in-reserve (RIR) for RPE-based training. Each exercise tracks time-under-tension per set, and exercises can be reordered on the fly using drag-and-drop.

The rest timer is science-backed: it differentiates between compound and isolation exercises and uses a traffic-light model (red → yellow → green) to communicate ATP recovery status — not just a countdown, but an indication of actual readiness to perform. A progress bar fills as recovery percentage climbs, and the color shifts as the muscle system transitions from incomplete to full recovery.

During a session, FORCE surfaces intelligent suggestions for what to train next based on which muscle groups have sufficiently recovered. Each suggestion shows a recovery ring and percentage so users can make informed decisions mid-workout. If a workout runs excessively long, a modal prompts the user to normalize the duration rather than letting idle time pollute session data.

### Post-Workout Session Diagnosis

After finishing a workout, FORCE analyzes the session and returns a diagnosis. Possible outcomes include **Great Session**, **Fatigue Detected**, **Performance Drop**, and **Overreaching** — each color-coded and accompanied by expandable recommendation cards with specific, actionable guidance. This turns raw logged data into something the user can act on.

### Recovery Status

A dedicated recovery screen breaks down every muscle group by recovery percentage, organized into upper body, lower body, and core sections. Each muscle is color-coded (green, yellow, red) based on how much it has recovered since last being trained.

For PRO users, FORCE also tracks **CNS (Central Nervous System) fatigue** — a system-level metric that measures overall neurological load, hours until full recovery, and a recovery percentage. This is a feature found in dedicated coaching software, not typical fitness apps.

### Volume Analysis

FORCE provides three lenses for analyzing training volume:

**Volume** — A weekly breakdown of sets and total volume (kg) per muscle group over a configurable lookback window (up to 52 weeks for PRO users). Displayed as bar charts with scrollable history.

**Volume Status** — Each muscle group is compared against evidence-based targets derived from the Schoenfeld MEV/MAV framework (minimum effective volume / maximum adaptive volume). Muscles are tagged as **Optimal**, **Undertrained**, **Overtrained**, or **Untrained**, giving users a clear picture of where their program is lacking or excessive.

**Muscle Balance** — Antagonist pair ratios (chest vs. back, biceps vs. triceps, quads vs. hamstrings, etc.) are analyzed and displayed as split bars with ratio indicators. Imbalances are flagged, helping users catch asymmetries before they become injuries.

### Exercise Statistics & Progression Tracking

Each exercise in the library has a dedicated statistics screen (PRO) showing:
- All-time best estimated 1RM
- 1RM progression over time as a line chart
- Percentage improvement from first to most recent 1RM
- Overload trend analysis for progressive overload verification
- Full set history with weight/rep combinations

This turns the exercise library into a personal strength database.

### Workout Programs

Users can build structured multi-week training programs directly in the app. The creation flow lets users define a cycle length, name each training day ("Push", "Pull", "Legs"), mark rest days, and assign exercises with target set counts per day. Exercises within each day can be reordered via drag-and-drop.

Multiple programs can be saved, and one can be activated at a time. The home screen surfaces today's program day — showing the exact exercises and target sets — with a quick-start button to begin the session from the template.

### AI Coaching Assistant

FORCE includes a conversational AI coach that users can query about programming, exercise form, nutrition, and recovery. Conversations are session-based with persistent history, so users can revisit previous exchanges. The assistant streams responses in real time and maintains context across a session.

Chat sessions are organized chronologically with relative timestamps, can be renamed or deleted, and each shows a message count. The assistant introduces itself with its four areas of expertise on first use.

### Workout Templates

Beyond full programs, users can save individual workouts as reusable templates and start sessions from them in one tap. Templates make it easy to repeat a training day without rebuilding it from scratch each time.

### Calendar & Activity Tracking

A weekly activity view shows at a glance which days had workouts and which were rest days. A monthly calendar provides aggregate statistics — total workouts, rest days, and training frequency — to help users monitor consistency over time.

---

## Tech Stack

Built with **React Native** and **Expo** (TypeScript throughout), targeting iOS, Android, and web from a single codebase. Navigation uses **Expo Router** (file-based routing). **Zustand** handles local UI state; **TanStack Query** manages server state with caching and background refetching. The HTTP layer uses **Ky** with a custom client that handles Supabase JWT injection, ETag-based response caching, automatic token refresh, and backend health monitoring.

Authentication is handled by **Supabase**, with Google and Apple sign-in support. Subscriptions and in-app purchases use **RevenueCat**. Errors are tracked with **Sentry**. Native health data integrates with **Apple HealthKit** and **Google Fit** via custom Expo plugins. Animations use **React Native Reanimated** and gesture handling uses **React Native Gesture Handler**.

---

## Status

Active development. Core workout tracking, analytics, AI assistant, and program creation are fully implemented.
