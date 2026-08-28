package credits

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
)

type Credit struct {
	ID             int        `json:"id"`
	FinanceSpaceID int        `json:"finance_space_id"`
	PersonID       *int       `json:"person_id,omitempty"`
	Amount         float64    `json:"amount"`
	AmountRepaid   float64    `json:"amount_repaid"`
	Outstanding    float64    `json:"outstanding"`
	DateLent       time.Time  `json:"date_lent"`
	RepaymentDate  *time.Time `json:"repayment_date,omitempty"`
	Description    string     `json:"description,omitempty"`
}

var (
	ErrFinanceSpaceNotFound = errors.New("finance space not found")
	ErrPersonNotFound       = errors.New("person not found")
	ErrInvalidAmount        = errors.New("invalid amount")
	ErrInvalidRepaymentDate = errors.New("invalid repayment date")
)

func Create(
	ctx context.Context,
	conn *pgx.Conn,
	userID int,
	financeSpaceID int,
	personID *int,
	amount float64,
	dateLent time.Time,
	repaymentDate *time.Time,
	description string,
) (Credit, error) {

	if amount <= 0 {
		return Credit{}, ErrInvalidAmount
	}

	if repaymentDate != nil && repaymentDate.Before(dateLent) {
		return Credit{}, ErrInvalidRepaymentDate
	}

	var spaceExists bool

	err := conn.QueryRow(
		ctx,
		`SELECT EXISTS (
			SELECT 1
			FROM finance_spaces
			WHERE id = $1
			AND user_id = $2
		)`,
		financeSpaceID,
		userID,
	).Scan(&spaceExists)

	if err != nil {
		return Credit{}, err
	}

	if !spaceExists {
		return Credit{}, ErrFinanceSpaceNotFound
	}

	if personID != nil {
		var personExists bool

		err = conn.QueryRow(
			ctx,
			`SELECT EXISTS (
				SELECT 1
				FROM people
				WHERE id = $1
				AND finance_space_id = $2
			)`,
			*personID,
			financeSpaceID,
		).Scan(&personExists)

		if err != nil {
			return Credit{}, err
		}

		if !personExists {
			return Credit{}, ErrPersonNotFound
		}
	}

	var credit Credit

	err = conn.QueryRow(
		ctx,
		`INSERT INTO credits (
			finance_space_id,
			person_id,
			amount,
			date_lent,
			repayment_date,
			description
		)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING
			id,
			finance_space_id,
			person_id,
			amount,
			date_lent,
			repayment_date,
			description`,
		financeSpaceID,
		personID,
		amount,
		dateLent,
		repaymentDate,
		description,
	).Scan(
		&credit.ID,
		&credit.FinanceSpaceID,
		&credit.PersonID,
		&credit.Amount,
		&credit.DateLent,
		&credit.RepaymentDate,
		&credit.Description,
	)

	if err != nil {
		return Credit{}, err
	}

	credit.AmountRepaid = 0
	credit.Outstanding = amount

	return credit, nil
}

func List(
	ctx context.Context,
	conn *pgx.Conn,
	userID int,
) ([]Credit, error) {

	rows, err := conn.Query(
		ctx,
		`SELECT
			c.id,
			c.finance_space_id,
			c.person_id,
			c.amount,
			COALESCE(
				(
					SELECT SUM(cr.amount)
					FROM credit_repayments cr
					WHERE cr.credit_id = c.id
				),
				0
			) AS amount_repaid,
			c.date_lent,
			c.repayment_date,
			c.description
		FROM credits c
		JOIN finance_spaces fs
			ON c.finance_space_id = fs.id
		WHERE fs.user_id = $1
		ORDER BY c.date_lent DESC, c.id DESC`,
		userID,
	)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	credits := make([]Credit, 0)

	for rows.Next() {
		var credit Credit

		err := rows.Scan(
			&credit.ID,
			&credit.FinanceSpaceID,
			&credit.PersonID,
			&credit.Amount,
			&credit.AmountRepaid,
			&credit.DateLent,
			&credit.RepaymentDate,
			&credit.Description,
		)

		if err != nil {
			return nil, err
		}

		credit.Outstanding = credit.Amount - credit.AmountRepaid

		if credit.Outstanding < 0 {
			credit.Outstanding = 0
		}

		credits = append(credits, credit)
	}

	return credits, rows.Err()
}
