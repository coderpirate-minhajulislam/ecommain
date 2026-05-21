# ─── Project Makefile ──────────────────────────────────────

.PHONY: dev build install fresh migrate seed test lint format types \
        cache-clear optimize deploy-build setup pint serve

# ─── Development ──────────────────────────────────────────

dev: ## Start Vite dev server
	npm run dev

serve: ## Start PHP dev server (Artisan)
	php artisan serve

# ─── Install ──────────────────────────────────────────────

install: ## Install all dependencies
	composer install
	npm install

setup: ## First-time project setup
	composer install
	cp -n .env.example .env || true
	php artisan key:generate
	php artisan migrate --force
	npm install
	npm run build

# ─── Build ────────────────────────────────────────────────

build: ## Build frontend assets
	npm run build

build-ssr: ## Build frontend with SSR
	npm run build:ssr

# ─── Database ─────────────────────────────────────────────

migrate: ## Run migrations
	php artisan migrate

migrate-fresh: ## Fresh migrate + seed
	php artisan migrate:fresh --seed

seed: ## Run database seeders
	php artisan db:seed

# ─── Cache ────────────────────────────────────────────────

cache-clear: ## Clear all caches
	php artisan cache:clear
	php artisan config:clear
	php artisan route:clear
	php artisan view:clear
	php artisan event:clear

optimize: ## Optimize for production
	php artisan optimize
	php artisan view:cache
	php artisan event:cache

# ─── Testing & Quality ───────────────────────────────────

test: ## Run tests
	php artisan test

lint: ## Fix lint issues
	npm run lint

lint-check: ## Check lint (no fix)
	npm run lint:check

format: ## Format code
	npm run format

format-check: ## Check formatting
	npm run format:check

types: ## TypeScript type check
	npm run types:check

pint: ## Run Laravel Pint (PHP formatting)
	./vendor/bin/pint

# ─── Deploy Build ────────────────────────────────────────

deploy-build: ## Full production build
	@echo "══════ Production Build ══════"
	npm install
	npm run build
	composer install --optimize-autoloader --no-dev
	php artisan cache:clear
	php artisan config:clear
	php artisan route:clear
	php artisan view:clear
	php artisan event:clear
	php artisan optimize
	php artisan view:cache
	php artisan event:cache
	php artisan config:clear
	php artisan route:clear
	@echo "══════ Build Complete ══════"

# ─── Help ─────────────────────────────────────────────────

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
