package debt_repayments

import (
	"context"
	"errors"
	"github.com/jackc/pgx/v5/pgxpool"
	"time"

	"github.com/jackc/pgx/v5"
)

type DebtRepayment struct {
	ID     int       `json:"id"`
	DebtID int       `json:"debt_id"`
	Amount float64   `json:"amount"`
	Date   time.Time `json:"date"`
}

var (
	ErrDebtNotFound      = errors.New("debt not found")
	ErrInvalidAmount     = errors.New("invalid amount")
	ErrRepaymentTooLarge = errors.New("repayment exceeds outstanding debt")
)

func Create(
	ctx context.Context,
	conn *pgxpool.Pool,
	userID int,
	debtID int,
	amount float64,
	date time.Time,
) (DebtRepayment, error) {

	if amount <= 0 {
		return DebtRepayment{}, ErrInvalidAmount
	}

	var debtAmount float64
	var amountRepaid float64

	err := conn.QueryRow(
		ctx,
		`SELECT
			d.amount,
			COALESCE(
				(
					SELECT SUM(dr.amount)
					FROM debt_repayments dr
					WHERE dr.debt_id = d.id
				),
				0
			)
		FROM debts d
		JOIN finance_spaces fs
			ON d.finance_space_id = fs.id
		WHERE d.id = $1
		AND fs.user_id = $2`,
		debtID,
		userID,
	).Scan(
		&debtAmount,
		&amountRepaid,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return DebtRepayment{}, ErrDebtNotFound
		}

		return DebtRepayment{}, err
	}

	outstanding := debtAmount - amountRepaid

	if outstanding <= 0 || amount > outstanding {
		return DebtRepayment{}, ErrRepaymentTooLarge
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
	conn *pgxpool.Pool,
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

	repayments := make([]DebtRepayment, 0)

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
