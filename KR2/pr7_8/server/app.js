const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      console.log('Body:', req.body);
    }
  });
  next();
});

const ACCESS_SECRET = 'access_secret';
const ACCESS_EXPIRES_IN = '15m';

// Хранилища
const users = [];    // { id, email, first_name, last_name, hashedPassword }
const products = [   // { id, title, category, description, price }
  { id: nanoid(6), title: 'iPhone 15 Pro', category: 'Смартфоны', description: 'Apple iPhone 15 Pro 256GB, титановый корпус, камера 48 Мп', price: 89990 },
  { id: nanoid(6), title: 'Samsung Galaxy S24', category: 'Смартфоны', description: 'Samsung Galaxy S24 128GB, AMOLED дисплей, Snapdragon 8 Gen 3', price: 74990 },
  { id: nanoid(6), title: 'MacBook Air M3', category: 'Ноутбуки', description: 'Apple MacBook Air 13" M3, 8GB RAM, 256GB SSD', price: 119990 },
  { id: nanoid(6), title: 'Sony WH-1000XM5', category: 'Наушники', description: 'Беспроводные наушники с ANC, до 30 часов работы', price: 29990 },
  { id: nanoid(6), title: 'iPad Air M2', category: 'Планшеты', description: 'Apple iPad Air 11" M2, 128GB, Wi-Fi', price: 69990 },
];

// ===== Вспомогательные функции =====

function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// ===== Auth middleware =====

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  try {
    req.user = jwt.verify(token, ACCESS_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ===== Auth routes =====

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { email, first_name, last_name, password } = req.body;
  if (!email || !first_name || !last_name || !password) {
    return res.status(400).json({ error: 'email, first_name, last_name, password are required' });
  }
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ error: 'User with this email already exists' });
  }
  const user = {
    id: nanoid(6),
    email,
    first_name,
    last_name,
    hashedPassword: await hashPassword(password),
  };
  users.push(user);
  res.status(201).json({ id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name });
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const user = users.find(u => u.email === email);
  if (!user || !(await verifyPassword(password, user.hashedPassword))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  res.json({ accessToken: generateAccessToken(user) });
});

// GET /api/auth/me (protected)
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name });
});

// ===== Products routes =====

// POST /api/products (public)
app.post('/api/products', (req, res) => {
  const { title, category, description, price } = req.body;
  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({ error: 'title, category, description, price are required' });
  }
  const product = { id: nanoid(6), title, category, description, price: Number(price) };
  products.push(product);
  res.status(201).json(product);
});

// GET /api/products (public)
app.get('/api/products', (req, res) => {
  res.json(products);
});

// GET /api/products/:id (protected)
app.get('/api/products/:id', authMiddleware, (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// PUT /api/products/:id (protected)
app.put('/api/products/:id', authMiddleware, (req, res) => {
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  const { title, category, description, price } = req.body;
  if (title !== undefined) products[idx].title = title;
  if (category !== undefined) products[idx].category = category;
  if (description !== undefined) products[idx].description = description;
  if (price !== undefined) products[idx].price = Number(price);
  res.json(products[idx]);
});

// DELETE /api/products/:id (protected)
app.delete('/api/products/:id', authMiddleware, (req, res) => {
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  products.splice(idx, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
