package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"income-tracker/internal/auth"
	"income-tracker/internal/database"
	"income-tracker/internal/finance"
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

	http.HandleFunc("POST /users", userHandler.Create)
	http.HandleFunc("POST /login", userHandler.Login)

	protectedFinance := auth.Middleware(
		jwtSecret,
		http.HandlerFunc(financeHandler.Create),
	)

	http.Handle("/finance-spaces", protectedFinance)

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "Income Tracker API is running!")
	})

	fmt.Println("Server running on http://localhost:8080")

	log.Fatal(http.ListenAndServe(":8080", nil))
}
