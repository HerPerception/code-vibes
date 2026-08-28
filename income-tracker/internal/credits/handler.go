package credits

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
	FinanceSpaceID int     `json:"finance_space_id"`
	PersonID       *int    `json:"person_id"`
	Amount         float64 `json:"amount"`
	DateLent       string  `json:"date_lent"`
	RepaymentDate  *string `json:"repayment_date"`
	Description    string  `json:"description"`
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

	dateLent, err := time.Parse("2006-01-02", req.DateLent)

	if err != nil {
		http.Error(w, "invalid date_lent", http.StatusBadRequest)
		return
	}

	var repaymentDate *time.Time

	if req.RepaymentDate != nil && *req.RepaymentDate != "" {
		parsed, err := time.Parse("2006-01-02", *req.RepaymentDate)

		if err != nil {
			http.Error(w, "invalid repayment_date", http.StatusBadRequest)
			return
		}

		repaymentDate = &parsed
	}

	credit, err := Create(
		r.Context(),
		h.Conn,
		userID,
		req.FinanceSpaceID,
		req.PersonID,
		req.Amount,
		dateLent,
		repaymentDate,
		req.Description,
	)

	if err != nil {
		switch {
		case errors.Is(err, ErrFinanceSpaceNotFound):
			http.Error(w, "finance space not found", http.StatusNotFound)

		case errors.Is(err, ErrPersonNotFound):
			http.Error(w, "person not found in this finance space", http.StatusBadRequest)

		case errors.Is(err, ErrInvalidAmount):
			http.Error(w, "amount must be greater than zero", http.StatusBadRequest)

		case errors.Is(err, ErrInvalidRepaymentDate):
			http.Error(w, "repayment date cannot be before date lent", http.StatusBadRequest)

		default:
			http.Error(w, "could not create credit", http.StatusInternalServerError)
		}

		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(credit)
}

func (h Handler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(auth.UserIDKey).(int)

	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	credits, err := List(
		r.Context(),
		h.Conn,
		userID,
	)

	if err != nil {
		http.Error(w, "could not get credits", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(credits)
}
