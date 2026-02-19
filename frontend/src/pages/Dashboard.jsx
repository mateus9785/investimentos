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

function Card({ title, value, subtitle, iconBg, valueStyle, onEdit, rightValue, rightLabel, rightValueStyle }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: iconBg }}
        />
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        {onEdit && (
          <button
            onClick={onEdit}
            className="ml-auto text-gray-400 hover:text-blue-600 text-sm"
            title="Editar saldo inicial"
          >
            ✏️
          </button>
        )}
      </div>
      <div className="flex items-baseline justify-between mt-1">
        <p className="text-2xl font-bold" style={valueStyle}>{value}</p>
        {rightValue !== undefined && (
          <div className="text-right">
            {rightLabel && <p className="text-gray-400 text-xs">{rightLabel}</p>}
            <p className="text-2xl font-bold" style={rightValueStyle}>{rightValue}</p>
          </div>
        )}
      </div>
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
  const [goalForm, setGoalForm] = useState({ total_balance: 0, monthly_profit: 0, broker_balance: 0, broker_international_balance: 0 });
  const [saving, setSaving] = useState(false);
  const [editingGoalField, setEditingGoalField] = useState(null);
  const [balances, setBalances] = useState([]);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [editingBalanceType, setEditingBalanceType] = useState(null);
  const [balanceForm, setBalanceForm] = useState({ initial_balance: '' });
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({ fromAccount: 'bank', toAccount: 'broker', fromAmount: '', toAmount: '' });
  const { month, year } = getCurrentMonthYear();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [summaryRes, curveRes, balancesRes] = await Promise.all([
        api.get(`/dashboard/summary?month=${month}&year=${year}`),
        api.get(`/dashboard/equity-curve?month=${month}&year=${year}`),
        api.get('/balances')
      ]);
      setSummary(summaryRes.data);
      setEquityCurve(curveRes.data);
      setBalances(balancesRes.data);
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
        monthly_profit: res.data.monthly_profit || 0,
        broker_balance: res.data.broker_balance || 0,
        broker_international_balance: res.data.broker_international_balance || 0
      });
    } catch {
      setGoalForm({ total_balance: 0, monthly_profit: 0, broker_balance: 0, broker_international_balance: 0 });
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
        monthly_profit: parseFloat(goalForm.monthly_profit) || 0,
        broker_balance: parseFloat(goalForm.broker_balance) || 0,
        broker_international_balance: parseFloat(goalForm.broker_international_balance) || 0
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

  const handleBalanceEdit = (type) => {
    const balance = balances.find(b => b.account_type === type);
    setEditingBalanceType(type);
    setBalanceForm({ initial_balance: balance ? balance.initial_balance : '' });
    setBalanceModalOpen(true);
  };

  const handleBalanceSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const existing = balances.find(b => b.account_type === editingBalanceType);
      if (existing) {
        await api.put(`/balances/${existing.id}`, {
          initial_balance: parseFloat(balanceForm.initial_balance),
          reference_date: existing.reference_date.split('T')[0]
        });
      } else {
        await api.post('/balances', {
          account_type: editingBalanceType,
          initial_balance: parseFloat(balanceForm.initial_balance),
          reference_date: new Date().toISOString().split('T')[0]
        });
      }
      setBalanceModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar saldo:', error);
      alert('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fromBalance = balances.find(b => b.account_type === transferForm.fromAccount);
      const toBalance = balances.find(b => b.account_type === transferForm.toAccount);
      const fromAmount = parseFloat(transferForm.fromAmount);
      const toAmount = parseFloat(transferForm.toAmount);

      const updateOrCreate = async (existing, accountType, delta) => {
        if (existing) {
          await api.put(`/balances/${existing.id}`, {
            initial_balance: parseFloat(existing.initial_balance) + delta,
            reference_date: existing.reference_date.split('T')[0]
          });
        } else {
          await api.post('/balances', {
            account_type: accountType,
            initial_balance: delta,
            reference_date: new Date().toISOString().split('T')[0]
          });
        }
      };

      await updateOrCreate(fromBalance, transferForm.fromAccount, -fromAmount);
      await updateOrCreate(toBalance, transferForm.toAccount, toAmount);

      setTransferModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Erro ao transferir:', error);
      alert('Erro ao transferir');
    } finally {
      setSaving(false);
    }
  };

  const balanceTypeLabels = {
    bank: 'Saldo Banco',
    broker: 'Saldo Corretora',
    broker_international: 'Corretora Int.'
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Dashboard - {monthNames[month - 1]} {year}
        </h1>
        <button
          onClick={() => {
            setTransferForm({ fromAccount: 'bank', toAccount: 'broker', fromAmount: '', toAmount: '' });
            setTransferModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium"
        >
          Transferir entre contas
        </button>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card
          title="Saldo Total"
          value={formatCurrency(summary.balances.total)}
          iconBg="#3b82f6"
          rightLabel="Resultado líquido"
          rightValue={formatCurrency(netResult)}
          rightValueStyle={{ color: isNetPositive ? '#16a34a' : '#dc2626' }}
        />
        <Card
          title="Saldo Banco"
          value={formatCurrency(summary.balances.bank.current)}
          subtitle={`Inicial: ${formatCurrency(summary.balances.bank.initial)}`}
          iconBg="#a855f7"
          onEdit={() => handleBalanceEdit('bank')}
          rightLabel="Gastos do mês"
          rightValue={formatCurrency(summary.month.expenses)}
          rightValueStyle={{ color: '#dc2626' }}
        />
        <Card
          title="Saldo Corretora"
          value={formatCurrency(summary.balances.broker.current)}
          subtitle={`Inicial: ${formatCurrency(summary.balances.broker.initial)}`}
          iconBg="#22c55e"
          onEdit={() => handleBalanceEdit('broker')}
          rightLabel="Lucro/Prejuízo"
          rightValue={formatCurrency(summary.month.pnlDomestic)}
          rightValueStyle={{ color: summary.month.pnlDomestic >= 0 ? '#16a34a' : '#dc2626' }}
        />
        <Card
          title="Corretora Int."
          value={formatCurrency((summary.balances.broker_international?.current || 0) * (summary.exchangeRate || 0))}
          subtitle={`${formatCurrencyUSD(summary.balances.broker_international?.current || 0)} R$ ${(summary.exchangeRate || 0).toFixed(2)}`}
          iconBg="#0ea5e9"
          onEdit={() => handleBalanceEdit('broker_international')}
          rightLabel="Lucro/Prejuízo"
          rightValue={formatCurrency(summary.month.pnlInternationalBrl)}
          rightValueStyle={{ color: summary.month.pnlInternationalBrl >= 0 ? '#16a34a' : '#dc2626' }}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        <GoalCard
          label="Meta Saldo Corretora"
          current={summary.goalProgress.brokerBalance.current}
          target={summary.goalProgress.brokerBalance.target}
          barColor="#22c55e"
          onEdit={() => openGoalModal('broker_balance')}
        />
        <GoalCard
          label="Meta Corretora Int. (R$)"
          current={summary.goalProgress.brokerInternationalBalance.current}
          target={summary.goalProgress.brokerInternationalBalance.target}
          barColor="#0ea5e9"
          onEdit={() => openGoalModal('broker_international_balance')}
        />
      </div>

      {/* Modal de edição de saldo inicial */}
      <Modal
        isOpen={balanceModalOpen}
        onClose={() => setBalanceModalOpen(false)}
        title={`Editar Saldo Inicial - ${balanceTypeLabels[editingBalanceType] || ''}`}
      >
        <form onSubmit={handleBalanceSubmit}>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Saldo Inicial ({editingBalanceType === 'broker_international' ? 'USD' : 'R$'})
            </label>
            <input
              type="number"
              step="0.01"
              value={balanceForm.initial_balance}
              onChange={(e) => setBalanceForm({ initial_balance: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setBalanceModalOpen(false)}
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

      {/* Modal de transferência entre contas */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="Transferir entre contas"
      >
        <form onSubmit={handleTransferSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Conta de origem</label>
            <select
              value={transferForm.fromAccount}
              onChange={(e) => {
                const from = e.target.value;
                setTransferForm(f => ({
                  ...f,
                  fromAccount: from,
                  toAccount: f.toAccount === from
                    ? Object.keys(balanceTypeLabels).find(k => k !== from)
                    : f.toAccount
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {Object.entries(balanceTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Valor a retirar ({transferForm.fromAccount === 'broker_international' ? 'USD' : 'R$'})
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={transferForm.fromAmount}
              onChange={(e) => setTransferForm(f => ({ ...f, fromAmount: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Conta de destino</label>
            <select
              value={transferForm.toAccount}
              onChange={(e) => setTransferForm(f => ({ ...f, toAccount: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {Object.entries(balanceTypeLabels)
                .filter(([key]) => key !== transferForm.fromAccount)
                .map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
            </select>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Valor a depositar ({transferForm.toAccount === 'broker_international' ? 'USD' : 'R$'})
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={transferForm.toAmount}
              onChange={(e) => setTransferForm(f => ({ ...f, toAmount: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setTransferModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Transferindo...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de edição de metas */}
      <Modal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        title={{
          total_balance: 'Editar Meta de Saldo Total',
          monthly_profit: 'Editar Meta de Lucro Mensal',
          broker_balance: 'Editar Meta Saldo Corretora',
          broker_international_balance: 'Editar Meta Corretora Int.'
        }[editingGoalField] || 'Editar Meta'}
      >
        <form onSubmit={handleGoalSubmit}>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              {{
                total_balance: 'Meta de Saldo Total (R$)',
                monthly_profit: 'Meta de Lucro Mensal (R$)',
                broker_balance: 'Meta Saldo Corretora (R$)',
                broker_international_balance: 'Meta Corretora Int. (R$)'
              }[editingGoalField]}
            </label>
            <input
              type="number"
              step="0.01"
              value={goalForm[editingGoalField] ?? ''}
              onChange={(e) => setGoalForm({ ...goalForm, [editingGoalField]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Ex: 50000"
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
