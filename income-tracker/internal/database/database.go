package database

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func Connect() (*pgxpool.Pool, error) {
	connString := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)

	config, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, err
	}

	config.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeExec

	// SLOW_QUERY_MS=0 means "don't trace at all" — attaching a tracer with a
	// zero threshold would log every query, which is the opposite of quiet.
	if threshold := slowQueryThreshold(); threshold > 0 {
		config.ConnConfig.Tracer = newSlowQueryTracer(threshold)
	}

	return pgxpool.NewWithConfig(context.Background(), config)
}
