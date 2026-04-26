package handlers

import (
	"database/sql"
	"net/http"

	"github.com/taskflow/backend/internal/middleware"
)

func NewRouter(db *sql.DB) http.Handler {
	mux := http.NewServeMux()

	ah := &AuthHandler{db: db}
	ph := &ProjectHandler{db: db}
	th := &TaskHandler{db: db}

	// Public auth routes
	mux.HandleFunc("POST /auth/register", ah.Register)
	mux.HandleFunc("POST /auth/login", ah.Login)

	// Protected routes wrapped individually
	protected := func(h http.HandlerFunc) http.Handler {
		return middleware.Auth(h)
	}

	mux.Handle("GET /projects", protected(ph.List))
	mux.Handle("POST /projects", protected(ph.Create))
	mux.Handle("GET /projects/{id}", protected(ph.Get))
	mux.Handle("PATCH /projects/{id}", protected(ph.Update))
	mux.Handle("DELETE /projects/{id}", protected(ph.Delete))
	mux.Handle("GET /projects/{id}/stats", protected(ph.Stats))

	mux.Handle("GET /projects/{id}/tasks", protected(th.List))
	mux.Handle("POST /projects/{id}/tasks", protected(th.Create))
	mux.Handle("PATCH /tasks/{id}", protected(th.Update))
	mux.Handle("DELETE /tasks/{id}", protected(th.Delete))

	return mux
}
