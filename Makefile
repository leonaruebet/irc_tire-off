# TireOff - Tire Age Tracking System
# Makefile for common development commands

.PHONY: install dev build start clean clean-cache db-push db-generate db-studio lint format help reinstall

# Default target
help:
	@echo "TireOff Development Commands"
	@echo "=============================="
	@echo ""
	@echo "Setup:"
	@echo "  make install      Full setup (install + db generate + db push)"
	@echo "  make reinstall    Clean everything and reinstall from scratch"
	@echo ""
	@echo "Development:"
	@echo "  make dev          Start development server"
	@echo "  make build        Build for production"
	@echo "  make start        Start production server"
	@echo ""
	@echo "Database:"
	@echo "  make db-push      Push schema to MongoDB"
	@echo "  make db-generate  Generate Prisma client"
	@echo "  make db-studio    Open Prisma Studio"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint         Run linter"
	@echo "  make format       Format code with Prettier"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean        Remove node_modules and build artifacts"
	@echo "  make clean-cache  Remove turbo and Next.js caches only"

# Installation - full setup
install:
	@echo "📦 Installing dependencies..."
	pnpm install
	@echo "🔧 Generating Prisma client..."
	pnpm db:generate
	@echo "📤 Pushing schema to database..."
	pnpm db:push
	@echo ""
	@echo "✅ Setup complete! Run 'make dev' to start development server."

# Full reinstall - clean everything first
reinstall: clean install
	@echo "✅ Reinstall complete!"

# Development
dev: clean-cache
	@-lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	pnpm dev

# Build
build: clean-cache db-generate
	pnpm build

# Start production
start:
	pnpm start

# Database commands
db-push:
	pnpm db:push

db-generate:
	pnpm db:generate

db-studio:
	pnpm db:studio

# Linting
lint:
	pnpm lint

# Formatting
format:
	pnpm format

# Clean turbo and Next.js caches only (fast cleanup)
clean-cache:
	@echo "🧹 Cleaning caches..."
	-rm -rf .turbo
	-rm -rf apps/web/.next
	-rm -rf apps/web/.turbo
	-rm -rf packages/*/.turbo
	@echo "✅ Caches cleaned"

# Full clean - remove node_modules and build artifacts
clean:
	@echo "🧹 Cleaning everything..."
	-pnpm turbo clean 2>/dev/null || true
	rm -rf node_modules
	rm -rf apps/web/.next
	rm -rf apps/web/node_modules
	rm -rf packages/*/node_modules
	rm -rf packages/*/dist
	rm -rf .turbo
	@echo "✅ Clean complete"
