import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { formatCurrency, formatCurrencyUSD, formatDate, getCurrentMonthYear } from '../hooks/useApi';

const GREEN = '#4ade80';
const RED = '#f87171';

function Card({ title, value, subtitle, iconBg, valueStyle, onEdit, rightValue, rightLabel, rightValueStyle, milestones, milestonesCurrent, milestonesBarColor, onEditMilestones, onFullscreen }) {
  let nextMilestone = null;
  let allDone = false;
  if (milestones && milestones.length > 0) {
    const sorted = [...milestones].sort((a, b) => parseFloat(a.target_amount) - parseFloat(b.target_amount));
    const next = sorted.find(m => (milestonesCurrent ?? 0) < parseFloat(m.target_amount));
    if (next) {
      const target = parseFloat(next.target_amount);
      nextMilestone = { target, pct: Math.min(((milestonesCurrent ?? 0) / target) * 100, 100), remaining: target - (milestonesCurrent ?? 0) };
    } else {
      allDone = true;
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: iconBg }} />
            <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
            {onEdit && (
              <button onClick={onEdit} className="text-gray-400 hover:text-blue-400 text-sm" title="Editar saldo inicial">
                ✏️
              </button>
            )}
            {onFullscreen && (
              <button onClick={onFullscreen} className="text-gray-400 hover:text-white text-sm ml-1" title="Tela cheia">
                ⛶
              </button>
            )}
          </div>
          <p className="text-2xl font-bold" style={valueStyle}>{value}</p>
          {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
        </div>
        {rightValue !== undefined && (
          <div className="text-right">
            {rightLabel && <p className="text-gray-400 text-xs">{rightLabel}</p>}
            <p className="text-2xl font-bold" style={rightValueStyle}>{rightValue}</p>
          </div>
        )}
      </div>

      {onEditMilestones && (
        <div className="mt-4 pt-3 border-t border-gray-700">
          {!milestones || milestones.length === 0 ? (
            <button onClick={onEditMilestones} className="text-xs text-blue-400 hover:text-blue-300">+ Adicionar metas</button>
          ) : allDone ? (
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-400 font-semibold">Todas as metas batidas!</span>
              <button onClick={onEditMilestones} className="text-xs text-blue-400 hover:text-blue-300">Metas</button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-400">
                  Meta: <span className="text-gray-200 font-semibold">{formatCurrency(nextMilestone.target)}</span>
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-orange-400">falta {formatCurrency(nextMilestone.remaining)}</span>
                  <button onClick={onEditMilestones} className="text-xs text-blue-400 hover:text-blue-300">Metas</button>
                </div>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-1.5">
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${nextMilestone.pct}%`, backgroundColor: milestonesBarColor }} />
              </div>
              <div className="text-xs text-gray-500 mt-1">{nextMilestone.pct.toFixed(1)}%</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // goals
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalForm, setGoalForm] = useState({ total_balance: 0, monthly_profit: 0, broker_international_balance: 0 });
  const [editingGoalField, setEditingGoalField] = useState(null);

  // milestones
  const [milestones, setMilestones] = useState([]);
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [milestoneModalType, setMilestoneModalType] = useState(null);
  const [newMilestoneValue, setNewMilestoneValue] = useState('');

  // balances
  const [balances, setBalances] = useState([]);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [editingBalanceType, setEditingBalanceType] = useState(null);
  const [balanceForm, setBalanceForm] = useState({ initial_balance: '' });

  // transfer
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({ fromAccount: 'bank', toAccount: 'broker', fromAmount: '', toAmount: '' });

  // expenses
  const [expenses, setExpenses] = useState([]);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseForm, setExpenseForm] = useState({ amount: '', description: '', expense_date: new Date().toISOString().split('T')[0], is_mandatory: false });

  // binance
  const [binanceBalance, setBinanceBalance] = useState(null);
  const [currentRate, setCurrentRate] = useState(0);
  const [btcPrice, setBtcPrice] = useState(null);
  const [openPositions, setOpenPositions] = useState([]);

  // fullscreen saldo
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [fullscreenBalance, setFullscreenBalance] = useState(isMobile);

  const [saving, setSaving] = useState(false);
  const { month, year } = getCurrentMonthYear();

  // diary
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [diaryLoading, setDiaryLoading] = useState(false);
  const [showDiaryEditor, setShowDiaryEditor] = useState(false);
  const [editingDiaryEntry, setEditingDiaryEntry] = useState(null);
  const [diaryFilters, setDiaryFilters] = useState(getCurrentMonthYear());
  const [diaryForm, setDiaryForm] = useState({ title: '', entry_date: new Date().toISOString().split('T')[0], content: '' });
  const [diaryImage, setDiaryImage] = useState(null);
  const [diaryImagePreview, setDiaryImagePreview] = useState(null);
  const [diarySaving, setDiarySaving] = useState(false);
  const [diaryLightbox, setDiaryLightbox] = useState(null);
  const diaryEditorRef = useRef(null);
  const diaryFileInputRef = useRef(null);

  useEffect(() => {
    loadData();

    const fetchLive = async () => {
      try {
        const res = await api.get('/binance/live');
        setBtcPrice(res.data.btcPrice);
        setOpenPositions(res.data.positions);
        if (res.data.positions.length > 0) {
          // recalcula o saldo total da binance somando o balance base + unrealized PNL
        }
      } catch { /* silencioso */ }
      try {
        const res = await api.get('/binance/balance');
        setBinanceBalance(res.data.balanceUSD);
      } catch { /* silencioso */ }
    };

    fetchLive();
    const interval = setInterval(fetchLive, 1_000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [summaryRes, balancesRes, expensesRes, rateRes, milestonesRes, binanceRes] = await Promise.all([
        api.get(`/dashboard/summary?month=${month}&year=${year}`),
        api.get('/balances'),
        api.get(`/expenses?month=${month}&year=${year}`),
        api.get('/exchange/usd'),
        api.get('/milestones'),
        api.get('/binance/balance').catch(() => null)
      ]);
      setSummary(summaryRes.data);
      setBalances(balancesRes.data);
      setExpenses(expensesRes.data);
      setCurrentRate(rateRes.data.rate);
      setMilestones(milestonesRes.data);
      setBinanceBalance(binanceRes ? binanceRes.data.balanceUSD : null);
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Goals ---
  const openGoalModal = async (field) => {
    try {
      const res = await api.get('/goals');
      setGoalForm({
        total_balance: res.data.total_balance || 0,
        monthly_profit: res.data.monthly_profit || 0,
        broker_international_balance: res.data.broker_international_balance || 0
      });
    } catch {
      setGoalForm({ total_balance: 0, monthly_profit: 0, broker_international_balance: 0 });
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

  // --- Milestones ---
  const openMilestoneModal = (type) => {
    setMilestoneModalType(type);
    setNewMilestoneValue('');
    setMilestoneModalOpen(true);
  };

  const handleMilestoneAdd = async (e) => {
    e.preventDefault();
    if (!newMilestoneValue) return;
    setSaving(true);
    try {
      await api.post('/milestones', { type: milestoneModalType, target_amount: parseFloat(newMilestoneValue) });
      setNewMilestoneValue('');
      const res = await api.get('/milestones');
      setMilestones(res.data);
    } catch (error) {
      console.error('Erro ao adicionar meta:', error);
      alert('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleMilestoneDelete = async (id) => {
    try {
      await api.delete(`/milestones/${id}`);
      const res = await api.get('/milestones');
      setMilestones(res.data);
    } catch {
      alert('Erro ao excluir');
    }
  };

  // --- Balances ---
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

  // --- Transfer ---
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

  // --- Expenses ---
  const openExpenseModal = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setExpenseForm({
        amount: expense.amount,
        description: expense.description || '',
        expense_date: expense.expense_date.split('T')[0],
        is_mandatory: !!expense.is_mandatory
      });
    } else {
      setEditingExpense(null);
      setExpenseForm({ amount: '', description: '', expense_date: new Date().toISOString().split('T')[0], is_mandatory: false });
    }
    setExpenseModalOpen(true);
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...expenseForm, amount: parseFloat(expenseForm.amount) };
      if (editingExpense) {
        await api.put(`/expenses/${editingExpense.id}`, data);
      } else {
        await api.post('/expenses', data);
      }
      setExpenseModalOpen(false);
      setEditingExpense(null);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar gasto:', error);
      alert(error.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleExpenseDelete = async (id) => {
    if (!confirm('Deseja realmente excluir este gasto?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      loadData();
    } catch {
      alert('Erro ao excluir');
    }
  };

  // --- Diary ---
  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return tmp.textContent || tmp.innerText || '';
  };

  useEffect(() => {
    loadDiaryEntries();
  }, [diaryFilters]);

  useEffect(() => {
    if (!diaryLightbox) return;
    const handleKey = (e) => { if (e.key === 'Escape') setDiaryLightbox(null); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [diaryLightbox]);

  const loadDiaryEntries = async () => {
    setDiaryLoading(true);
    try {
      const res = await api.get(`/diary?month=${diaryFilters.month}&year=${diaryFilters.year}`);
      setDiaryEntries(res.data);
    } catch (error) {
      console.error('Erro ao carregar diário:', error);
    } finally {
      setDiaryLoading(false);
    }
  };

  const openNewDiaryEntry = () => {
    setEditingDiaryEntry(null);
    setDiaryForm({ title: '', entry_date: new Date().toISOString().split('T')[0], content: '' });
    setDiaryImage(null);
    setDiaryImagePreview(null);
    setShowDiaryEditor(true);
    setTimeout(() => { if (diaryEditorRef.current) diaryEditorRef.current.innerHTML = ''; }, 0);
  };

  const openEditDiaryEntry = (entry) => {
    setEditingDiaryEntry(entry);
    setDiaryForm({ title: entry.title, entry_date: entry.entry_date.split('T')[0], content: entry.content || '' });
    setDiaryImage(null);
    setDiaryImagePreview(entry.image_path ? `http://localhost:3001${entry.image_path}` : null);
    setShowDiaryEditor(true);
    setTimeout(() => { if (diaryEditorRef.current) diaryEditorRef.current.innerHTML = entry.content || ''; }, 0);
  };

  const closeDiaryEditor = () => {
    setShowDiaryEditor(false);
    setEditingDiaryEntry(null);
  };

  const handleDiaryImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Imagem muito grande. Máximo 5MB.'); return; }
    const reader = new FileReader();
    reader.onloadend = () => { setDiaryImage(reader.result); setDiaryImagePreview(reader.result); };
    reader.readAsDataURL(file);
  };

  const removeDiaryImage = () => {
    setDiaryImage(null);
    setDiaryImagePreview(null);
    if (diaryFileInputRef.current) diaryFileInputRef.current.value = '';
  };

  const execDiaryCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    diaryEditorRef.current?.focus();
  };

  const handleDiarySubmit = async (e) => {
    e.preventDefault();
    setDiarySaving(true);
    try {
      const content = diaryEditorRef.current?.innerHTML || '';
      const data = {
        ...diaryForm,
        content,
        image: diaryImage === null && !diaryImagePreview ? null : diaryImage
      };
      if (editingDiaryEntry) {
        await api.put(`/diary/${editingDiaryEntry.id}`, data);
      } else {
        await api.post('/diary', data);
      }
      closeDiaryEditor();
      loadDiaryEntries();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert(error.response?.data?.error || 'Erro ao salvar');
    } finally {
      setDiarySaving(false);
    }
  };

  const handleDiaryDelete = async (id) => {
    if (!confirm('Deseja realmente excluir esta entrada?')) return;
    try {
      await api.delete(`/diary/${id}`);
      loadDiaryEntries();
    } catch {
      alert('Erro ao excluir');
    }
  };

  const diaryMonths = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // --- Derived ---
  const balanceTypeLabels = { bank: 'Saldo Banco', broker_international: 'Corretora Int.' };

  const expenseTotal = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const expenseMandatory = expenses.filter(e => e.is_mandatory).reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const expenseOptional = expenseTotal - expenseMandatory;

  if (loading) {
    return <div className="text-gray-400">Carregando...</div>;
  }

  if (!summary) {
    return <div style={{ color: RED }}>Erro ao carregar dados</div>;
  }

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const pnl = summary.month.pnl;
  const netResult = pnl - summary.month.expenses;
  const isNetPositive = netResult >= 0;

  // Saldo total com Binance real (substitui broker_international do summary quando disponível)
  const binanceBRL = binanceBalance !== null ? binanceBalance * currentRate : null;
  const totalBalance = binanceBRL !== null
    ? summary.balances.bank.current + (summary.balances.broker?.current || 0) + binanceBRL
    : summary.balances.total;

  return (
    <>
    {fullscreenBalance && (
      <div
        className="fixed inset-0 z-50 bg-gray-950 flex flex-col items-center justify-center select-none px-6"
        style={!isMobile ? { cursor: 'pointer' } : undefined}
        onClick={!isMobile ? (e) => { if (e.target === e.currentTarget) setFullscreenBalance(false); } : undefined}
      >
        {/* Saldo total */}
        <p className="font-bold text-white" style={{ fontSize: 'clamp(3rem, 12vw, 9rem)', lineHeight: 1.1 }}>
          {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalBalance)}
        </p>

        {/* Dólar + Bitcoin price + PNL */}
        {btcPrice !== null && (
          <div className="mt-8 flex items-center gap-10">
            {currentRate > 0 && (
              <span className="text-gray-300 font-mono font-semibold" style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2.6rem)' }}>
                <span className="text-gray-500">USD</span> {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(currentRate)}
              </span>
            )}
            <span className="text-white font-mono font-semibold" style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2.6rem)' }}>
              <span className="text-yellow-400">₿</span> {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(btcPrice)}
            </span>
            {openPositions.length > 0 && (() => {
              const totalPnl = openPositions.reduce((sum, p) => sum + p.unrealizedProfit, 0);
              return (
                <span className="font-mono font-bold" style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2.6rem)', color: totalPnl >= 0 ? GREEN : RED }}>
                  {totalPnl >= 0 ? '+' : ''}{new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalPnl)}
                </span>
              );
            })()}
          </div>
        )}

        {!isMobile && <p className="text-gray-700 text-sm mt-10">clique fora para fechar</p>}
      </div>
    )}
    <div className="flex flex-col min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">
          Dashboard - {monthNames[month - 1]} {year}
        </h1>
        <button
          onClick={() => {
            setTransferForm({ fromAccount: 'bank', toAccount: 'broker', fromAmount: '', toAmount: '' });
            setTransferModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium"
        >
          Transferir entre contas
        </button>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card
          title="Saldo Total"
          value={formatCurrency(totalBalance)}
          iconBg="#3b82f6"
          rightLabel="Resultado líquido"
          rightValue={formatCurrency(netResult)}
          rightValueStyle={{ color: isNetPositive ? GREEN : RED }}
          milestones={milestones.filter(m => m.type === 'total_balance')}
          milestonesCurrent={totalBalance}
          milestonesBarColor="#3b82f6"
          onEditMilestones={() => openMilestoneModal('total_balance')}
          onFullscreen={() => setFullscreenBalance(true)}
        />
        <Card
          title="Saldo Banco"
          value={formatCurrency(summary.balances.bank.current)}
          iconBg="#a855f7"
          onEdit={() => handleBalanceEdit('bank')}
          rightLabel="Gastos do mês"
          rightValue={formatCurrency(summary.month.expenses)}
          rightValueStyle={{ color: RED }}
        />
        {(() => {
          const brokerInitial = summary.balances.broker_international?.initial || 0;
          const pnlUSD = binanceBalance !== null ? binanceBalance - brokerInitial : null;
          const pnlBRL = pnlUSD !== null ? pnlUSD * currentRate : null;
          return (
            <Card
              title="Corretora Int."
              value={binanceBRL !== null
                ? <>{formatCurrency(binanceBRL)} <span className="text-sm font-normal text-gray-400">({formatCurrencyUSD(binanceBalance)})</span></>
                : <>{formatCurrency((summary.balances.broker_international?.current || 0) * (summary.exchangeRate || 0))} <span className="text-sm font-normal text-gray-400">({formatCurrencyUSD(summary.balances.broker_international?.current || 0)})</span></>
              }
              iconBg="#0ea5e9"
              onEdit={() => handleBalanceEdit('broker_international')}
              rightLabel="P&L Binance"
              rightValue={pnlBRL !== null ? formatCurrency(pnlBRL) : '—'}
              rightValueStyle={{ color: pnlBRL !== null ? (pnlBRL >= 0 ? GREEN : RED) : '#9ca3af' }}
            />
          );
        })()}
      </div>

      {/* Gastos do mês */}
      <div>

        {/* Gastos */}
        <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
            <h2 className="text-base font-bold text-gray-100">Gastos do Mês</h2>
            <button
              onClick={() => openExpenseModal()}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              + Novo Gasto
            </button>
          </div>

          {/* Resumo gastos */}
          <div className="grid grid-cols-3 gap-px bg-gray-700">
            <div className="bg-gray-800 px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">Total</p>
              <p className="text-sm font-bold" style={{ color: RED }}>{formatCurrency(expenseTotal)}</p>
            </div>
            <div className="bg-gray-800 px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">Obrigatórios</p>
              <p className="text-sm font-bold text-orange-400">{formatCurrency(expenseMandatory)}</p>
            </div>
            <div className="bg-gray-800 px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">Opcionais</p>
              <p className="text-sm font-bold text-green-400">{formatCurrency(expenseOptional)}</p>
            </div>
          </div>

          {/* Tabela gastos */}
          {expenses.length === 0 ? (
            <p className="text-gray-400 text-sm px-5 py-6">Nenhum gasto registrado este mês.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-750 sticky top-0">
                  <tr className="bg-gray-700/60">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Data</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Descrição</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-400 uppercase">Tipo</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Valor</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {expenses.map(expense => (
                    <tr key={expense.id} className="hover:bg-gray-700/50">
                      <td className="px-4 py-2.5 text-gray-300 whitespace-nowrap">{formatDate(expense.expense_date)}</td>
                      <td className="px-4 py-2.5 text-gray-300 max-w-[140px] truncate">{expense.description || '-'}</td>
                      <td className="px-4 py-2.5 text-center">
                        {expense.is_mandatory
                          ? <span className="inline-block bg-red-900/40 text-red-300 text-xs font-semibold px-2 py-0.5 rounded-full">Obrig.</span>
                          : <span className="inline-block bg-green-900/40 text-green-300 text-xs font-semibold px-2 py-0.5 rounded-full">Opc.</span>
                        }
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium" style={{ color: RED }}>{formatCurrency(expense.amount)}</td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <button onClick={() => openExpenseModal(expense)} className="text-blue-400 hover:text-blue-300 mr-2">Editar</button>
                        <button onClick={() => handleExpenseDelete(expense.id)} style={{ color: RED }} className="hover:opacity-75">Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Seção Diário */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-gray-100">Diário de Trades</h2>
          <button onClick={openNewDiaryEntry} className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-sm font-medium">
            + Nova Entrada
          </button>
        </div>
        <div className="bg-gray-800 rounded-lg shadow p-4 mb-4">
          <div className="flex gap-4">
            <select
              value={diaryFilters.month}
              onChange={(e) => setDiaryFilters({ ...diaryFilters, month: parseInt(e.target.value) })}
              className="px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 text-sm"
            >
              {diaryMonths.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select
              value={diaryFilters.year}
              onChange={(e) => setDiaryFilters({ ...diaryFilters, year: parseInt(e.target.value) })}
              className="px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 text-sm"
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        {diaryLoading ? (
          <p className="text-gray-400 text-sm">Carregando...</p>
        ) : diaryEntries.length === 0 ? (
          <div className="bg-gray-800 rounded-lg shadow p-8 text-center">
            <p className="text-gray-400 mb-4">Nenhuma entrada encontrada</p>
            <button onClick={openNewDiaryEntry} className="text-blue-400 hover:text-blue-300 text-sm">Criar primeira entrada</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {diaryEntries.map(entry => (
              <div key={entry.id} className="bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                {entry.image_path && (
                  <img
                    src={`http://localhost:3001${entry.image_path}`}
                    alt={entry.title}
                    className="w-full h-40 object-cover cursor-zoom-in"
                    onClick={() => setDiaryLightbox(`http://localhost:3001${entry.image_path}`)}
                    title="Clique para ampliar"
                  />
                )}
                <div className="p-4">
                  <div className="text-sm text-gray-400 mb-1">{formatDate(entry.entry_date)}</div>
                  <h3 className="font-bold text-gray-100 mb-2">{entry.title}</h3>
                  <p className="text-gray-300 text-sm line-clamp-3">
                    {stripHtml(entry.content).substring(0, 150)}
                    {stripHtml(entry.content).length > 150 ? '...' : ''}
                  </p>
                  <div className="flex justify-between mt-4 pt-4 border-t border-gray-700">
                    <button onClick={() => openEditDiaryEntry(entry)} className="text-blue-400 hover:text-blue-300 text-sm">Editar</button>
                    <button onClick={() => handleDiaryDelete(entry.id)} className="text-red-400 hover:text-red-300 text-sm">Excluir</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal nova/editar entrada do diário */}
      <Modal isOpen={showDiaryEditor} onClose={closeDiaryEditor} title={editingDiaryEntry ? 'Editar Entrada' : 'Nova Entrada'} fullHeight>
        <form onSubmit={handleDiarySubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-200 text-sm font-medium mb-2">Título</label>
              <input
                type="text"
                value={diaryForm.title}
                onChange={(e) => setDiaryForm({ ...diaryForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Trade PETR4 - Análise"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-gray-200 text-sm font-medium mb-2">Data</label>
              <input
                type="date"
                value={diaryForm.entry_date}
                onChange={(e) => setDiaryForm({ ...diaryForm, entry_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-200 text-sm font-medium mb-2">Imagem (opcional)</label>
            {diaryImagePreview ? (
              <div className="relative inline-block">
                <img
                  src={diaryImagePreview}
                  alt="Preview"
                  className="max-w-full max-h-40 rounded-lg border border-gray-600 cursor-zoom-in"
                  onClick={() => setDiaryLightbox(diaryImagePreview)}
                />
                <button type="button" onClick={removeDiaryImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 text-sm">
                  ✕
                </button>
              </div>
            ) : (
              <div onClick={() => diaryFileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors">
                <p className="text-gray-400 text-sm">Clique para adicionar imagem</p>
                <p className="text-gray-500 text-xs mt-1">PNG, JPG até 5MB</p>
              </div>
            )}
            <input ref={diaryFileInputRef} type="file" accept="image/*" onChange={handleDiaryImageChange} className="hidden" />
          </div>
          <div className="mb-4">
            <label className="block text-gray-200 text-sm font-medium mb-2">Conteúdo</label>
            <div className="flex flex-wrap gap-1 p-2 bg-gray-700 border border-b-0 border-gray-600 rounded-t-md">
              <button type="button" onClick={() => execDiaryCommand('bold')} className="px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded hover:bg-gray-600 text-gray-100 font-bold" title="Negrito">B</button>
              <button type="button" onClick={() => execDiaryCommand('italic')} className="px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded hover:bg-gray-600 text-gray-100 italic" title="Itálico">I</button>
              <button type="button" onClick={() => execDiaryCommand('underline')} className="px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded hover:bg-gray-600 text-gray-100 underline" title="Sublinhado">U</button>
              <button type="button" onClick={() => execDiaryCommand('strikeThrough')} className="px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded hover:bg-gray-600 text-gray-100 line-through" title="Tachado">S</button>
              <div className="w-px bg-gray-600 mx-1" />
              <button type="button" onClick={() => execDiaryCommand('formatBlock', 'h1')} className="px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded hover:bg-gray-600 text-gray-100 font-bold" title="Título 1">H1</button>
              <button type="button" onClick={() => execDiaryCommand('formatBlock', 'h2')} className="px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded hover:bg-gray-600 text-gray-100 font-bold" title="Título 2">H2</button>
              <div className="w-px bg-gray-600 mx-1" />
              <button type="button" onClick={() => execDiaryCommand('insertUnorderedList')} className="px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded hover:bg-gray-600 text-gray-100" title="Lista">• Lista</button>
              <button type="button" onClick={() => execDiaryCommand('insertOrderedList')} className="px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded hover:bg-gray-600 text-gray-100" title="Lista Numerada">1. Lista</button>
              <div className="w-px bg-gray-600 mx-1" />
              <select onChange={(e) => { if (e.target.value) { execDiaryCommand('foreColor', e.target.value); e.target.value = ''; } }} className="px-1 py-1 bg-gray-800 border border-gray-600 rounded hover:bg-gray-600 text-gray-100 text-xs" title="Cor do texto">
                <option value="">Cor</option>
                <option value="#ef4444">Vermelho</option>
                <option value="#22c55e">Verde</option>
                <option value="#3b82f6">Azul</option>
                <option value="#f59e0b">Amarelo</option>
                <option value="#8b5cf6">Roxo</option>
              </select>
              <select onChange={(e) => { if (e.target.value) { execDiaryCommand('hiliteColor', e.target.value); e.target.value = ''; } }} className="px-1 py-1 bg-gray-800 border border-gray-600 rounded hover:bg-gray-600 text-gray-100 text-xs" title="Destaque">
                <option value="">Destaque</option>
                <option value="#fef08a">Amarelo</option>
                <option value="#bbf7d0">Verde</option>
                <option value="#bfdbfe">Azul</option>
                <option value="#fecaca">Vermelho</option>
              </select>
            </div>
            <div
              ref={diaryEditorRef}
              contentEditable
              className="min-h-[180px] p-4 border border-gray-600 rounded-b-md focus:outline-none focus:ring-2 focus:ring-blue-500 prose max-w-none bg-gray-700 text-gray-100"
              style={{ whiteSpace: 'pre-wrap' }}
              dangerouslySetInnerHTML={{ __html: diaryForm.content }}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={closeDiaryEditor} className="px-4 py-2 text-gray-300 hover:text-gray-100">Cancelar</button>
            <button type="submit" disabled={diarySaving} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
              {diarySaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Lightbox diário */}
      {diaryLightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 cursor-zoom-out" onClick={() => setDiaryLightbox(null)}>
          <img src={diaryLightbox} alt="Imagem em tela cheia" className="max-w-full max-h-full object-contain select-none" onClick={(e) => e.stopPropagation()} />
          <button className="absolute top-4 right-4 text-white text-3xl leading-none hover:text-gray-300" onClick={() => setDiaryLightbox(null)}>✕</button>
        </div>
      )}

      {/* Modal de metas (lista por tipo) */}
      {(() => {
        const typeLabels = {
          total_balance: 'Metas de Saldo Total',
          monthly_profit: 'Metas de Lucro Mensal',
          broker_international_balance: 'Metas Corretora Int. (R$)'
        };
        const typeCurrents = {
          total_balance: summary?.balances?.total ?? 0,
          monthly_profit: summary?.goalProgress?.monthlyProfit?.current ?? 0,
          broker_international_balance: summary?.goalProgress?.brokerInternationalBalance?.current ?? 0
        };
        const typeMilestones = milestones
          .filter(m => m.type === milestoneModalType)
          .sort((a, b) => parseFloat(a.target_amount) - parseFloat(b.target_amount));
        const current = typeCurrents[milestoneModalType] ?? 0;

        return (
          <Modal
            isOpen={milestoneModalOpen}
            onClose={() => setMilestoneModalOpen(false)}
            title={typeLabels[milestoneModalType] || 'Metas'}
            fullHeight
          >
            <div className="flex flex-col flex-1 min-h-0">
              {/* Lista de metas existentes */}
              {typeMilestones.length === 0 ? (
                <p className="text-gray-400 text-sm mb-4 italic">Nenhuma meta cadastrada.</p>
              ) : (
                <div className="overflow-y-auto space-y-2 mb-5 pr-1">
                  {typeMilestones.map((m) => {
                    const target = parseFloat(m.target_amount);
                    const achieved = current >= target;
                    const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
                    const remaining = target - current;
                    return (
                      <div
                        key={m.id}
                        className={`flex items-center gap-3 rounded-md px-3 py-2.5 ${achieved ? 'bg-green-900/20 border border-green-700/30' : 'bg-gray-700/50'}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className={`text-sm font-bold ${achieved ? 'text-green-300' : 'text-gray-100'}`}>
                              {achieved ? '✓ ' : ''}{formatCurrency(target)}
                            </span>
                            {achieved ? (
                              <span className="text-xs font-bold text-green-400">BATIDA!</span>
                            ) : (
                              <span className="text-xs text-orange-400">falta {formatCurrency(remaining)}</span>
                            )}
                          </div>
                          <div className="w-full bg-gray-600 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: achieved ? '#4ade80' : '#3b82f6' }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{pct.toFixed(1)}%</div>
                        </div>
                        <button
                          onClick={() => handleMilestoneDelete(m.id)}
                          className="text-gray-500 hover:text-red-400 text-lg leading-none flex-shrink-0"
                          title="Excluir meta"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Adicionar nova meta */}
              <form onSubmit={handleMilestoneAdd} className="flex gap-2 flex-shrink-0">
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={newMilestoneValue}
                  onChange={(e) => setNewMilestoneValue(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 text-sm"
                  placeholder="Ex: 10000"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={saving || !newMilestoneValue}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium whitespace-nowrap"
                >
                  {saving ? '...' : '+ Adicionar'}
                </button>
              </form>

              <div className="flex justify-end mt-4">
                <button onClick={() => setMilestoneModalOpen(false)} className="px-4 py-2 text-gray-300 hover:text-gray-100 text-sm">
                  Fechar
                </button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Modal de edição de saldo inicial */}
      <Modal
        isOpen={balanceModalOpen}
        onClose={() => setBalanceModalOpen(false)}
        title={`Editar Saldo Inicial - ${balanceTypeLabels[editingBalanceType] || ''}`}
      >
        <form onSubmit={handleBalanceSubmit}>
          <div className="mb-6">
            <label className="block text-gray-200 text-sm font-medium mb-2">
              Saldo Inicial ({editingBalanceType === 'broker_international' ? 'USD' : 'R$'})
            </label>
            <input
              type="number"
              step="0.01"
              value={balanceForm.initial_balance}
              onChange={(e) => setBalanceForm({ initial_balance: e.target.value })}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100"
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setBalanceModalOpen(false)} className="px-4 py-2 text-gray-300 hover:text-gray-100">Cancelar</button>
            <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de transferência entre contas */}
      <Modal isOpen={transferModalOpen} onClose={() => setTransferModalOpen(false)} title="Transferir entre contas">
        <form onSubmit={handleTransferSubmit}>
          <div className="mb-4">
            <label className="block text-gray-200 text-sm font-medium mb-2">Conta de origem</label>
            <select
              value={transferForm.fromAccount}
              onChange={(e) => {
                const from = e.target.value;
                setTransferForm(f => ({
                  ...f,
                  fromAccount: from,
                  toAccount: f.toAccount === from ? Object.keys(balanceTypeLabels).find(k => k !== from) : f.toAccount
                }));
              }}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100"
            >
              {Object.entries(balanceTypeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-200 text-sm font-medium mb-2">
              Valor a retirar ({transferForm.fromAccount === 'broker_international' ? 'USD' : 'R$'})
            </label>
            <input type="number" step="0.01" min="0.01" value={transferForm.fromAmount}
              onChange={(e) => setTransferForm(f => ({ ...f, fromAmount: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100" required />
          </div>
          <div className="mb-4">
            <label className="block text-gray-200 text-sm font-medium mb-2">Conta de destino</label>
            <select value={transferForm.toAccount}
              onChange={(e) => setTransferForm(f => ({ ...f, toAccount: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100"
            >
              {Object.entries(balanceTypeLabels).filter(([key]) => key !== transferForm.fromAccount).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>
          <div className="mb-6">
            <label className="block text-gray-200 text-sm font-medium mb-2">
              Valor a depositar ({transferForm.toAccount === 'broker_international' ? 'USD' : 'R$'})
            </label>
            <input type="number" step="0.01" min="0.01" value={transferForm.toAmount}
              onChange={(e) => setTransferForm(f => ({ ...f, toAmount: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100" required />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setTransferModalOpen(false)} className="px-4 py-2 text-gray-300 hover:text-gray-100">Cancelar</button>
            <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Transferindo...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal novo/editar gasto */}
      <Modal isOpen={expenseModalOpen} onClose={() => { setExpenseModalOpen(false); setEditingExpense(null); }} title={editingExpense ? 'Editar Gasto' : 'Novo Gasto'}>
        <form onSubmit={handleExpenseSubmit}>
          <div className="mb-4">
            <label className="block text-gray-200 text-sm font-medium mb-2">Valor</label>
            <input type="number" step="0.01" value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100" required autoFocus />
          </div>
          <div className="mb-4">
            <label className="block text-gray-200 text-sm font-medium mb-2">Descrição</label>
            <input type="text" value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100" />
          </div>
          <div className="mb-4">
            <label className="block text-gray-200 text-sm font-medium mb-2">Data</label>
            <input type="date" value={expenseForm.expense_date}
              onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100" required />
          </div>
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={expenseForm.is_mandatory}
                onChange={(e) => setExpenseForm({ ...expenseForm, is_mandatory: e.target.checked })}
                className="w-4 h-4 accent-red-600" />
              <span className="text-gray-200 text-sm font-medium">Gasto obrigatório</span>
              <span className="text-xs text-gray-400">(não pode ser cortado)</span>
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => { setExpenseModalOpen(false); setEditingExpense(null); }} className="px-4 py-2 text-gray-300 hover:text-gray-100">Cancelar</button>
            <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
    </>
  );
}
