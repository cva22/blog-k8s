.PHONY: install dev build start stop clean migrate

# Install all dependencies
install:
	pnpm install

# Start development servers
dev:
	docker-compose -f docker-compose.yaml up -d
	pnpm --filter @blog-app/auth run prisma:generate
	pnpm --filter @blog-app/posts run prisma:generate
	pnpm --filter @blog-app/comments run prisma:generate
	pnpm --filter @blog-app/moderation run prisma:generate
	pnpm --filter @blog-app/query run prisma:generate
	pnpm dev

# Run migrations
migrate:
	pnpm --filter @blog-app/auth run prisma:migrate
	pnpm --filter @blog-app/posts run prisma:migrate
	pnpm --filter @blog-app/comments run prisma:migrate
	pnpm --filter @blog-app/moderation run prisma:migrate

# Generate Prisma clients
generate:
	pnpm --filter @blog-app/auth run prisma:generate
	pnpm --filter @blog-app/posts run prisma:generate
	pnpm --filter @blog-app/comments run prisma:generate
	pnpm --filter @blog-app/moderation run prisma:generate

# Build all services
build:
	pnpm build

start-docker:
	docker compose up -d

stop-docker:
	docker-compose -f docker-compose.yaml down

# Clean up
clean:
	docker-compose -f docker-compose.yaml down -v
	rm -rf apps/*/node_modules apps/*/*/node_modules
	rm -rf node_modules
	rm -rf apps/*/dist apps/*/*/dist
	rm -rf apps/*/.turbo apps/*/*/.turbo

# Reset everything
reset: clean install migrate dev


