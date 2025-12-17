# Mini-CRM

Мини-CRM для сбора и обработки заявок с сайта через универсальный виджет.

![Laravel](https://img.shields.io/badge/Laravel-12-red)
![PHP](https://img.shields.io/badge/PHP-8.4-blue)

## Быстрый старт

### Требования
- PHP 8.3.0
- Composer
- SQLite / MySQL

### Установка

```bash
# Клонировать репозиторий
git clone <repository-url>
cd mini-crm

# Установить зависимости
composer install

# Скопировать конфигурацию
cp .env.example .env

# Сгенерировать ключ
php artisan key:generate

# Создать базу данных и заполнить тестовыми данными
touch database/database.sqlite
php artisan migrate:fresh --seed

# Запустить сервер
php artisan serve
```

### Docker (опционально)

```bash
docker-compose up -d
```

## Тестовые данные

После выполнения `php artisan db:seed` будут созданы:

| Email | Пароль | Роль |
|-------|--------|------|
| admin@example.com | password | admin |
| manager@example.com | password | manager |

Также создаются 10 клиентов с 1-3 заявками каждый.

## Маршруты

### Публичные

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/widget` | Виджет формы обратной связи |
| POST | `/api/tickets` | API создания заявки |

### Защищенные (требуется авторизация)

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/login` | Страница входа |
| GET | `/admin/tickets` | Список заявок |
| GET | `/admin/tickets/{id}` | Детали заявки |
| PATCH | `/admin/tickets/{id}/status` | Изменение статуса |
| GET | `/api/tickets/statistics` | Статистика заявок |

## API

### Создание заявки

```bash
curl -X POST http://localhost:8000/api/tickets \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Иван Иванов",
    "phone": "+79991234567",
    "email": "ivan@example.com",
    "subject": "Тема обращения",
    "text": "Текст сообщения"
  }'
```

**Ответ:**
```json
{
  "success": true,
  "message": "Заявка успешно создана",
  "data": {
    "id": 1,
    "subject": "Тема обращения",
    "status": "new",
    "status_label": "Новый",
    "created_at": "2025-12-08T13:45:00+00:00"
  }
}
```

### Получение статистики

```bash
curl http://localhost:8000/api/tickets/statistics \
  -H "Accept: application/json" \
  -b "laravel_session=<session_cookie>"
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "day": 5,
    "week": 23,
    "month": 87,
    "total": 156
  }
}
```

## Встраивание виджета

Вставьте на ваш сайт:

```html
<iframe 
  src="https://your-domain.com/widget" 
  width="100%" 
  height="700" 
  frameborder="0">
</iframe>
```

## Тестирование

```bash
php artisan test
```

## Структура проекта

```
app/
├── Contracts/           # Интерфейсы репозиториев
├── Enums/               # Enum классы (TicketStatus)
├── Http/
│   ├── Controllers/
│   │   ├── Admin/       # Контроллеры админки
│   │   ├── Api/         # API контроллеры
│   │   └── Auth/        # Авторизация
│   ├── Requests/        # Form Requests с валидацией
│   └── Resources/       # API Resources
├── Models/              # Eloquent модели
├── Repositories/        # Реализации репозиториев
└── Services/            # Бизнес-логика
```

## Технологии

- **Laravel 12** - PHP фреймворк
- **spatie/laravel-permission** - Роли и права
- **spatie/laravel-medialibrary** - Работа с файлами
- **SQLite** - База данных

## Особенности

- Валидация телефона в формате E.164
- Ограничение: 1 заявка в сутки с одного телефона/email
- Загрузка файлов до 10 МБ
- Фильтрация заявок по дате, статусу, email, телефону
- Автоматическая установка даты ответа при обработке заявки

## Лицензия

MIT
