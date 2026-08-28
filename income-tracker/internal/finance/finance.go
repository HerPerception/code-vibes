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
	ErrInvalidName   = errors.New("invalid finance space name")
	ErrDuplicateName = errors.New("duplicate finance space name")
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

	var exists bool

	err := conn.QueryRow(
		ctx,
		`SELECT EXISTS (
			SELECT 1
			FROM finance_spaces
			WHERE user_id = $1
			AND LOWER(name) = LOWER($2)
		)`,
		userID,
		name,
	).Scan(&exists)

	if err != nil {
		return FinanceSpace{}, err
	}

	if exists {
		return FinanceSpace{}, ErrDuplicateName
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

	spaces := make([]FinanceSpace, 0)

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
