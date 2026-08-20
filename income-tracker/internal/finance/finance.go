package finance

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
)

type FinanceSpace struct {
	ID     int    `json:"id"`
	Name   string `json:"name"`
	Type   string `json:"type"`
	UserID int    `json:"user_id"`
}

var ErrInvalidType = errors.New("invalid finance space type")

func Create(
	ctx context.Context,
	conn *pgx.Conn,
	userID int,
	name string,
	spaceType string,
) (FinanceSpace, error) {
	if spaceType != "personal" && spaceType != "business" {
		return FinanceSpace{}, ErrInvalidType
	}

	var space FinanceSpace

	err := conn.QueryRow(
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
