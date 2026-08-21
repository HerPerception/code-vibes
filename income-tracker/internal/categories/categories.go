package categories

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
)

type Category struct {
	ID             int    `json:"id"`
	FinanceSpaceID int    `json:"finance_space_id"`
	Name           string `json:"name"`
	Type           string `json:"type"`
}

var ErrFinanceSpaceNotFound = errors.New("finance space not found")

func Create(
	ctx context.Context,
	conn *pgx.Conn,
	userID int,
	financeSpaceID int,
	name string,
	categoryType string,
) (Category, error) {

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
		return Category{}, err
	}

	if !exists {
		return Category{}, ErrFinanceSpaceNotFound
	}

	var category Category

	err = conn.QueryRow(
		ctx,
		`INSERT INTO categories (
			finance_space_id,
			name,
			type
		)
		VALUES ($1, $2, $3)
		RETURNING id, finance_space_id, name, type`,
		financeSpaceID,
		name,
		categoryType,
	).Scan(
		&category.ID,
		&category.FinanceSpaceID,
		&category.Name,
		&category.Type,
	)

	if err != nil {
		return Category{}, err
	}

	return category, nil
}

func List(
	ctx context.Context,
	conn *pgx.Conn,
	userID int,
) ([]Category, error) {

	rows, err := conn.Query(
		ctx,
		`SELECT
			c.id,
			c.finance_space_id,
			c.name,
			c.type
		FROM categories c
		JOIN finance_spaces fs
			ON c.finance_space_id = fs.id
		WHERE fs.user_id = $1
		ORDER BY c.id`,
		userID,
	)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var categories []Category

	for rows.Next() {
		var category Category

		err := rows.Scan(
			&category.ID,
			&category.FinanceSpaceID,
			&category.Name,
			&category.Type,
		)

		if err != nil {
			return nil, err
		}

		categories = append(categories, category)
	}

	return categories, rows.Err()
}