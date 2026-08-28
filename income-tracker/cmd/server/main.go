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

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		frontendURL := os.Getenv("FRONTEND_URL")
		if frontendURL == "" {
			frontendURL = "*"
		}

		w.Header().Set("Access-Control-Allow-Origin", frontendURL)
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Vary", "Origin")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

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
	defer conn.Close()

	if err := conn.Ping(context.Background()); err != nil {
		log.Fatal(err)
	}

	userHandler := users.Handler{Conn: conn}
	financeHandler := finance.Handler{Conn: conn}
	categoryHandler := categories.Handler{Conn: conn}
	peopleHandler := people.Handler{Conn: conn}
	incomeHandler := income.Handler{Conn: conn}
	expenseHandler := expenses.Handler{Conn: conn}
	debtHandler := debts.Handler{Conn: conn}
	debtRepaymentHandler := debt_repayments.Handler{Conn: conn}
	creditHandler := credits.Handler{Conn: conn}
	creditRepaymentHandler := credit_repayments.Handler{Conn: conn}
	dashboardHandler := dashboard.Handler{Conn: conn}

	http.HandleFunc("POST /users", userHandler.Create)
	http.HandleFunc("POST /login", userHandler.Login)

	http.Handle("POST /finance-spaces",
		auth.Middleware(jwtSecret, http.HandlerFunc(financeHandler.Create)))
	http.Handle("GET /finance-spaces",
		auth.Middleware(jwtSecret, http.HandlerFunc(financeHandler.List)))

	http.Handle("POST /categories",
		auth.Middleware(jwtSecret, http.HandlerFunc(categoryHandler.Create)))
	http.Handle("GET /categories",
		auth.Middleware(jwtSecret, http.HandlerFunc(categoryHandler.List)))

	http.Handle("POST /people",
		auth.Middleware(jwtSecret, http.HandlerFunc(peopleHandler.Create)))
	http.Handle("GET /people",
		auth.Middleware(jwtSecret, http.HandlerFunc(peopleHandler.List)))

	http.Handle("POST /income",
		auth.Middleware(jwtSecret, http.HandlerFunc(incomeHandler.Create)))
	http.Handle("GET /income",
		auth.Middleware(jwtSecret, http.HandlerFunc(incomeHandler.List)))

	http.Handle("POST /expenses",
		auth.Middleware(jwtSecret, http.HandlerFunc(expenseHandler.Create)))
	http.Handle("GET /expenses",
		auth.Middleware(jwtSecret, http.HandlerFunc(expenseHandler.List)))

	http.Handle("POST /debts",
		auth.Middleware(jwtSecret, http.HandlerFunc(debtHandler.Create)))
	http.Handle("GET /debts",
		auth.Middleware(jwtSecret, http.HandlerFunc(debtHandler.List)))

	http.Handle("POST /debt-repayments",
		auth.Middleware(jwtSecret, http.HandlerFunc(debtRepaymentHandler.Create)))
	http.Handle("GET /debt-repayments",
		auth.Middleware(jwtSecret, http.HandlerFunc(debtRepaymentHandler.List)))

	http.Handle("POST /credits",
		auth.Middleware(jwtSecret, http.HandlerFunc(creditHandler.Create)))
	http.Handle("GET /credits",
		auth.Middleware(jwtSecret, http.HandlerFunc(creditHandler.List)))

	http.Handle("POST /credit-repayments",
		auth.Middleware(jwtSecret, http.HandlerFunc(creditRepaymentHandler.Create)))
	http.Handle("GET /credit-repayments",
		auth.Middleware(jwtSecret, http.HandlerFunc(creditRepaymentHandler.List)))

	http.Handle("GET /dashboard",
		auth.Middleware(jwtSecret, http.HandlerFunc(dashboardHandler.Summary)))

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
	log.Println("Server running on " + addr)

	log.Fatal(http.ListenAndServe(addr, withCORS(http.DefaultServeMux)))
}
