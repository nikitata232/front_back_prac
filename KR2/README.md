# KR2 — Практики 7–11: Аутентификация и RBAC

Три последовательно усложняющихся приложения: от хеширования паролей до полноценной ролевой модели с React-фронтендом.

---

## Структура проекта

```
KR2/
├── pr7_8/
│   └── server/          # Практики 7+8 — bcrypt + JWT access-токены
├── pr9_10/
│   ├── server/          # Практика 9  — добавлены refresh-токены
│   └── client/          # Практика 10 — React SPA (axios-интерцептор)
└── pr11_12/
    ├── server/          # Практика 11 — RBAC: роли user / seller / admin
    └── client/          # Практика 12 — React PhoneStore: ролевой UI, каталог телефонов, страница Users
```

---

## Быстрый старт

> Для каждого сервера нужен отдельный терминал. Клиент запускается в третьем терминале.

### pr7_8 (Практики 7–8)

```bash
cd pr7_8/server
npm install
npm start          # сервер на http://localhost:3000
```

### pr9_10 (Практики 9–10)

```bash
# Терминал 1 — сервер
cd pr9_10/server
npm install
npm start          # http://localhost:3000

# Терминал 2 — клиент
cd pr9_10/client
npm install
npm start          # http://localhost:3001
```

### pr11_12 (Практики 11–12) — рекомендуемый для демо

```bash
# Терминал 1 — сервер
cd pr11_12/server
npm install
npm start          # http://localhost:3000
                   # Swagger UI: http://localhost:3000/api/docs

# Терминал 2 — клиент
cd pr11_12/client
npm install
npm start          # http://localhost:3001
```

---

## pr7_8 — bcrypt + JWT (практики 7 и 8)

### Что реализовано

- Регистрация с хешированием пароля через **bcrypt** (10 раундов соли)
- Вход с выдачей **JWT access-токена** (срок жизни 15 минут)
- Защищённые маршруты через `authMiddleware` — проверяет заголовок `Authorization: Bearer <token>`
- CRUD товаров: список и создание — публичные; просмотр, редактирование, удаление — только с токеном

### Сущность «Пользователь»

| Поле | Тип | Описание |
|------|-----|----------|
| id | string | nanoid, уникальный идентификатор |
| email | string | логин (уникальный) |
| first_name | string | имя |
| last_name | string | фамилия |
| hashedPassword | string | bcrypt-хеш, никогда не возвращается клиенту |

### Сущность «Товар»

| Поле | Тип |
|------|-----|
| id | string |
| title | string |
| category | string |
| description | string |
| price | number |

### Маршруты API

| Метод | URL | Доступ | Описание |
|-------|-----|--------|----------|
| POST | /api/auth/register | Публичный | Создать аккаунт |
| POST | /api/auth/login | Публичный | Войти, получить access-токен |
| GET | /api/auth/me | Bearer token | Данные текущего пользователя |
| POST | /api/products | Публичный | Создать товар |
| GET | /api/products | Публичный | Список товаров |
| GET | /api/products/:id | Bearer token | Товар по ID |
| PUT | /api/products/:id | Bearer token | Обновить товар |
| DELETE | /api/products/:id | Bearer token | Удалить товар |

### Пример использования (curl)

```bash
# Регистрация
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","first_name":"Иван","last_name":"Иванов","password":"secret123"}'

# Вход
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'
# → {"accessToken": "eyJ..."}

# Защищённый маршрут
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer eyJ..."
```

---

## pr9_10 — Refresh-токены + React SPA (практики 9 и 10)

### Что добавлено к pr7_8

**Сервер:**
- Генерация пары токенов при входе: **access-токен** (15 мин) + **refresh-токен** (7 дней)
- Хранилище refresh-токенов в памяти (`Set`)
- Маршрут `POST /api/auth/refresh` — принимает refresh-токен, возвращает новую пару; старый токен удаляется (ротация)

**Клиент (React):**
- `AuthContext` — глобальное состояние авторизации (пользователь, методы login/logout/register)
- Axios-инстанс с двумя interceptors:
  - **Request interceptor** — автоматически подставляет `Authorization: Bearer <accessToken>` из `localStorage`
  - **Response interceptor** — при ошибке 401 автоматически обновляет access-токен через refresh и повторяет запрос
- Страницы: **Login**, **Register**, **Products** (список товаров с возможностью CRUD)
- Защищённая маршрутизация: неавторизованных редиректит на `/login`

### Дополнительный маршрут

| Метод | URL | Описание |
|-------|-----|----------|
| POST | /api/auth/refresh | Тело: `{"refreshToken":"..."}` → `{"accessToken":"...","refreshToken":"..."}` |

