package categories

import (
	"encoding/json"
	"errors"
	"github.com/jackc/pgx/v5/pgxpool"
	"net/http"

	"income-tracker/internal/auth"
)

type Handler struct {
	Conn *pgxpool.Pool
}

type CreateRequest struct {
	FinanceSpaceID int    `json:"finance_space_id"`
	Name           string `json:"name"`
	Type           string `json:"type"`
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

	category, err := Create(
		r.Context(),
		h.Conn,
		userID,
		req.FinanceSpaceID,
		req.Name,
		req.Type,
	)

	if err != nil {
		if errors.Is(err, ErrFinanceSpaceNotFound) {
			http.Error(w, "finance space not found", http.StatusNotFound)
			return
		}

		http.Error(w, "could not create category", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(category)
}

func (h Handler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(auth.UserIDKey).(int)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	categories, err := List(r.Context(), h.Conn, userID)

	if err != nil {
		http.Error(w, "could not get categories", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(categories)
}
