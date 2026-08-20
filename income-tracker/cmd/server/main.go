package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"income-tracker/internal/auth"
	"income-tracker/internal/database"
	"income-tracker/internal/expenses"
	"income-tracker/internal/finance"
	"income-tracker/internal/income"
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

	// --------------------
	// User routes
	// --------------------

	http.HandleFunc("POST /users", userHandler.Create)
	http.HandleFunc("POST /login", userHandler.Login)

	// --------------------
	// Finance space routes
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
	// Income routes
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
	// Expense routes
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
	// Default route
	// --------------------

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "Income Tracker API is running!")
	})

	fmt.Println("Server running on http://localhost:8080")

	log.Fatal(http.ListenAndServe(":8080", nil))
}