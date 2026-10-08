# Мини-CRM. Список команд: just --list

default:
    @just --list

# Сервер на порту 3000. Другой порт ломает вход.
dev:
    npm run dev -- --port 3000

test:
    npm test

lint:
    npm run lint

typecheck:
    npx tsc --noEmit --pretty false

check: typecheck test lint

# Собирает базу заново и стирает локальные заявки.
seed:
    npm run seed
