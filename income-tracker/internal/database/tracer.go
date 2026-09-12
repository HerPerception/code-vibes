package database

import (
	"context"
	"log"
	"os"
	"strconv"
	"strings"
	"sync/atomic"
	"time"

	"github.com/jackc/pgx/v5"
)

/* Slow-query tracing.
 *
 * There is no APM on this service, so the first question when the dashboard
 * feels slow is "which query?" — and without this there is no way to answer
 * it. Every query that exceeds the threshold is logged with its duration and
 * row count, which is enough to tell an unindexed scan from a healthy one.
 *
 * Deliberately NOT logged: the bound parameters. They carry user ids, emails
 * and amounts, and the SQL text plus timing is what actually identifies a
 * slow query — the arguments only put personal data in the log stream.
 *
 * Tune with SLOW_QUERY_MS (default 200, set 0 to disable).
 */

type queryTraceKey struct{}

type queryTrace struct {
	sql   string
	start time.Time
}

type slowQueryTracer struct {
	threshold time.Duration
	logger    *log.Logger

	// Counters are reported alongside each slow query so a single log line
	// answers "is this the only one, or is everything slow?"
	total atomic.Int64
	slow  atomic.Int64
}

func newSlowQueryTracer(threshold time.Duration) *slowQueryTracer {
	return &slowQueryTracer{
		threshold: threshold,
		logger:    log.New(os.Stderr, "[pgx] ", log.LstdFlags),
	}
}

func (t *slowQueryTracer) TraceQueryStart(
	ctx context.Context,
	_ *pgx.Conn,
	data pgx.TraceQueryStartData,
) context.Context {
	return context.WithValue(ctx, queryTraceKey{}, &queryTrace{
		sql:   data.SQL,
		start: time.Now(),
	})
}

func (t *slowQueryTracer) TraceQueryEnd(
	ctx context.Context,
	_ *pgx.Conn,
	data pgx.TraceQueryEndData,
) {
	trace, ok := ctx.Value(queryTraceKey{}).(*queryTrace)

	if !ok {
		return
	}

	elapsed := time.Since(trace.start)

	t.total.Add(1)

	if data.Err != nil {
		t.logger.Printf(
			"query failed after %s: %v\n  sql: %s",
			elapsed.Round(time.Millisecond),
			data.Err,
			condenseSQL(trace.sql),
		)

		return
	}

	if elapsed < t.threshold {
		return
	}

	t.logger.Printf(
		"slow query %s rows=%d (slow=%d of %d)\n  sql: %s",
		elapsed.Round(time.Millisecond),
		data.CommandTag.RowsAffected(),
		t.slow.Add(1),
		t.total.Load(),
		condenseSQL(trace.sql),
	)
}

// condenseSQL flattens a query onto one line so a multi-line literal in the
// source doesn't turn a single slow query into a dozen log lines.
func condenseSQL(sql string) string {
	const limit = 400

	condensed := strings.Join(strings.Fields(sql), " ")

	if len(condensed) > limit {
		return condensed[:limit] + "..."
	}

	return condensed
}

// slowQueryThreshold reads SLOW_QUERY_MS, falling back to 200ms when unset or
// unparseable. Zero means "off" — Connect skips attaching the tracer entirely,
// so nothing (not even failures) is logged.
func slowQueryThreshold() time.Duration {
	const fallback = 200 * time.Millisecond

	raw := os.Getenv("SLOW_QUERY_MS")

	if raw == "" {
		return fallback
	}

	ms, err := strconv.Atoi(raw)

	if err != nil || ms < 0 {
		log.Printf("invalid SLOW_QUERY_MS %q; using %s", raw, fallback)

		return fallback
	}

	return time.Duration(ms) * time.Millisecond
}
