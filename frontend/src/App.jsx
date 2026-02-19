import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Trades from './pages/Trades';
import Calendar from './pages/Calendar';
import Diary from './pages/Diary';
import DiaryEditor from './pages/DiaryEditor';
import InternationalTrades from './pages/InternationalTrades';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="gastos" element={<Expenses />} />
        <Route path="trades" element={<Trades />} />
        <Route path="trades-internacionais" element={<InternationalTrades />} />
        <Route path="calendario" element={<Calendar />} />

        <Route path="diario" element={<Diary />} />
        <Route path="diario/novo" element={<DiaryEditor />} />
        <Route path="diario/:id" element={<DiaryEditor />} />
      </Route>
    </Routes>
  );
}

export default App;
