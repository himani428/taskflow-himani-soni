# TaskFlow

A minimal but production-ready task management system with authentication, projects, and kanban boards.

---

## 1. Overview

TaskFlow allows users to register, log in, create projects, manage tasks, and organize them across different statuses.

This project is fully containerized and runs with a single command using Docker.

### Tech Stack

* **Backend:** Go (net/http), JWT, bcrypt, golang-migrate
* **Frontend:** React, TypeScript, Vite
* **Database:** PostgreSQL
* **Infrastructure:** Docker, Docker Compose, nginx

---

## 2. Architecture Decisions

* **Go standard library instead of frameworks**
  Uses Go 1.22 `net/http` for lightweight and efficient routing without external dependencies.

* **No ORM**
  Uses raw SQL with `database/sql` for full control and transparency.

* **JWT Authentication**
  Tokens stored in localStorage for simplicity (suitable for assignment scope).

* **Docker-first approach**
  Entire system runs via Docker — no manual backend/frontend setup required.

* **Frontend served via nginx**
  React app is built and served as static files in production mode.

* **Auto migrations & seed**
  Database migrations and seed data run automatically on startup.

---

## 3. Running Locally

You only need **Docker installed**. No need to run `npm install` or `npm run dev`.

```bash
git clone https://github.com/your-name/taskflow
cd taskflow

# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env

docker compose up --build
```

### Access the app:

* **Frontend:** http://localhost:3000
* **Backend API:** http://localhost:8080

> The frontend is built using Vite and served via nginx inside Docker. No separate frontend setup is required.

---

## 4. Database & Migrations

* Migrations run automatically when the backend starts
* Seed data runs safely (idempotent)

No manual setup required.

---

## 5. Test Credentials

You can either:

### Option 1 (Recommended)

Register a new user via the UI.

### Option 2

Use the following credentials:

```
Email: himani@test.com  
Password: 123456
```

---

## 6. API Reference

### Auth

#### POST /auth/register

```json
{
  "name": "Himani",
  "email": "himani@test.com",
  "password": "password123"
}
```

#### POST /auth/login

```json
{
  "email": "himani@test.com",
  "password": "password123"
}
```

Response:

```json
{
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "name": "Himani",
    "email": "himani@test.com"
  }
}
```

---

### Projects

* `GET /projects`
* `POST /projects`
* `GET /projects/:id`
* `PATCH /projects/:id`
* `DELETE /projects/:id`
* `GET /projects/:id/stats`

---

### Tasks

* `GET /projects/:id/tasks`
* `POST /projects/:id/tasks`
* `PATCH /tasks/:id`
* `DELETE /tasks/:id`

---

### Error Responses

```json
{ "error": "validation failed" }
{ "error": "unauthorized" }
{ "error": "not found" }
```

---

## 7. What I’d Improve With More Time

* Refresh token + secure cookie auth
* Project collaboration (team members)
* Pagination & filtering improvements
* Better frontend error handling
* Drag-and-drop kanban board
* Real-time updates (SSE/WebSockets)
* Integration tests

---

## 8. Notes

* This project is designed to run entirely via Docker
* No manual dependency installation required
* Clean separation between backend, frontend, and database

---

## 9. Submission Checklist

* [x] Docker setup working
* [x] Auth flow (register/login) working
* [x] Projects & tasks working
* [x] Clean UI (no demo credentials hardcoded)
* [x] README aligned with actual setup

---
