package people

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
	FinanceSpaceID int    `json:"finance_space_id"`
	Name           string `json:"name"`
	Contact        string `json:"contact"`
	Note           string `json:"note"`
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

	person, err := Create(
		r.Context(),
		h.Conn,
		userID,
		req.FinanceSpaceID,
		req.Name,
		req.Contact,
		req.Note,
	)

	if err != nil {
		if errors.Is(err, ErrFinanceSpaceNotFound) {
			http.Error(w, "finance space not found", http.StatusNotFound)
			return
		}

		http.Error(w, "could not create person", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(person)
}

func (h Handler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(auth.UserIDKey).(int)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	people, err := List(r.Context(), h.Conn, userID)

	if err != nil {
		http.Error(w, "could not get people", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(people)
}
