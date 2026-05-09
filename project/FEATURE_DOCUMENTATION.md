# Project Feature Documentation

This document describes the complete product and technical feature set for the `project/` application.

## 1) Product Overview

`project/` is a Next.js App Router SaaS application that combines:
- Team workspaces
- Task management and collaboration
- Invite-based team onboarding
- AI assistant workflows
- Property and meeting workflows
- Stripe billing
- Admin console and analytics

Primary production host:
- [https://bnu-one.vercel.app](https://bnu-one.vercel.app)

## 2) Tech Stack

- Framework: Next.js 16 (App Router), React 18, TypeScript
- Database: PostgreSQL + Prisma (with generated client in `src/generated/prisma`)
- Auth: JWT cookie auth (`auth-token`) via `jose` and `bcryptjs`
- Realtime: Pusher
- Storage: Supabase Storage
- Payments: Stripe
- Email: Resend
- Video/rooms: 100ms APIs
- AI: Groq-compatible APIs (chat, STT, TTS, task parsing, summaries)
- Optional social sign-in: Firebase (Google sign-in)

## 3) High-Level Architecture

- UI routes in `src/app/**`
- API routes in `src/app/api/**`
- Shared services in `src/lib/**`
- UI components in `src/components/**`
- Prisma models in `prisma/schema.prisma`

Core global wrappers:
- `src/app/layout.tsx`
  - `ThemeProvider`
  - `AuthProvider`
  - `UserOnboardingGuard`
  - `AppLayout`

## 4) Route / Page Feature Map

### Public/Marketing
- `/` (`src/app/page.tsx`): Landing (hero, case studies, process, testimonials, contact)
- `/pricing`: Pricing and upgrade entry

### Authentication
- `/login`: Email/password + Google popup sign-in
- `/signup`: Account creation

### Onboarding
- `/onboarding`: Multi-step onboarding flow:
  - profession
  - team size
  - primary goal
  - workspace identity (name/logo)
  - completion

### Workspace Experience
- `/workspaces`: Workspace dashboard and stats
- `/workspaces/[slug]`: Workspace home
- `/workspaces/[slug]/tasks`: Task board/management
- `/workspaces/[slug]/tasks-list`: Task list view
- `/workspaces/[slug]/chat`: Workspace chat
- `/workspaces/[slug]/members`: Team member management
- `/workspaces/[slug]/analytics`: Workspace analytics
- `/workspaces/[slug]/reports`: Workspace reports
- `/workspaces/[slug]/settings`: Workspace settings

### Cross-workspace/User Features
- `/tasks`: User task center (assigned/all views + AI prioritize)
- `/profile`: Profile and integrations
- `/chat`: Global/community chat
- `/send-email`: Email utility form
- `/meeting`: Meeting room client route

### Property Features
- `/properties`: Property listing
- `/properties/[id]`: Property detail + meeting request workflow

### Billing
- `/stripe`
- `/stripe/success`
- `/stripe/cancel`

### Invite Flow
- `/invite?token=...`: Invite preview + auto acceptance flow

### Admin Console
- `/admin`
- `/admin/analytics`
- `/admin/properties`
- `/admin/properties/new`
- `/admin/requests`
- `/admin/reports`
- `/admin/settings`
- `/admin/users`

## 5) Core User Flows

### Signup/Login
- Signup creates user, sets auth cookie, logs activity, then routes to onboarding.
- Login validates credentials, sets auth cookie, logs activity, sends login notification.
- Google sign-in path verifies Firebase ID token and maps user account.

### Onboarding
- User completes multi-step profile/workspace setup.
- Completion persists via `PATCH /api/auth/me`.
- If user has no workspace membership, a default workspace is created.

### Workspace Creation & Collaboration
- Users can create workspaces (premium logic can limit count for non-premium users).
- Owners/admins can invite members by email.
- Invite links are emailed via Resend.
- In production invite links are forced to `https://bnu-one.vercel.app`.

### Invite Acceptance (No Login Prompt Path)
- Invite token is validated through `/api/workspaces/invites/accept`.
- If no active session exists, backend can resolve/create the invited user and set auth cookie.
- User is added to workspace from token.
- Redirect behavior:
  - onboarding incomplete -> `/onboarding`
  - onboarding complete -> target workspace

### Task Lifecycle
- Create/update/delete tasks in workspace context.
- Assign members, set status/priority, track milestones.
- Some actions emit notifications and points updates.
- Calendar and meeting integrations attach to tasks.

### Admin Workflows
- Admin-only user management, analytics, activity monitoring.
- Admin review of meeting requests with approval/rejection and follow-up notifications/emails.

### Billing Flow
- Stripe checkout session creation.
- Webhook updates premium status.
- Session verification endpoint refreshes billing state in user profile.

## 6) API Domain Map

### Auth API
- `api/auth/login`
- `api/auth/signup`
- `api/auth/logout`
- `api/auth/me`
- `api/auth/google`
- `api/auth/google/calendar`
- `api/auth/google/calendar/callback`

### Workspace API
- `api/workspaces`
- `api/workspaces/dashboard-stats`
- `api/workspaces/[slug]`
- `api/workspaces/[slug]/members`
- `api/workspaces/[slug]/members/[memberId]`
- `api/workspaces/[slug]/invites`
- `api/workspaces/[slug]/invites/[inviteId]`
- `api/workspaces/invites/accept`

### Task API
- `api/workspaces/[slug]/tasks`
- `api/workspaces/[slug]/tasks/[taskId]`
- `api/workspaces/[slug]/tasks/[taskId]/calendar`
- `api/workspaces/[slug]/tasks/[taskId]/meeting`
- `api/tasks`
- `api/tasks/ai-prioritize`

### Chat API
- `api/chat/messages`
- `api/workspaces/[slug]/chat/messages`

### Admin API
- `api/admin/users`
- `api/admin/analytics`
- `api/admin/activity`
- `api/admin/meeting-requests`
- `api/admin/notifications`
- `api/admin/properties`
- `api/admin/reports/view`

### Other API Domains
- Stripe: `api/stripe/create-checkout`, `api/stripe/verify-session`, `api/stripe/webhook`
- Properties: `api/properties`, `api/properties/[id]`
- Notifications: `api/notifications`
- Meetings: `api/meeting-requests`, `api/get-or-create-room`, `api/generate-code`, `api/check-room`
- AI: `api/ai/daily-summary`, `api/groq-stt`, `api/groq-task-parse`, `api/groq-tts`, `api/workspaces/[slug]/ai-chat`
- Misc: `api/profile/avatar`, `api/email/send`, `api/health`

## 7) Realtime & Notifications

- Pusher channels power:
  - workspace chat updates
  - community chat updates
  - user notifications
  - admin notifications
  - workspace-level refresh events

Notification sources include:
- login/signup
- task milestone or assignment events
- invite accepted events
- meeting and admin actions

## 8) Data Model (Prisma)

Main entities:
- `User`
- `Workspace`
- `WorkspaceMember`
- `WorkspaceInvite`
- `Task`
- `Milestone`
- `Property`
- `MeetingRequest`
- `ChatMessage`
- `ActivityLog`
- `Notification`

Model file:
- `prisma/schema.prisma`

## 9) Integrations

### Supabase
- Avatar and workspace image uploads via storage bucket.
- Public URLs used in UI and Next image remote patterns.

### Resend
- Invite emails
- Admin-created user credentials emails
- Meeting-related emails
- Generic email sending endpoint

### Stripe
- Subscription checkout
- Webhook-based entitlement updates
- Session verification and premium status syncing

### 100ms
- Room creation
- Room code generation
- Meeting existence checks
- Task-meeting/admin-meeting integrations

### Google Calendar
- OAuth connect flow
- Task meeting/calendar event insertion for connected users

### AI / Groq-style endpoints
- Daily summary generation
- Task prioritization
- Workspace AI chat assistant
- STT/TTS and transcript parsing

## 10) Environment Variables Reference

Primary variables used in code:
- `DATABASE_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `PUSHER_APP_ID`
- `PUSHER_KEY`
- `PUSHER_SECRET`
- `PUSHER_CLUSTER`
- `NEXT_PUBLIC_PUSHER_KEY`
- `NEXT_PUBLIC_PUSHER_CLUSTER`
- `RESEND_SECRET_KEY`
- `RESEND_FROM_EMAIL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `MANAGEMENT_TOKEN`
- `TEMPLATE_ID`
- `API_KEY` (AI routes)
- `OAUTH_CLIENT_ID`
- `OAUTH_CLIENT_SECRET`
- Backward-compat typo fallback seen in code: `OAUTH_CLEINT_SECRET`

Notes:
- Use underscore naming (for example `OAUTH_CLIENT_ID`) and avoid invalid `-` env key style.
- Production invite links intentionally target `https://bnu-one.vercel.app`.

## 11) Build, Runtime, and DevOps

### Build flow
- `prebuild` runs `prisma generate`
- `build` runs `next build`
- Type validation is currently skipped in build via `next.config.ts` (`typescript.ignoreBuildErrors: true`)

### Docker
- `Dockerfile` for production multi-stage build
- `Dockerfile.dev` for development
- `docker-compose.yml` and `docker-compose.dev.yml` for app + postgres setup
- Health endpoint: `/api/health`

### Makefile
Convenience commands for:
- build/up/down/logs/restart/clean
- dev and dev-build
- prisma migrate/studio/generate/push
- shell/db-shell/status

## 12) Security and Hardening Notes

Current behavior to review in future hardening pass:
- Some endpoints are permissive and may need stricter authorization checks.
- Ensure secrets are not committed and rotate exposed credentials if needed.
- Remove insecure defaults (for example fallback JWT secret) in production.
- Re-enable strict type checking once all TypeScript errors are fixed.

## 13) Known Product Caveats / Consistency Notes

- Brand text appears mixed in places (for example "Momentum" vs "Ionio").
- Onboarding guard behavior should stay aligned with invite-token routing expectations.
- Validate all production callback URLs and domain-dependent links against deployed host.

---

If this doc needs a stricter format (for example API contracts with request/response schemas per endpoint), add a companion `API_REFERENCE.md`.
