package dashboard

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/jackc/pgx/v5/pgxpool"

	"income-tracker/internal/auth"
)

type Handler struct {
	Conn *pgxpool.Pool
}

func (h Handler) Summary(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(auth.UserIDKey).(int)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	/* Omitted means "every space the user owns"; present means one space. A
	   malformed value is rejected rather than ignored, so a client bug like a
	   stray quote surfaces as a 400 instead of quiet account-wide totals. */
	var financeSpaceID *int

	if raw := r.URL.Query().Get("finance_space_id"); raw != "" {
		id, err := strconv.Atoi(raw)

		if err != nil || id <= 0 {
			http.Error(w, "invalid finance_space_id", http.StatusBadRequest)
			return
		}

		financeSpaceID = &id
	}

	summary, err := GetSummary(
		r.Context(),
		h.Conn,
		userID,
		financeSpaceID,
	)

	if err != nil {
		http.Error(w, "could not get dashboard", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(summary)
}
