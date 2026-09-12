package dashboard

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// MonthlyPoint is one month of the cash-flow chart: the income bar and the
// expense bar that share a band. Months with no activity are absent rather
// than zero — the chart plots what exists.
type MonthlyPoint struct {
	Month   string  `json:"month"` // "YYYY-MM"
	Income  float64 `json:"income"`
	Expense float64 `json:"expense"`
}

// Summary is every figure the dashboard tiles show, computed in the database
// instead of by summing full result sets in the browser.
//
// FinanceSpaceID echoes back the space the numbers describe. The response is
// not instantaneous relative to a space switch, so without it a slow reply for
// the previous space can land after the new one and overwrite the tiles with
// the wrong totals. The client can drop a reply whose id is not the one it is
// currently showing.
type Summary struct {
	FinanceSpaceID *int `json:"finance_space_id,omitempty"`

	TotalIncome   float64 `json:"total_income"`
	TotalExpenses float64 `json:"total_expenses"`
	Balance       float64 `json:"balance"`

	TotalDebt       float64 `json:"total_debt"`
	TotalDebtRepaid float64 `json:"total_debt_repaid"`
	OutstandingDebt float64 `json:"outstanding_debt"`

	TotalCredit       float64 `json:"total_credit"`
	TotalCreditRepaid float64 `json:"total_credit_repaid"`
	OutstandingCredit float64 `json:"outstanding_credit"`

	Monthly []MonthlyPoint `json:"monthly"`
}

// GetSummary totals one finance space, or every space the user owns when
// financeSpaceID is nil.
//
// A finance_space_id belonging to another user is not an error: the scope CTE
// only ever yields spaces owned by userID, so the foreign id simply matches
// nothing and every total comes back zero.
func GetSummary(
	ctx context.Context,
	conn *pgxpool.Pool,
	userID int,
	financeSpaceID *int,
) (Summary, error) {

	summary := Summary{FinanceSpaceID: financeSpaceID}

	/* ($2::int IS NULL OR ...) is the optional-scope idiom. The cast is not
	   decoration: without it Postgres cannot infer a type for the bare $2 in
	   the IS NULL test and the statement fails to prepare. */
	err := conn.QueryRow(
		ctx,
		`WITH scope AS (
			SELECT id
			FROM finance_spaces
			WHERE user_id = $1
			AND ($2::int IS NULL OR id = $2)
		)
		SELECT
			COALESCE((SELECT SUM(amount)
				FROM income
				WHERE finance_space_id IN (SELECT id FROM scope)), 0),

			COALESCE((SELECT SUM(amount)
				FROM expenses
				WHERE finance_space_id IN (SELECT id FROM scope)), 0),

			COALESCE((SELECT SUM(amount)
				FROM debts
				WHERE finance_space_id IN (SELECT id FROM scope)), 0),

			/* Repayments carry only their parent's id, so they reach the
			   space through the debt they repay — the same scoping the client
			   used to do in a Set. */
			COALESCE((SELECT SUM(dr.amount)
				FROM debt_repayments dr
				JOIN debts d ON dr.debt_id = d.id
				WHERE d.finance_space_id IN (SELECT id FROM scope)), 0),

			COALESCE((SELECT SUM(amount)
				FROM credits
				WHERE finance_space_id IN (SELECT id FROM scope)), 0),

			COALESCE((SELECT SUM(cr.amount)
				FROM credit_repayments cr
				JOIN credits c ON cr.credit_id = c.id
				WHERE c.finance_space_id IN (SELECT id FROM scope)), 0)`,
		userID,
		financeSpaceID,
	).Scan(
		&summary.TotalIncome,
		&summary.TotalExpenses,
		&summary.TotalDebt,
		&summary.TotalDebtRepaid,
		&summary.TotalCredit,
		&summary.TotalCreditRepaid,
	)

	if err != nil {
		return Summary{}, err
	}

	summary.Balance = summary.TotalIncome - summary.TotalExpenses
	summary.OutstandingDebt = summary.TotalDebt - summary.TotalDebtRepaid
	summary.OutstandingCredit = summary.TotalCredit - summary.TotalCreditRepaid

	/* The client floors these at zero, because a space can be over-repaid by
	   an older bug or a direct edit. Keep that, or the tiles show negatives
	   the chart does not agree with. */
	if summary.OutstandingDebt < 0 {
		summary.OutstandingDebt = 0
	}

	if summary.OutstandingCredit < 0 {
		summary.OutstandingCredit = 0
	}

	monthly, err := getMonthly(
		ctx,
		conn,
		userID,
		financeSpaceID,
	)

	if err != nil {
		return Summary{}, err
	}

	summary.Monthly = monthly

	return summary, nil
}

/* getMonthly buckets income and expenses into one row per calendar month. The
   two tables name their date column differently, which is why this is a UNION
   of two shapes rather than one join.

   The scope predicate below must stay identical to the one in GetSummary. If
   the two ever disagree the tiles and the chart start describing different
   sets of transactions, and the chart is the one that looks wrong. */
func getMonthly(
	ctx context.Context,
	conn *pgxpool.Pool,
	userID int,
	financeSpaceID *int,
) ([]MonthlyPoint, error) {

	rows, err := conn.Query(
		ctx,
		`WITH scope AS (
			SELECT id
			FROM finance_spaces
			WHERE user_id = $1
			AND ($2::int IS NULL OR id = $2)
		)
		SELECT
			month,
			SUM(income),
			SUM(expense)
		FROM (
			SELECT
				to_char(date_received, 'YYYY-MM') AS month,
				amount AS income,
				0 AS expense
			FROM income
			WHERE finance_space_id IN (SELECT id FROM scope)

			UNION ALL

			SELECT
				to_char(date, 'YYYY-MM') AS month,
				0 AS income,
				amount AS expense
			FROM expenses
			WHERE finance_space_id IN (SELECT id FROM scope)
		) AS buckets
		GROUP BY month
		ORDER BY month`,
		userID,
		financeSpaceID,
	)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	points := make([]MonthlyPoint, 0)

	for rows.Next() {
		var point MonthlyPoint

		err := rows.Scan(
			&point.Month,
			&point.Income,
			&point.Expense,
		)

		if err != nil {
			return nil, err
		}

		points = append(points, point)
	}

	return points, rows.Err()
}
