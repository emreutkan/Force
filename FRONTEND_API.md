# ForceAPI — Frontend Reference

API backend for the Force fitness app. Django REST API serving an iOS/Android client.

**Base URL (prod):** `https://your-domain.com`
**Swagger UI:** `/api/docs/`
**ReDoc:** `/api/redoc/`

---

## Authentication

All endpoints require a Supabase JWT:

```
Authorization: Bearer <supabase_jwt>
```

The frontend authenticates with Supabase directly. The resulting JWT is forwarded to this API on every request. On first request, a Django user is auto-created from the JWT. On email change, Django syncs automatically on the next request.

---

## Response Conventions

- All timestamps are ISO 8601 UTC: `"2025-01-15T10:30:00Z"`
- Decimal fields (weight, height, 1RM) may be returned as strings in some serializers — always `parseFloat()`
- Pagination uses `?page=1&page_size=20`; response wraps results in `{ count, next, previous, results }`
- `4xx` errors always include an `error` or `detail` key with a machine-readable code or message

---

## User Endpoints — `/api/user/`

### `GET /api/user/me/`
Current user profile.

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "is_verified": false,
  "gender": "male",
  "height": 180.5,
  "weight": 75.25,
  "created_at": "2025-01-15T10:00:00Z",
  "is_pro": true,
  "is_paid_pro": true,
  "is_trial": false,
  "pro_days_remaining": 30,
  "trial_days_remaining": null,
  "pro_until": "2025-03-15T10:00:00Z",
  "trial_until": null
}
```

### `PATCH /api/user/me/`
```json
// Request (all optional)
{ "gender": "male" | "female" }
```
Returns updated profile (same shape as GET).

### `POST /api/user/height/`
```json
// Request
{ "height": 180.5 }

// Response 200
{ "height": "180.50", "message": "Height updated successfully" }
```

### `POST /api/user/gender/`
```json
// Request
{ "gender": "male" | "female" }

// Response 200
{ "gender": "male", "message": "Gender updated successfully" }
```

### `POST /api/user/weight/`
Adds a new weight history entry.
```json
// Request
{ "weight": 75.25 }

