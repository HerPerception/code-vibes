import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "/api";

type User = {
  id: number;
  name: string;
  email: string;
};

type FinanceSpace = {
  id: number;
  name: string;
  type: string;
  user_id: number;
};

type Income = {
  id: number;
  finance_space_id: number;
  category_id: number;
  amount: number;
  date_received: string;
  description: string | null;
};

type Expense = {
  id: number;
  finance_space_id: number;
  category_id: number;
  amount: number;
  date: string;
  description: string | null;
};

function App() {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      return null;
    }

    return JSON.parse(savedUser);
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("token");
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [financeSpaces, setFinanceSpaces] = useState<FinanceSpace[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);

  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeCategoryId, setIncomeCategoryId] = useState("");
  const [incomeDate, setIncomeDate] = useState("");
  const [incomeDescription, setIncomeDescription] = useState("");

  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategoryId, setExpenseCategoryId] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");

  const selectedSpace = financeSpaces.find(
    (space) => space.id === selectedSpaceId
  );

  const selectedIncome = useMemo(() => {
    return income.filter(
      (item) => item.finance_space_id === selectedSpaceId
    );
  }, [income, selectedSpaceId]);

  const selectedExpenses = useMemo(() => {
    return expenses.filter(
      (item) => item.finance_space_id === selectedSpaceId
    );
  }, [expenses, selectedSpaceId]);

  const totalIncome = useMemo(() => {
    return selectedIncome.reduce(
      (total, item) => total + Number(item.amount),
      0
    );
  }, [selectedIncome]);

  const totalExpenses = useMemo(() => {
    return selectedExpenses.reduce(
      (total, item) => total + Number(item.amount),
      0
    );
  }, [selectedExpenses]);

  const balance = totalIncome - totalExpenses;

  async function login(event: {
    preventDefault: () => void;
  }) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error("Invalid email or password.");
      }

      const data = await response.json();

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);

      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
    setFinanceSpaces([]);
    setIncome([]);
    setExpenses([]);
    setSelectedSpaceId(null);
  }

  async function loadDashboard() {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [spacesResponse, incomeResponse, expensesResponse] =
        await Promise.all([
          fetch(`${API_URL}/finance-spaces`, {
            headers,
          }),

          fetch(`${API_URL}/income`, {
            headers,
          }),

          fetch(`${API_URL}/expenses`, {
            headers,
          }),
        ]);

      if (!spacesResponse.ok) {
        throw new Error("Could not load finance spaces.");
      }

      if (!incomeResponse.ok) {
        throw new Error("Could not load income.");
      }

      if (!expensesResponse.ok) {
        throw new Error("Could not load expenses.");
      }

      const spacesData = await spacesResponse.json();
      const incomeData = await incomeResponse.json();
      const expensesData = await expensesResponse.json();

      setFinanceSpaces(spacesData);
      setIncome(Array.isArray(incomeData) ? incomeData : []);
      setExpenses(Array.isArray(expensesData) ? expensesData : []);

      if (spacesData.length > 0) {
        setSelectedSpaceId((currentId) => {
          if (
            currentId &&
            spacesData.some(
              (space: FinanceSpace) => space.id === currentId
            )
          ) {
            return currentId;
          }

          return spacesData[0].id;
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  async function addIncome(event: {
    preventDefault: () => void;
  }) {
    event.preventDefault();

    if (!token || !selectedSpaceId) {
      setError("Please select a finance space.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/income`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          finance_space_id: selectedSpaceId,
          category_id: Number(incomeCategoryId),
          amount: Number(incomeAmount),
          date_received: incomeDate,
          description: incomeDescription,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not add income.");
      }

      setIncomeAmount("");
      setIncomeCategoryId("");
      setIncomeDate("");
      setIncomeDescription("");
      setShowIncomeForm(false);

      await loadDashboard();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not add income."
      );
      setLoading(false);
    }
  }

  async function addExpense(event: {
    preventDefault: () => void;
  }) {
    event.preventDefault();

    if (!token || !selectedSpaceId) {
      setError("Please select a finance space.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          finance_space_id: selectedSpaceId,
          category_id: Number(expenseCategoryId),
          amount: Number(expenseAmount),
          date: expenseDate,
          description: expenseDescription,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not add expense.");
      }

      setExpenseAmount("");
      setExpenseCategoryId("");
      setExpenseDate("");
      setExpenseDescription("");
      setShowExpenseForm(false);

      await loadDashboard();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not add expense."
      );
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadDashboard();
    }
  }, [token]);

  function formatMoney(amount: number) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  if (!user || !token) {
    return (
      <div className="app">
        <div className="login-container">
          <h1>Income Tracker</h1>

          <div className="login-card">
            <h2>Login</h2>

            <form onSubmit={login}>
              <label htmlFor="email">Email</label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                required
              />

              <label htmlFor="password">Password</label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />

              <button type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            {error && <p className="error">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Income Tracker</h1>
          <p>Welcome, {user.name}</p>
        </div>

        <button className="logout-button" onClick={logout}>
          Logout
        </button>
      </header>

      <main className="dashboard">
        <section className="dashboard-header">
          <div>
            <h2>Dashboard</h2>

            {selectedSpace && (
              <p>
                Viewing your{" "}
                <strong>{selectedSpace.name}</strong> finance space.
              </p>
            )}
          </div>

          <button onClick={loadDashboard} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </section>

        {error && <div className="error-box">{error}</div>}

        <section className="space-section">
          <h3>Finance Spaces</h3>

          <div className="space-list">
            {financeSpaces.map((space) => (
              <button
                key={space.id}
                className={
                  selectedSpaceId === space.id
                    ? "space-card active"
                    : "space-card"
                }
                onClick={() => setSelectedSpaceId(space.id)}
              >
                <strong>{space.name}</strong>
                <span>{space.type}</span>
              </button>
            ))}
          </div>

          {financeSpaces.length === 0 && (
            <p>No finance spaces found.</p>
          )}
        </section>

        <section className="summary-grid">
          <div className="summary-card">
            <span>Total Income</span>
            <strong className="income-value">
              {formatMoney(totalIncome)}
            </strong>
          </div>

          <div className="summary-card">
            <span>Total Expenses</span>
            <strong className="expense-value">
              {formatMoney(totalExpenses)}
            </strong>
          </div>

          <div className="summary-card">
            <span>Balance</span>
            <strong>{formatMoney(balance)}</strong>
          </div>
        </section>

        {/* ACTION BUTTONS */}

        <section className="action-section">
          <button
            className="income-button"
            onClick={() => {
              setShowIncomeForm(true);
              setShowExpenseForm(false);
            }}
          >
            + Add Income
          </button>

          <button
            className="expense-button"
            onClick={() => {
              setShowExpenseForm(true);
              setShowIncomeForm(false);
            }}
          >
            + Add Expense
          </button>
        </section>

        {/* ADD INCOME FORM */}

        {showIncomeForm && (
          <section className="form-card">
            <h3>Add Income</h3>

            <form onSubmit={addIncome}>
              <label htmlFor="income-amount">
                Amount
              </label>

              <input
                id="income-amount"
                type="number"
                min="0"
                step="0.01"
                value={incomeAmount}
                onChange={(event) =>
                  setIncomeAmount(event.target.value)
                }
                placeholder="e.g. 100000"
                required
              />

              <label htmlFor="income-category">
                Category ID
              </label>

              <input
                id="income-category"
                type="number"
                min="1"
                value={incomeCategoryId}
                onChange={(event) =>
                  setIncomeCategoryId(event.target.value)
                }
                placeholder="e.g. 4"
                required
              />

              <label htmlFor="income-date">
                Date
              </label>

              <input
                id="income-date"
                type="date"
                value={incomeDate}
                onChange={(event) =>
                  setIncomeDate(event.target.value)
                }
                required
              />

              <label htmlFor="income-description">
                Description
              </label>

              <input
                id="income-description"
                type="text"
                value={incomeDescription}
                onChange={(event) =>
                  setIncomeDescription(event.target.value)
                }
                placeholder="e.g. Monthly salary"
              />

              <div className="form-actions">
                <button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Income"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowIncomeForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ADD EXPENSE FORM */}

        {showExpenseForm && (
          <section className="form-card">
            <h3>Add Expense</h3>

            <form onSubmit={addExpense}>
              <label htmlFor="expense-amount">
                Amount
              </label>

              <input
                id="expense-amount"
                type="number"
                min="0"
                step="0.01"
                value={expenseAmount}
                onChange={(event) =>
                  setExpenseAmount(event.target.value)
                }
                placeholder="e.g. 5000"
                required
              />

              <label htmlFor="expense-category">
                Category ID
              </label>

              <input
                id="expense-category"
                type="number"
                min="1"
                value={expenseCategoryId}
                onChange={(event) =>
                  setExpenseCategoryId(event.target.value)
                }
                placeholder="e.g. 6"
                required
              />

              <label htmlFor="expense-date">
                Date
              </label>

              <input
                id="expense-date"
                type="date"
                value={expenseDate}
                onChange={(event) =>
                  setExpenseDate(event.target.value)
                }
                required
              />

              <label htmlFor="expense-description">
                Description
              </label>

              <input
                id="expense-description"
                type="text"
                value={expenseDescription}
                onChange={(event) =>
                  setExpenseDescription(event.target.value)
                }
                placeholder="e.g. Bought food"
              />

              <div className="form-actions">
                <button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Expense"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowExpenseForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* TRANSACTIONS */}

        <section className="transactions-grid">
          <div className="transaction-card">
            <div className="card-header">
              <h3>Recent Income</h3>
              <span>{selectedIncome.length}</span>
            </div>

            {selectedIncome.length === 0 ? (
              <p className="empty">No income recorded.</p>
            ) : (
              <div className="transaction-list">
                {selectedIncome.map((item) => (
                  <div
                    className="transaction"
                    key={item.id}
                  >
                    <div>
                      <strong>
                        {item.description || "Income"}
                      </strong>

                      <small>
                        {formatDate(item.date_received)}
                      </small>
                    </div>

                    <span className="income-value">
                      +{formatMoney(Number(item.amount))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="transaction-card">
            <div className="card-header">
              <h3>Recent Expenses</h3>
              <span>{selectedExpenses.length}</span>
            </div>

            {selectedExpenses.length === 0 ? (
              <p className="empty">
                No expenses recorded.
              </p>
            ) : (
              <div className="transaction-list">
                {selectedExpenses.map((item) => (
                  <div
                    className="transaction"
                    key={item.id}
                  >
                    <div>
                      <strong>
                        {item.description || "Expense"}
                      </strong>

                      <small>
                        {formatDate(item.date)}
                      </small>
                    </div>

                    <span className="expense-value">
                      -{formatMoney(Number(item.amount))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;