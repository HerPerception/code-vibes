package dashboard

import (
	"encoding/json"
	"net/http"

	"income-tracker/internal/auth"

	"github.com/jackc/pgx/v5"
)

type Handler struct {
	Conn *pgx.Conn
}

func (h Handler) Summary(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(auth.UserIDKey).(int)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	summary, err := GetSummary(
		r.Context(),
		h.Conn,
		userID,
	)

	if err != nil {
		http.Error(w, "could not get dashboard", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(summary)
}
