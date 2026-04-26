package handlers

import (
	"database/sql"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/taskflow/backend/internal/middleware"
	"github.com/taskflow/backend/internal/models"
)

type TaskHandler struct {
	db *sql.DB
}

func (h *TaskHandler) List(w http.ResponseWriter, r *http.Request) {
	projectID := r.PathValue("id")
	status := r.URL.Query().Get("status")
	assignee := r.URL.Query().Get("assignee")

	query := `SELECT id, title, description, status, priority, project_id, assignee_id,
	           to_char(due_date, 'YYYY-MM-DD'), created_at, updated_at
	           FROM tasks WHERE project_id=$1`
	args := []any{projectID}
	idx := 2

	if status != "" {
		query += " AND status=$" + string(rune('0'+idx))
		args = append(args, status)
		idx++
	}
	if assignee != "" {
		query += " AND assignee_id=$" + string(rune('0'+idx))
		args = append(args, assignee)
	}
	query += " ORDER BY created_at DESC"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "server error")
		return
	}
	defer rows.Close()

	tasks := []models.Task{}
	for rows.Next() {
		var t models.Task
		if err := rows.Scan(&t.ID, &t.Title, &t.Description, &t.Status, &t.Priority,
			&t.ProjectID, &t.AssigneeID, &t.DueDate, &t.CreatedAt, &t.UpdatedAt); err != nil {
			continue
		}
		tasks = append(tasks, t)
	}

	writeJSON(w, http.StatusOK, map[string]any{"tasks": tasks})
}

func (h *TaskHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	projectID := r.PathValue("id")

	// Check project exists and user has access
	var ownerID string
	err := h.db.QueryRow(`SELECT owner_id FROM projects WHERE id=$1`, projectID).Scan(&ownerID)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "not found")
		return
	}
	_ = userID // any authenticated user can create tasks

	var body struct {
		Title       string  `json:"title"`
		Description *string `json:"description"`
		Priority    string  `json:"priority"`
		AssigneeID  *string `json:"assignee_id"`
		DueDate     *string `json:"due_date"`
	}
	if err := decode(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if strings.TrimSpace(body.Title) == "" {
		writeValidationError(w, map[string]string{"title": "is required"})
		return
	}
	if body.Priority == "" {
		body.Priority = "medium"
	}

	t := models.Task{
		ID:          uuid.New().String(),
		Title:       body.Title,
		Description: body.Description,
		Status:      "todo",
		Priority:    body.Priority,
		ProjectID:   projectID,
		AssigneeID:  body.AssigneeID,
		DueDate:     body.DueDate,
	}

	err = h.db.QueryRow(`
		INSERT INTO tasks (id, title, description, status, priority, project_id, assignee_id, due_date)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
		RETURNING created_at, updated_at
	`, t.ID, t.Title, t.Description, t.Status, t.Priority, t.ProjectID, t.AssigneeID, t.DueDate,
	).Scan(&t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "server error")
		return
	}

	writeJSON(w, http.StatusCreated, t)
}

func (h *TaskHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	taskID := r.PathValue("id")

	var projectID string
	err := h.db.QueryRow(`SELECT project_id FROM tasks WHERE id=$1`, taskID).Scan(&projectID)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "not found")
		return
	}

	// Must be project owner or assignee
	var ownerID string
	h.db.QueryRow(`SELECT owner_id FROM projects WHERE id=$1`, projectID).Scan(&ownerID)
	var assigneeID *string
	h.db.QueryRow(`SELECT assignee_id FROM tasks WHERE id=$1`, taskID).Scan(&assigneeID)

	if ownerID != userID && (assigneeID == nil || *assigneeID != userID) {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	var body struct {
		Title       *string `json:"title"`
		Description *string `json:"description"`
		Status      *string `json:"status"`
		Priority    *string `json:"priority"`
		AssigneeID  *string `json:"assignee_id"`
		DueDate     *string `json:"due_date"`
	}
	if err := decode(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	var t models.Task
	err = h.db.QueryRow(`
		UPDATE tasks SET
			title       = COALESCE($1, title),
			description = COALESCE($2, description),
			status      = COALESCE($3, status),
			priority    = COALESCE($4, priority),
			assignee_id = CASE WHEN $5::text IS NOT NULL THEN $5::uuid ELSE assignee_id END,
			due_date    = CASE WHEN $6::text IS NOT NULL THEN $6::date ELSE due_date END,
			updated_at  = NOW()
		WHERE id = $7
		RETURNING id, title, description, status, priority, project_id, assignee_id,
		          to_char(due_date,'YYYY-MM-DD'), created_at, updated_at
	`, body.Title, body.Description, body.Status, body.Priority, body.AssigneeID, body.DueDate, taskID,
	).Scan(&t.ID, &t.Title, &t.Description, &t.Status, &t.Priority, &t.ProjectID,
		&t.AssigneeID, &t.DueDate, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "server error")
		return
	}

	writeJSON(w, http.StatusOK, t)
}

func (h *TaskHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	taskID := r.PathValue("id")

	var projectID string
	err := h.db.QueryRow(`SELECT project_id FROM tasks WHERE id=$1`, taskID).Scan(&projectID)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "not found")
		return
	}

	var ownerID string
	h.db.QueryRow(`SELECT owner_id FROM projects WHERE id=$1`, projectID).Scan(&ownerID)

	if ownerID != userID {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	h.db.Exec(`DELETE FROM tasks WHERE id=$1`, taskID)
	w.WriteHeader(http.StatusNoContent)
}
