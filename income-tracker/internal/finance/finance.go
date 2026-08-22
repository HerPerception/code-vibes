package finance

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
)

type FinanceSpace struct {
	ID     int    `json:"id"`
	Name   string `json:"name"`
	Type   string `json:"type"`
	UserID int    `json:"user_id"`
}

var (
	ErrInvalidType   = errors.New("invalid finance space type")
	ErrInvalidName   = errors.New("finance space name cannot be empty")
	ErrDuplicateName = errors.New("finance space with this name already exists")
)

func Create(
	ctx context.Context,
	conn *pgx.Conn,
	userID int,
	name string,
	spaceType string,
) (FinanceSpace, error) {
	name = strings.TrimSpace(name)

	if name == "" {
		return FinanceSpace{}, ErrInvalidName
	}

	if spaceType != "personal" && spaceType != "business" {
		return FinanceSpace{}, ErrInvalidType
	}

	var existingID int

	err := conn.QueryRow(
		ctx,
		`SELECT id
		 FROM finance_spaces
		 WHERE user_id = $1
		   AND LOWER(name) = LOWER($2)
		 LIMIT 1`,
		userID,
		name,
	).Scan(&existingID)

	if err == nil {
		return FinanceSpace{}, ErrDuplicateName
	}

	if !errors.Is(err, pgx.ErrNoRows) {
		return FinanceSpace{}, err
	}

	var space FinanceSpace

	err = conn.QueryRow(
		ctx,
		`INSERT INTO finance_spaces (user_id, name, type)
		 VALUES ($1, $2, $3)
		 RETURNING id, name, type, user_id`,
		userID,
		name,
		spaceType,
	).Scan(
		&space.ID,
		&space.Name,
		&space.Type,
		&space.UserID,
	)

	if err != nil {
		return FinanceSpace{}, err
	}

	return space, nil
}

func List(
	ctx context.Context,
	conn *pgx.Conn,
	userID int,
) ([]FinanceSpace, error) {
	rows, err := conn.Query(
		ctx,
		`SELECT id, name, type, user_id
		 FROM finance_spaces
		 WHERE user_id = $1
		 ORDER BY id`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var spaces []FinanceSpace

	for rows.Next() {
		var space FinanceSpace

		err := rows.Scan(
			&space.ID,
			&space.Name,
			&space.Type,
			&space.UserID,
		)
		if err != nil {
			return nil, err
		}

		spaces = append(spaces, space)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return spaces, nil
}
