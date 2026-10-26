NPM ?= npm
NEXTS := npx next

.DEFAULT_GOAL := help

.PHONY: help install dev build start lint typegen typecheck check ci api-summary info clean distclean

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies with npm ci
	$(NPM) ci

dev: ## Start development server (next dev)
	@printf "Enter NEXT_PUBLIC_API_URL [http://127.0.0.1:8080]: "; \
	read input_url; \
	url=$${input_url:-http://127.0.0.1:8080}; \
	if [ ! -f .env.local ]; then \
		if [ -f .env.example ]; then \
			cp .env.example .env.local; \
		else \
			touch .env.local; \
		fi; \
	fi; \
	if grep -q "^NEXT_PUBLIC_API_URL=" .env.local; then \
		awk -v val="$$url" '/^NEXT_PUBLIC_API_URL=/ {print "NEXT_PUBLIC_API_URL=" val; next} {print}' .env.local > .env.local.tmp && mv .env.local.tmp .env.local; \
	else \
		echo "NEXT_PUBLIC_API_URL=$$url" >> .env.local; \
	fi; \
	echo "✓ NEXT_PUBLIC_API_URL set to: $$url in .env.local"
	$(NPM) run dev

build: ## Production build (next build, type-checked)
	$(NPM) run build

start: ## Start production server (next start)
	$(NPM) run start

lint: ## Run ESLint
	$(NPM) run lint

typegen: ## Generate Next.js route types
	$(NEXTS) typegen

typecheck: ## Run TypeScript type check
	npx tsc --noEmit

check: lint typecheck ## Run lint and typecheck

ci: check build ## Run lint, typecheck and production build

api-summary: ## Regenerate docs/api-summary.md from docs/swagger.json
	node scripts/generate_api_summary.js

info: ## Show Next.js environment info
	$(NEXTS) info

clean: ## Remove build artifacts
	rm -rf .next tsconfig.tsbuildinfo

distclean: clean ## Remove build artifacts and node_modules
	rm -rf node_modules
