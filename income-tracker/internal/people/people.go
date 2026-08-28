package people

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
)

type Person struct {
	ID             int    `json:"id"`
	FinanceSpaceID int    `json:"finance_space_id"`
	Name           string `json:"name"`
	Contact        string `json:"contact,omitempty"`
	Note           string `json:"note,omitempty"`
}

var (
	ErrFinanceSpaceNotFound = errors.New("finance space not found")
	ErrInvalidName          = errors.New("invalid person name")
)

func Create(
	ctx context.Context,
	conn *pgx.Conn,
	userID int,
	financeSpaceID int,
	name string,
	contact string,
	note string,
) (Person, error) {

	name = strings.TrimSpace(name)

	if name == "" {
		return Person{}, ErrInvalidName
	}

	var exists bool

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
	).Scan(&exists)

	if err != nil {
		return Person{}, err
	}

	if !exists {
		return Person{}, ErrFinanceSpaceNotFound
	}

	var person Person

	err = conn.QueryRow(
		ctx,
		`INSERT INTO people (
			finance_space_id,
			name,
			contact,
			note
		)
		VALUES ($1, $2, $3, $4)
		RETURNING id, finance_space_id, name, contact, note`,
		financeSpaceID,
		name,
		contact,
		note,
	).Scan(
		&person.ID,
		&person.FinanceSpaceID,
		&person.Name,
		&person.Contact,
		&person.Note,
	)

	if err != nil {
		return Person{}, err
	}

	return person, nil
}

func List(
	ctx context.Context,
	conn *pgx.Conn,
	userID int,
) ([]Person, error) {

	rows, err := conn.Query(
		ctx,
		`SELECT
			p.id,
			p.finance_space_id,
			p.name,
			p.contact,
			p.note
		FROM people p
		JOIN finance_spaces fs
			ON p.finance_space_id = fs.id
		WHERE fs.user_id = $1
		ORDER BY p.id`,
		userID,
	)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	people := make([]Person, 0)

	for rows.Next() {
		var person Person

		err := rows.Scan(
			&person.ID,
			&person.FinanceSpaceID,
			&person.Name,
			&person.Contact,
			&person.Note,
		)

		if err != nil {
			return nil, err
		}

		people = append(people, person)
	}

	return people, rows.Err()
}
