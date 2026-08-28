package expenses

import (
	"context"
	"errors"
	"github.com/jackc/pgx/v5/pgxpool"
	"time"
)

type Expense struct {
	ID             int       `json:"id"`
	FinanceSpaceID int       `json:"finance_space_id"`
	CategoryID     int       `json:"category_id"`
	Amount         float64   `json:"amount"`
	Date           time.Time `json:"date"`
	Description    string    `json:"description"`
}

var ErrFinanceSpaceNotFound = errors.New("finance space not found")

func Create(
	ctx context.Context,
	conn *pgxpool.Pool,
	userID int,
	financeSpaceID int,
	categoryID int,
	amount float64,
	date time.Time,
	description string,
) (Expense, error) {

	var spaceExists bool

	err := conn.QueryRow(
		ctx,
		`SELECT EXISTS (
			SELECT 1
			FROM finance_spaces
			WHERE id = $1 AND user_id = $2
		)`,
		financeSpaceID,
		userID,
	).Scan(&spaceExists)

	if err != nil {
		return Expense{}, err
	}

	if !spaceExists {
		return Expense{}, ErrFinanceSpaceNotFound
	}

	var expense Expense

	err = conn.QueryRow(
		ctx,
		`INSERT INTO expenses (
			finance_space_id,
			category_id,
			amount,
			date,
			description
		)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING
			id,
			finance_space_id,
			category_id,
			amount,
			date,
			description`,
		financeSpaceID,
		categoryID,
		amount,
		date,
		description,
	).Scan(
		&expense.ID,
		&expense.FinanceSpaceID,
		&expense.CategoryID,
		&expense.Amount,
		&expense.Date,
		&expense.Description,
	)

	if err != nil {
		return Expense{}, err
	}

	return expense, nil
}

func List(
	ctx context.Context,
	conn *pgxpool.Pool,
	userID int,
) ([]Expense, error) {

	rows, err := conn.Query(
		ctx,
		`SELECT
			e.id,
			e.finance_space_id,
			e.category_id,
			e.amount,
			e.date,
			e.description
		FROM expenses e
		JOIN finance_spaces fs
			ON e.finance_space_id = fs.id
		WHERE fs.user_id = $1
		ORDER BY e.date DESC, e.id DESC`,
		userID,
	)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var expenses []Expense

	for rows.Next() {
		var expense Expense

		err := rows.Scan(
			&expense.ID,
			&expense.FinanceSpaceID,
			&expense.CategoryID,
			&expense.Amount,
			&expense.Date,
			&expense.Description,
		)

		if err != nil {
			return nil, err
		}

		expenses = append(expenses, expense)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return expenses, nil
}