### Как работает автообновление токена

```
Запрос к API → 401 Unauthorized
       ↓
Достаём refreshToken из localStorage
       ↓
POST /api/auth/refresh → новая пара токенов
       ↓
Сохраняем в localStorage, повторяем исходный запрос
       ↓
(если refresh тоже истёк → разлогиниваем пользователя)
```

---

## pr11_12 — PhoneStore: RBAC + каталог телефонов (практики 11–12)

### Что добавлено к pr9_10

**Сервер:**
- Поле `role` в сущности пользователя (`'user' | 'seller' | 'admin'`)
- Роль кодируется в JWT-токен
- `roleMiddleware(...roles)` — проверяет роль после `authMiddleware`, возвращает 403 при нехватке прав
- Демо-аккаунты, создаются автоматически при старте сервера
- Swagger UI по адресу `http://localhost:3000/api/docs`
- Маршруты управления пользователями (только admin)
- Каталог из **25 смартфонов** брендов Apple, Samsung, Xiaomi, Google, OnePlus, Другие — с фотографиями

**Клиент:**
- Магазин называется **PhoneStore**, тематика — только смартфоны
- Цветовая тема: тёмный фон `#080d14`, акцент — циановый `rgba(6, 182, 212, ...)`
- Страница `/users` — доступна только admin, показывает список пользователей с кнопками смены роли и удаления
- UI адаптируется к роли: кнопка «+ Добавить товар» видна только seller/admin, кнопка «Удалить» — только admin
- Ролевой бейдж пользователя в шапке
- Карточка товара показывает фото; при ошибке загрузки — graceful-заглушка 📱

### Каталог товаров

25 смартфонов, разбитых по брендам (используются как категории):

| Бренд | Модели |
|-------|--------|
| Apple | iPhone 16 Pro Max, 16 Pro, 16, 15 Pro, 15, SE (3-е пок.) |
| Samsung | Galaxy S25 Ultra, S25+, S24, Z Fold 6, Z Flip 6, A55 5G |
| Xiaomi | 14 Ultra, 14T Pro, 13, Redmi Note 13 Pro+, POCO F6 Pro |
| Google | Pixel 9 Pro XL, Pixel 9, Pixel 8a |
| OnePlus | OnePlus 12, Nord 4 |
| Другие | Nothing Phone (2), Sony Xperia 1 VI, Motorola Edge 50 Ultra |

### Сущность «Товар»

| Поле | Тип | Описание |
|------|-----|----------|
| id | string | nanoid |
| title | string | Название модели |
| category | string | Бренд (Apple / Samsung / Xiaomi / …) |
| description | string | Краткие характеристики |
| price | number | Цена в рублях |
| image | string | URL фотографии (Wikimedia Commons) |

### Демо-аккаунты

| Email | Пароль | Роль |
|-------|--------|------|
| admin@test.com | password123 | admin |
| seller@test.com | password123 | seller |
| user@test.com | password123 | user |

> Все новые зарегистрированные пользователи получают роль `user`.

### Права доступа

| Маршрут | Метод | Доступ |
|---------|-------|--------|
| /api/auth/register | POST | Все |
| /api/auth/login | POST | Все |
| /api/auth/refresh | POST | Все |
| /api/auth/me | GET | Любой авторизованный |
| /api/users | GET | admin |
| /api/users/:id/role | PATCH | admin |
| /api/users/:id | DELETE | admin |
| /api/products | GET | Все |
| /api/products/:id | GET | Все |
| /api/products | POST | seller, admin |
| /api/products/:id | PUT | seller, admin |
| /api/products/:id | DELETE | admin |

### Фильтрация товаров по бренду

На странице Products товары фильтруются по бренду — кнопки формируются динамически из категорий загруженных товаров.

---

## Общие технологии

| Пакет | Назначение |
|-------|-----------|
| express | HTTP-сервер |
| bcrypt | Хеширование паролей (Blowfish, cost=10) |
| jsonwebtoken | Создание и проверка JWT |
| nanoid | Генерация коротких уникальных ID |
| cors | Разрешение запросов с фронтенда (localhost:3001) |
| swagger-jsdoc + swagger-ui-express | Документация API (только pr11_12) |
| React 18 | Клиентский SPA |
| react-router-dom v6 | Маршрутизация на фронтенде |
| axios | HTTP-клиент с interceptors |
| sass | CSS-препроцессор для стилей |

---

## Хранение данных

Все данные хранятся **в памяти** (массивы и `Set`). При перезапуске сервера данные сбрасываются, демо-аккаунты пересоздаются автоматически.
