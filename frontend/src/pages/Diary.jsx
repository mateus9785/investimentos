import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatDate, getCurrentMonthYear } from '../hooks/useApi';

export default function Diary() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(getCurrentMonthYear());
  const navigate = useNavigate();

  useEffect(() => {
    loadEntries();
  }, [filters]);

  const loadEntries = async () => {
    try {
      const response = await api.get(`/diary?month=${filters.month}&year=${filters.year}`);
      setEntries(response.data);
    } catch (error) {
      console.error('Erro ao carregar diário:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente excluir esta entrada?')) return;

    try {
      await api.delete(`/diary/${id}`);
      loadEntries();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir');
    }
  };

  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return tmp.textContent || tmp.innerText || '';
  };

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Diário de Trades</h1>
        <button
          onClick={() => navigate('/diario/novo')}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          + Nova Entrada
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <select
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            {months.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">Nenhuma entrada encontrada</p>
          <button
            onClick={() => navigate('/diario/novo')}
            className="text-blue-600 hover:text-blue-800"
          >
            Criar primeira entrada
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map(entry => (
            <div
              key={entry.id}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
            >
              {entry.image_path && (
                <img
                  src={`http://localhost:3001${entry.image_path}`}
                  alt={entry.title}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-4">
                <div className="text-sm text-gray-500 mb-1">
                  {formatDate(entry.entry_date)}
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{entry.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-3">
                  {stripHtml(entry.content).substring(0, 150)}
                  {stripHtml(entry.content).length > 150 ? '...' : ''}
                </p>
                <div className="flex justify-between mt-4 pt-4 border-t">
                  <button
                    onClick={() => navigate(`/diario/${entry.id}`)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
