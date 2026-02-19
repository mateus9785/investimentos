import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { formatCurrency, formatCurrencyUSD, formatDate, getCurrentMonthYear } from '../hooks/useApi';

const GREEN = '#16a34a';
const RED = '#dc2626';

export default function InternationalTrades() {
  const [trades, setTrades] = useState([]);
  const [brokerInitialBalance, setBrokerInitialBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [filters, setFilters] = useState(getCurrentMonthYear());
  const [currentRate, setCurrentRate] = useState(0);

  const [form, setForm] = useState({
    trade_date: new Date().toISOString().split('T')[0],
    pnl_usd: '',
    exchange_rate: '',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      const [tradesRes, summaryRes, rateRes] = await Promise.all([
        api.get(`/international-trades?month=${filters.month}&year=${filters.year}`),
        api.get(`/dashboard/summary?month=${filters.month}&year=${filters.year}`),
        api.get('/exchange/usd')
      ]);

      const sortedTrades = tradesRes.data.sort((a, b) =>
        new Date(a.trade_date) - new Date(b.trade_date)
      );

      setTrades(sortedTrades);
      setBrokerInitialBalance(summaryRes.data.balances.broker_international?.initial || 0);
      setCurrentRate(rateRes.data.rate);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExchangeRate = async () => {
    try {
      const res = await api.get('/exchange/usd');
      const rate = res.data.rate;
      setCurrentRate(rate);
      return rate.toFixed(4);
    } catch (error) {
      console.error('Erro ao buscar cotação:', error);
      return '';
    }
  };

  const openModal = async (trade = null) => {
    if (trade) {
      setEditingTrade(trade);
      setForm({
        trade_date: trade.trade_date.split('T')[0],
        pnl_usd: trade.pnl_usd,
        exchange_rate: trade.exchange_rate,
        description: trade.description || ''
      });
    } else {
      setEditingTrade(null);
      const rate = await fetchExchangeRate();
      setForm({
        trade_date: new Date().toISOString().split('T')[0],
        pnl_usd: '',
        exchange_rate: rate,
        description: ''
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTrade(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...form,
        pnl_usd: parseFloat(form.pnl_usd),
        exchange_rate: parseFloat(form.exchange_rate)
      };

      if (editingTrade) {
        await api.put(`/international-trades/${editingTrade.id}`, data);
      } else {
        await api.post('/international-trades', data);
      }

      closeModal();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar trade:', error);
      alert(error.response?.data?.error || 'Erro ao salvar');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente excluir este trade?')) return;

    try {
      await api.delete(`/international-trades/${id}`);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir');
    }
  };

  const getBalanceBeforeTrade = (tradeIndex) => {
    let balance = brokerInitialBalance;
    for (let i = 0; i < tradeIndex; i++) {
      balance += parseFloat(trades[i].pnl_usd);
    }
    return balance;
  };

  const calcPercentage = (pnlUsd, tradeIndex) => {
    const balanceBefore = getBalanceBeforeTrade(tradeIndex);
    if (balanceBefore <= 0) return null;
    return (pnlUsd / balanceBefore) * 100;
  };

  const currentBalance = brokerInitialBalance + trades.reduce((sum, t) => sum + parseFloat(t.pnl_usd), 0);
  const totalPnlUsd = trades.reduce((sum, t) => sum + parseFloat(t.pnl_usd), 0);
  const totalPnlBrl = totalPnlUsd * currentRate;
  const totalPercentage = brokerInitialBalance > 0 ? (totalPnlUsd / brokerInitialBalance) * 100 : null;

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const tradesForDisplay = [...trades].reverse();

  const previewPnlBrl = form.pnl_usd && form.exchange_rate
    ? (parseFloat(form.pnl_usd) * parseFloat(form.exchange_rate))
    : null;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Trades Internacionais</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          + Novo Trade
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 items-center flex-wrap">
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
          <div className="text-sm text-gray-500">
            <span>Saldo Inicial: {formatCurrencyUSD(brokerInitialBalance)}</span>
            <span className="mx-2">|</span>
            <span>Saldo Atual: {formatCurrencyUSD(currentBalance)}</span>
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="flex gap-4 mb-6">
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: totalPnlUsd >= 0 ? '#dcfce7' : '#fee2e2' }}
        >
          <p className="font-medium" style={{ color: totalPnlUsd >= 0 ? GREEN : RED }}>
            P&L Total (USD): <span className="text-xl">{formatCurrencyUSD(totalPnlUsd)}</span>
            {totalPercentage !== null && (
              <span className="ml-2 text-sm">
                ({totalPercentage >= 0 ? '+' : ''}{totalPercentage.toFixed(2)}%)
              </span>
            )}
          </p>
        </div>
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: totalPnlBrl >= 0 ? '#dcfce7' : '#fee2e2' }}
        >
          <p className="font-medium" style={{ color: totalPnlBrl >= 0 ? GREEN : RED }}>
            P&L Total (BRL): <span className="text-xl">{formatCurrency(totalPnlBrl)}</span>
          </p>
        </div>
        {currentRate > 0 && (
          <div className="rounded-lg p-4 bg-gray-100">
            <p className="font-medium text-gray-700">
              Cotação Atual: <span className="text-xl">R$ {currentRate.toFixed(4)}</span>
            </p>
          </div>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : trades.length === 0 ? (
        <p className="text-gray-500">Nenhum trade encontrado</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo Antes (USD)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">P&L (USD)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">P&L (BRL)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tradesForDisplay.map((trade) => {
                const originalIndex = trades.findIndex(t => t.id === trade.id);
                const pnlUsd = parseFloat(trade.pnl_usd);
                const pnlBrl = pnlUsd * currentRate;
                const isPositive = pnlUsd >= 0;
                const balanceBefore = getBalanceBeforeTrade(originalIndex);
                const pct = calcPercentage(pnlUsd, originalIndex);

                return (
                  <tr key={trade.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(trade.trade_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {trade.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-500">
                      {formatCurrencyUSD(balanceBefore)}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-right font-bold"
                      style={{ color: isPositive ? GREEN : RED }}
                    >
                      {formatCurrencyUSD(pnlUsd)}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-right"
                      style={{ color: isPositive ? GREEN : RED }}
                    >
                      {formatCurrency(pnlBrl)}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-right"
                      style={{ color: isPositive ? GREEN : RED }}
                    >
                      {pct !== null ? (
                        <span>{isPositive ? '+' : ''}{pct.toFixed(2)}%</span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <button
                        onClick={() => openModal(trade)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(trade.id)}
                        style={{ color: RED }}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingTrade ? 'Editar Trade Internacional' : 'Novo Trade Internacional'}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Data</label>
            <input
              type="date"
              value={form.trade_date}
              onChange={(e) => setForm({ ...form, trade_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">P&L (USD)</label>
            <input
              type="number"
              step="0.01"
              value={form.pnl_usd}
              onChange={(e) => setForm({ ...form, pnl_usd: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Valores negativos para prejuízo"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Cotação USD/BRL</label>
            <input
              type="number"
              step="0.0001"
              value={form.exchange_rate}
              onChange={(e) => setForm({ ...form, exchange_rate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Ex: 5.1234"
              required
            />
          </div>

          {previewPnlBrl !== null && (
            <div className="mb-4 p-3 rounded-md" style={{ backgroundColor: previewPnlBrl >= 0 ? '#dcfce7' : '#fee2e2' }}>
              <p className="text-sm font-medium" style={{ color: previewPnlBrl >= 0 ? GREEN : RED }}>
                P&L em BRL: {formatCurrency(previewPnlBrl)}
              </p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">Descrição</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Ex: AAPL, SPY, ES, etc."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