// Response 200
{ "weight": "75.25", "date": "2025-02-28T15:30:00Z", "message": "Weight updated successfully" }
```

### `GET /api/user/weight/history/`
Paginated weight history. Query params: `?page=1&page_size=100`
```json
{
  "count": 50,
  "next": "...",
  "previous": null,
  "results": [
    { "id": 1, "date": "2025-02-28T15:30:00Z", "weight": 75.25, "bodyfat": 18.5 }
  ]
}
```

### `DELETE /api/user/weight/<weight_id>/`
Query param: `?delete_bodyfat=true` to also delete the linked body fat entry.
```json
{ "message": "Weight entry deleted successfully", "deleted_date": "2025-02-28", "bodyfat_deleted": true }
```

### `DELETE /api/user/me/delete/`
Permanently deletes the account. `204 No Content`.

### `GET /api/user/data/export/?format=json`
Returns a JSON file (or ZIP for `format=csv`) of all user data.

### `POST /api/user/data/import/`
`multipart/form-data` with a JSON file matching the export format. `201` on success.

---

## Exercise Endpoints — `/api/exercise/`

### `GET /api/exercise/list/`
All exercises in the catalog. Supports filtering.

```json
[
  {
    "id": 3,
    "name": "Barbell Bench Press",
    "description": "...",
    "instructions": "...",
    "primary_muscle": "chest",
    "secondary_muscles": ["triceps", "shoulders"],
    "equipment_type": "barbell",
    "category": "compound",
    "difficulty": "intermediate",
    "image": "https://.../exercises/barbell-bench-press.jpg",
    "video_url": null,
    "is_active": true
  }
]
```

**Muscle group values:** `chest`, `shoulders`, `biceps`, `triceps`, `forearms`, `lats`, `traps`, `lower_back`, `quads`, `hamstrings`, `glutes`, `calves`, `abs`, `obliques`, `abductors`, `adductors`

**Equipment values:** `bodyweight`, `barbell`, `dumbbell`, `machine`, `cable`, `resistance_band`, `kettlebell`, `ez_bar`, `dip_bars`, `treadmill`, `stationary_bike`, `elliptical`, `rowing_machine`, `bicycle`

**Category values:** `compound`, `isolation`, `cardio`, `flexibility`

---

## Workout Endpoints — `/api/workout/`

### Workout Object Shape

```json
{
  "id": 1,
  "title": "Chest Day",
  "datetime": "2025-02-28T14:00:00Z",
  "duration": 3600,
  "intensity": "high",
  "notes": "Good session",
  "is_done": true,
  "is_rest_day": false,
  "calories_burned": "450.50",
  "created_at": "2025-02-28T14:00:00Z",
  "updated_at": "2025-02-28T15:00:00Z",
  "exercises": [
    {
      "id": 10,
      "workout": 1,
      "exercise": {
        "id": 3,
        "name": "Barbell Bench Press",
        "primary_muscle": "chest",
        "secondary_muscles": ["triceps", "shoulders"],
        "category": "compound",
        "equipment_type": "barbell",
        "image": "https://..."
      },
      "order": 1,
      "one_rep_max": "120.50",
      "sets": [
        {
          "id": 45,
          "workout_exercise": 10,
          "set_number": 1,
          "reps": 8,
          "weight": "100.00",
          "rest_time_before_set": 120,
          "is_warmup": false,
          "reps_in_reserve": 2,
          "eccentric_time": 3,
          "concentric_time": 1,
          "total_tut": 32
        }
      ]
    }
  ],
  "total_volume": 2400.0,
  "primary_muscles_worked": ["chest"],
  "secondary_muscles_worked": ["triceps", "shoulders"],
  "cns_load": 3.5
}
```

**Workout states:**
- `is_done: false, is_rest_day: false` → active (in-progress)
- `is_done: true, is_rest_day: false` → completed
- `is_done: true, is_rest_day: true` → rest day

---

### `POST /api/workout/create/`
```json
// Request (all optional)
{
  "title": "Chest Day",
  "date": "2025-02-28T14:00:00Z",
  "is_rest_day": false
}
```
Returns `201` with full workout object. Only one active workout is allowed at a time.

**Error codes:**
- `ACTIVE_WORKOUT_EXISTS` — complete or delete existing active workout first
- `WORKOUT_EXISTS_FOR_DATE` — a workout already exists for that date
- `REST_DAY_EXISTS_FOR_DATE` — a rest day already exists for that date

### `GET /api/workout/list/`
Paginated list of all workouts. Returns full workout objects.

### `GET /api/workout/list/<workout_id>/`
Single workout by ID.

### `GET /api/workout/active/`
```json
{ "active_workout": { /* full workout object or null */ } }
```

### `GET /api/workout/check-today/`
Optional query param: `?date=2025-02-28`
```json
{
  "date": "2025-02-28",
  "status": "none" | "active" | "rest_day" | "completed",
  "active_workout": null,
  "completed_workout": null
}
```

### `GET /api/workout/check-date/`
Query params: `?date=2025-02-28` or `?day=28&month=2&year=2025`
```json
{ "total_workouts": 50, "days_past": 180, "weeks_past": 25.71 }
```

### `PATCH /api/workout/<workout_id>/update/`
```json
// Request (all optional)
{
  "title": "Updated Title",
  "date": "2025-02-28T15:00:00Z",
  "duration": 3600,
  "intensity": "high",
  "notes": "Updated notes"
}
```
Returns updated workout object.

### `POST /api/workout/<workout_id>/complete/`
```json
// Request (all optional)
{
  "duration": 3600,
  "intensity": "high",
  "notes": "Great session",
  "normalize_duration": false,
  "proceed_as_is": false
}
```
Returns completed workout object with `is_done: true`. May return `400 EXCESSIVE_DURATION` if duration looks wrong — resend with `proceed_as_is: true` to override.

### `DELETE /api/workout/<workout_id>/delete/`
`204 No Content`

---

### `POST /api/workout/<workout_id>/add_exercise/`
```json
// Request
{ "exercise_id": 3 }

