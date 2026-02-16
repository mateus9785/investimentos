import { useState, useEffect } from 'react';
import api from '../services/api';
import { formatCurrency, getCurrentMonthYear } from '../hooks/useApi';

const GREEN = '#16a34a';
const RED = '#dc2626';
const GREEN_BG = '#dcfce7';
const RED_BG = '#fee2e2';
const GREEN_BORDER = '#86efac';
const RED_BORDER = '#fecaca';

export default function Calendar() {
  const [calendar, setCalendar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(getCurrentMonthYear());

  useEffect(() => {
    loadCalendar();
  }, [filters]);

  const loadCalendar = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/trades/calendar/${filters.year}/${filters.month}`);
      setCalendar(response.data);
    } catch (error) {
      console.error('Erro ao carregar calendário:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const getPnlForDay = (day) => {
    const dayPadded = String(day).padStart(2, '0');
    const monthPadded = String(filters.month).padStart(2, '0');
    const dateStr = `${filters.year}-${monthPadded}-${dayPadded}`;

    const entry = calendar.find(c => {
      const entryDate = typeof c.date === 'string'
        ? c.date.split('T')[0]
        : new Date(c.date).toISOString().split('T')[0];
      return entryDate === dateStr;
    });

    return entry ? parseFloat(entry.total_pnl) : null;
  };

  const daysInMonth = getDaysInMonth(filters.year, filters.month);
  const firstDay = getFirstDayOfMonth(filters.year, filters.month);

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const totalPnl = calendar.reduce((sum, c) => sum + parseFloat(c.total_pnl), 0);
  const daysWithTrade = calendar.length;
  const positiveDays = calendar.filter(c => parseFloat(c.total_pnl) > 0).length;
  const negativeDays = calendar.filter(c => parseFloat(c.total_pnl) < 0).length;

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const previousMonth = () => {
    if (filters.month === 1) {
      setFilters({ month: 12, year: filters.year - 1 });
    } else {
      setFilters({ ...filters, month: filters.month - 1 });
    }
  };

  const nextMonth = () => {
    if (filters.month === 12) {
      setFilters({ month: 1, year: filters.year + 1 });
    } else {
      setFilters({ ...filters, month: filters.month + 1 });
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Calendário de Trades</h1>

      {/* Navegação do mês */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={previousMonth}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
          >
            ← Anterior
          </button>
          <h2 className="text-xl font-semibold text-gray-800">
            {months[filters.month - 1]} {filters.year}
          </h2>
          <button
            onClick={nextMonth}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
          >
            Próximo →
          </button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div
          className="rounded-lg p-4 text-center"
          style={{ backgroundColor: totalPnl >= 0 ? GREEN_BG : RED_BG }}
        >
          <p className="text-gray-600 text-sm">Total do Mês</p>
          <p className="text-lg font-bold" style={{ color: totalPnl >= 0 ? GREEN : RED }}>
            {formatCurrency(totalPnl)}
          </p>
        </div>
        <div className="rounded-lg p-4 text-center" style={{ backgroundColor: '#dbeafe' }}>
          <p className="text-gray-600 text-sm">Dias Operados</p>
          <p className="text-lg font-bold" style={{ color: '#1d4ed8' }}>{daysWithTrade}</p>
        </div>
        <div className="rounded-lg p-4 text-center" style={{ backgroundColor: GREEN_BG }}>
          <p className="text-gray-600 text-sm">Dias Positivos</p>
          <p className="text-lg font-bold" style={{ color: GREEN }}>{positiveDays}</p>
        </div>
        <div className="rounded-lg p-4 text-center" style={{ backgroundColor: RED_BG }}>
          <p className="text-gray-600 text-sm">Dias Negativos</p>
          <p className="text-lg font-bold" style={{ color: RED }}>{negativeDays}</p>
        </div>
      </div>

      {/* Calendário */}
      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map(day => (
              <div key={day} className="text-center text-gray-500 font-medium text-sm py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Dias do mês */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="h-20" />;
              }

              const pnl = getPnlForDay(day);
              const hasTrade = pnl !== null;
              const isPositive = pnl > 0;
              const isNegative = pnl < 0;

              let bgColor = '#ffffff';
              let borderColor = '#e5e7eb';
              let textColor = '#374151';

              if (hasTrade) {
                if (isPositive) {
                  bgColor = GREEN_BG;
                  borderColor = GREEN_BORDER;
                  textColor = GREEN;
                } else if (isNegative) {
                  bgColor = RED_BG;
                  borderColor = RED_BORDER;
                  textColor = RED;
                } else {
                  bgColor = '#f3f4f6';
                  borderColor = '#d1d5db';
                  textColor = '#6b7280';
                }
              }

              return (
                <div
                  key={day}
                  className="h-20 rounded-lg p-2 flex flex-col"
                  style={{
                    backgroundColor: bgColor,
                    border: `1px solid ${borderColor}`
                  }}
                >
                  <div className="text-xs text-gray-500">{day}</div>
                  {hasTrade && (
                    <div
                      className="text-sm font-bold mt-auto"
                      style={{ color: textColor }}
                    >
                      {formatCurrency(pnl)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
