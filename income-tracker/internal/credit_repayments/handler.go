package credit_repayments

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"income-tracker/internal/auth"

	"github.com/jackc/pgx/v5"
)

type Handler struct {
	Conn *pgx.Conn
}

type CreateRequest struct {
	CreditID int     `json:"credit_id"`
	Amount   float64 `json:"amount"`
	Date     string  `json:"date"`
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

	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		http.Error(w, "invalid date", http.StatusBadRequest)
		return
	}

	repayment, err := Create(
		r.Context(),
		h.Conn,
		userID,
		req.CreditID,
		req.Amount,
		date,
	)

	if err != nil {
		if errors.Is(err, ErrCreditNotFound) {
			http.Error(w, "credit not found", http.StatusNotFound)
			return
		}

		http.Error(w, "could not create credit repayment", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(repayment)
}

func (h Handler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(auth.UserIDKey).(int)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	repayments, err := List(r.Context(), h.Conn, userID)

	if err != nil {
		http.Error(w, "could not get credit repayments", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(repayments)
}
