const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const balanceRoutes = require('./routes/balances');
const expenseRoutes = require('./routes/expenses');
const tradeRoutes = require('./routes/trades');
const goalRoutes = require('./routes/goals');
const categoryRoutes = require('./routes/categories');
const dashboardRoutes = require('./routes/dashboard');
const diaryRoutes = require('./routes/diary');
const internationalTradeRoutes = require('./routes/internationalTrades');
const exchangeRoutes = require('./routes/exchange');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Servir arquivos de upload
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/balances', balanceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/international-trades', internationalTradeRoutes);
app.use('/api/exchange', exchangeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
