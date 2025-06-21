const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const PORT = 3000;

// "Database" in RAM
const users = [
  { username: 'admin', password: 'admin', role: 'admin' }
];

app.use(bodyParser.json());
app.use(session({
  secret: 'wave-secret',
  resave: false,
  saveUninitialized: true,
}));

// Registrazione
app.post('/register', (req, res) => {
  const { username, password, role } = req.body;
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username già esistente' });
  }
  const user = { username, password, role: role || 'utente' };
  users.push(user);
  res.json({ message: 'Registrazione avvenuta', user: { username: user.username, role: user.role } });
});

// Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Credenziali non valide' });
  }
  req.session.user = { username: user.username, role: user.role };
  res.json({ message: 'Login effettuato', user: { username: user.username, role: user.role } });
});

// Test autenticazione
app.get('/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Non autenticato' });
  res.json({ user: req.session.user });
});

app.listen(PORT, () => {
  console.log(`✅ Server avviato su http://localhost:${PORT}`);
});