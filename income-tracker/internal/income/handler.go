package income

import (
	"encoding/json"
	"errors"
	"github.com/jackc/pgx/v5/pgxpool"
	"net/http"
	"time"

	"income-tracker/internal/auth"
)

type Handler struct {
	Conn *pgxpool.Pool
}

type CreateRequest struct {
	FinanceSpaceID int     `json:"finance_space_id"`
	CategoryID     int     `json:"category_id"`
	Amount         float64 `json:"amount"`
	DateReceived   string  `json:"date_received"`
	Description    string  `json:"description"`
}

func (h Handler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(auth.UserIDKey).(int)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req CreateRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	dateReceived, err := time.Parse("2006-01-02", req.DateReceived)
	if err != nil {
		http.Error(w, "invalid date format, use YYYY-MM-DD", http.StatusBadRequest)
		return
	}

	income, err := Create(
		r.Context(),
		h.Conn,
		userID,
		req.FinanceSpaceID,
		req.CategoryID,
		req.Amount,
		dateReceived,
		req.Description,
	)

	if err != nil {
		if errors.Is(err, ErrFinanceSpaceNotFound) {
			http.Error(w, "finance space not found", http.StatusNotFound)
			return
		}

		http.Error(w, "could not create income", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(income)
}

func (h Handler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(auth.UserIDKey).(int)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	incomes, err := List(
		r.Context(),
		h.Conn,
		userID,
	)

	if err != nil {
		http.Error(w, "could not get income", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(incomes)
}
