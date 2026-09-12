-- 0001_hot_path_indexes.sql
--
-- Indexes for the queries the app actually runs, in the order they matter.
--
-- Context: the base schema lives outside this repository, so nothing here
-- creates tables. Every statement is `IF NOT EXISTS` and purely additive —
-- this file is safe to run against an existing database, and safe to run
-- twice.
--
-- Apply with:
--   psql "postgres://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME" \
--     -f migrations/0001_hot_path_indexes.sql
--
-- Read the UNIQUE index at the bottom before running: it will fail if the
-- data already violates it. There is a pre-flight check for that.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Tenant scoping.
--
-- Every authenticated request resolves user -> finance_spaces -> rows. This is
-- the single most-hit predicate in the codebase and the leftmost column of
-- every join that follows.
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_finance_spaces_user_id
  ON finance_spaces (user_id);

-- ---------------------------------------------------------------------------
-- 2. Repayment lookups — the correlated subqueries.
--
-- debts.List and credits.List both run a SUM() subquery per parent row:
--
--   SELECT d.*, COALESCE((SELECT SUM(dr.amount) FROM debt_repayments dr
--                         WHERE dr.debt_id = d.id), 0) FROM debts d ...
--
-- Without an index on the parent column that inner scan is sequential, so the
-- cost is O(debts x repayments). These two are the highest-value indexes here.
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_debt_repayments_debt_id
  ON debt_repayments (debt_id);

CREATE INDEX IF NOT EXISTS idx_credit_repayments_credit_id
  ON credit_repayments (credit_id);

-- ---------------------------------------------------------------------------
-- 3. Ledger listings, scoped by space and ordered by date.
--
-- List() already sorts by (date DESC, id DESC), and finance_space_id is the
-- leading column, so these composites serve both the filter and the sort in
-- one index. They also cover plain lookups on finance_space_id alone via the
-- leftmost prefix, which is why there is no separate single-column index for
-- these four tables.
--
-- (They earn their keep once the endpoints are scoped by finance_space_id —
-- today List() filters through fs.user_id, so the planner may still choose a
-- scan-and-sort. That is the next change, and these are what make it cheap.)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_income_space_date
  ON income (finance_space_id, date_received DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_space_date
  ON expenses (finance_space_id, date DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_debts_space_date
  ON debts (finance_space_id, date_borrowed DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_credits_space_date
  ON credits (finance_space_id, date_lent DESC, id DESC);

-- ---------------------------------------------------------------------------
-- 4. Smaller child tables.
--
-- No date-ordered listing, so a plain FK index is all that's needed.
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_categories_finance_space_id
  ON categories (finance_space_id);

CREATE INDEX IF NOT EXISTS idx_people_finance_space_id
  ON people (finance_space_id);

-- ---------------------------------------------------------------------------
-- 5. Enforce finance-space name uniqueness in the database.
--
-- finance.Create currently does SELECT EXISTS(...) then INSERT. Two concurrent
-- requests for the same name both pass the check and both insert. This index
-- makes that impossible: the second INSERT fails with unique_violation (23505),
-- which the handler can catch the same way users.Create already catches a
-- duplicate email.
--
-- !! THIS IS THE ONE STATEMENT THAT CAN FAIL. !!
-- If any user already has two spaces whose names differ only by case, the
-- index cannot be built. Check first — this should return zero rows:
--
--   SELECT user_id, lower(name), count(*)
--   FROM finance_spaces
--   GROUP BY user_id, lower(name)
--   HAVING count(*) > 1;
--
-- If it returns rows, resolve the duplicates before running this file.
-- ---------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS uq_finance_spaces_user_id_lower_name
  ON finance_spaces (user_id, lower(name));

COMMIT;

-- ---------------------------------------------------------------------------
-- Verification.
--
-- Confirm the planner is using the new indexes rather than scanning:
--
--   EXPLAIN (ANALYZE, BUFFERS)
--   SELECT d.id, COALESCE((SELECT SUM(dr.amount) FROM debt_repayments dr
--                          WHERE dr.debt_id = d.id), 0)
--   FROM debts d
--   JOIN finance_spaces fs ON d.finance_space_id = fs.id
--   WHERE fs.user_id = 1;
--
-- Expect an Index Scan on idx_debt_repayments_debt_id. If you still see a
-- Seq Scan on debt_repayments, run ANALYZE debt_repayments and re-check.
-- ---------------------------------------------------------------------------
