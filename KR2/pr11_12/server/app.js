const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(cors({ origin: 'http://localhost:3001' }));
app.use(express.json());

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'TechStore API', version: '1.0.0', description: 'RBAC: роли user / seller / admin' },
    servers: [{ url: 'http://localhost:3000' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            role: { type: 'string', enum: ['user', 'seller', 'admin'] },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            category: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
          },
        },
        Tokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  },
  apis: ['./app.js'],
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const ACCESS_SECRET = 'access_secret';
const REFRESH_SECRET = 'refresh_secret';
const SALT_ROUNDS = 10;

// In-memory stores
const users = [];
const refreshTokens = new Set();

// Pre-seeded demo accounts (password: password123)
const DEMO_PASSWORD = 'password123';
bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS).then((hash) => {
  users.push(
    { id: nanoid(), email: 'admin@test.com', first_name: 'Админ', last_name: 'Тестов', hashedPassword: hash, role: 'admin' },
    { id: nanoid(), email: 'user@test.com',  first_name: 'Иван',  last_name: 'Иванов',  hashedPassword: hash, role: 'user'  },
    { id: nanoid(), email: 'seller@test.com', first_name: 'Продавец', last_name: 'Петров', hashedPassword: hash, role: 'seller' }
  );
});

const products = [
  { id: nanoid(), title: 'iPhone 16', category: 'Смартфоны', description: 'Флагманский смартфон Apple', price: 89999 },
  { id: nanoid(), title: 'MacBook Air M3', category: 'Ноутбуки', description: 'Лёгкий ноутбук Apple', price: 129999 },
  { id: nanoid(), title: 'AirPods Pro', category: 'Аудио', description: 'Беспроводные наушники с ANC', price: 24999 },
  { id: nanoid(), title: 'iPad Pro 13"', category: 'Планшеты', description: 'Профессиональный планшет', price: 119999 },
  { id: nanoid(), title: 'Apple Watch Series 10', category: 'Часы', description: 'Умные часы с мониторингом здоровья', price: 39999 },
];

// Token helpers
const generateAccessToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, ACCESS_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, REFRESH_SECRET, { expiresIn: '7d' });

// Middleware
const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Токен не предоставлен' });
  try {
    req.user = jwt.verify(header.slice(7), ACCESS_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Недействительный токен' });
  }
};

const roleMiddleware = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }
  next();
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, first_name, last_name, password]
 *             properties:
 *               email: { type: string, example: ivan@example.com }
 *               first_name: { type: string, example: Иван }
 *               last_name: { type: string, example: Иванов }
 *               password: { type: string, example: secret123 }
 *     responses:
 *       201:
 *         description: Успешная регистрация
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Tokens' }
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.post('/api/auth/register', async (req, res) => {
  const { email, first_name, last_name, password } = req.body;
  if (!email || !first_name || !last_name || !password)
    return res.status(400).json({ error: 'Все поля обязательны' });
  if (users.find((u) => u.email === email))
    return res.status(400).json({ error: 'Email уже занят' });

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = { id: nanoid(), email, first_name, last_name, hashedPassword, role: 'user' };
  users.push(user);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  refreshTokens.add(refreshToken);

  res.status(201).json({ accessToken, refreshToken });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: admin@test.com }
 *               password: { type: string, example: password123 }
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Tokens' }
 *       401:
 *         description: Неверные данные
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });

  const valid = await bcrypt.compare(password, user.hashedPassword);
  if (!valid) return res.status(401).json({ error: 'Неверный email или пароль' });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  refreshTokens.add(refreshToken);

  res.json({ accessToken, refreshToken });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновление токенов
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Новая пара токенов
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Tokens' }
 *       401:
 *         description: Недействительный refresh-токен
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken || !refreshTokens.has(refreshToken))
    return res.status(401).json({ error: 'Недействительный refresh токен' });
  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = users.find((u) => u.id === payload.id);
    if (!user) return res.status(401).json({ error: 'Пользователь не найден' });

    refreshTokens.delete(refreshToken);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    refreshTokens.add(newRefreshToken);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    res.status(401).json({ error: 'Недействительный refresh токен' });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Данные текущего пользователя
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Профиль пользователя
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  const { hashedPassword, ...safe } = user;
  res.json(safe);
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Список всех пользователей (только admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Массив пользователей
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/User' }
 *       403:
 *         description: Недостаточно прав
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.get('/api/users', authMiddleware, roleMiddleware('admin'), (req, res) => {
  res.json(users.map(({ hashedPassword, ...u }) => u));
});

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     summary: Сменить роль пользователя (только admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [user, seller, admin] }
 *     responses:
 *       200:
 *         description: Обновлённый пользователь
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Недопустимая роль
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: Недостаточно прав
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.patch('/api/users/:id/role', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  const { role } = req.body;
  if (!['user', 'seller', 'admin'].includes(role))
    return res.status(400).json({ error: 'Недопустимая роль' });
  user.role = role;
  const { hashedPassword, ...safe } = user;
  res.json(safe);
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Удалить пользователя (только admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Пользователь удалён
 *       400:
 *         description: Нельзя удалить себя
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: Недостаточно прав
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.delete('/api/users/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Пользователь не найден' });
  if (users[idx].id === req.user.id) return res.status(400).json({ error: 'Нельзя удалить себя' });
  users.splice(idx, 1);
  res.json({ message: 'Пользователь удалён' });
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Массив товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Product' }
 *   post:
 *     summary: Создать товар (seller / admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, category, price]
 *             properties:
 *               title: { type: string, example: iPhone 16 }
 *               category: { type: string, example: Смартфоны }
 *               description: { type: string }
 *               price: { type: number, example: 89999 }
 *     responses:
 *       201:
 *         description: Созданный товар
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       403:
 *         description: Недостаточно прав
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.get('/api/products', (req, res) => res.json(products));

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Товар
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       404:
 *         description: Не найден
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   put:
 *     summary: Обновить товар (seller / admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               category: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *     responses:
 *       200:
 *         description: Обновлённый товар
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       403:
 *         description: Недостаточно прав
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   delete:
 *     summary: Удалить товар (только admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Товар удалён
 *       403:
 *         description: Недостаточно прав
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.get('/api/products/:id', (req, res) => {
  const p = products.find((p) => p.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Товар не найден' });
  res.json(p);
});

// Products — seller/admin create/edit, admin delete
app.post('/api/products', authMiddleware, roleMiddleware('seller', 'admin'), (req, res) => {
  const { title, category, description, price } = req.body;
  if (!title || !category || price == null)
    return res.status(400).json({ error: 'Укажите название, категорию и цену' });
  const product = { id: nanoid(), title, category, description: description || '', price: Number(price) };
  products.push(product);
  res.status(201).json(product);
});

app.put('/api/products/:id', authMiddleware, roleMiddleware('seller', 'admin'), (req, res) => {
  const idx = products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Товар не найден' });
  const { title, category, description, price } = req.body;
  products[idx] = { ...products[idx], title, category, description, price: Number(price) };
  res.json(products[idx]);
});

app.delete('/api/products/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const idx = products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Товар не найден' });
  products.splice(idx, 1);
  res.json({ message: 'Товар удалён' });
});

app.listen(3000, () => console.log('pr11-12 server running on http://localhost:3000'));
