package income

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
)

type Income struct {
	ID             int       `json:"id"`
	FinanceSpaceID int       `json:"finance_space_id"`
	CategoryID     int       `json:"category_id"`
	Amount         float64   `json:"amount"`
	DateReceived   time.Time `json:"date_received"`
	Description    string    `json:"description"`
}

var ErrFinanceSpaceNotFound = errors.New("finance space not found")

func Create(
	ctx context.Context,
	conn *pgx.Conn,
	userID int,
	financeSpaceID int,
	categoryID int,
	amount float64,
	dateReceived time.Time,
	description string,
) (Income, error) {

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
		return Income{}, err
	}

	if !spaceExists {
		return Income{}, ErrFinanceSpaceNotFound
	}

	var income Income

	err = conn.QueryRow(
		ctx,
		`INSERT INTO income (
			finance_space_id,
			category_id,
			amount,
			date_received,
			description
		)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING
			id,
			finance_space_id,
			category_id,
			amount,
			date_received,
			description`,
		financeSpaceID,
		categoryID,
		amount,
		dateReceived,
		description,
	).Scan(
		&income.ID,
		&income.FinanceSpaceID,
		&income.CategoryID,
		&income.Amount,
		&income.DateReceived,
		&income.Description,
	)

	if err != nil {
		return Income{}, err
	}

	return income, nil
}

func List(
	ctx context.Context,
	conn *pgx.Conn,
	userID int,
) ([]Income, error) {

	rows, err := conn.Query(
		ctx,
		`SELECT
			i.id,
			i.finance_space_id,
			i.category_id,
			i.amount,
			i.date_received,
			i.description
		FROM income i
		JOIN finance_spaces fs
			ON i.finance_space_id = fs.id
		WHERE fs.user_id = $1
		ORDER BY i.date_received DESC, i.id DESC`,
		userID,
	)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var incomes []Income

	for rows.Next() {
		var income Income

		err := rows.Scan(
			&income.ID,
			&income.FinanceSpaceID,
			&income.CategoryID,
			&income.Amount,
			&income.DateReceived,
			&income.Description,
		)

		if err != nil {
			return nil, err
		}

		incomes = append(incomes, income)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return incomes, nil
}
