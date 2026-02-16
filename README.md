# Sistema de Gestão Financeira Pessoal

Sistema web para controle financeiro pessoal com React, Node.js e MySQL.

## Funcionalidades

- **Dashboard**: Visão geral com saldos, gastos, P&L e progresso dos objetivos
- **Gastos**: Controle de gastos por categoria (Nubank)
- **Trades**: Registro de operações com P&L (Clear)
- **Calendário**: Visualização mensal com lucro/prejuízo por dia
- **Objetivos**: Metas de saldo total e lucro mensal

## Tecnologias

**Backend**: Node.js, Express, MySQL, JWT
**Frontend**: React 18, Vite, Tailwind CSS

## Instalação

### 1. Banco de Dados

Execute o script SQL para criar as tabelas:

```bash
mysql -u root -p < backend/database/migrations/001_initial_schema.sql
```

### 2. Backend

```bash
cd backend
npm install
```

Configure o arquivo `.env`:

```
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=investimentos
JWT_SECRET=sua_chave_secreta
```

### 3. Frontend

```bash
cd frontend
npm install
```

## Executar

**Backend** (porta 3001):
```bash
cd backend
npm run dev
```

**Frontend** (porta 5173):
```bash
cd frontend
npm run dev
```

Acesse: http://localhost:5173

## Login

Usuário padrão criado pelo seed:
- **Username**: admin
- **Senha**: 123456

## Estrutura do Projeto

```
investimentos/
├── backend/
│   ├── src/
│   │   ├── config/database.js
│   │   ├── controllers/
│   │   ├── middlewares/authMiddleware.js
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/calculationService.js
│   │   └── app.js
│   ├── database/migrations/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── context/AuthContext.jsx
│   │   ├── services/api.js
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Dados do usuário |
| GET/POST/PUT/DELETE | /api/balances | Saldos iniciais |
| GET/POST/PUT/DELETE | /api/expenses | Gastos |
| GET/POST/PUT/DELETE | /api/trades | Trades |
| GET/POST/PUT/DELETE | /api/goals | Objetivos |
| GET | /api/dashboard/summary | Resumo do dashboard |
| GET | /api/categories | Categorias |
| GET | /api/trades/calendar/:year/:month | Calendário de trades |
