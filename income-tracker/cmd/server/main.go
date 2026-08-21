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
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
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

	err = conn.Ping(context.Background())
	if err != nil {
		log.Fatal(err)
	}

	userHandler := users.Handler{
		Conn: conn,
	}

	financeHandler := finance.Handler{
		Conn: conn,
	}

	incomeHandler := income.Handler{
		Conn: conn,
	}

	expenseHandler := expenses.Handler{
		Conn: conn,
	}

	categoryHandler := categories.Handler{
		Conn: conn,
	}

	peopleHandler := people.Handler{
		Conn: conn,
	}

	debtHandler := debts.Handler{
		Conn: conn,
	}

	debtRepaymentHandler := debt_repayments.Handler{
		Conn: conn,
	}

	creditHandler := credits.Handler{
		Conn: conn,
	}

	creditRepaymentHandler := credit_repayments.Handler{
		Conn: conn,
	}

	dashboardHandler := dashboard.Handler{
		Conn: conn,
	}

	// --------------------
	// Users
	// --------------------

	http.HandleFunc("POST /users", userHandler.Create)
	http.HandleFunc("POST /login", userHandler.Login)

	// --------------------
	// Finance spaces
	// --------------------

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

	// --------------------
	// Categories
	// --------------------

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

	// --------------------
	// People
	// --------------------

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

	// --------------------
	// Income
	// --------------------

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

	// --------------------
	// Expenses
	// --------------------

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

	// --------------------
	// Debts
	// --------------------

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

	// --------------------
	// Debt repayments
	// --------------------

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

	// --------------------
	// Credits
	// --------------------

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

	// --------------------
	// Credit repayments
	// --------------------

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

	// --------------------
	// Dashboard
	// --------------------

	protectedDashboard := auth.Middleware(
		jwtSecret,
		http.HandlerFunc(dashboardHandler.Summary),
	)

	http.Handle("GET /dashboard", protectedDashboard)

	// --------------------
	// Default route
	// --------------------

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "Income Tracker API is running!")
	})

	fmt.Println("Server running on http://localhost:8080")

	log.Fatal(http.ListenAndServe(":8080", nil))
}
