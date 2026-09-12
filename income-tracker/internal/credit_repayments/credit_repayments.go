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

	tx, err := conn.Begin(ctx)

	if err != nil {
		return CreditRepayment{}, err
	}

	defer tx.Rollback(ctx)

	/* Lock the credit for the rest of the transaction. Without this the
	   read-check-insert below is a time-of-check/time-of-use race: two
	   concurrent repayments both read the same outstanding balance, both
	   pass the check, and the credit ends up over-repaid. */
	var creditAmount float64

	err = tx.QueryRow(
		ctx,
		`SELECT c.amount
		 FROM credits c
		 JOIN finance_spaces fs
			ON c.finance_space_id = fs.id
		 WHERE c.id = $1
		 AND fs.user_id = $2
		 FOR UPDATE OF c`,
		creditID,
		userID,
	).Scan(&creditAmount)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return CreditRepayment{}, ErrCreditNotFound
		}

		return CreditRepayment{}, err
	}

	/* Safe to total now: any concurrent repayment on this credit has either
	   committed already or is blocked on the lock taken above. */
	var amountRepaid float64

	err = tx.QueryRow(
		ctx,
		`SELECT COALESCE(SUM(amount), 0)
		 FROM credit_repayments
		 WHERE credit_id = $1`,
		creditID,
	).Scan(&amountRepaid)

	if err != nil {
		return CreditRepayment{}, err
	}

	outstanding := creditAmount - amountRepaid

	if outstanding <= 0 || amount > outstanding {
		return CreditRepayment{}, ErrRepaymentTooLarge
	}

	var repayment CreditRepayment

	err = tx.QueryRow(
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

	if err := tx.Commit(ctx); err != nil {
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
