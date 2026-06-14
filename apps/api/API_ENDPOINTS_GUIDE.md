# DNA API - Complete Endpoints Guide

## Table of Contents
1. [Authentication Flow](#authentication-flow)
2. [User & Profile Management](#user--profile-management)
3. [Match Management](#match-management)
4. [Designation System](#designation-system)
5. [Payment System](#payment-system)
6. [Training & Evaluation](#training--evaluation)
7. [Statistics & Reports](#statistics--reports)
8. [Notifications System](#notifications-system)

---

## Authentication Flow

### 1. POST `/api/auth/login`
**Purpose:** Login and get JWT token

**Request:**
```json
{
  "email": "admin@dna.tn",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "676abc...",
    "email": "admin@dna.tn",
    "role": "ADMIN_DNA",
    "firstName": "Admin",
    "lastName": "DNA"
  }
}
```

**Use the `access_token` in all subsequent requests** as Bearer token in Authorization header.

### 2. POST `/api/auth/forgot-password`
**Purpose:** Request password reset

### 3. POST `/api/auth/reset-password`
**Purpose:** Reset password with token

---

## User & Profile Management

### Understanding the Two-Step Process

**IMPORTANT:** To create a functional referee/inspector/CRA president, you need TWO steps:

#### Step 1: Create User (Authentication Account)
#### Step 2: Create Profile (Professional Data)

---

### USERS (Authentication)

#### 1. POST `/api/users`
**Purpose:** Create authentication account

**Request:**
```json
{
  "email": "referee1@example.com",
  "password": "Pass123!",
  "role": "ARBITRE",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "12345678"
}
```

**Creates:** Login credentials only (no professional profile yet)

**Available Roles:**
- `ADMIN_DNA` - System administrator
- `FINANCE_DNA` - Financial manager
- `DESIGNATION_DNA` - Designation manager
- `ARBITRE` - Referee (needs referee profile)
- `INSPECTEUR` - Inspector (needs inspector profile)
- `CRA` - Regional president (needs CRA profile)
- `CAA`, `CAJ`, `CAF`, `CDC`, `CDE` - Commission leaders

#### 2. GET `/api/users`
**Purpose:** Get all users (admin only)

#### 3. GET `/api/users/role/:role`
**Purpose:** Get users by role (e.g., all ARBITRE users)

#### 4. GET `/api/users/:id`
**Purpose:** Get specific user

#### 5. PATCH `/api/users/:id`
**Purpose:** Update user information

#### 6. PATCH `/api/users/:id/toggle-status`
**Purpose:** Activate/deactivate user account

#### 7. DELETE `/api/users/:id`
**Purpose:** Delete user account

---

### REFEREES (Professional Profile)

#### 1. POST `/api/referees`
**Purpose:** Create referee professional profile

**Request:**
```json
{
  "userId": "676abc...",  // From step 1 (create user)
  "matricule": "REF2024001",
  "category": "A",
  "league": "Ligue 1",
  "region": "Tunis",
  "dateOfBirth": "1990-01-01",
  "cin": "12345678",
  "address": "123 Avenue Habib Bourguiba",
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "87654321"
  }
}
```

**Categories:** A, B, C1, C2, JEUNE, FEMININE, REGIONAL

**Creates:** Complete referee with:
- Official matricule number
- Performance statistics tracking
- Can be designated to matches
- Can receive payments

#### 2. GET `/api/referees`
**Purpose:** Get all referees with filters

**Query Parameters:**
- `page=1` - Pagination
- `limit=10` - Items per page
- `category=A` - Filter by category
- `league=Ligue 1` - Filter by league
- `region=Tunis` - Filter by region
- `isAvailable=true` - Only available referees
- `search=John` - Search by name/matricule

#### 3. GET `/api/referees/category/:category`
**Purpose:** Get all referees in specific category (A, B, C1, C2)

#### 4. GET `/api/referees/:id`
**Purpose:** Get referee details with full statistics

#### 5. PATCH `/api/referees/:id`
**Purpose:** Update referee information

#### 6. DELETE `/api/referees/:id`
**Purpose:** Delete referee profile

#### 7. POST `/api/referees/import`
**Purpose:** Bulk import referees from Excel file

#### 8. GET `/api/referees/statistics`
**Purpose:** Get overall referee statistics (counts by category, etc.)

---

### INSPECTORS (Professional Profile)

Same two-step process:
1. Create User with role `INSPECTEUR`
2. Create Inspector profile with POST `/api/inspectors`

#### POST `/api/inspectors`
```json
{
  "userId": "676xyz...",
  "matricule": "INSP2024001",
  "region": "Tunis",
  "specialization": "VAR"
}
```

---

### CRA PRESIDENTS (Professional Profile)

Same two-step process:
1. Create User with role `CRA`
2. Create CRA President profile with POST `/api/cra-presidents`

#### POST `/api/cra-presidents`
```json
{
  "userId": "676def...",
  "region": "Tunis",
  "phoneNumber": "12345678"
}
```

---

## Match Management

### 1. POST `/api/matches`
**Purpose:** Create a new match

**Request:**
```json
{
  "homeTeam": "Espérance ST",
  "awayTeam": "Club Africain",
  "date": "2026-02-15T19:00:00Z",
  "venue": "Stade Olympique de Radès",
  "competition": "LIGUE_1",
  "category": "A",
  "round": 15
}
```

**Competitions:** LIGUE_1, LIGUE_2, COUPE_TUNISIE, AMICAL

### 2. GET `/api/matches`
**Purpose:** Get all matches with filters

**Query Parameters:**
- `startDate=2026-01-01`
- `endDate=2026-12-31`
- `competition=LIGUE_1`
- `category=A`
- `status=SCHEDULED`
- `page=1&limit=10`

### 3. GET `/api/matches/calendar`
**Purpose:** Get matches in calendar format by date range

### 4. GET `/api/matches/:id`
**Purpose:** Get match details with designations

### 5. PATCH `/api/matches/:id`
**Purpose:** Update match information

### 6. PATCH `/api/matches/:id/date`
**Purpose:** Reschedule match (special endpoint for date changes)

### 7. DELETE `/api/matches/:id`
**Purpose:** Delete match

### 8. POST `/api/matches/import`
**Purpose:** Bulk import matches from Excel

---

## Designation System

**Workflow:** Match created → System suggests referees → DNA designates → Referees notified

### 1. POST `/api/designations`
**Purpose:** Create designation for a match

**Request:**
```json
{
  "matchId": "match123",
  "referees": [
    {
      "refereeId": "ref1",
      "role": "ARBITRE_CENTRAL"
    },
    {
      "refereeId": "ref2",
      "role": "ASSISTANT_1"
    },
    {
      "refereeId": "ref3",
      "role": "ASSISTANT_2"
    },
    {
      "refereeId": "ref4",
      "role": "QUATRIEME_ARBITRE"
    }
  ],
  "hasVAR": false
}
```

**Referee Roles (Obligatoires):** ARBITRE_CENTRAL, ASSISTANT_1, ASSISTANT_2, QUATRIEME_ARBITRE
**Referee Roles (Optionnels):** ARBITRE_VAR, ASSISTANT_VAR

### 2. GET `/api/designations/suggestions/:matchId`
**Purpose:** Get AI-suggested referees for a match

**Response:**
```json
{
  "suggestions": [
    {
      "referee": { "matricule": "REF001", "firstName": "John" },
      "role": "ARBITRE_CENTRAL",
      "score": 95.5,
      "reasons": [
        "Category match (+30)",
        "Performance: 18.5/20 (+27.75)",
        "4 matches this month (optimal) (+20)"
      ]
    }
  ]
}
```

**Scoring Algorithm:**
- Category match: +30 points
- Performance (commissioner + inspector reports): +30 points
- Workload balance: +20 points
- Availability: +10 points
- Conflict of interest check: -100 if conflict
- Travel distance: up to +10 points

### 3. GET `/api/designations`
**Purpose:** Get all designations

### 4. GET `/api/designations/match/:matchId`
**Purpose:** Get designation for specific match

### 5. PATCH `/api/designations/:id`
**Purpose:** Update designation

### 6. PATCH `/api/designations/:id/submit`
**Purpose:** Submit designation (locks it)

### 7. PATCH `/api/designations/:id/validate`
**Purpose:** Validate designation (final approval)

### 8. POST `/api/designations/:id/send-notifications`
**Purpose:** Send notifications to designated referees

### 9. POST `/api/designations/bulk-assign`
**Purpose:** Assign multiple matches at once

---

### Designation Overrides (CRA Manual Control)

**NEW ADDON FEATURE:** CRA President can manually override AI suggestions

#### 10. POST `/api/designations/:id/override`
**Purpose:** Override system designation with manual selection

**Request:**
```json
{
  "newReferees": [
    {
      "refereeId": "newRef1",
      "role": "ARBITRE_CENTRAL"
    },
    {
      "refereeId": "newRef2",
      "role": "ASSISTANT_1"
    },
    {
      "refereeId": "newRef3",
      "role": "ASSISTANT_2"
    },
    {
      "refereeId": "newRef4",
      "role": "QUATRIEME_ARBITRE"
    }
  ],
  "reason": "Arbitre principal indisponible suite à blessure"
}
```

**Creates:** Complete audit trail with previous state

#### 11. POST `/api/designations/:id/take-control`
**Purpose:** Lock designation for manual control only

#### 12. GET `/api/designations/:id/override-history`
**Purpose:** View all override actions for this designation

#### 13. GET `/api/designations/overrides/all`
**Purpose:** Get all overrides across system (with filters)

#### 14. POST `/api/designations/:id/revert-override`
**Purpose:** Undo override and restore previous state

---

## Payment System

### Payment Rates (Configuration)

#### 1. POST `/api/payment-rates`
**Purpose:** Create payment rate

**Request:**
```json
{
  "category": "A",
  "competition": "LIGUE_1",
  "role": "ARBITRE_CENTRAL",
  "amount": 350.00,
  "effectiveDate": "2026-01-01"
}
```

#### 2. GET `/api/payment-rates`
**Purpose:** Get all payment rates

#### 3. GET `/api/payment-rates/active`
**Purpose:** Get currently active rates only

#### 4. GET `/api/payment-rates/calculate`
**Purpose:** Calculate payment for specific match configuration

---

### Payment Generation & Validation

#### 5. POST `/api/payments/generate`
**Purpose:** Generate payments for completed matches

**Request:**
```json
{
  "matchIds": ["match1", "match2"],
  "month": "2026-01"
}
```

**Creates:** Payment records for all referees in those matches

#### 6. GET `/api/payments`
**Purpose:** Get all payments with filters

**Query Parameters:**
- `status=PENDING` - Filter by status
- `category=A` - Filter by referee category
- `startDate=2026-01-01`
- `endDate=2026-01-31`

**Payment Status Flow:**
- `PENDING` → `VALIDATED` → `PAID`
- Can be `REJECTED`

#### 7. GET `/api/payments/pending`
**Purpose:** Get all pending payments (shortcut)

#### 8. GET `/api/payments/referee/:refereeId`
**Purpose:** Get payment history for specific referee

#### 9. GET `/api/payments/:id`
**Purpose:** Get payment details

#### 10. PATCH `/api/payments/:id/validate`
**Purpose:** Validate payment (approve for payment)

**Who can validate:**
- **A/B category:** Only A/B referees or FINANCE_DNA can validate
- **C category:** Anyone with finance role can validate
- **(ADDON 2 requirement)**

#### 11. PATCH `/api/payments/:id/reject`
**Purpose:** Reject payment

#### 12. PATCH `/api/payments/:id/mark-paid`
**Purpose:** Mark as paid (after bank transfer)

#### 13. POST `/api/payments/bulk-validate`
**Purpose:** Validate multiple payments at once

---

### Cross-Category Payment Visibility (NEW ADDON)

#### 14. GET `/api/payments/all-categories`
**Purpose:** View payments across all categories with RBAC

**Access Control:**
- **A/B referees:** Full read/write on A/B, read-only on C
- **C referees:** Read-only on all categories
- **ADMIN_DNA, FINANCE_DNA, CRA:** Full access

**Response:**
```json
{
  "payments": [...],
  "summary": {
    "A": { "total": 15000, "count": 30, "canValidate": true },
    "B": { "total": 12000, "count": 40, "canValidate": true },
    "C": { "total": 8000, "count": 50, "canValidate": false }
  }
}
```

#### 15. GET `/api/payments/readonly/:category`
**Purpose:** View payments in specific category (read-only access)

#### 16. GET `/api/payments/cross-category-report`
**Purpose:** Generate consolidated report across categories

---

### Regional PDF Generation (NEW ADDON)

**Purpose:** Generate PDFs by region with CRA President signature

#### 17. GET `/api/payments/pdf/regional`
**Purpose:** Generate PDF for specific region

**Query Parameters:**
- `region=Tunis` (required)
- `startDate=2026-01-01`
- `endDate=2026-01-31`

**Response:** PDF file download with:
- CRA President signature
- Regional header
- All payments for that region
- Totals by category

#### 18. GET `/api/payments/pdf/consolidated-regional`
**Purpose:** Generate PDF for ALL regions

**Response:** Multi-region PDF with section per region

#### 19. GET `/api/payments/pdf/regions-list`
**Purpose:** Get list of all regions in system

---

## Training & Evaluation

### Training Resources (NEW ADDON)

**Purpose:** Video library for referee training

#### 1. POST `/api/training-resources`
**Purpose:** Upload new training resource

**Request:**
```json
{
  "title": "Introduction aux Lois du Jeu",
  "description": "Vidéo complète sur les règles de base",
  "type": "VIDEO",
  "categories": ["RULES", "POSITIONING"],
  "url": "https://example.com/video1.mp4",
  "thumbnailUrl": "https://example.com/thumb1.jpg",
  "duration": 45,
  "targetCategories": ["C1", "C2"]
}
```

**Resource Types:** VIDEO, DOCUMENT, INTERACTIVE, QUIZ, WEBINAR

**Categories:** RULES, POSITIONING, SIGNALS, PHYSICAL_PREPARATION, PSYCHOLOGY, VAR, GENERAL

#### 2. GET `/api/training-resources`
**Purpose:** Get all resources with filters

**Query Parameters:**
- `type=VIDEO`
- `category=RULES`
- `targetAudience=C1_C2`

#### 3. GET `/api/training-resources/:id`
**Purpose:** Get resource details

#### 4. PATCH `/api/training-resources/:id`
**Purpose:** Update resource

#### 5. DELETE `/api/training-resources/:id`
**Purpose:** Delete resource (soft delete - sets isActive=false)

#### 6. POST `/api/training-resources/:id/view`
**Purpose:** Track when referee views resource (increments view count)

#### 7. POST `/api/training-resources/:id/rate`
**Purpose:** Rate resource (1-5 stars)

**Request:**
```json
{
  "rating": 5
}
```

#### 8. POST `/api/training-resources/:id/notify-arbitres`
**Purpose:** Notify specific referees about resource

**Request:**
```json
{
  "refereeIds": ["ref1", "ref2"],
  "message": "Nouvelle vidéo obligatoire",
  "targetAudience": "C1_C2"
}
```

#### 9. GET `/api/training-resources/statistics`
**Purpose:** Get training statistics (total resources, views by category, etc.)

---

### Commissioner Reports

**Purpose:** Performance evaluation after matches

#### 1. POST `/api/commissioner-reports`
**Purpose:** Create performance report

**Request:**
```json
{
  "matchId": "match123",
  "refereeId": "ref1",
  "refereeRole": "ARBITRE_CENTRAL",
  "overallNote": 18.5,
  "strengths": ["Excellent positioning", "Good authority"],
  "improvements": ["Could improve foul detection"],
  "observations": "Très bonne prestation globale"
}
```

#### 2. GET `/api/commissioner-reports/referee/:refereeId`
**Purpose:** Get all reports for specific referee

#### 3. GET `/api/commissioner-reports/match/:matchId`
**Purpose:** Get all reports for specific match

#### 4. GET `/api/commissioner-reports/statistics/:refereeId`
**Purpose:** Get statistics from reports (average note, trend)

---

### Inspector Reports (NEW ADDON)

**Purpose:** Separate inspector evaluation system (not commissioner)

**Key Feature:** Composite scoring (60% commissioner + 40% inspector)

#### 1. POST `/api/inspector-reports`
**Purpose:** Create inspector evaluation

**Request:**
```json
{
  "refereeId": "ref123",
  "matchId": "match456",
  "inspectionType": "DURING_MATCH",
  "technicalScores": {
    "positioning": 16,
    "physicalFitness": 15,
    "gameControl": 17,
    "decisionMaking": 18,
    "communication": 16
  },
  "strengths": ["Excellent positioning"],
  "improvements": ["Could improve sprint recovery"],
  "verdict": "VERY_GOOD",
  "promotionRecommendation": "RECOMMENDED"
}
```

**Inspection Types:** BEFORE_MATCH, DURING_MATCH, POST_MATCH, FULL_INSPECTION

**Verdicts:** EXCELLENT, VERY_GOOD, GOOD, SATISFACTORY, NEEDS_IMPROVEMENT, INSUFFICIENT

**Promotion Recommendations:** STRONGLY_RECOMMENDED, RECOMMENDED, NEUTRAL, NOT_READY, DEMOTION_SUGGESTED

**Technical Scores (each /20):**
- Positioning
- Physical Fitness
- Game Control
- Decision Making
- Communication

**Overall Score:** Automatic average of 5 technical scores

#### 2. GET `/api/inspector-reports`
**Purpose:** Get all inspector reports

#### 3. GET `/api/inspector-reports/referee/:refereeId`
**Purpose:** Get all inspector reports for referee

#### 4. GET `/api/inspector-reports/referee/:refereeId/latest`
**Purpose:** Get latest inspector report for referee

#### 5. GET `/api/inspector-reports/:id`
**Purpose:** Get report details

#### 6. PATCH `/api/inspector-reports/:id`
**Purpose:** Update report

#### 7. PATCH `/api/inspector-reports/:id/submit`
**Purpose:** Submit report (locks for review)

#### 8. PATCH `/api/inspector-reports/:id/review`
**Purpose:** Review report (ADMIN_DNA only)

**Request:**
```json
{
  "reviewNotes": "Excellent evaluation, bien détaillé"
}
```

#### 9. DELETE `/api/inspector-reports/:id`
**Purpose:** Archive report (soft delete)

---

## Statistics & Reports

### Advanced Statistics (NEW ADDON)

**Purpose:** Rankings, speed charts, comparative analysis

#### 1. GET `/api/statistics/rankings`
**Purpose:** Get complete rankings by category

**Query Parameters:**
- `category=A` (required)

**Response:**
```json
{
  "rankings": [
    {
      "rank": 1,
      "refereeId": "ref1",
      "matricule": "REF001",
      "firstName": "John",
      "lastName": "Doe",
      "matchesCount": 25,
      "averageNote": 18.5,
      "performanceScore": 95.5
    }
  ]
}
```

**Ranking Algorithm:**
- Based on recent performance (last 6 months)
- Weighted by match importance
- Commissioner (60%) + Inspector (40%) if both exist

#### 2. GET `/api/statistics/referee/:id/speed-chart`
**Purpose:** Generate radar/speed chart data

**Response:**
```json
{
  "dimensions": [
    "Positioning",
    "Physical Fitness",
    "Game Control",
    "Decision Making",
    "Communication"
  ],
  "currentScores": [16.5, 15.2, 17.8, 18.1, 16.9],
  "avgScores": [15.0, 14.5, 16.0, 16.5, 15.8],
  "minScores": [12.0, 11.0, 13.0, 14.0, 13.5],
  "maxScores": [19.0, 18.5, 19.5, 20.0, 19.2],
  "initialScores": [14.0, 13.5, 15.0, 15.5, 14.8]
}
```

**Use this for radar charts in frontend**

#### 3. GET `/api/statistics/referee/:id/comparative-analysis`
**Purpose:** Compare referee with peers in same category

**Response:**
```json
{
  "referee": {
    "averageNote": 18.5,
    "matchesCount": 25,
    "rank": 3
  },
  "categoryAverage": {
    "averageNote": 16.2,
    "matchesCount": 22
  },
  "percentile": 85
}
```

#### 4. GET `/api/statistics/referee/:id/progression`
**Purpose:** Track progression over time

**Response:**
```json
{
  "timeline": [
    { "month": "2026-01", "averageNote": 17.2, "matchesCount": 8 },
    { "month": "2026-02", "averageNote": 17.8, "matchesCount": 9 },
    { "month": "2026-03", "averageNote": 18.5, "matchesCount": 8 }
  ],
  "trend": "IMPROVING"
}
```

#### 5. GET `/api/statistics/referee/:id/seminar-notes`
**Purpose:** Get seminar attendance and notes

**Response:**
```json
{
  "seminarNotes": [
    {
      "seminarId": "sem1",
      "note": 18,
      "date": "2026-01-15"
    }
  ]
}
```

---

### Availability Management

#### 1. POST `/api/availability`
**Purpose:** Declare availability/unavailability

**Request:**
```json
{
  "refereeId": "ref123",
  "startDate": "2026-02-01",
  "endDate": "2026-02-07",
  "isAvailable": false,
  "reason": "Congé médical"
}
```

#### 2. GET `/api/availability`
**Purpose:** Get all availability declarations

#### 3. GET `/api/availability/referee/:refereeId`
**Purpose:** Get availability for specific referee

#### 4. GET `/api/availability/date/:date`
**Purpose:** Get all availabilities for specific date

#### 5. PATCH `/api/availability/:id/approve`
**Purpose:** Approve availability request

#### 6. PATCH `/api/availability/:id/reject`
**Purpose:** Reject availability request

---

### Convocations

#### 1. POST `/api/convocations`
**Purpose:** Create convocation (seminar, meeting, training)

**Request:**
```json
{
  "type": "SEMINAR",
  "title": "Séminaire Formation VAR",
  "date": "2026-03-15T09:00:00Z",
  "location": "Centre Technique FTF",
  "referees": ["ref1", "ref2", "ref3"]
}
```

**Types:** SEMINAR, MEETING, TRAINING

#### 2. GET `/api/convocations`
**Purpose:** Get all convocations

#### 3. GET `/api/convocations/:id`
**Purpose:** Get convocation details

#### 4. PATCH `/api/convocations/:id`
**Purpose:** Update convocation

#### 5. POST `/api/convocations/:id/add-note`
**Purpose:** Add note to convocation

#### 6. POST `/api/convocations/:id/send-notifications`
**Purpose:** Send notifications to referees

#### 7. DELETE `/api/convocations/:id`
**Purpose:** Delete convocation

---

## Common Workflows

### Complete Referee Onboarding
```
1. POST /api/users (role: ARBITRE)
   → Get userId

2. POST /api/referees (userId from step 1)
   → Referee is now in system

3. POST /api/availability (set availability)
   → Referee can be designated
```

### Match Designation Flow
```
1. POST /api/matches
   → Create match

2. GET /api/designations/suggestions/:matchId
   → Get AI suggestions

3. POST /api/designations
   → Assign referees

4. PATCH /api/designations/:id/submit
   → Lock designation

5. POST /api/designations/:id/send-notifications
   → Notify referees
```

### Payment Processing Flow
```
1. Match completed with designation

2. POST /api/commissioner-reports
   → Submit performance report

3. POST /api/payments/generate
   → Generate payments for month

4. PATCH /api/payments/:id/validate
   → Validate payments (RBAC: A/B only for A/B)

5. PATCH /api/payments/:id/mark-paid
   → Mark as paid after transfer

6. GET /api/payments/pdf/regional
   → Generate PDF for CRA signature
```

### Training & Evaluation Flow
```
1. POST /api/training-resources
   → Upload training video

2. POST /api/training-resources/:id/notify-arbitres
   → Notify specific referees

3. Referee: POST /api/training-resources/:id/view
   → Track viewing

4. Referee: POST /api/training-resources/:id/rate
   → Rate resource

5. POST /api/inspector-reports
   → Create inspector evaluation

6. GET /api/statistics/referee/:id/speed-chart
   → View performance radar chart
```

---

## Access Control Summary

### Admin Roles
- **ADMIN_DNA:** Full system access
- **FINANCE_DNA:** Payments, validation
- **DESIGNATION_DNA:** Designations, assignments

### Referee Validation RBAC (ADDON 2)
- **A/B Referees:** Can validate A/B payments only
- **C Referees:** Read-only on all payments
- **FINANCE_DNA/ADMIN_DNA/CRA:** Can validate all

### Regional Control
- **CRA President:** Can override designations in their region
- Can generate regional PDFs with signature

---

## Notifications System

### Overview
The notification system provides:
- **In-App notifications** via WebSocket (real-time)
- **WhatsApp notifications** via GREEN-API
- **Automatic reminders** for upcoming matches and events
- **Group notifications** for admins to send announcements

### WebSocket Connection
Connect to `/notifications` namespace with JWT token:
```javascript
const socket = io('http://localhost:3000/notifications', {
  auth: { token: 'your-jwt-token' }
});

socket.on('notification', (data) => {
  console.log('New notification:', data);
});
```

### 1. GET `/api/notifications/my`
**Purpose:** Get my notifications with pagination

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `unreadOnly` (optional boolean)
- `type` (optional: DESIGNATION_ASSIGNED, CONVOCATION_INVITED, etc.)

**Response:**
```json
{
  "data": [
    {
      "_id": "...",
      "type": "DESIGNATION_ASSIGNED",
      "title": "⚽ Nouvelle désignation",
      "message": "Vous êtes désigné pour le match...",
      "read": false,
      "priority": "NORMAL",
      "createdAt": "2025-01-20T10:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3,
  "unreadCount": 5
}
```

### 2. GET `/api/notifications/unread-count`
**Purpose:** Get count of unread notifications

**Response:**
```json
{
  "unreadCount": 5
}
```

### 3. PATCH `/api/notifications/:id/read`
**Purpose:** Mark a notification as read

### 4. PATCH `/api/notifications/read-all`
**Purpose:** Mark all notifications as read

### 5. GET `/api/notifications/preferences`
**Purpose:** Get my notification preferences

**Response:**
```json
{
  "channels": {
    "inApp": true,
    "whatsapp": true,
    "email": false
  },
  "quietHours": {
    "enabled": false,
    "start": "22:00",
    "end": "07:00"
  },
  "types": {
    "designation": true,
    "convocation": true,
    "reminder": true,
    "payment": true
  },
  "reminderTiming": {
    "matchHoursBefore": 24,
    "seminarHoursBefore": 48
  }
}
```

### 6. PATCH `/api/notifications/preferences`
**Purpose:** Update my notification preferences

**Request:**
```json
{
  "channels": {
    "whatsapp": true
  },
  "whatsappNumber": "+21698123456",
  "quietHours": {
    "enabled": true,
    "start": "23:00",
    "end": "08:00"
  }
}
```

### 7. POST `/api/notifications/send-group` (ADMIN_DNA only)
**Purpose:** Send notification to multiple users

**Request:**
```json
{
  "title": "📢 Annonce importante",
  "message": "Séminaire national le 15 février",
  "roles": ["ARBITRE", "INSPECTEUR"],
  "regions": ["TUNIS", "SFAX"],
  "priority": "HIGH",
  "sendWhatsApp": true
}
```

**Response:**
```json
{
  "sent": 45,
  "failed": 2
}
```

### 8. GET `/api/notifications/templates` (ADMIN_DNA only)
**Purpose:** Get all notification templates

### 9. POST `/api/notifications/templates` (ADMIN_DNA only)
**Purpose:** Create new notification template

**Request:**
```json
{
  "code": "MATCH_REMINDER",
  "type": "MATCH_REMINDER",
  "titleTemplate": "⏰ Rappel: Match dans {{hours}}h",
  "messageTemplate": "Rappel: Match {{homeTeam}} vs {{awayTeam}} à {{venue}}",
  "whatsappTemplate": "⚽ *Rappel Match*\n{{homeTeam}} vs {{awayTeam}}\n📍 {{venue}}\n🕐 {{date}}",
  "variables": ["hours", "homeTeam", "awayTeam", "venue", "date"]
}
```

### 10. GET `/api/notifications/whatsapp/status` (ADMIN_DNA only)
**Purpose:** Check WhatsApp connection status

**Response:**
```json
{
  "enabled": true,
  "authorized": true,
  "details": {
    "stateInstance": "authorized"
  }
}
```

### Notification Types
| Type | Description | Recipients |
|------|-------------|------------|
| DESIGNATION_ASSIGNED | Referee assigned to match | Arbitre |
| CONVOCATION_INVITED | Invited to seminar/training | Arbitre |
| MATCH_REMINDER | Match starting soon | Arbitre |
| SEMINAR_REMINDER | Seminar starting soon | Arbitre |
| AVAILABILITY_REPORTED | Excuse/injury reported | CRA |
| PAYMENT_VALIDATED | Payment confirmed | Arbitre |
| ANNOUNCEMENT | Admin group message | All |

---

## Notes

1. **All dates** should be in ISO 8601 format: `2026-01-15T19:00:00Z`
2. **All endpoints** require authentication (except `/api/auth/login`)
3. **Bearer token** must be in Authorization header
4. **Pagination** uses `page` and `limit` query parameters
5. **Soft deletes** preserve data (sets `isActive=false`)
6. **Audit trails** track all override actions with user, timestamp, reason

---

## Quick Reference: Entity Relationships

```
User (Authentication)
  ↓ userId
  ├─→ Referee (Professional Profile)
  ├─→ Inspector (Professional Profile)
  └─→ CRA President (Professional Profile)

Match
  ↓ matchId
  ├─→ Designation (Referee Assignments)
  ├─→ Commissioner Report (Performance)
  ├─→ Inspector Report (Evaluation)
  └─→ Payments (Generated after match)

Designation
  ↓ referees
  └─→ Referee

Payment
  ├─→ Match
  └─→ Referee
```
