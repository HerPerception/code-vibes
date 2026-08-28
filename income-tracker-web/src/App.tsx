import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
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
  type: "personal" | "business";
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

type Person = {
  id: number;
  finance_space_id: number;
  name: string;
  contact?: string;
  note?: string;
};

type Debt = {
  id: number;
  finance_space_id: number;
  person_id?: number | null;
  amount: number;
  date_borrowed: string;
  repayment_date?: string | null;
  description?: string | null;
};

type DebtRepayment = {
  id: number;
  debt_id: number;
  amount: number;
  date: string;
};

type Credit = {
  id: number;
  finance_space_id: number;
  person_id?: number | null;
  amount: number;
  date_lent: string;
  repayment_date?: string | null;
  description?: string | null;
};

type CreditRepayment = {
  id: number;
  credit_id: number;
  amount: number;
  date: string;
};

type ModalType =
  | "finance"
  | "person"
  | "debt"
  | "debt-repayment"
  | "credit"
  | "credit-repayment"
  | null;

function App() {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token")
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [financeSpaces, setFinanceSpaces] = useState<FinanceSpace[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);

  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtRepayments, setDebtRepayments] = useState<DebtRepayment[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [creditRepayments, setCreditRepayments] = useState<
    CreditRepayment[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [modal, setModal] = useState<ModalType>(null);

  const [spaceName, setSpaceName] = useState("");
  const [spaceType, setSpaceType] = useState<"personal" | "business">(
    "personal"
  );

  const [personName, setPersonName] = useState("");
  const [personContact, setPersonContact] = useState("");
  const [personNote, setPersonNote] = useState("");

  const [debtPersonId, setDebtPersonId] = useState("");
  const [debtAmount, setDebtAmount] = useState("");
  const [debtDate, setDebtDate] = useState("");
  const [debtRepaymentDate, setDebtRepaymentDate] = useState("");
  const [debtDescription, setDebtDescription] = useState("");

  const [debtRepaymentDebtId, setDebtRepaymentDebtId] = useState("");
  const [debtRepaymentAmount, setDebtRepaymentAmount] = useState("");
  const [debtRepaymentDateValue, setDebtRepaymentDateValue] = useState("");

  const [creditPersonId, setCreditPersonId] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditDate, setCreditDate] = useState("");
  const [creditRepaymentDate, setCreditRepaymentDate] = useState("");
  const [creditDescription, setCreditDescription] = useState("");

  const [creditRepaymentCreditId, setCreditRepaymentCreditId] =
    useState("");
  const [creditRepaymentAmount, setCreditRepaymentAmount] = useState("");
  const [creditRepaymentDateValue, setCreditRepaymentDateValue] =
    useState("");

  const selectedSpace = financeSpaces.find(
    (space) => space.id === selectedSpaceId
  );

  const selectedIncome = useMemo(
    () =>
      income.filter((item) => item.finance_space_id === selectedSpaceId),
    [income, selectedSpaceId]
  );

  const selectedExpenses = useMemo(
    () =>
      expenses.filter((item) => item.finance_space_id === selectedSpaceId),
    [expenses, selectedSpaceId]
  );

  const selectedPeople = useMemo(
    () =>
      people.filter((person) => person.finance_space_id === selectedSpaceId),
    [people, selectedSpaceId]
  );

  const selectedDebts = useMemo(
    () =>
      debts.filter((debt) => debt.finance_space_id === selectedSpaceId),
    [debts, selectedSpaceId]
  );

  const selectedCredits = useMemo(
    () =>
      credits.filter((credit) => credit.finance_space_id === selectedSpaceId),
    [credits, selectedSpaceId]
  );

  const totalIncome = useMemo(
    () =>
      selectedIncome.reduce(
        (total, item) => total + Number(item.amount),
        0
      ),
    [selectedIncome]
  );

  const totalExpenses = useMemo(
    () =>
      selectedExpenses.reduce(
        (total, item) => total + Number(item.amount),
        0
      ),
    [selectedExpenses]
  );

  const totalDebt = useMemo(
    () =>
      selectedDebts.reduce(
        (total, item) => total + Number(item.amount),
        0
      ),
    [selectedDebts]
  );

  const totalDebtRepaid = useMemo(
    () =>
      debtRepayments.reduce(
        (total, repayment) => total + Number(repayment.amount),
        0
      ),
    [debtRepayments]
  );

  const totalCredit = useMemo(
    () =>
      selectedCredits.reduce(
        (total, item) => total + Number(item.amount),
        0
      ),
    [selectedCredits]
  );

  const totalCreditRepaid = useMemo(
    () =>
      creditRepayments.reduce(
        (total, repayment) => total + Number(repayment.amount),
        0
      ),
    [creditRepayments]
  );

  const outstandingDebt = totalDebt - totalDebtRepaid;
  const outstandingCredit = totalCredit - totalCreditRepaid;

  const balance = totalIncome - totalExpenses;

  async function login(event: FormEvent<HTMLFormElement>) {
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
    setPeople([]);
    setDebts([]);
    setDebtRepayments([]);
    setCredits([]);
    setCreditRepayments([]);

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

      const responses = await Promise.all([
        fetch(`${API_URL}/finance-spaces`, { headers }),
        fetch(`${API_URL}/income`, { headers }),
        fetch(`${API_URL}/expenses`, { headers }),
        fetch(`${API_URL}/people`, { headers }),
        fetch(`${API_URL}/debts`, { headers }),
        fetch(`${API_URL}/debt-repayments`, { headers }),
        fetch(`${API_URL}/credits`, { headers }),
        fetch(`${API_URL}/credit-repayments`, { headers }),
      ]);

      const names = [
        "finance spaces",
        "income",
        "expenses",
        "people",
        "debts",
        "debt repayments",
        "credits",
        "credit repayments",
      ];

      for (let i = 0; i < responses.length; i++) {
        if (!responses[i].ok) {
          throw new Error(`Could not load ${names[i]}.`);
        }
      }

      const [
        spacesData,
        incomeData,
        expensesData,
        peopleData,
        debtsData,
        debtRepaymentsData,
        creditsData,
        creditRepaymentsData,
      ] = await Promise.all(responses.map((response) => response.json()));

      const spaces = Array.isArray(spacesData) ? spacesData : [];

      setFinanceSpaces(spaces);
      setIncome(Array.isArray(incomeData) ? incomeData : []);
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      setPeople(Array.isArray(peopleData) ? peopleData : []);
      setDebts(Array.isArray(debtsData) ? debtsData : []);
      setDebtRepayments(
        Array.isArray(debtRepaymentsData) ? debtRepaymentsData : []
      );
      setCredits(Array.isArray(creditsData) ? creditsData : []);
      setCreditRepayments(
        Array.isArray(creditRepaymentsData)
          ? creditRepaymentsData
          : []
      );

      if (spaces.length > 0) {
        setSelectedSpaceId((currentId) => {
          if (
            currentId &&
            spaces.some((space: FinanceSpace) => space.id === currentId)
          ) {
            return currentId;
          }

          return spaces[0].id;
        });
      } else {
        setSelectedSpaceId(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load dashboard."
      );
    } finally {
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

  function formatDate(date: string | null | undefined) {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function closeModal() {
    setModal(null);

    setSpaceName("");
    setSpaceType("personal");

    setPersonName("");
    setPersonContact("");
    setPersonNote("");

    setDebtPersonId("");
    setDebtAmount("");
    setDebtDate("");
    setDebtRepaymentDate("");
    setDebtDescription("");

    setDebtRepaymentDebtId("");
    setDebtRepaymentAmount("");
    setDebtRepaymentDateValue("");

    setCreditPersonId("");
    setCreditAmount("");
    setCreditDate("");
    setCreditRepaymentDate("");
    setCreditDescription("");

    setCreditRepaymentCreditId("");
    setCreditRepaymentAmount("");
    setCreditRepaymentDateValue("");
  }

  async function postJSON(
    endpoint: string,
    body: Record<string, unknown>
  ) {
    if (!token) {
      throw new Error("You are not logged in.");
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message.trim() || "Request failed.");
    }

    return response.json();
  }

  async function createFinanceSpace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!spaceName.trim()) {
      setError("Finance space name is required.");
      return;
    }

    try {
      setError("");

      const space = await postJSON("/finance-spaces", {
        name: spaceName.trim(),
        type: spaceType,
      });

      setFinanceSpaces((current) => [...current, space]);
      setSelectedSpaceId(space.id);

      closeModal();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create finance space."
      );
    }
  }

  async function createPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSpaceId) {
      setError("Select a finance space first.");
      return;
    }

    if (!personName.trim()) {
      setError("Person name is required.");
      return;
    }

    try {
      setError("");

      const person = await postJSON("/people", {
        finance_space_id: selectedSpaceId,
        name: personName.trim(),
        contact: personContact.trim(),
        note: personNote.trim(),
      });

      setPeople((current) => [...current, person]);

      closeModal();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create person."
      );
    }
  }

  async function createDebt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSpaceId) {
      setError("Select a finance space first.");
      return;
    }

    try {
      setError("");

      const debt = await postJSON("/debts", {
        finance_space_id: selectedSpaceId,
        person_id: debtPersonId ? Number(debtPersonId) : null,
        amount: Number(debtAmount),
        date_borrowed: debtDate,
        repayment_date: debtRepaymentDate || null,
        description: debtDescription.trim(),
      });

      setDebts((current) => [...current, debt]);

      closeModal();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create debt."
      );
    }
  }

  async function createDebtRepayment(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setError("");

      const repayment = await postJSON("/debt-repayments", {
        debt_id: Number(debtRepaymentDebtId),
        amount: Number(debtRepaymentAmount),
        date: debtRepaymentDateValue,
      });

      setDebtRepayments((current) => [...current, repayment]);

      closeModal();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create debt repayment."
      );
    }
  }

  async function createCredit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSpaceId) {
      setError("Select a finance space first.");
      return;
    }

    try {
      setError("");

      const credit = await postJSON("/credits", {
        finance_space_id: selectedSpaceId,
        person_id: creditPersonId ? Number(creditPersonId) : null,
        amount: Number(creditAmount),
        date_lent: creditDate,
        repayment_date: creditRepaymentDate || null,
        description: creditDescription.trim(),
      });

      setCredits((current) => [...current, credit]);

      closeModal();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create credit."
      );
    }
  }

  async function createCreditRepayment(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setError("");

      const repayment = await postJSON("/credit-repayments", {
        credit_id: Number(creditRepaymentCreditId),
        amount: Number(creditRepaymentAmount),
        date: creditRepaymentDateValue,
      });

      setCreditRepayments((current) => [...current, repayment]);

      closeModal();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create credit repayment."
      );
    }
  }

  function getPersonName(personId: number | null | undefined) {
    if (!personId) {
      return "No person";
    }

    return (
      people.find((person) => person.id === personId)?.name ||
      "Unknown person"
    );
  }

  function getDebtRepayments(debtId: number) {
    return debtRepayments
      .filter((repayment) => repayment.debt_id === debtId)
      .reduce((total, repayment) => total + Number(repayment.amount), 0);
  }

  function getCreditRepayments(creditId: number) {
    return creditRepayments
      .filter((repayment) => repayment.credit_id === creditId)
      .reduce((total, repayment) => total + Number(repayment.amount), 0);
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
                Viewing your <strong>{selectedSpace.name}</strong> finance
                space.
              </p>
            )}
          </div>

          <button onClick={loadDashboard} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </section>

        {error && <div className="error-box">{error}</div>}

        <section className="space-section">
          <div className="section-title-row">
            <h3>Finance Spaces</h3>

            <button
              className="add-button"
              onClick={() => setModal("finance")}
            >
              + Add Finance Space
            </button>
          </div>

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

        {selectedSpace && (
          <>
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

              <div className="summary-card">
                <span>Money You Owe</span>
                <strong className="expense-value">
                  {formatMoney(outstandingDebt)}
                </strong>
              </div>

              <div className="summary-card">
                <span>Money Owed to You</span>
                <strong className="income-value">
                  {formatMoney(outstandingCredit)}
                </strong>
              </div>
            </section>

            <section className="action-grid">
              <button onClick={() => setModal("person")}>
                + Add Person
              </button>

              <button onClick={() => setModal("debt")}>
                + Add Debt
              </button>

              <button onClick={() => setModal("debt-repayment")}>
                + Debt Repayment
              </button>

              <button onClick={() => setModal("credit")}>
                + Add Credit
              </button>

              <button onClick={() => setModal("credit-repayment")}>
                + Credit Repayment
              </button>
            </section>

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
                      <div className="transaction" key={item.id}>
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
                  <p className="empty">No expenses recorded.</p>
                ) : (
                  <div className="transaction-list">
                    {selectedExpenses.map((item) => (
                      <div className="transaction" key={item.id}>
                        <div>
                          <strong>
                            {item.description || "Expense"}
                          </strong>
                          <small>{formatDate(item.date)}</small>
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

            <section className="data-section">
              <div className="card-header">
                <h3>People</h3>
                <span>{selectedPeople.length}</span>
              </div>

              {selectedPeople.length === 0 ? (
                <p className="empty">No people added yet.</p>
              ) : (
                <div className="record-list">
                  {selectedPeople.map((person) => (
                    <div className="record" key={person.id}>
                      <div>
                        <strong>{person.name}</strong>
                        <small>
                          {person.contact || "No contact"}
                        </small>
                      </div>

                      <span>{person.note || "—"}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="data-section">
              <div className="card-header">
                <h3>Debts — Money You Owe</h3>
                <span>{selectedDebts.length}</span>
              </div>

              {selectedDebts.length === 0 ? (
                <p className="empty">No debts recorded.</p>
              ) : (
                <div className="record-list">
                  {selectedDebts.map((debt) => {
                    const repaid = getDebtRepayments(debt.id);
                    const remaining = Number(debt.amount) - repaid;

                    return (
                      <div className="record" key={debt.id}>
                        <div>
                          <strong>
                            {getPersonName(debt.person_id)}
                          </strong>

                          <small>
                            Borrowed {formatDate(debt.date_borrowed)}
                            {debt.description
                              ? ` · ${debt.description}`
                              : ""}
                          </small>
                        </div>

                        <div className="record-amounts">
                          <strong className="expense-value">
                            {formatMoney(Number(debt.amount))}
                          </strong>

                          <small>
                            Repaid {formatMoney(repaid)} · Remaining{" "}
                            {formatMoney(remaining)}
                          </small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="data-section">
              <div className="card-header">
                <h3>Credits — Money Owed to You</h3>
                <span>{selectedCredits.length}</span>
              </div>

              {selectedCredits.length === 0 ? (
                <p className="empty">No credits recorded.</p>
              ) : (
                <div className="record-list">
                  {selectedCredits.map((credit) => {
                    const repaid = getCreditRepayments(credit.id);
                    const remaining =
                      Number(credit.amount) - repaid;

                    return (
                      <div className="record" key={credit.id}>
                        <div>
                          <strong>
                            {getPersonName(credit.person_id)}
                          </strong>

                          <small>
                            Lent {formatDate(credit.date_lent)}
                            {credit.description
                              ? ` · ${credit.description}`
                              : ""}
                          </small>
                        </div>

                        <div className="record-amounts">
                          <strong className="income-value">
                            {formatMoney(Number(credit.amount))}
                          </strong>

                          <small>
                            Repaid {formatMoney(repaid)} · Remaining{" "}
                            {formatMoney(remaining)}
                          </small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="transactions-grid">
              <div className="transaction-card">
                <div className="card-header">
                  <h3>Debt Repayments</h3>
                  <span>{debtRepayments.length}</span>
                </div>

                {debtRepayments.length === 0 ? (
                  <p className="empty">
                    No debt repayments recorded.
                  </p>
                ) : (
                  <div className="transaction-list">
                    {debtRepayments.map((repayment) => (
                      <div
                        className="transaction"
                        key={repayment.id}
                      >
                        <div>
                          <strong>
                            Debt #{repayment.debt_id}
                          </strong>
                          <small>
                            {formatDate(repayment.date)}
                          </small>
                        </div>

                        <span className="expense-value">
                          {formatMoney(Number(repayment.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="transaction-card">
                <div className="card-header">
                  <h3>Credit Repayments</h3>
                  <span>{creditRepayments.length}</span>
                </div>

                {creditRepayments.length === 0 ? (
                  <p className="empty">
                    No credit repayments recorded.
                  </p>
                ) : (
                  <div className="transaction-list">
                    {creditRepayments.map((repayment) => (
                      <div
                        className="transaction"
                        key={repayment.id}
                      >
                        <div>
                          <strong>
                            Credit #{repayment.credit_id}
                          </strong>
                          <small>
                            {formatDate(repayment.date)}
                          </small>
                        </div>

                        <span className="income-value">
                          {formatMoney(Number(repayment.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {modal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div
            className="modal-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2>
                {modal === "finance" && "Add Finance Space"}
                {modal === "person" && "Add Person"}
                {modal === "debt" && "Add Debt"}
                {modal === "debt-repayment" && "Record Debt Repayment"}
                {modal === "credit" && "Add Credit"}
                {modal === "credit-repayment" &&
                  "Record Credit Repayment"}
              </h2>

              <button onClick={closeModal}>×</button>
            </div>

            {modal === "finance" && (
              <form onSubmit={createFinanceSpace}>
                <label htmlFor="space-name">Name</label>

                <input
                  id="space-name"
                  value={spaceName}
                  onChange={(event) =>
                    setSpaceName(event.target.value)
                  }
                  placeholder="e.g. Business"
                  required
                />

                <label htmlFor="space-type">Type</label>

                <select
                  id="space-type"
                  value={spaceType}
                  onChange={(event) =>
                    setSpaceType(
                      event.target.value as "personal" | "business"
                    )
                  }
                >
                  <option value="personal">Personal</option>
                  <option value="business">Business</option>
                </select>

                <button type="submit">Create Finance Space</button>
              </form>
            )}

            {modal === "person" && (
              <form onSubmit={createPerson}>
                <label htmlFor="person-name">Name</label>

                <input
                  id="person-name"
                  value={personName}
                  onChange={(event) =>
                    setPersonName(event.target.value)
                  }
                  placeholder="Person's name"
                  required
                />

                <label htmlFor="person-contact">Contact</label>

                <input
                  id="person-contact"
                  value={personContact}
                  onChange={(event) =>
                    setPersonContact(event.target.value)
                  }
                  placeholder="Phone or email"
                />

                <label htmlFor="person-note">Note</label>

                <textarea
                  id="person-note"
                  value={personNote}
                  onChange={(event) =>
                    setPersonNote(event.target.value)
                  }
                  placeholder="Optional note"
                />

                <button type="submit">Add Person</button>
              </form>
            )}

            {modal === "debt" && (
              <form onSubmit={createDebt}>
                <label htmlFor="debt-person">Person</label>

                <select
                  id="debt-person"
                  value={debtPersonId}
                  onChange={(event) =>
                    setDebtPersonId(event.target.value)
                  }
                >
                  <option value="">No person</option>

                  {selectedPeople.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>

                <label htmlFor="debt-amount">Amount</label>

                <input
                  id="debt-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={debtAmount}
                  onChange={(event) =>
                    setDebtAmount(event.target.value)
                  }
                  required
                />

                <label htmlFor="debt-date">Date Borrowed</label>

                <input
                  id="debt-date"
                  type="date"
                  value={debtDate}
                  onChange={(event) =>
                    setDebtDate(event.target.value)
                  }
                  required
                />

                <label htmlFor="debt-repayment-date">
                  Expected Repayment Date
                </label>

                <input
                  id="debt-repayment-date"
                  type="date"
                  value={debtRepaymentDate}
                  onChange={(event) =>
                    setDebtRepaymentDate(event.target.value)
                  }
                />

                <label htmlFor="debt-description">
                  Description
                </label>

                <textarea
                  id="debt-description"
                  value={debtDescription}
                  onChange={(event) =>
                    setDebtDescription(event.target.value)
                  }
                />

                <button type="submit">Create Debt</button>
              </form>
            )}

            {modal === "debt-repayment" && (
              <form onSubmit={createDebtRepayment}>
                <label htmlFor="debt-repayment-debt">
                  Debt
                </label>

                <select
                  id="debt-repayment-debt"
                  value={debtRepaymentDebtId}
                  onChange={(event) =>
                    setDebtRepaymentDebtId(event.target.value)
                  }
                  required
                >
                  <option value="">Select debt</option>

                  {selectedDebts.map((debt) => (
                    <option key={debt.id} value={debt.id}>
                      Debt #{debt.id} —{" "}
                      {getPersonName(debt.person_id)} —{" "}
                      {formatMoney(Number(debt.amount))}
                    </option>
                  ))}
                </select>

                <label htmlFor="debt-repayment-amount">
                  Amount
                </label>

                <input
                  id="debt-repayment-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={debtRepaymentAmount}
                  onChange={(event) =>
                    setDebtRepaymentAmount(event.target.value)
                  }
                  required
                />

                <label htmlFor="debt-repayment-date-value">
                  Date
                </label>

                <input
                  id="debt-repayment-date-value"
                  type="date"
                  value={debtRepaymentDateValue}
                  onChange={(event) =>
                    setDebtRepaymentDateValue(event.target.value)
                  }
                  required
                />

                <button type="submit">
                  Record Repayment
                </button>
              </form>
            )}

            {modal === "credit" && (
              <form onSubmit={createCredit}>
                <label htmlFor="credit-person">Person</label>

                <select
                  id="credit-person"
                  value={creditPersonId}
                  onChange={(event) =>
                    setCreditPersonId(event.target.value)
                  }
                >
                  <option value="">No person</option>

                  {selectedPeople.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>

                <label htmlFor="credit-amount">Amount</label>

                <input
                  id="credit-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={creditAmount}
                  onChange={(event) =>
                    setCreditAmount(event.target.value)
                  }
                  required
                />

                <label htmlFor="credit-date">Date Lent</label>

                <input
                  id="credit-date"
                  type="date"
                  value={creditDate}
                  onChange={(event) =>
                    setCreditDate(event.target.value)
                  }
                  required
                />

                <label htmlFor="credit-repayment-date">
                  Expected Repayment Date
                </label>

                <input
                  id="credit-repayment-date"
                  type="date"
                  value={creditRepaymentDate}
                  onChange={(event) =>
                    setCreditRepaymentDate(event.target.value)
                  }
                />

                <label htmlFor="credit-description">
                  Description
                </label>

                <textarea
                  id="credit-description"
                  value={creditDescription}
                  onChange={(event) =>
                    setCreditDescription(event.target.value)
                  }
                />

                <button type="submit">Create Credit</button>
              </form>
            )}

            {modal === "credit-repayment" && (
              <form onSubmit={createCreditRepayment}>
                <label htmlFor="credit-repayment-credit">
                  Credit
                </label>

                <select
                  id="credit-repayment-credit"
                  value={creditRepaymentCreditId}
                  onChange={(event) =>
                    setCreditRepaymentCreditId(event.target.value)
                  }
                  required
                >
                  <option value="">Select credit</option>

                  {selectedCredits.map((credit) => (
                    <option key={credit.id} value={credit.id}>
                      Credit #{credit.id} —{" "}
                      {getPersonName(credit.person_id)} —{" "}
                      {formatMoney(Number(credit.amount))}
                    </option>
                  ))}
                </select>

                <label htmlFor="credit-repayment-amount">
                  Amount
                </label>

                <input
                  id="credit-repayment-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={creditRepaymentAmount}
                  onChange={(event) =>
                    setCreditRepaymentAmount(event.target.value)
                  }
                  required
                />

                <label htmlFor="credit-repayment-date-value">
                  Date
                </label>

                <input
                  id="credit-repayment-date-value"
                  type="date"
                  value={creditRepaymentDateValue}
                  onChange={(event) =>
                    setCreditRepaymentDateValue(event.target.value)
                  }
                  required
                />

                <button type="submit">
                  Record Repayment
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;