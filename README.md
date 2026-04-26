# TaskFlow

A minimal but production-ready task management system with authentication, projects, and kanban boards.

---

## 1. Overview

TaskFlow lets users register, log in, create projects, add tasks, and assign them to team members. It ships with a Go REST API, a React + TypeScript frontend, PostgreSQL for persistence, and a single `docker compose up` to run everything.

**Stack:**
- **Backend:** Go 1.22, standard library `net/http` (no framework), `golang-migrate` for migrations, `golang-jwt` for JWTs, `bcrypt` for passwords, `slog` for structured logging
- **Frontend:** React 18, TypeScript, React Router v6, Vite, custom component system (no external UI library)
- **Database:** PostgreSQL 16
- **Infrastructure:** Docker + Docker Compose, multi-stage Dockerfiles, nginx for the frontend

---

## 2. Architecture Decisions

**Go standard library over a framework.** Go 1.22's `net/http` now supports method-based routing (`GET /projects/{id}`) natively. Adding Gin or Chi would be extra dependency weight for no real benefit at this scale.

**No ORM.** Raw `database/sql` with hand-written queries keeps the SQL visible, reviewable, and explicit. At this scope it's faster to write than fighting an ORM's abstractions.

**JWT in Authorization header, stored in localStorage.** Simple and standard. The tradeoff is XSS exposure vs. cookie complexity — for a take-home this is the right call. In production I'd use httpOnly cookies with CSRF tokens.

**Custom React components.** Chose to build a small component system rather than pull in shadcn/ui or MUI. This keeps the bundle small, shows component design thinking, and avoids fighting library defaults. The tradeoff is more upfront code.

**Migrations auto-run on startup.** The API container runs `migrate up` before starting the HTTP server. This means zero manual steps after `docker compose up`. The tradeoff is that you'd want a more careful migration strategy in a multi-replica production deploy.

**Seed runs once.** The seed function checks if the test user exists before inserting — so it's idempotent and safe to run on every restart.

**What I intentionally left out:**
- Refresh tokens (out of scope for the assignment)
- Rate limiting (would add in production)
- Full team membership model (assignees are derived from the current user; a real app would have a `project_members` table)
- WebSocket real-time updates (listed as a bonus — ran out of time)
- Pagination (partially implemented in the API query layer but not wired to query params on all endpoints)

---

## 3. Running Locally

You only need Docker installed. Nothing else.

```bash
git clone https://github.com/your-name/taskflow
cd taskflow
cp .env.example .env
docker compose up --build
```

- **Frontend:** http://localhost:3000
- **API:** http://localhost:8080

The first boot takes ~60s to build both images. Subsequent starts are fast.

Migrations and seed data run automatically on API container start.

---

## 4. Running Migrations

Migrations run automatically when the API container starts. If you need to run them manually:

```bash
# Install golang-migrate
brew install golang-migrate   # macOS
# or: go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# Run migrations against a local DB
migrate -path ./backend/migrations \
        -database "postgres://taskflow:taskflow_secret@localhost:5432/taskflow?sslmode=disable" \
        up

# Roll back
migrate -path ./backend/migrations \
        -database "postgres://taskflow:taskflow_secret@localhost:5432/taskflow?sslmode=disable" \
        down 1
```

---

## 5. Test Credentials

```
Email:    test@taskflow.io
Password: password123
```

Two additional seeded users (same password):
```
sneha@taskflow.io
priya@taskflow.io
```

---

## 6. API Reference

### Auth

**POST /auth/register**
```json
// Request
{ "name": "Jane Doe", "email": "jane@example.com", "password": "secret123" }

// Response 201
{ "token": "<jwt>", "user": { "id": "uuid", "name": "Jane Doe", "email": "jane@example.com" } }
```

**POST /auth/login**
```json
// Request
{ "email": "test@taskflow.io", "password": "password123" }

// Response 200
{ "token": "<jwt>", "user": { "id": "uuid", "name": "Arjun Kumar", "email": "test@taskflow.io" } }
```

All subsequent requests require: `Authorization: Bearer <token>`

---

### Projects

**GET /projects** — list projects the user owns or has tasks in
```json
// Response 200
{ "projects": [{ "id": "uuid", "name": "Website Redesign", "description": "...", "owner_id": "uuid", "created_at": "..." }] }
```

**POST /projects**
```json
// Request
{ "name": "New Project", "description": "Optional" }
// Response 201 — project object
```

**GET /projects/:id** — project + all its tasks
```json
// Response 200
{ "id": "uuid", "name": "...", "tasks": [ /* task objects */ ] }
```

**PATCH /projects/:id** — owner only
```json
// Request — all fields optional
{ "name": "Updated Name", "description": "Updated desc" }
// Response 200 — updated project object
```

**DELETE /projects/:id** — owner only → 204 No Content

**GET /projects/:id/stats** — owner only
```json
// Response 200
{
  "by_status": { "todo": 3, "in_progress": 2, "done": 5 },
  "by_assignee": { "uuid": { "name": "Arjun Kumar", "count": 4 } }
}
```

---

### Tasks

**GET /projects/:id/tasks?status=todo&assignee=uuid**
```json
// Response 200
{ "tasks": [ /* task objects */ ] }
```

**POST /projects/:id/tasks**
```json
// Request
{ "title": "Design homepage", "description": "...", "priority": "high", "assignee_id": "uuid", "due_date": "2026-04-20" }
// Response 201 — task object
```

**PATCH /tasks/:id** — all fields optional
```json
// Request
{ "title": "Updated", "status": "done", "priority": "low", "assignee_id": "uuid", "due_date": "2026-04-25" }
// Response 200 — updated task object
```

**DELETE /tasks/:id** — project owner only → 204 No Content

---

### Error Responses

```json
// 400
{ "error": "validation failed", "fields": { "email": "is required" } }

// 401
{ "error": "unauthorized" }

// 403
{ "error": "forbidden" }

// 404
{ "error": "not found" }
```

---

## 7. What I'd Do With More Time

**Authentication hardening.** Refresh tokens with rotation, httpOnly cookies, proper CSRF protection. The current JWT-in-localStorage approach is fine for a take-home but not for production.

**Project membership model.** Right now "team members" are inferred from task assignees using only the current user. A real app needs a `project_members` join table so you can invite collaborators and see their names across the UI.

**Better error recovery in the frontend.** I have optimistic UI for task status changes (reverts on failure) but other mutations like create/delete don't have retry logic or offline queuing.

**Pagination.** The list endpoints need `?page=&limit=` — the query structure is straightforward to extend but I ran out of time to wire it through the frontend too.

**Integration tests.** I'd write table-driven tests in Go covering: registration with duplicate email, login with wrong password, creating a task on a project you don't own, and the full auth→create project→create task→update status flow.

**Drag-and-drop kanban.** The column structure is already in place — I'd drop in `@dnd-kit/core` and wire the `onDragEnd` to call `tasksApi.update` with the new status.

**Real-time updates.** Server-Sent Events would be the lightest-weight approach — a `/events` endpoint that pushes task mutations to all clients watching a project.

**Proper loading skeletons.** Currently using a spinner. Skeleton screens feel much more polished and give users a better sense of layout before data arrives.
