package dashboard

import (
	"context"

	"github.com/jackc/pgx/v5"
)

type Summary struct {
	TotalIncome   float64 `json:"total_income"`
	TotalExpenses float64 `json:"total_expenses"`
	Balance       float64 `json:"balance"`
	TotalDebt     float64 `json:"total_debt"`
	TotalCredit   float64 `json:"total_credit"`
}

func GetSummary(
	ctx context.Context,
	conn *pgx.Conn,
	userID int,
) (Summary, error) {

	var summary Summary

	err := conn.QueryRow(
		ctx,
		`SELECT
			COALESCE((
				SELECT SUM(i.amount)
				FROM income i
				JOIN finance_spaces fs ON i.finance_space_id = fs.id
				WHERE fs.user_id = $1
			), 0),

			COALESCE((
				SELECT SUM(e.amount)
				FROM expenses e
				JOIN finance_spaces fs ON e.finance_space_id = fs.id
				WHERE fs.user_id = $1
			), 0),

			COALESCE((
				SELECT SUM(d.amount)
				FROM debts d
				JOIN finance_spaces fs ON d.finance_space_id = fs.id
				WHERE fs.user_id = $1
			), 0),

			COALESCE((
				SELECT SUM(c.amount)
				FROM credits c
				JOIN finance_spaces fs ON c.finance_space_id = fs.id
				WHERE fs.user_id = $1
			), 0)`,
		userID,
	).Scan(
		&summary.TotalIncome,
		&summary.TotalExpenses,
		&summary.TotalDebt,
		&summary.TotalCredit,
	)

	if err != nil {
		return Summary{}, err
	}

	summary.Balance = summary.TotalIncome - summary.TotalExpenses

	return summary, nil
}
