# KR1 — Практические работы по Node.js и React

Автор: **Limonov Nikita**

Репозиторий содержит 6 практических работ, разбитых на 3 папки. Каждая работа посвящена разработке веб-приложений на Node.js (Express) и React.

---

## Структура проекта

```
KR1/
├── pr1_2/          # Практические работы 1–2
├── pr3_4/          # Практические работы 3–4
│   ├── 3_prac/
│   └── 4_prac/
│       ├── client/ # React-приложение
│       └── server/ # Express-сервер
└── pr5_6/          # Практические работы 5–6
    └── 5_prac/
        ├── client/ # React-приложение
        └── server/ # Express-сервер + Swagger
```

---

## Требования

- [Node.js](https://nodejs.org/) v18+
- npm v9+

---

## Практическая работа 1–2 (`pr1_2`)

HTML-страница с карточкой магазина и стилями на SCSS. Express-сервер с REST API для управления списком магазинов.

### Запуск сервера

```bash
cd pr1_2
npm install
node app.js
```

Сервер запустится на `http://localhost:3000`

### API эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/` | Главная страница |
| GET | `/users` | Получить всех пользователей |
| GET | `/users/:id` | Получить по ID |
| POST | `/users` | Создать нового |
| PATCH | `/users/:id` | Обновить по ID |
| DELETE | `/users/:id` | Удалить по ID |

### Компиляция SCSS

Для компиляции стилей из `input.scss` в `output.css` используй:

```bash
npx sass input.scss output.css
```

---

## Практическая работа 3 (`pr3_4/3_prac`)

Express-сервер с REST API — аналог практики 1–2, но с более чистой структурой кода.

### Запуск

```bash
cd pr3_4
npm install
cd 3_prac
node app.js
```

Сервер запустится на `http://localhost:3000`

---

## Практическая работа 4 (`pr3_4/4_prac`)

Полноценное fullstack-приложение: React (клиент) + Express (сервер). Управление каталогом товаров интернет-магазина электроники.

### Запуск сервера

```bash
cd pr3_4/4_prac/server
npm install
node app.js
```

Сервер запустится на `http://localhost:3000`

### Запуск клиента

В отдельном терминале:

```bash
cd pr3_4/4_prac/client
npm install
npm start
```

Клиент откроется на `http://localhost:3001`

### API эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/products` | Получить все товары |
| GET | `/api/products/:id` | Получить товар по ID |
| POST | `/api/products` | Добавить товар |
| PATCH | `/api/products/:id` | Обновить товар |
| DELETE | `/api/products/:id` | Удалить товар |

---

## Практическая работа 5 (`pr5_6/5_prac`)

Расширенная версия практики 4: fullstack React + Express с добавлением **Swagger UI** для документации API и изображений товаров.

### Запуск сервера

```bash
cd pr5_6/5_prac/server
npm install
node app.js
```

Сервер запустится на `http://localhost:3000`  
Swagger UI доступен по адресу: `http://localhost:3000/api-docs`

### Запуск клиента

В отдельном терминале:

```bash
cd pr5_6/5_prac/client
npm install
npm start
```

Клиент откроется на `http://localhost:3001`

### API эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/products` | Получить все товары |
| GET | `/api/products/:id` | Получить товар по ID |
| POST | `/api/products` | Добавить товар |
| PATCH | `/api/products/:id` | Обновить товар |
| DELETE | `/api/products/:id` | Удалить товар |

---

## Загрузка на GitHub

Если репозиторий ещё не подключён к GitHub:

```bash
git remote add origin https://github.com/ВАШ_ЛОГИН/KR1.git
git push -u origin main
```

При последующих изменениях:

```bash
git add .
git commit -m "описание изменений"
git push
```
