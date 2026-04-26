package handlers

import (
	"database/sql"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/taskflow/backend/internal/middleware"
	"github.com/taskflow/backend/internal/models"
)

type ProjectHandler struct {
	db *sql.DB
}

func (h *ProjectHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	rows, err := h.db.Query(`
		SELECT DISTINCT p.id, p.name, p.description, p.owner_id, p.created_at
		FROM projects p
		LEFT JOIN tasks t ON t.project_id = p.id
		WHERE p.owner_id = $1 OR t.assignee_id = $1
		ORDER BY p.created_at DESC
	`, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "server error")
		return
	}
	defer rows.Close()

	projects := []models.Project{}
	for rows.Next() {
		var p models.Project
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.OwnerID, &p.CreatedAt); err != nil {
			continue
		}
		projects = append(projects, p)
	}

	writeJSON(w, http.StatusOK, map[string]any{"projects": projects})
}

func (h *ProjectHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	var body struct {
		Name        string  `json:"name"`
		Description *string `json:"description"`
	}
	if err := decode(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if strings.TrimSpace(body.Name) == "" {
		writeValidationError(w, map[string]string{"name": "is required"})
		return
	}

	p := models.Project{
		ID:          uuid.New().String(),
		Name:        body.Name,
		Description: body.Description,
		OwnerID:     userID,
	}

	err := h.db.QueryRow(
		`INSERT INTO projects (id, name, description, owner_id) VALUES ($1,$2,$3,$4) RETURNING created_at`,
		p.ID, p.Name, p.Description, p.OwnerID,
	).Scan(&p.CreatedAt)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "server error")
		return
	}

	writeJSON(w, http.StatusCreated, p)
}

func (h *ProjectHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	projectID := r.PathValue("id")

	var p models.Project
	err := h.db.QueryRow(
		`SELECT id, name, description, owner_id, created_at FROM projects WHERE id=$1`,
		projectID,
	).Scan(&p.ID, &p.Name, &p.Description, &p.OwnerID, &p.CreatedAt)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "server error")
		return
	}

	// Access check: owner or has tasks assigned
	if p.OwnerID != userID {
		var count int
		h.db.QueryRow(`SELECT COUNT(*) FROM tasks WHERE project_id=$1 AND assignee_id=$2`, projectID, userID).Scan(&count)
		if count == 0 {
			writeError(w, http.StatusForbidden, "forbidden")
			return
		}
	}

	rows, err := h.db.Query(`
		SELECT id, title, description, status, priority, project_id, assignee_id,
		       to_char(due_date, 'YYYY-MM-DD'), created_at, updated_at
		FROM tasks WHERE project_id=$1 ORDER BY created_at DESC
	`, projectID)
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

	writeJSON(w, http.StatusOK, models.ProjectWithTasks{Project: p, Tasks: tasks})
}

func (h *ProjectHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	projectID := r.PathValue("id")

	var ownerID string
	err := h.db.QueryRow(`SELECT owner_id FROM projects WHERE id=$1`, projectID).Scan(&ownerID)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "not found")
		return
	}
	if ownerID != userID {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	var body struct {
		Name        *string `json:"name"`
		Description *string `json:"description"`
	}
	if err := decode(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	var p models.Project
	err = h.db.QueryRow(`
		UPDATE projects
		SET name = COALESCE($1, name),
		    description = COALESCE($2, description)
		WHERE id = $3
		RETURNING id, name, description, owner_id, created_at
	`, body.Name, body.Description, projectID).Scan(&p.ID, &p.Name, &p.Description, &p.OwnerID, &p.CreatedAt)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "server error")
		return
	}

	writeJSON(w, http.StatusOK, p)
}

func (h *ProjectHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	projectID := r.PathValue("id")

	var ownerID string
	err := h.db.QueryRow(`SELECT owner_id FROM projects WHERE id=$1`, projectID).Scan(&ownerID)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "not found")
		return
	}
	if ownerID != userID {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	_, err = h.db.Exec(`DELETE FROM projects WHERE id=$1`, projectID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "server error")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *ProjectHandler) Stats(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	projectID := r.PathValue("id")

	var ownerID string
	err := h.db.QueryRow(`SELECT owner_id FROM projects WHERE id=$1`, projectID).Scan(&ownerID)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "not found")
		return
	}
	if ownerID != userID {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	byStatus := map[string]int{"todo": 0, "in_progress": 0, "done": 0}
	rows, _ := h.db.Query(`SELECT status, COUNT(*) FROM tasks WHERE project_id=$1 GROUP BY status`, projectID)
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var s string
			var c int
			rows.Scan(&s, &c)
			byStatus[s] = c
		}
	}

	byAssignee := map[string]models.AssigneeStat{}
	arows, _ := h.db.Query(`
		SELECT u.id, u.name, COUNT(t.id)
		FROM tasks t JOIN users u ON u.id = t.assignee_id
		WHERE t.project_id=$1 AND t.assignee_id IS NOT NULL
		GROUP BY u.id, u.name
	`, projectID)
	if arows != nil {
		defer arows.Close()
		for arows.Next() {
			var id, name string
			var count int
			arows.Scan(&id, &name, &count)
			byAssignee[id] = models.AssigneeStat{Name: name, Count: count}
		}
	}

	writeJSON(w, http.StatusOK, models.ProjectStats{ByStatus: byStatus, ByAssignee: byAssignee})
}
