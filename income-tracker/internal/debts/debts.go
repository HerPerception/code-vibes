package debts

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
)

type Debt struct {
	ID             int        `json:"id"`
	FinanceSpaceID int        `json:"finance_space_id"`
	PersonID       *int       `json:"person_id,omitempty"`
	Amount         float64    `json:"amount"`
	DateBorrowed   time.Time  `json:"date_borrowed"`
	RepaymentDate  *time.Time `json:"repayment_date,omitempty"`
	Description    string     `json:"description,omitempty"`
}

var ErrFinanceSpaceNotFound = errors.New("finance space not found")

func Create(
	ctx context.Context,
	conn *pgx.Conn,
	userID int,
	financeSpaceID int,
	personID *int,
	amount float64,
	dateBorrowed time.Time,
	repaymentDate *time.Time,
	description string,
) (Debt, error) {

	var exists bool

	err := conn.QueryRow(
		ctx,
		`SELECT EXISTS (
			SELECT 1
			FROM finance_spaces
			WHERE id = $1 AND user_id = $2
		)`,
		financeSpaceID,
		userID,
	).Scan(&exists)

	if err != nil {
		return Debt{}, err
	}

	if !exists {
		return Debt{}, ErrFinanceSpaceNotFound
	}

	var debt Debt

	err = conn.QueryRow(
		ctx,
		`INSERT INTO debts (
			finance_space_id,
			person_id,
			amount,
			date_borrowed,
			repayment_date,
			description
		)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING
			id,
			finance_space_id,
			person_id,
			amount,
			date_borrowed,
			repayment_date,
			description`,
		financeSpaceID,
		personID,
		amount,
		dateBorrowed,
		repaymentDate,
		description,
	).Scan(
		&debt.ID,
		&debt.FinanceSpaceID,
		&debt.PersonID,
		&debt.Amount,
		&debt.DateBorrowed,
		&debt.RepaymentDate,
		&debt.Description,
	)

	if err != nil {
		return Debt{}, err
	}

	return debt, nil
}

func List(
	ctx context.Context,
	conn *pgx.Conn,
	userID int,
) ([]Debt, error) {

	rows, err := conn.Query(
		ctx,
		`SELECT
			d.id,
			d.finance_space_id,
			d.person_id,
			d.amount,
			d.date_borrowed,
			d.repayment_date,
			d.description
		FROM debts d
		JOIN finance_spaces fs
			ON d.finance_space_id = fs.id
		WHERE fs.user_id = $1
		ORDER BY d.date_borrowed DESC, d.id DESC`,
		userID,
	)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var debts []Debt

	for rows.Next() {
		var debt Debt

		err := rows.Scan(
			&debt.ID,
			&debt.FinanceSpaceID,
			&debt.PersonID,
			&debt.Amount,
			&debt.DateBorrowed,
			&debt.RepaymentDate,
			&debt.Description,
		)

		if err != nil {
			return nil, err
		}

		debts = append(debts, debt)
	}

	return debts, rows.Err()
}
