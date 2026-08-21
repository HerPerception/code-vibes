package credit_repayments

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
)

type CreditRepayment struct {
	ID       int       `json:"id"`
	CreditID int       `json:"credit_id"`
	Amount   float64   `json:"amount"`
	Date     time.Time `json:"date"`
}

var ErrCreditNotFound = errors.New("credit not found")

func Create(
	ctx context.Context,
	conn *pgx.Conn,
	userID int,
	creditID int,
	amount float64,
	date time.Time,
) (CreditRepayment, error) {

	var exists bool

	err := conn.QueryRow(
		ctx,
		`SELECT EXISTS (
			SELECT 1
			FROM credits c
			JOIN finance_spaces fs
				ON c.finance_space_id = fs.id
			WHERE c.id = $1 AND fs.user_id = $2
		)`,
		creditID,
		userID,
	).Scan(&exists)

	if err != nil {
		return CreditRepayment{}, err
	}

	if !exists {
		return CreditRepayment{}, ErrCreditNotFound
	}

	var repayment CreditRepayment

	err = conn.QueryRow(
		ctx,
		`INSERT INTO credit_repayments (
			credit_id,
			amount,
			date
		)
		VALUES ($1, $2, $3)
		RETURNING id, credit_id, amount, date`,
		creditID,
		amount,
		date,
	).Scan(
		&repayment.ID,
		&repayment.CreditID,
		&repayment.Amount,
		&repayment.Date,
	)

	if err != nil {
		return CreditRepayment{}, err
	}

	return repayment, nil
}

func List(
	ctx context.Context,
	conn *pgx.Conn,
	userID int,
) ([]CreditRepayment, error) {

	rows, err := conn.Query(
		ctx,
		`SELECT
			cr.id,
			cr.credit_id,
			cr.amount,
			cr.date
		FROM credit_repayments cr
		JOIN credits c
			ON cr.credit_id = c.id
		JOIN finance_spaces fs
			ON c.finance_space_id = fs.id
		WHERE fs.user_id = $1
		ORDER BY cr.date DESC, cr.id DESC`,
		userID,
	)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var repayments []CreditRepayment

	for rows.Next() {
		var repayment CreditRepayment

		err := rows.Scan(
			&repayment.ID,
			&repayment.CreditID,
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
