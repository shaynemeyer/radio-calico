.PHONY: help install dev dev-stop prod prod-stop test test-all test-watch test-backend test-frontend test-integration test-coverage security-audit security-fix security-test clean clean-all logs logs-prod db-reset db-backup db-restore status build rebuild

# Default target
help: ## Show this help message
	@echo "RadioCalico Makefile Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Installation
install: ## Install dependencies
	npm install

# Development
dev: ## Start development server (SQLite, local)
	npm run dev

dev-docker: ## Start development environment with Docker
	docker compose --profile development up

dev-stop: ## Stop development Docker containers
	docker compose --profile development down

# Production
prod: ## Start production environment (PostgreSQL + nginx)
	@if [ -z "$$DB_PASSWORD" ]; then \
		echo "❌ ERROR: DB_PASSWORD environment variable is required"; \
		echo "Set it with: export DB_PASSWORD=\"your_secure_password\""; \
		echo "Or generate one: export DB_PASSWORD=\"$$(openssl rand -base64 32)\""; \
		exit 1; \
	fi
	docker compose -f docker-compose.prod.yml up -d
	@echo ""
	@echo "🚀 Production environment started!"
	@echo "   App: http://localhost"
	@echo "   API: http://localhost/api"
	@echo ""
	@echo "Commands:"
	@echo "   make logs-prod  - View logs"
	@echo "   make status     - Check status"
	@echo "   make prod-stop  - Stop services"

prod-stop: ## Stop production environment
	docker compose -f docker-compose.prod.yml down

prod-build: ## Build production images
	docker compose -f docker-compose.prod.yml build

prod-rebuild: ## Rebuild and restart production environment
	docker compose -f docker-compose.prod.yml down
	docker compose -f docker-compose.prod.yml build --no-cache
	docker compose -f docker-compose.prod.yml up -d

# Testing
test: ## Run unit tests
	npm test

test-all: ## Run all tests (unit + integration)
	npm run test:all

test-watch: ## Run tests in watch mode
	npm run test:watch

test-backend: ## Run backend tests only
	npm run test:backend

test-frontend: ## Run frontend tests only
	npm run test:frontend

test-integration: ## Run integration tests with Playwright
	npm run test:integration

test-coverage: ## Run tests with coverage report
	npm run test:coverage

# Security
security-audit: ## Run npm security audit
	npm run security:audit

security-fix: ## Fix security vulnerabilities automatically
	npm run security:audit-fix

security-test: ## Run security tests (fails on moderate+ vulnerabilities)
	npm run security:test

# Database Management
db-reset: ## Reset production database (WARNING: destroys all data)
	@echo "⚠️  WARNING: This will destroy all production data!"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	docker compose -f docker-compose.prod.yml down
	docker volume rm radio-calico_postgres_data || true
	docker compose -f docker-compose.prod.yml up -d

db-backup: ## Backup production database
	@mkdir -p backups
	docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres radiocalico > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Database backed up to backups/backup_$(shell date +%Y%m%d_%H%M%S).sql"

db-restore: ## Restore database from backup (usage: make db-restore BACKUP=backup_file.sql)
	@if [ -z "$(BACKUP)" ]; then echo "Usage: make db-restore BACKUP=backup_file.sql"; exit 1; fi
	@if [ ! -f "$(BACKUP)" ]; then echo "Backup file $(BACKUP) not found"; exit 1; fi
	docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d radiocalico < $(BACKUP)
	@echo "Database restored from $(BACKUP)"

# Monitoring & Logs
logs: ## View development logs
	docker compose --profile development logs -f

logs-prod: ## View production logs
	docker compose -f docker-compose.prod.yml logs -f

logs-app: ## View application logs only
	docker compose -f docker-compose.prod.yml logs -f app

logs-db: ## View database logs only
	docker compose -f docker-compose.prod.yml logs -f postgres

logs-nginx: ## View nginx logs only
	docker compose -f docker-compose.prod.yml logs -f nginx

status: ## Show status of all containers
	@echo "Production containers:"
	@docker compose -f docker-compose.prod.yml ps 2>/dev/null || echo "Production not running"
	@echo ""
	@echo "Development containers:"
	@docker compose --profile development ps 2>/dev/null || echo "Development not running"

# Build & Deploy
build: ## Build all Docker images
	docker compose -f docker-compose.prod.yml build

rebuild: ## Rebuild images without cache
	docker compose -f docker-compose.prod.yml build --no-cache

deploy: ## Deploy to production (alias for prod)
	$(MAKE) prod

# Cleanup
clean: ## Stop all containers and remove images
	docker compose -f docker-compose.prod.yml down --rmi local
	docker compose --profile development down --rmi local

clean-all: ## Remove everything including volumes and orphaned containers
	docker compose -f docker-compose.prod.yml down --rmi all --volumes --remove-orphans
	docker compose --profile development down --rmi all --volumes --remove-orphans
	docker system prune -f

# Quick commands
quick-test: ## Quick test run (backend only)
	npm run test:backend

quick-deploy: ## Quick production deployment
	$(MAKE) prod-rebuild

# Health checks
health: ## Check health of production services
	@echo "Checking production services health..."
	@curl -s http://localhost/health > /dev/null && echo "✅ Nginx: healthy" || echo "❌ Nginx: unhealthy"
	@curl -s http://localhost/health | jq -r '.status + " - DB: " + .database' 2>/dev/null || echo "❌ API: unhealthy"
	@docker compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres > /dev/null 2>&1 && echo "✅ Database: healthy" || echo "❌ Database: unhealthy"