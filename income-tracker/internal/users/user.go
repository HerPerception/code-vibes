package users

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

var ErrEmailExists = errors.New("email already exists")
var ErrInvalidCredentials = errors.New("invalid email or password")

func Create(ctx context.Context, conn *pgx.Conn, name, email, password string) (User, error) {
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return User{}, err
	}

	var user User
	var storedPasswordHash string

	err = conn.QueryRow(
		ctx,
		`INSERT INTO users (name, email, password_hash)
		 VALUES ($1, $2, $3)
		 RETURNING id, name, email, password_hash`,
		name,
		email,
		passwordHash,
	).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&storedPasswordHash,
	)

	if err != nil {
		var pgErr *pgconn.PgError

		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return User{}, ErrEmailExists
		}

		return User{}, err
	}

	return user, nil
}

func Login(ctx context.Context, conn *pgx.Conn, email, password string) (User, error) {
	var user User
	var passwordHash string

	err := conn.QueryRow(
		ctx,
		`SELECT id, name, email, password_hash
		 FROM users
		 WHERE email = $1`,
		email,
	).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&passwordHash,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return User{}, ErrInvalidCredentials
		}

		return User{}, err
	}

	err = bcrypt.CompareHashAndPassword(
		[]byte(passwordHash),
		[]byte(password),
	)
	if err != nil {
		return User{}, ErrInvalidCredentials
	}

	return user, nil
}
