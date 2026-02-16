import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { formatCurrency, formatCurrencyUSD, getCurrentMonthYear } from '../hooks/useApi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

function Card({ title, value, subtitle, iconBg, valueStyle }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: iconBg }}
        />
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      </div>
      <p className="text-2xl font-bold mt-1" style={valueStyle}>{value}</p>
      {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

function GoalCard({ label, current, target, barColor, onEdit }) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const remaining = target - current;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between mb-2">
        <span className="text-gray-700 font-medium">{label}</span>
        <button
          onClick={onEdit}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Editar
        </button>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
        <div
          className="h-3 rounded-full transition-all"
          style={{ width: `${percentage}%`, backgroundColor: barColor }}
        />
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Atual:</span>
          <span className="font-medium text-gray-700">{formatCurrency(current)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Meta:</span>
          <span className="font-medium text-gray-700">{formatCurrency(target)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t">
          <span className="text-gray-500">Falta:</span>
          <span
            className="font-bold"
            style={{ color: remaining <= 0 ? '#16a34a' : '#ea580c' }}
          >
            {remaining <= 0 ? 'Meta atingida!' : formatCurrency(remaining)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [equityCurve, setEquityCurve] = useState([]);
  const [loading, setLoading] = useState(true);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalForm, setGoalForm] = useState({ total_balance: 0, monthly_profit: 0 });
  const [saving, setSaving] = useState(false);
  const [editingGoalField, setEditingGoalField] = useState(null);
  const { month, year } = getCurrentMonthYear();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [summaryRes, curveRes] = await Promise.all([
        api.get(`/dashboard/summary?month=${month}&year=${year}`),
        api.get(`/dashboard/equity-curve?month=${month}&year=${year}`)
      ]);
      setSummary(summaryRes.data);
      setEquityCurve(curveRes.data);
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
    } finally {
      setLoading(false);
    }
  };

  const openGoalModal = async (field) => {
    try {
      const res = await api.get('/goals');
      setGoalForm({
        total_balance: res.data.total_balance || 0,
        monthly_profit: res.data.monthly_profit || 0
      });
    } catch {
      setGoalForm({ total_balance: 0, monthly_profit: 0 });
    }
    setEditingGoalField(field);
    setGoalModalOpen(true);
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/goals', {
        total_balance: parseFloat(goalForm.total_balance) || 0,
        monthly_profit: parseFloat(goalForm.monthly_profit) || 0
      });
      setGoalModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar objetivos:', error);
      alert('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Carregando...</div>;
  }

  if (!summary) {
    return <div style={{ color: '#dc2626' }}>Erro ao carregar dados</div>;
  }

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const pnl = summary.month.pnl;
  const isPnlPositive = pnl >= 0;
  const netResult = pnl - summary.month.expenses;
  const isNetPositive = netResult >= 0;

  // Chart data
  const chartLabels = equityCurve.map(p =>
    p.date === 'Início' ? 'Início' : new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  );
  const chartBalances = equityCurve.map(p => p.balance);
  const chartPnls = equityCurve.map(p => p.pnl);

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Capital (R$)',
        data: chartBalances,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: chartPnls.map(pnl =>
          pnl >= 0 ? '#16a34a' : '#dc2626'
        ),
        pointBorderColor: chartPnls.map(pnl =>
          pnl >= 0 ? '#16a34a' : '#dc2626'
        ),
        pointRadius: chartPnls.map((_, i) => i === 0 ? 5 : 4),
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const idx = ctx.dataIndex;
            const balance = formatCurrency(ctx.raw);
            const dayPnl = equityCurve[idx]?.pnl || 0;
            if (idx === 0) return `Capital: ${balance}`;
            return [
              `Capital: ${balance}`,
              `P&L do dia: ${formatCurrency(dayPnl)}`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => formatCurrency(value)
        }
      }
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Dashboard - {monthNames[month - 1]} {year}
      </h1>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card
          title="Saldo Total"
          value={formatCurrency(summary.balances.total)}
          iconBg="#3b82f6"
        />
        <Card
          title="Saldo Banco"
          value={formatCurrency(summary.balances.bank.current)}
          subtitle={`Inicial: ${formatCurrency(summary.balances.bank.initial)}`}
          iconBg="#a855f7"
        />
        <Card
          title="Saldo Corretora"
          value={formatCurrency(summary.balances.broker.current)}
          subtitle={`Inicial: ${formatCurrency(summary.balances.broker.initial)}`}
          iconBg="#22c55e"
        />
        <Card
          title="Corretora Int."
          value={formatCurrency((summary.balances.broker_international?.current || 0) * (summary.exchangeRate || 0))}
          subtitle={`${formatCurrencyUSD(summary.balances.broker_international?.current || 0)} @ ${(summary.exchangeRate || 0).toFixed(2)}`}
          iconBg="#0ea5e9"
        />
      </div>

      {/* Resumo do mês */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card
          title="Gastos do Mês"
          value={formatCurrency(summary.month.expenses)}
          iconBg="#ef4444"
          valueStyle={{ color: '#dc2626' }}
        />
        <Card
          title="Lucro/Prejuízo do Mês"
          value={formatCurrency(pnl)}
          iconBg={isPnlPositive ? '#22c55e' : '#ef4444'}
          valueStyle={{ color: isPnlPositive ? '#16a34a' : '#dc2626' }}
        />
        <Card
          title="Resultado Líquido do Mês"
          value={formatCurrency(netResult)}
          subtitle="Lucro/Prejuízo - Gastos"
          iconBg={isNetPositive ? '#22c55e' : '#ef4444'}
          valueStyle={{ color: isNetPositive ? '#16a34a' : '#dc2626' }}
        />
      </div>

      {/* Gráfico de evolução do capital */}
      {equityCurve.length > 1 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Evolução do Capital</h2>
          <div style={{ height: '350px' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Progresso dos objetivos */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">Progresso dos Objetivos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GoalCard
          label="Meta de Saldo Total"
          current={summary.goalProgress.totalBalance.current}
          target={summary.goalProgress.totalBalance.target}
          barColor="#3b82f6"
          onEdit={() => openGoalModal('total_balance')}
        />
        <GoalCard
          label="Meta de Lucro Mensal"
          current={summary.goalProgress.monthlyProfit.current}
          target={summary.goalProgress.monthlyProfit.target}
          barColor="#22c55e"
          onEdit={() => openGoalModal('monthly_profit')}
        />
      </div>

      {/* Modal de edição de metas */}
      <Modal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        title={editingGoalField === 'total_balance' ? 'Editar Meta de Saldo Total' : 'Editar Meta de Lucro Mensal'}
      >
        <form onSubmit={handleGoalSubmit}>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              {editingGoalField === 'total_balance' ? 'Meta de Saldo Total (R$)' : 'Meta de Lucro Mensal (R$)'}
            </label>
            <input
              type="number"
              step="0.01"
              value={goalForm[editingGoalField]}
              onChange={(e) => setGoalForm({ ...goalForm, [editingGoalField]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder={editingGoalField === 'total_balance' ? 'Ex: 100000' : 'Ex: 5000'}
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setGoalModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
