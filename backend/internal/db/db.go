package db

import (
	"database/sql"
	"fmt"
	"log/slog"
	"os"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/lib/pq"
)

func Connect() (*sql.DB, error) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		host := os.Getenv("DB_HOST")
		port := os.Getenv("DB_PORT")
		user := os.Getenv("DB_USER")
		password := os.Getenv("DB_PASSWORD")
		dbname := os.Getenv("DB_NAME")
		if port == "" {
			port = "5432"
		}
		dsn = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
			host, port, user, password, dbname)
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	slog.Info("database connected")
	return db, nil
}

func RunMigrations(db *sql.DB) error {
	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("migration driver: %w", err)
	}

	m, err := migrate.NewWithDatabaseInstance("file:///migrations", "postgres", driver)
	if err != nil {
		return fmt.Errorf("migration instance: %w", err)
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migration up: %w", err)
	}

	slog.Info("migrations applied")
	return nil
}

func RunSeed(db *sql.DB) error {
	var count int
	err := db.QueryRow(`SELECT COUNT(*) FROM users WHERE email = 'test@taskflow.io'`).Scan(&count)
	if err != nil || count > 0 {
		return err
	}

	seed, err := os.ReadFile("/migrations/seed.sql")
	if err != nil {
		return fmt.Errorf("read seed: %w", err)
	}

	_, err = db.Exec(string(seed))
	if err != nil {
		return fmt.Errorf("exec seed: %w", err)
	}

	slog.Info("seed data inserted")
	return nil
}
