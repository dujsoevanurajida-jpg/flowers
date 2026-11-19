const express = require('express');
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'db', 'bloom.db');
fs.mkdirSync(path.join(__dirname, 'db'), { recursive: true });

let db;

async function initDB() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY, name TEXT, category TEXT,
      price INTEGER, description TEXT, image_url TEXT
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT, phone TEXT, address TEXT,
      delivery_date TEXT, delivery_time TEXT,
      contact_method TEXT, total INTEGER,
      status TEXT DEFAULT 'new',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER, product_id INTEGER,
      name TEXT, price INTEGER, qty INTEGER
    );
  `);

  const count = db.exec('SELECT COUNT(*) c FROM products')[0]?.values[0][0] || 0;
  if (count === 0) {
    const seed = db.prepare('INSERT INTO products VALUES (?,?,?,?,?,?)');
    [
      [1,'Букет «Розовое утро»','roses',2500,'Нежные розы с пионами и зеленью.','https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=600&q=80'],
      [2,'Классические розы','roses',3200,'15 бархатных красных роз.','https://content2.flowwow-images.com/data/flowers/1000x1000/09/1770813727_30509809.jpg'],
      [3,'Весенний микс','spring',1800,'Тюльпаны, нарциссы и веточки вербы.','https://avatars.mds.yandex.net/i?id=c47a5c069253c40baa36ff22fd870669536495b1-6220423-images-thumbs&n=13'],
      [4,'Пионовый рай','premium',4500,'Пышные пионы в авторской упаковке.','https://images.unsplash.com/photo-1596438459194-f275f413d6ff?w=600&q=80'],
      [5,'Солнечный день','spring',2100,'Яркие герберы и хризантемы.','https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=600&q=80'],
      [6,'Премиум «Шёлк»','premium',5900,'Экзотические цветы и орхидеи.','https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=600&q=80'],
      [7,'Букет невесты','premium',6400,'Нежные цветы','https://avatars.mds.yandex.net/i?id=973645516644b75cbffe2c08afd1c37f_l-5525759-images-thumbs&n=13']
    ].forEach(p => seed.run(p));
    seed.free();
  }
  saveDB();
}

function saveDB() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}
function get(sql, params = []) { return all(sql, params)[0]; }
function run(sql, params = []) {
  db.run(sql, params);
  saveDB();
  return { lastInsertRowid: db.exec('SELECT last_insert_rowid() id')[0].values[0][0] };
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/products', (req, res) => res.json(all('SELECT * FROM products')));

app.post('/api/orders', (req, res) => {
  const { name, phone, address, delivery_date, delivery_time, contact_method, items } = req.body;
  if (!name || !phone || !items?.length) return res.status(400).json({ error: 'Заполните имя и телефон' });

  let total = 0; const rows = [];
  for (const it of items) {
    const p = get('SELECT * FROM products WHERE id = ?', [it.id]);
    if (!p) continue;
    const qty = Math.max(1, Math.min(50, +it.qty || 1));
    total += p.price * qty;
    rows.push({ p, qty });
  }
  if (!rows.length) return res.status(400).json({ error: 'Корзина пуста' });

  const info = run(
    `INSERT INTO orders (customer_name, phone, address, delivery_date, delivery_time, contact_method, total)
     VALUES (?,?,?,?,?,?,?)`,
    [name, phone, address, delivery_date, delivery_time, contact_method, total]
  );

  const addItem = db.prepare('INSERT INTO order_items (order_id, product_id, name, price, qty) VALUES (?,?,?,?,?)');
  rows.forEach(({ p, qty }) => { addItem.run([info.lastInsertRowid, p.id, p.name, p.price, qty]); });
  addItem.free();
  saveDB();

  res.json({ id: info.lastInsertRowid, total });
});

app.get('/api/orders/:id', (req, res) => {
  const order = get('SELECT * FROM orders WHERE id = ?', [+req.params.id]);
  if (!order) return res.status(404).json({ error: 'Заказ не найден' });
  order.items = all('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
  res.json(order);
});

app.get('/api/orders', (req, res) => res.json(all('SELECT * FROM orders ORDER BY id DESC')));

initDB().then(() => {
  app.listen(3000, () => console.log('Bloom Сургут: http://localhost:3000'));
});