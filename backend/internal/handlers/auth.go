package handlers

import (
	"database/sql"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/taskflow/backend/internal/auth"
	"github.com/taskflow/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	db *sql.DB
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := decode(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	fields := map[string]string{}
	if strings.TrimSpace(body.Name) == "" {
		fields["name"] = "is required"
	}
	if strings.TrimSpace(body.Email) == "" {
		fields["email"] = "is required"
	}
	if len(body.Password) < 8 {
		fields["password"] = "must be at least 8 characters"
	}
	if len(fields) > 0 {
		writeValidationError(w, fields)
		return
	}

	var exists bool
	_ = h.db.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE email=$1)`, body.Email).Scan(&exists)
	if exists {
		writeValidationError(w, map[string]string{"email": "already in use"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), 12)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "server error")
		return
	}

	user := models.User{
		ID:    uuid.New().String(),
		Name:  body.Name,
		Email: body.Email,
	}

	_, err = h.db.Exec(
		`INSERT INTO users (id, name, email, password) VALUES ($1, $2, $3, $4)`,
		user.ID, user.Name, user.Email, string(hash),
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "server error")
		return
	}

	token, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "server error")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{"token": token, "user": user})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := decode(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	fields := map[string]string{}
	if strings.TrimSpace(body.Email) == "" {
		fields["email"] = "is required"
	}
	if strings.TrimSpace(body.Password) == "" {
		fields["password"] = "is required"
	}
	if len(fields) > 0 {
		writeValidationError(w, fields)
		return
	}

	var user models.User
	var hash string
	err := h.db.QueryRow(
		`SELECT id, name, email, password, created_at FROM users WHERE email=$1`,
		body.Email,
	).Scan(&user.ID, &user.Name, &user.Email, &hash, &user.CreatedAt)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "server error")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(body.Password)); err != nil {
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	token, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "server error")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"token": token, "user": user})
}
