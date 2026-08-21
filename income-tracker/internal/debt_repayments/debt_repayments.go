package debt_repayments

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
)

type DebtRepayment struct {
	ID     int       `json:"id"`
	DebtID int       `json:"debt_id"`
	Amount float64   `json:"amount"`
	Date   time.Time `json:"date"`
}

var ErrDebtNotFound = errors.New("debt not found")

func Create(
	ctx context.Context,
	conn *pgx.Conn,
	userID int,
	debtID int,
	amount float64,
	date time.Time,
) (DebtRepayment, error) {

	var exists bool

	err := conn.QueryRow(
		ctx,
		`SELECT EXISTS (
			SELECT 1
			FROM debts d
			JOIN finance_spaces fs
				ON d.finance_space_id = fs.id
			WHERE d.id = $1 AND fs.user_id = $2
		)`,
		debtID,
		userID,
	).Scan(&exists)

	if err != nil {
		return DebtRepayment{}, err
	}

	if !exists {
		return DebtRepayment{}, ErrDebtNotFound
	}

	var repayment DebtRepayment

	err = conn.QueryRow(
		ctx,
		`INSERT INTO debt_repayments (
			debt_id,
			amount,
			date
		)
		VALUES ($1, $2, $3)
		RETURNING id, debt_id, amount, date`,
		debtID,
		amount,
		date,
	).Scan(
		&repayment.ID,
		&repayment.DebtID,
		&repayment.Amount,
		&repayment.Date,
	)

	if err != nil {
		return DebtRepayment{}, err
	}

	return repayment, nil
}

func List(
	ctx context.Context,
	conn *pgx.Conn,
	userID int,
) ([]DebtRepayment, error) {

	rows, err := conn.Query(
		ctx,
		`SELECT
			dr.id,
			dr.debt_id,
			dr.amount,
			dr.date
		FROM debt_repayments dr
		JOIN debts d
			ON dr.debt_id = d.id
		JOIN finance_spaces fs
			ON d.finance_space_id = fs.id
		WHERE fs.user_id = $1
		ORDER BY dr.date DESC, dr.id DESC`,
		userID,
	)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var repayments []DebtRepayment

	for rows.Next() {
		var repayment DebtRepayment

		err := rows.Scan(
			&repayment.ID,
			&repayment.DebtID,
			&repayment.Amount,
			&repayment.Date,
		)

		if err != nil {
			return nil, err
		}

		repayments = append(repayments, repayment)
	}

	return repayments, rows.Err()
}
