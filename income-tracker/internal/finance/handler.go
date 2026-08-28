package finance

import (
	"encoding/json"
	"errors"
	"net/http"

	"income-tracker/internal/auth"

	"github.com/jackc/pgx/v5"
)

type Handler struct {
	Conn *pgx.Conn
}

type CreateRequest struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

func (h Handler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(auth.UserIDKey).(int)

	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req CreateRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	space, err := Create(
		r.Context(),
		h.Conn,
		userID,
		req.Name,
		req.Type,
	)

	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidName):
			http.Error(w, "finance space name cannot be empty", http.StatusBadRequest)

		case errors.Is(err, ErrInvalidType):
			http.Error(w, "type must be personal or business", http.StatusBadRequest)

		case errors.Is(err, ErrDuplicateName):
			http.Error(w, "you already have a finance space with this name", http.StatusConflict)

		default:
			http.Error(w, "could not create finance space", http.StatusInternalServerError)
		}

		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(space)
}

func (h Handler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(auth.UserIDKey).(int)

	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	spaces, err := List(
		r.Context(),
		h.Conn,
		userID,
	)

	if err != nil {
		http.Error(w, "could not get finance spaces", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(spaces)
}
