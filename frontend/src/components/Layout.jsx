import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/gastos', label: 'Gastos', icon: '💸' },
  { path: '/trades', label: 'Trades', icon: '📈' },
  { path: '/trades-internacionais', label: 'Trades Int.', icon: '🌎' },
  { path: '/diario', label: 'Diário', icon: '📝' },
  { path: '/calendario', label: 'Calendário', icon: '📅' },

];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold">Finanças</h1>
        </div>
        <nav className="mt-6 flex-1">
          {menuItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                  isActive ? 'bg-gray-800 text-white border-l-4 border-blue-500' : ''
                }`
              }
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-6 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm w-full transition-colors"
          >
            <span>🚪</span>
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="ml-64">
        {/* Page content */}
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
