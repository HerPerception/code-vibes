package main

import (
    "context"
    "fmt"
    "log"
    "net/http"
    "os"

    "income-tracker/internal/auth"
    "income-tracker/internal/categories"
    "income-tracker/internal/credit_repayments"
    "income-tracker/internal/credits"
    "income-tracker/internal/dashboard"
    "income-tracker/internal/database"
    "income-tracker/internal/debt_repayments"
    "income-tracker/internal/debts"
    "income-tracker/internal/expenses"
    "income-tracker/internal/finance"
    "income-tracker/internal/income"
    "income-tracker/internal/people"
    "income-tracker/internal/users"

    "github.com/joho/godotenv"
)

func main() {
    if err := godotenv.Load(); err != nil {
        log.Println(".env file not found; using environment variables")
    }

    jwtSecret := os.Getenv("JWT_SECRET")
    if jwtSecret == "" {
        log.Fatal("JWT_SECRET is not set")
    }

    conn, err := database.Connect()
    if err != nil {
        log.Fatal(err)
    }
    defer conn.Close(context.Background())

    if err := conn.Ping(context.Background()); err != nil {
        log.Fatal(err)
    }

    userHandler := users.Handler{Conn: conn}
    financeHandler := finance.Handler{Conn: conn}
    incomeHandler := income.Handler{Conn: conn}
    expenseHandler := expenses.Handler{Conn: conn}
    categoryHandler := categories.Handler{Conn: conn}
    peopleHandler := people.Handler{Conn: conn}
    debtHandler := debts.Handler{Conn: conn}
    debtRepaymentHandler := debt_repayments.Handler{Conn: conn}
    creditHandler := credits.Handler{Conn: conn}
    creditRepaymentHandler := credit_repayments.Handler{Conn: conn}
    dashboardHandler := dashboard.Handler{Conn: conn}

    http.HandleFunc("POST /users", userHandler.Create)
    http.HandleFunc("POST /login", userHandler.Login)

    protectedCreateFinance := auth.Middleware(
        jwtSecret,
        http.HandlerFunc(financeHandler.Create),
    )
    protectedListFinance := auth.Middleware(
        jwtSecret,
        http.HandlerFunc(financeHandler.List),
    )
    http.Handle("POST /finance-spaces", protectedCreateFinance)
    http.Handle("GET /finance-spaces", protectedListFinance)

    protectedCreateCategory := auth.Middleware(
        jwtSecret,
        http.HandlerFunc(categoryHandler.Create),
    )
    protectedListCategory := auth.Middleware(
        jwtSecret,
        http.HandlerFunc(categoryHandler.List),
    )
    http.Handle("POST /categories", protectedCreateCategory)
    http.Handle("GET /categories", protectedListCategory)

    protectedCreatePerson := auth.Middleware(
        jwtSecret,
        http.HandlerFunc(peopleHandler.Create),
    )
    protectedListPeople := auth.Middleware(
        jwtSecret,
        http.HandlerFunc(peopleHandler.List),
    )
    http.Handle("POST /people", protectedCreatePerson)
    http.Handle("GET /people", protectedListPeople)

    protectedCreateIncome := auth.Middleware(
        jwtSecret,
        http.HandlerFunc(incomeHandler.Create),
    )
    protectedListIncome := auth.Middleware(
        jwtSecret,
        http.HandlerFunc(incomeHandler.List),
    )
    http.Handle("POST /income", protectedCreateIncome)
    http.Handle("GET /income", protectedListIncome)

    protectedCreateExpense := auth.Middleware(
        jwtSecret,
        http.HandlerFunc(expenseHandler.Create),
    )
    protectedListExpense := auth.Middleware(
        jwtSecret,
        http.HandlerFunc(expenseHandler.List),
    )
    http.Handle("POST /expenses", protectedCreateExpense)
    http.Handle("GET /expenses", protectedListExpense)

    protectedCreateDebt := auth.Middleware(
        jwtSecret,
        http.HandlerFunc(debtHandler.Create),
    )
    protectedListDebt := auth.Middleware(
        jwtSecret,
        http.HandlerFunc(debtHandler.List),
    )
    http.Handle("POST /debts", protectedCreateDebt)
    http.Handle("GET /debts", protectedListDebt)

    protectedCreateDebtRepayment := auth.Middleware(
        jwtSecret,
        http.HandlerFunc(debtRepaymentHandler.Create),
    )
    protectedListDebtRepayment := auth.Middleware(
        jwtSecret,
        http.HandlerFunc(debtRepaymentHandler.List),
    )
    http.Handle("POST /debt-repayments", protectedCreateDebtRepayment)
    http.Handle("GET /debt-repayments", protectedListDebtRepayment)

    protectedCreateCredit := auth.Middleware(
        jwtSecret,
        http.HandlerFunc(creditHandler.Create),
    )
    protectedListCredit := auth.Middleware(
        jwtSecret,
        http.HandlerFunc(creditHandler.List),
    )
    http.Handle("POST /credits", protectedCreateCredit)
    http.Handle("GET /credits", protectedListCredit)

    protectedCreateCreditRepayment := auth.Middleware(
        jwtSecret,
        http.HandlerFunc(creditRepaymentHandler.Create),
    )
    protectedListCreditRepayment := auth.Middleware(
        jwtSecret,
        http.HandlerFunc(creditRepaymentHandler.List),
    )
    http.Handle("POST /credit-repayments", protectedCreateCreditRepayment)
    http.Handle("GET /credit-repayments", protectedListCreditRepayment)

    protectedDashboard := auth.Middleware(
        jwtSecret,
        http.HandlerFunc(dashboardHandler.Summary),
    )
    http.Handle("GET /dashboard", protectedDashboard)

    http.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        fmt.Fprintln(w, "OK")
    })

    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintln(w, "Income Tracker API is running!")
    })

    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }

    addr := "0.0.0.0:" + port
    fmt.Println("Server running on " + addr)

    log.Fatal(http.ListenAndServe(addr, nil))
}