// Response 201
{ "id": 10, "workout": 1, "exercise": 3, "order": 2, "sets": [], "one_rep_max": null }
```

### `POST /api/workout/exercise/<workout_exercise_id>/add_set/`
```json
// Request
{
  "reps": 8,
  "weight": 100.5,
  "rest_time_before_set": 120,
  "is_warmup": false,
  "reps_in_reserve": 2,
  "eccentric_time": 3,
  "concentric_time": 1,
  "total_tut": 32
}
// Response 201 — set object
```

### `PATCH /api/workout/set/<set_id>/update/`
Any set field (same fields as add_set). Returns updated set object.

### `DELETE /api/workout/set/<set_id>/delete/`
`204 No Content`

### `DELETE /api/workout/exercise/<workout_exercise_id>/delete/`
`204 No Content`

### `POST /api/workout/<workout_id>/update_order/`
```json
// Request
{
  "exercise_orders": [
    { "id": 10, "order": 1 },
    { "id": 11, "order": 2 }
  ]
}
```

---

### Rest Timer

### `GET /api/workout/active/rest-timer/`
```json
{
  "is_paused": false,
  "paused_at": null,
  "paused_duration_seconds": 0
}
```

### `POST /api/workout/active/rest-timer/stop/`
Pauses the rest timer.

### `POST /api/workout/active/rest-timer/resume/`
Resumes a paused timer.

---

### Templates

### `POST /api/workout/template/create/`
```json
// Request
{
  "title": "Push Template",
  "notes": "Optional notes",
  "exercises": [
    { "exercise_id": 3, "order": 1 },
    { "exercise_id": 5, "order": 2 }
  ]
}
```

### `GET /api/workout/template/list/`
Returns list of template objects.

### `DELETE /api/workout/template/delete/<template_id>/`
`204 No Content`

### `POST /api/workout/template/start/`
```json
// Request
{ "template_id": 1 }
// Response 201 — new workout created from template
```

---

### Calendar

### `GET /api/workout/calendar/`
Query params: `year` (required), `month` (optional), `week` (optional)
```json
{
  "calendar": [
    {
      "date": "2025-02-01",
      "day": 1,
      "weekday": 5,
      "has_workout": true,
      "is_rest_day": false,
      "workout_count": 1,
      "rest_day_count": 0
    }
  ],
  "period": { "year": 2025, "month": 2, "week": null, "start_date": "2025-02-01", "end_date": "2025-02-28" }
}
```

### `GET /api/workout/calendar/stats/`
Same query params as `/calendar/`.
```json
{
  "total_workouts": 18,
  "total_rest_days": 4,
  "days_not_worked": 6,
  "total_days": 28,
  "period": { ... }
}
```

### `GET /api/workout/years/`
```json
{ "years": [2025, 2024, 2023] }
```

---

### Exercise History

### `GET /api/workout/exercise/<exercise_id>/1rm-history/`
PRO: full history. Free: last 30 days.
```json
{
  "exercise_id": 3,
  "exercise_name": "Barbell Bench Press",
  "history": [
    { "workout_id": 1, "workout_title": "Chest Day", "workout_date": "2025-01-15T10:00:00Z", "one_rep_max": 120.5 }
  ],
  "total_workouts": 12,
  "is_pro": true,
  "days_limit": null
}
```

### `GET /api/workout/exercise/<exercise_id>/set-history/`
Paginated set history across all workouts.
```json
{
  "count": 80,
  "next": "...",
  "previous": null,
  "results": [
    {
      "id": 45,
      "weight": 100.0,
      "reps": 8,
      "is_warmup": false,
      "set_number": 1,
      "workout_id": 1,
      "workout_title": "Chest Day",
      "workout_date": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### `GET /api/workout/exercise/<exercise_id>/last-workout/`
```json
{
  "exercise_id": 3,
  "exercise_name": "Barbell Bench Press",
  "last_workout": {
    "workout_id": 1,
    "workout_title": "Chest Day",
    "workout_date": "2025-01-15T10:00:00Z",
    "one_rep_max": 120.5,
    "sets": [
      { "set_number": 1, "weight": 100.0, "reps": 8, "one_rep_max": 120.5 }
    ],
    "total_sets": 3,
    "days_ago": 7
  }
}
```

### `GET /api/workout/exercise/<exercise_id>/overload-trend/`
**PRO only.** 8-week linear regression on 1RM.
```json
{
  "exercise_id": 3,
  "exercise_name": "Barbell Bench Press",
  "trend": "progressing" | "regressing" | "stagnating" | "insufficient_data",
  "data_points": [
    { "date": "2025-01-01", "one_rep_max": 115.0 },
    { "date": "2025-01-08", "one_rep_max": 118.5 }
  ],
  "weeks_analyzed": 8,
  "change_kg": 5.5,
  "change_percent": 4.8,
  "message": "Solid upward trend..."
}
```

---

### Personal Records

### `GET /api/workout/personal-records/`
All-time PRs across every exercise the user has performed, sorted by exercise name.
```json
[
  {
    "exercise_id": 3,
    "exercise_name": "Barbell Bench Press",
    "primary_muscle": "chest",
    "best_1rm": 120.5,
    "best_1rm_date": "2025-01-15T10:30:00Z",
    "best_weight": 110.0,
    "best_weight_date": "2025-01-15T10:30:00Z",
    "best_volume_set": 880.0,
    "best_volume_set_date": "2025-01-15T10:30:00Z"
  }
]
```

- `best_1rm` — highest Brzycki 1RM (computed at workout completion)
- `best_weight` — heaviest single-set weight (warmups excluded)
- `best_volume_set` — highest `weight × reps` single set (warmups excluded)

### `GET /api/workout/personal-records/<exercise_id>/`
PR detail + chronological 1RM history for one exercise.
```json
{
  "exercise_id": 3,
  "exercise_name": "Barbell Bench Press",
  "primary_muscle": "chest",
  "best_1rm": 120.5,
  "best_1rm_date": "2025-01-15T10:30:00Z",
  "best_weight": 110.0,
  "best_weight_date": "2025-01-15T10:30:00Z",
  "best_volume_set": 880.0,
  "best_volume_set_date": "2025-01-15T10:30:00Z",
  "pr_history": [
    {
      "workout_id": 1,
      "workout_title": "Chest Day",
      "workout_date": "2025-01-01T10:00:00Z",
      "one_rep_max": 115.0
    },
    {
      "workout_id": 5,
      "workout_title": "Chest Day",
      "workout_date": "2025-01-15T10:00:00Z",
      "one_rep_max": 120.5
    }
  ],
  "total_workouts": 12
}
```

`404` if `exercise_id` doesn't exist. PR fields are `null` if no data exists for that metric.

---

### Analytics

### `GET /api/workout/user-stats/`
```json
{
  "streak": { "current": 5, "longest": 21 },
  "sessions": { "total": 120, "this_week": 3, "this_month": 14 },
  "volume_kg": { "total": 150000.0, "this_week": 4200.0, "this_month": 18500.0 },
  "time": { "total_minutes": 7200.0, "avg_per_session_minutes": 60.0 },
  "calories": { "total": 54000.0, "this_week": 1350.0, "this_month": 6300.0 },
  "consistency": { "active_days_last_30": 18, "avg_sessions_per_week": 3.5 }
}
```

### `GET /api/workout/<workout_id>/summary/`
Workout score (0–10), positives/negatives/neutrals breakdown, diagnosis.
```json
{
  "workout_id": 1,
  "score": 7.5,
  "positives": {
    "chest": { "type": "recovery", "message": "Chest was fully recovered before workout", "pre_recovery": 100.0 }
  },
  "negatives": {},
  "neutrals": {},
  "summary": {
    "total_positives": 1,
    "total_negatives": 0,
    "total_neutrals": 2,
    "muscles_worked": ["chest", "shoulders", "triceps"],
    "exercises_performed": 3
  },
  "diagnosis": {
    "primary_issue": "good_session",
    "message": "Muscles were well-recovered...",
    "recommendation": "Maintain your current recovery schedule..."
  },
  "is_pro": true,
  "has_advanced_insights": true
}
```

### `GET /api/workout/volume-analysis/`
Query params: `?weeks_back=12`, or `?start_date=2025-01-01&end_date=2025-02-28`
**Free:** max 4 weeks. **PRO:** up to 2 years.

Returns weekly volume per muscle group + summary + antagonist balance analysis.

---

### Muscle Recovery

### `GET /api/workout/recovery/status/`
Current recovery status per muscle group.

### `GET /api/workout/recommendations/recovery/`
Science-based recovery recommendations.

### `GET /api/workout/recommendations/frequency/`
Training frequency recommendations per muscle group.

### `GET /api/workout/exercise/<workout_exercise_id>/rest-recommendations/`
Rest period recommendations for a specific exercise.

### `GET /api/workout/active/suggest-exercise/`
Suggests next exercise based on current recovery status.

### `GET /api/workout/exercise/<workout_exercise_id>/optimization-check/`
Checks if current exercise is optimally placed given recovery.

### `GET /api/workout/research/`
Evidence-based training research articles. Query params: `?muscle_group=chest&category=REST_PERIODS`

---

### Workout Programs (Splits)

### `POST /api/workout/program/create/`
```json
// Request
{
  "name": "PPL",
  "cycle_length": 3,
  "days": [
    {
      "day_number": 1,
      "name": "Push Day",
      "is_rest_day": false,
      "exercises": [
        { "exercise_id": 3, "target_sets": 3, "order": 1 }
      ]
    },
    { "day_number": 2, "name": "Pull Day", "is_rest_day": false, "exercises": [] },
    { "day_number": 3, "name": "Rest", "is_rest_day": true, "exercises": [] }
  ]
}
```

Validation: `cycle_length` must equal number of days; `day_number` values must be `1..cycle_length` with no duplicates.

```json
// Response 201
{
  "id": 5,
  "name": "PPL",
  "cycle_length": 3,
  "is_active": false,
  "activated_at": null,
  "days": [
    {
      "id": 14,
      "day_number": 1,
      "name": "Push Day",
      "is_rest_day": false,
      "exercises": [
        { "id": 21, "exercise": { "id": 3, "name": "Barbell Bench Press", ... }, "order": 1, "target_sets": 3 }
      ]
    }
  ],
  "created_at": "2025-02-28T10:00:00Z",
  "updated_at": "2025-02-28T10:00:00Z"
}
```

### `GET /api/workout/program/list/`
Array of program objects.

### `GET /api/workout/program/<program_id>/`
Single program object.

### `PATCH /api/workout/program/<program_id>/update/`
```json
{ "name": "New Name" }
```

### `DELETE /api/workout/program/<program_id>/delete/`
`204 No Content`

### `POST /api/workout/program/<program_id>/activate/`
Sets this program as active, deactivates all others. Returns program object.

### `POST /api/workout/program/<program_id>/deactivate/`
Returns program object.

### `GET /api/workout/program/current-day/`
Which day in the cycle is today based on activation date.
```json
{
  "program_id": 5,
  "program_name": "PPL",
  "cycle_length": 3,
  "activated_at": "2025-02-15T10:00:00Z",
  "days_completed_since_activation": 12,
  "current_day_number": 1,
  "current_day": {
    "id": 14,
    "day_number": 1,
    "name": "Push Day",
    "is_rest_day": false,
    "exercises": [ ... ]
  }
}
```
`404 NO_ACTIVE_PROGRAM` if no program is active.

---

## Body Measurements — `/api/measurements/`

### `POST /api/measurements/create/`
```json
// Request
{
  "height": 180.5,
  "weight": 75.25,
  "waist": 85.0,
  "neck": 38.0,
  "hips": 95.0,
  "gender": "male",
  "notes": "Morning"
}
```
`hips` required for `gender: "female"`.

```json
// Response 201
{
  "id": 1,
  "height": 180.5,
  "weight": 75.25,
  "waist": 85.0,
  "neck": 38.0,
  "hips": 95.0,
  "body_fat_percentage": 18.5,
  "gender": "male",
  "notes": "Morning",
  "created_at": "2025-02-28T08:00:00Z",
  "updated_at": "2025-02-28T08:00:00Z"
}
```

### `GET /api/measurements/`
Paginated list. Same object shape.

### `POST /api/measurements/calculate-body-fat/men/`
```json
// Request
{ "height": 180.5, "weight": 75.25, "waist": 85.0, "neck": 38.0 }

// Response 200
{
  "body_fat_percentage": 18.5,
  "measurements": { "height_cm": 180.5, "weight_kg": 75.25, "waist_cm": 85.0, "neck_cm": 38.0 },
  "method": "US Navy Method (Men)"
}
```

### `POST /api/measurements/calculate-body-fat/women/`
Same as men but also requires `"hips": 95.0`.

---

## AI Chat — `/api/chat/`

Uses DRF Router — standard ViewSet actions.

### `POST /api/chat/session/`
```json
// Request
{ "title": "Training Tips" }

// Response 201
{ "id": 1, "title": "Training Tips", "messages": [], "created_at": "...", "updated_at": "..." }
```

### `GET /api/chat/session/`
List of all sessions.

### `GET /api/chat/session/<id>/`
Session with full message history.
```json
{
  "id": 1,
  "title": "Training Tips",
  "messages": [
    { "id": 10, "role": "user", "content": "Best rep range for hypertrophy?", "created_at": "..." },
    { "id": 11, "role": "ai", "content": "6-12 reps...", "created_at": "..." }
  ],
  "created_at": "...",
  "updated_at": "..."
}
```

### `POST /api/chat/session/<id>/message/`
```json
// Request
{ "message": "What's the best rep range for hypertrophy?" }

// Response 201 — the AI reply
{ "id": 11, "role": "ai", "content": "...", "created_at": "..." }
```

### `DELETE /api/chat/session/<id>/`
`204 No Content`

---

## PRO vs Free Tier

| Feature | Free | PRO |
|---------|------|-----|
| 1RM History | Last 30 days | All time |
| Overload Trend | ❌ | ✅ |
| Volume Analysis | 4 weeks | 2 years |
| Workout Summary (1RM performance score) | ❌ | ✅ |
| Rate limits | Standard | Relaxed |

`is_pro` is returned on relevant endpoints. PRO-gated endpoints return `402` or `403` with a `requires_pro` flag for non-PRO users.

---

## Validation Rules

| Field | Constraint |
|-------|-----------|
| Height | 50–300 cm |
| Weight (body) | 20–500 kg |
| Set weight | > 0, max 700 kg |
| Reps | 0–100 |
| Reps in reserve | 0–100 |
| Rest time | 0–10,800 s (3 h) |
| Eccentric / concentric time | 0–600 s |
| Total TUT | 0–600 s |
| Waist | 30–200 cm |
| Neck | 20–80 cm |
| Hips | 50–200 cm |
| Program cycle length | 1–30 days |

---

## Common Error Shapes

```json
// 401
{ "detail": "Authentication credentials were not provided." }

// 403 Rate limited
{ "detail": "Request was throttled. Expected available in X seconds." }

// 404
{ "detail": "Not found." }

// 400 — domain errors use a machine-readable code
{ "error": "ACTIVE_WORKOUT_EXISTS", "active_workout": 5, "message": "..." }

// 500
{ "error": "WORKOUT_CREATE_FAILED", "message": "...", "detail": "..." }
```
