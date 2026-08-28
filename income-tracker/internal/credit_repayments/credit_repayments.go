package credit_repayments

import (
	"context"
	"errors"
	"github.com/jackc/pgx/v5/pgxpool"
	"time"

	"github.com/jackc/pgx/v5"
)

type CreditRepayment struct {
	ID       int       `json:"id"`
	CreditID int       `json:"credit_id"`
	Amount   float64   `json:"amount"`
	Date     time.Time `json:"date"`
}

var (
	ErrCreditNotFound    = errors.New("credit not found")
	ErrInvalidAmount     = errors.New("invalid amount")
	ErrRepaymentTooLarge = errors.New("repayment exceeds outstanding credit")
)

func Create(
	ctx context.Context,
	conn *pgxpool.Pool,
	userID int,
	creditID int,
	amount float64,
	date time.Time,
) (CreditRepayment, error) {

	if amount <= 0 {
		return CreditRepayment{}, ErrInvalidAmount
	}

	var creditAmount float64
	var amountRepaid float64

	err := conn.QueryRow(
		ctx,
		`SELECT
			c.amount,
			COALESCE(
				(
					SELECT SUM(cr.amount)
					FROM credit_repayments cr
					WHERE cr.credit_id = c.id
				),
				0
			)
		FROM credits c
		JOIN finance_spaces fs
			ON c.finance_space_id = fs.id
		WHERE c.id = $1
		AND fs.user_id = $2`,
		creditID,
		userID,
	).Scan(
		&creditAmount,
		&amountRepaid,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return CreditRepayment{}, ErrCreditNotFound
		}

		return CreditRepayment{}, err
	}

	outstanding := creditAmount - amountRepaid

	if outstanding <= 0 || amount > outstanding {
		return CreditRepayment{}, ErrRepaymentTooLarge
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
	conn *pgxpool.Pool,
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

	repayments := make([]CreditRepayment, 0)

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
