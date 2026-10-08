.PHONY: up down build restart logs ps seed clean test

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose up --build -d

restart:
	docker compose restart

logs:
	docker compose logs -f

ps:
	docker compose ps

seed:
	docker compose exec catalog-service node src/seeds/seed.js

clean:
	docker compose down -v --remove-orphans
