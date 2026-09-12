import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, MouseEvent as ReactMouseEvent } from "react";
import "./App.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8080"
).replace(/\/$/, "");

const DEFAULT_CATEGORIES = [
  { name: "Salary", type: "income" as const },
  { name: "Business Income", type: "income" as const },
  { name: "Other Income", type: "income" as const },
  { name: "Food", type: "expense" as const },
  { name: "Transport", type: "expense" as const },
  { name: "Bills", type: "expense" as const },
  { name: "Other Expense", type: "expense" as const },
];


// ...existing code...
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

type Category = {
  id: number;
  finance_space_id: number;
  name: string;
  type: "income" | "expense";
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
  | "income"
  | "expense"
  | null;

/* ============================================================
   Pick-or-create field: choose an existing person/category
   from the list, or type a brand-new one (created when the
   form is submitted).
   ============================================================ */

type PickOption = { id: number; name: string; meta?: string };

function PickOrCreate({
  id,
  value,
  onChange,
  options,
  placeholder,
  allowClear = false,
  clearLabel = "None",
  createLabel = "Create",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: PickOption[];
  placeholder?: string;
  allowClear?: boolean;
  clearLabel?: string;
  createLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();

  const sortedOptions = useMemo(
    () =>
      [...options].sort((a, b) => a.name.localeCompare(b.name)),
    [options]
  );

  const matches = sortedOptions.filter((option) =>
    option.name.toLowerCase().includes(lower)
  );
  const exact = sortedOptions.some(
    (option) => option.name.trim().toLowerCase() === lower
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocClick);

    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function pick(name: string) {
    onChange(name);
    setOpen(false);
  }

  return (
    <div className="pickorcreate" ref={rootRef}>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
      />

      {open && (matches.length > 0 || allowClear || trimmed) && (
        <div className="poc-menu" role="listbox">
          {allowClear && (
            <button
              type="button"
              className="poc-option poc-clear"
              role="option"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => pick("")}
            >
              {clearLabel}
            </button>
          )}

          {matches.map((option) => (
            <button
              type="button"
              className="poc-option"
              role="option"
              key={option.id}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => pick(option.name)}
            >
              {option.name}
              {option.meta ? <small>{option.meta}</small> : null}
            </button>
          ))}

          {trimmed && !exact && (
            <button
              type="button"
              className="poc-create"
              role="option"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => pick(trimmed)}
            >
              <span className="poc-plus">＋</span>
              {createLabel} “{trimmed}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Cash-flow chart (income vs expenses over time)
   ============================================================ */

function compactMoney(amount: number) {
  const abs = Math.abs(amount);

  if (abs >= 1_000_000) {
    return `₦${(amount / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}m`;
  }

  if (abs >= 1_000) {
    return `₦${Math.round(amount / 1_000)}k`;
  }

  return `₦${Math.round(amount)}`;
}

function monthKeyLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  const label = new Date(year, month - 1, 1).toLocaleDateString("en-NG", {
    month: "short",
  });

  return month === 1 ? `${label} '${String(year).slice(2)}` : label;
}

function shiftMonth(key: string, delta: number) {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function niceCeil(value: number) {
  if (value <= 0) {
    return 1;
  }

  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const factor =
    normalized <= 1
      ? 1
      : normalized <= 2
        ? 2
        : normalized <= 2.5
          ? 2.5
          : normalized <= 5
            ? 5
            : 10;

  return factor * magnitude;
}

type FlowPoint = {
  month: string;
  income: number;
  expense: number;
};

const FLOW_HEIGHT = 240;
const FLOW_PAD = { top: 18, right: 18, bottom: 30, left: 58 };

/* Bar geometry. Bars cap at 24px thick and never fill their month band —
   the leftover width stays as air, and a 2px gap in the surface colour
   separates the income/expense pair. Caps are rounded, feet are square
   on the baseline. */
const BAR_MAX = 24;
const BAR_MIN = 3;
const BAR_GAP = 2;
const BAR_RADIUS = 4;
const BAR_BAND_SHARE = 0.72;

/* A column: rounded top, square foot, grown from the baseline. */
function barPath(x: number, y: number, width: number, height: number) {
  const radius = Math.max(0, Math.min(BAR_RADIUS, width / 2, height));

  return (
    `M ${x} ${y + height} ` +
    `L ${x} ${y + radius} ` +
    `Q ${x} ${y} ${x + radius} ${y} ` +
    `L ${x + width - radius} ${y} ` +
    `Q ${x + width} ${y} ${x + width} ${y + radius} ` +
    `L ${x + width} ${y + height} Z`
  );
}

function CashFlowChart({
  income,
  expenses,
}: {
  income: Income[];
  expenses: Expense[];
}) {
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = boxRef.current;

    if (!el) {
      return;
    }

    const measure = () => setWidth(el.clientWidth);
    const observer = new ResizeObserver(measure);

    observer.observe(el);
    measure();

    return () => observer.disconnect();
  }, []);

  function fullMoney(amount: number) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function monthLongLabel(key: string) {
    const [year, month] = key.split("-").map(Number);

    return new Date(year, month - 1, 1).toLocaleDateString("en-NG", {
      month: "long",
      year: "numeric",
    });
  }

  const points = useMemo<FlowPoint[]>(() => {
    const sums = new Map<string, FlowPoint>();

    const add = (isoDate: string, amount: number, kind: "income" | "expense") => {
      const month = isoDate.slice(0, 7);
      const entry = sums.get(month) ?? { month, income: 0, expense: 0 };

      entry[kind] += amount;
      sums.set(month, entry);
    };

    income.forEach((item) =>
      add(item.date_received, Number(item.amount), "income")
    );
    expenses.forEach((item) => add(item.date, Number(item.amount), "expense"));

    const sorted = [...sums.values()].sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    if (sorted.length === 0) {
      return [];
    }

    const byKey = new Map(sorted.map((point) => [point.month, point]));
    const filled: FlowPoint[] = [];
    let cursor = sorted[0].month;
    const last = sorted[sorted.length - 1].month;

    while (cursor <= last) {
      filled.push(byKey.get(cursor) ?? { month: cursor, income: 0, expense: 0 });

      if (cursor === last) {
        break;
      }

      cursor = shiftMonth(cursor, 1);
    }

    return filled;
  }, [income, expenses]);

  if (points.length === 0) {
    return (
      <div ref={boxRef}>
        <p className="empty">
          Record income or expenses to see your cash flow over time.
        </p>
      </div>
    );
  }

  const innerWidth = Math.max(0, width - FLOW_PAD.left - FLOW_PAD.right);
  const innerHeight = FLOW_HEIGHT - FLOW_PAD.top - FLOW_PAD.bottom;
  const maxValue = niceCeil(
    Math.max(0.01, ...points.flatMap((point) => [point.income, point.expense]))
  );

  /* One band per month. The income/expense pair is centred in its band
     and the band's leftover width stays as air, so neighbouring months
     never read as one block. */
  const bandWidth = innerWidth / Math.max(1, points.length);
  const pairTarget = Math.min(bandWidth * BAR_BAND_SHARE, BAR_MAX * 2 + BAR_GAP);
  const barWidth = Math.max(BAR_MIN, (pairTarget - BAR_GAP) / 2);
  const pairWidth = barWidth * 2 + BAR_GAP;

  const bandLeft = (index: number) => FLOW_PAD.left + index * bandWidth;
  const bandCenter = (index: number) => bandLeft(index) + bandWidth / 2;
  const pairLeft = (index: number) => bandCenter(index) - pairWidth / 2;

  const barHeight = (value: number) =>
    value > 0 ? Math.max(1, (value / maxValue) * innerHeight) : 0;
  const barY = (value: number) =>
    FLOW_PAD.top + innerHeight - barHeight(value);
  const yAt = (value: number) =>
    FLOW_PAD.top + innerHeight - (value / maxValue) * innerHeight;

  /* Income is always the left bar, expenses always the right one — the
     order is part of the encoding, not just decoration. */
  const barX = (index: number, series: "income" | "expense") =>
    series === "income" ? pairLeft(index) : pairLeft(index) + barWidth + BAR_GAP;

  const gridValues = [maxValue, maxValue / 2, 0];
  const gridTicks = [maxValue * 0.75, maxValue * 0.25];
  const labelStride = Math.max(
    1,
    Math.ceil(54 / Math.max(1, bandWidth))
  );

  /* A one-line verdict computed from the same data as the chart. */
  const insight = (() => {
    const netByMonth = points.map((point) => ({
      month: point.month,
      net: point.income - point.expense,
    }));
    const positiveCount = netByMonth.filter((entry) => entry.net > 0).length;
    const totalNet = netByMonth.reduce((sum, entry) => sum + entry.net, 0);

    if (netByMonth.length === 1) {
      const only = netByMonth[0];

      return only.net >= 0
        ? `You kept ${fullMoney(only.net)} this month — nice.`
        : `You spent ${fullMoney(-only.net)} more than you earned this month.`;
    }

    const best = netByMonth.reduce((a, b) => (b.net > a.net ? b : a));

    if (totalNet >= 0) {
      const span =
        positiveCount === netByMonth.length
          ? "every month"
          : `${positiveCount} of ${netByMonth.length} months`;

      return `Net positive in ${span} — up ${fullMoney(
        totalNet
      )} overall. Best month: ${monthLongLabel(best.month)} (+${fullMoney(
        best.net
      )}).`;
    }

    const worst = netByMonth.reduce((a, b) => (b.net < a.net ? b : a));

    return `Expenses beat income in ${
      netByMonth.length - positiveCount
    } of ${netByMonth.length} months — down ${fullMoney(
      -totalNet
    )} overall. Worst month: ${monthLongLabel(worst.month)} (${fullMoney(
      worst.net
    )}).`;
  })();

  const handleChartMove = (event: ReactMouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const index = Math.floor((x - FLOW_PAD.left) / bandWidth);

    setHover(Math.min(points.length - 1, Math.max(0, index)));
  };

  const hoverIndex =
    hover !== null && hover < points.length ? hover : null;
  const hoverPoint = hoverIndex !== null ? points[hoverIndex] : null;
  const tipHalf = Math.max(60, Math.min(100, Math.floor(width * 0.45)));
  const tipLeft =
    hoverIndex !== null
      ? Math.min(
          Math.max(bandCenter(hoverIndex), tipHalf),
          Math.max(tipHalf, width - tipHalf)
        )
      : 0;

  if (width === 0) {
    return <div ref={boxRef} style={{ height: FLOW_HEIGHT }} />;
  }

  return (
    <div ref={boxRef} className="flow-wrap">
      <svg
        className="flow-chart"
        width={width}
        height={FLOW_HEIGHT}
        viewBox={`0 0 ${width} ${FLOW_HEIGHT}`}
        role="img"
        aria-label="Income and expenses by month"
        onMouseMove={handleChartMove}
        onMouseLeave={() => setHover(null)}
      >
        {/* Texture is the backup identity channel: where hue fails —
            greyscale print, forced-colors — each series keeps its own
            angle. CSS swaps these in; they are never on by default. */}
        <defs>
          <pattern
            id="flow-texture-income"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="6" height="6" className="flow-tex-base-income" />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="6"
              strokeWidth="2.5"
              className="flow-tex-ink-income"
            />
          </pattern>

          <pattern
            id="flow-texture-expense"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(135)"
          >
            <rect width="6" height="6" className="flow-tex-base-expense" />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="6"
              strokeWidth="2.5"
              className="flow-tex-ink-expense"
            />
          </pattern>
        </defs>

        {/* Grid is solid hairlines — dashing reads as "threshold". */}
        {gridTicks.map((value) => (
          <line
            key={`tick-${value}`}
            x1={FLOW_PAD.left}
            y1={yAt(value)}
            x2={width - FLOW_PAD.right}
            y2={yAt(value)}
            className="fg-faint"
          />
        ))}

        {gridValues.map((value) => {
          const y = yAt(value);

          return (
            <g key={value}>
              <line
                x1={FLOW_PAD.left}
                y1={y}
                x2={width - FLOW_PAD.right}
                y2={y}
                className={value === 0 ? "fg-zero" : "fg-grid"}
              />
              <text
                x={FLOW_PAD.left - 8}
                y={y + 4}
                textAnchor="end"
                className="flow-axis"
              >
                {compactMoney(value)}
              </text>
            </g>
          );
        })}

        {/* The hovered month, lifted out of the plot before the bars. */}
        {hoverIndex !== null && (
          <rect
            className="flow-band"
            x={bandLeft(hoverIndex)}
            y={FLOW_PAD.top}
            width={bandWidth}
            height={innerHeight}
          />
        )}

        {points.map((point, index) => {
          const incomeHeight = barHeight(point.income);
          const expenseHeight = barHeight(point.expense);

          return (
            <g key={point.month}>
              {incomeHeight > 0 && (
                <path
                  className="flow-bar flow-bar-income"
                  d={barPath(
                    barX(index, "income"),
                    barY(point.income),
                    barWidth,
                    incomeHeight
                  )}
                />
              )}

              {expenseHeight > 0 && (
                <path
                  className="flow-bar flow-bar-expense"
                  d={barPath(
                    barX(index, "expense"),
                    barY(point.expense),
                    barWidth,
                    expenseHeight
                  )}
                />
              )}
            </g>
          );
        })}

        {points.map((point, index) =>
          index % labelStride === 0 ? (
            <text
              key={point.month}
              x={bandCenter(index)}
              y={FLOW_HEIGHT - 8}
              textAnchor="middle"
              className="flow-axis"
            >
              {monthKeyLabel(point.month)}
            </text>
          ) : null
        )}
      </svg>

      {hoverPoint && (
        <div className="flow-tip" style={{ left: tipLeft, top: 6 }}>
          <p className="flow-tip-title">{monthLongLabel(hoverPoint.month)}</p>

          <div className="flow-tip-row">
            <span className="flow-tip-dot in" />
            Income
            <strong>{fullMoney(hoverPoint.income)}</strong>
          </div>

          <div className="flow-tip-row">
            <span className="flow-tip-dot ex" />
            Expenses
            <strong>{fullMoney(hoverPoint.expense)}</strong>
          </div>

          <div className="flow-tip-row">
            <span className="flow-tip-dot net" />
            Net
            <strong
              className={
                hoverPoint.income - hoverPoint.expense >= 0
                  ? "flow-pos"
                  : "flow-neg"
              }
            >
              {hoverPoint.income - hoverPoint.expense >= 0 ? "+" : "−"}
              {fullMoney(
                Math.abs(hoverPoint.income - hoverPoint.expense)
              )}
            </strong>
          </div>
        </div>
      )}

      <p className="flow-insight">{insight}</p>
    </div>
  );
}

type Theme = "dark" | "light";

function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: Theme;
  onToggle: () => void;
}) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? (
        /* Sun — click to go light */
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        /* Moon — click to go dark */
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    return window.localStorage.getItem("it-theme") === "light"
      ? "light"
      : "dark";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute(
        "content",
        theme === "light" ? "#eef2f7" : "#0b0f19"
      );
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem("it-theme", next);
      } catch {
        /* storage may be unavailable — ignore */
      }
      return next;
    });
  };

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
  const [name, setName] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [registrationMessage, setRegistrationMessage] = useState("");

  const [financeSpaces, setFinanceSpaces] = useState<FinanceSpace[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
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

  const [entryCategory, setEntryCategory] = useState("");
  const [entryAmount, setEntryAmount] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [entryDescription, setEntryDescription] = useState("");

  const [spaceName, setSpaceName] = useState("");
  const [spaceType, setSpaceType] = useState<"personal" | "business">(
    "personal"
  );

  const [personName, setPersonName] = useState("");
  const [personContact, setPersonContact] = useState("");
  const [personNote, setPersonNote] = useState("");

  const [debtPersonText, setDebtPersonText] = useState("");
  const [debtAmount, setDebtAmount] = useState("");
  const [debtDate, setDebtDate] = useState("");
  const [debtRepaymentDate, setDebtRepaymentDate] = useState("");
  const [debtDescription, setDebtDescription] = useState("");

  const [debtRepaymentDebtId, setDebtRepaymentDebtId] = useState("");
  const [debtRepaymentAmount, setDebtRepaymentAmount] = useState("");
  const [debtRepaymentDateValue, setDebtRepaymentDateValue] = useState("");

  const [creditPersonText, setCreditPersonText] = useState("");
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

  const selectedCategories = useMemo(
    () =>
      categories.filter(
        (category) => category.finance_space_id === selectedSpaceId
      ),
    [categories, selectedSpaceId]
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

  /* Repayments carry only their parent's id, so scope them to the selected
     space through the debts/credits already filtered above. */
  const totalDebtRepaid = useMemo(() => {
    const debtIds = new Set(selectedDebts.map((debt) => debt.id));

    return debtRepayments
      .filter((repayment) => debtIds.has(repayment.debt_id))
      .reduce((total, repayment) => total + Number(repayment.amount), 0);
  }, [debtRepayments, selectedDebts]);

  const totalCredit = useMemo(
    () =>
      selectedCredits.reduce(
        (total, item) => total + Number(item.amount),
        0
      ),
    [selectedCredits]
  );

  const totalCreditRepaid = useMemo(() => {
    const creditIds = new Set(selectedCredits.map((credit) => credit.id));

    return creditRepayments
      .filter((repayment) => creditIds.has(repayment.credit_id))
      .reduce((total, repayment) => total + Number(repayment.amount), 0);
  }, [creditRepayments, selectedCredits]);

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

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setRegistrationMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const message = await response.text();

      if (!response.ok) {
        throw new Error(message.trim() || "Could not create account.");
      }

      setName("");
      setEmail("");
      setPassword("");
      setAuthMode("login");
      setRegistrationMessage(
        "Account created successfully. Please log in."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create account."
      );
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
    setCategories([]);
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
        fetch(`${API_URL}/categories`, { headers }),
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
        "categories",
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
        categoriesData,
        incomeData,
        expensesData,
        peopleData,
        debtsData,
        debtRepaymentsData,
        creditsData,
        creditRepaymentsData,
      ] = await Promise.all(responses.map((response) => response.json()));

      const spaces = Array.isArray(spacesData) ? spacesData : [];

      const loadedCategories: Category[] = Array.isArray(categoriesData)
        ? categoriesData
        : [];

      const completeCategories = await ensureDefaultCategories(
        spaces,
        loadedCategories
      );

      setFinanceSpaces(spaces);
      setCategories(completeCategories);
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

    setDebtPersonText("");
    setDebtAmount("");
    setDebtDate("");
    setDebtRepaymentDate("");
    setDebtDescription("");

    setDebtRepaymentDebtId("");
    setDebtRepaymentAmount("");
    setDebtRepaymentDateValue("");

    setCreditPersonText("");
    setCreditAmount("");
    setCreditDate("");
    setCreditRepaymentDate("");
    setCreditDescription("");

    setCreditRepaymentCreditId("");
    setCreditRepaymentAmount("");
    setCreditRepaymentDateValue("");

    setEntryCategory("");
    setEntryAmount("");
    setEntryDate("");
    setEntryDescription("");
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

  async function ensureDefaultCategories(
    spaces: FinanceSpace[],
    existingCategories: Category[]
  ): Promise<Category[]> {
    const completeCategories = [...existingCategories];

    for (const space of spaces) {
      for (const defaultCategory of DEFAULT_CATEGORIES) {
        const exists = completeCategories.some(
          (category) =>
            category.finance_space_id === space.id &&
            category.type === defaultCategory.type &&
            category.name.toLowerCase() ===
              defaultCategory.name.toLowerCase()
        );

        if (exists) {
          continue;
        }

        const category = (await postJSON("/categories", {
          finance_space_id: space.id,
          name: defaultCategory.name,
          type: defaultCategory.type,
        })) as Category;

        completeCategories.push(category);
      }
    }

    return completeCategories;
  }

  async function createFinanceSpace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!spaceName.trim()) {
      setError("Finance space name is required.");
      return;
    }

    try {
      setError("");

      const space = (await postJSON("/finance-spaces", {
        name: spaceName.trim(),
        type: spaceType,
      })) as FinanceSpace;

      const newCategories = await ensureDefaultCategories([space], []);

      setFinanceSpaces((current) => [...current, space]);
      setCategories((current) => [...current, ...newCategories]);
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

  /* Person/category combobox resolution — reuse an existing record when the
     typed text matches one, otherwise create it on the fly. */
  async function resolvePerson(name: string) {
    const clean = name.trim();

    if (!clean) {
      return null;
    }

    const existing = selectedPeople.find(
      (person) =>
        person.name.trim().toLowerCase() === clean.toLowerCase()
    );

    if (existing) {
      return existing.id;
    }

    const person = (await postJSON("/people", {
      finance_space_id: selectedSpaceId,
      name: clean,
      contact: "",
      note: "",
    })) as Person;

    setPeople((current) => [...current, person]);

    return person.id;
  }

  async function resolveCategory(
    name: string,
    type: "income" | "expense"
  ) {
    const clean = name.trim();

    const existing = selectedCategories.find(
      (category) =>
        category.type === type &&
        category.name.trim().toLowerCase() === clean.toLowerCase()
    );

    if (existing) {
      return existing.id;
    }

    const category = (await postJSON("/categories", {
      finance_space_id: selectedSpaceId,
      name: clean,
      type,
    })) as Category;

    setCategories((current) => [...current, category]);

    return category.id;
  }

  async function createDebt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSpaceId) {
      setError("Select a finance space first.");
      return;
    }

    try {
      setError("");

      const personId = await resolvePerson(debtPersonText);

      const debt = await postJSON("/debts", {
        finance_space_id: selectedSpaceId,
        person_id: personId,
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

      const personId = await resolvePerson(creditPersonText);

      const credit = await postJSON("/credits", {
        finance_space_id: selectedSpaceId,
        person_id: personId,
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

  async function createIncome(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSpaceId) {
      setError("Select a finance space first.");
      return;
    }

    if (!entryCategory.trim()) {
      setError("Pick an existing category or type a new one.");
      return;
    }

    if (!entryAmount || Number(entryAmount) <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    if (!entryDate) {
      setError("Select a date.");
      return;
    }

    try {
      setError("");

      const categoryId = await resolveCategory(entryCategory, "income");

      const item = await postJSON("/income", {
        finance_space_id: selectedSpaceId,
        category_id: categoryId,
        amount: Number(entryAmount),
        date_received: entryDate,
        description: entryDescription.trim(),
      });

      setIncome((current) => [...current, item]);
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create income.");
    }
  }

  async function createExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSpaceId) {
      setError("Select a finance space first.");
      return;
    }

    if (!entryCategory.trim()) {
      setError("Pick an existing category or type a new one.");
      return;
    }

    if (!entryAmount || Number(entryAmount) <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    if (!entryDate) {
      setError("Select a date.");
      return;
    }

    try {
      setError("");

      const categoryId = await resolveCategory(entryCategory, "expense");

      const item = await postJSON("/expenses", {
        finance_space_id: selectedSpaceId,
        category_id: categoryId,
        amount: Number(entryAmount),
        date: entryDate,
        description: entryDescription.trim(),
      });

      setExpenses((current) => [...current, item]);
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create expense.");
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
          <ThemeToggle theme={theme} onToggle={toggleTheme} />

          <div className="login-brand">
            <img className="brand-logo" src="/favicon.svg" alt="" />
            <h1>Income Tracker</h1>
          </div>

          <div className="login-card">
            <h2>
              {authMode === "register" ? "Create Account" : "Login"}
            </h2>

            {authMode === "register" ? (
              <form onSubmit={register}>
                <label htmlFor="name">Name</label>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your name"
                  required
                />

                <label htmlFor="register-email">Email</label>

                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  required
                />

                <label htmlFor="register-password">Password</label>

                <input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a password"
                  minLength={8}
                  required
                />

                <button type="submit" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </button>

                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setAuthMode("login");
                    setError("");
                    setRegistrationMessage("");
                  }}
                >
                  Already have an account? Login
                </button>
              </form>
            ) : (
              <form onSubmit={login}>
                <label htmlFor="login-email">Email</label>

                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  required
                />

                <label htmlFor="login-password">Password</label>

                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                />

                <button type="submit" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </button>

                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setAuthMode("register");
                    setError("");
                    setRegistrationMessage("");
                  }}
                >
                  Create an account
                </button>
              </form>
            )}

            {registrationMessage && (
              <p className="success">{registrationMessage}</p>
            )}

            {error && <p className="error">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img className="brand-logo" src="/favicon.svg" alt="" />
          <div>
            <h1>Income Tracker</h1>
            <p>Welcome, {user.name}</p>
          </div>
        </div>

        <div className="topbar-actions">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />

          <button className="logout-button" onClick={logout}>
            Logout
          </button>
        </div>
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
              <button onClick={() => setModal("income")}>
                + Add Income
              </button>

              <button onClick={() => setModal("expense")}>
                + Add Expense
              </button>

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

            <section className="data-section flow-section">
              <div className="card-header">
                <div className="flow-head">
                  <h3>Cash Flow</h3>
                  <p className="flow-subtitle">
                    Income vs expenses, month by month — income is always the
                    left bar, expenses the right.
                  </p>
                </div>
                <div className="flow-legend">
                  <span className="flow-key income">
                    <span className="flow-swatch" />
                    Income
                  </span>
                  <span className="flow-key expense">
                    <span className="flow-swatch" />
                    Expenses
                  </span>
                </div>
              </div>

              <CashFlowChart
                income={selectedIncome}
                expenses={selectedExpenses}
              />
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
                {modal === "income" && "Add Income"}
                {modal === "expense" && "Add Expense"}
              </h2>

              <button onClick={closeModal}>×</button>
            </div>

            {(modal === "income" || modal === "expense") && (
              <form
                onSubmit={
                  modal === "income" ? createIncome : createExpense
                }
              >
                <label htmlFor="entry-category">Category</label>

                <PickOrCreate
                  id="entry-category"
                  value={entryCategory}
                  onChange={setEntryCategory}
                  placeholder={
                    modal === "income"
                      ? "Pick an income category or type a new one"
                      : "Pick an expense category or type a new one"
                  }
                  createLabel="Add new category"
                  options={selectedCategories
                    .filter((category) =>
                      modal === "income"
                        ? category.type === "income"
                        : category.type === "expense"
                    )
                    .map((category) => ({
                      id: category.id,
                      name: category.name,
                    }))}
                />

                <label htmlFor="entry-amount">Amount</label>

                <input
                  id="entry-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={entryAmount}
                  onChange={(event) =>
                    setEntryAmount(event.target.value)
                  }
                  required
                />

                <label htmlFor="entry-date">Date</label>

                <input
                  id="entry-date"
                  type="date"
                  value={entryDate}
                  onChange={(event) =>
                    setEntryDate(event.target.value)
                  }
                  required
                />

                <label htmlFor="entry-description">Description</label>

                <textarea
                  id="entry-description"
                  value={entryDescription}
                  onChange={(event) =>
                    setEntryDescription(event.target.value)
                  }
                />

                <button type="submit">
                  {modal === "income" ? "Add Income" : "Add Expense"}
                </button>
              </form>
            )}

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

                <PickOrCreate
                  id="debt-person"
                  value={debtPersonText}
                  onChange={setDebtPersonText}
                  placeholder="Pick a person or type a new name"
                  createLabel="Add new person"
                  allowClear
                  clearLabel="No person"
                  options={selectedPeople.map((person) => ({
                    id: person.id,
                    name: person.name,
                    meta: person.contact || person.note || undefined,
                  }))}
                />

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

                <PickOrCreate
                  id="credit-person"
                  value={creditPersonText}
                  onChange={setCreditPersonText}
                  placeholder="Pick a person or type a new name"
                  createLabel="Add new person"
                  allowClear
                  clearLabel="No person"
                  options={selectedPeople.map((person) => ({
                    id: person.id,
                    name: person.name,
                    meta: person.contact || person.note || undefined,
                  }))}
                />

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