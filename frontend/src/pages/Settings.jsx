import { useState, useEffect } from 'react';
import api from '../services/api';
import { formatCurrency, formatCurrencyUSD } from '../hooks/useApi';

const ACCOUNT_LABELS = {
  bank: 'Banco (Nubank)',
  broker: 'Corretora (Clear)',
  broker_international: 'Corretora Int. (Binance)'
};

const ACCOUNT_COLORS = {
  bank: 'text-purple-600',
  broker: 'text-green-600',
  broker_international: 'text-blue-600'
};

export default function Settings() {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ initial_balance: '', reference_date: '' });
  const [balanceForm, setBalanceForm] = useState({
    account_type: 'bank',
    initial_balance: '',
    reference_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/balances');
      setBalances(res.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBalanceSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/balances', {
        ...balanceForm,
        initial_balance: parseFloat(balanceForm.initial_balance)
      });
      setBalanceForm({
        account_type: 'bank',
        initial_balance: '',
        reference_date: new Date().toISOString().split('T')[0]
      });
      loadData();
    } catch (error) {
      console.error('Erro ao salvar saldo:', error);
      alert('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (balance) => {
    setEditingId(balance.id);
    setEditForm({
      initial_balance: balance.initial_balance,
      reference_date: balance.reference_date.split('T')[0]
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ initial_balance: '', reference_date: '' });
  };

  const handleEditSubmit = async (id) => {
    setSaving(true);
    try {
      await api.put(`/balances/${id}`, {
        initial_balance: parseFloat(editForm.initial_balance),
        reference_date: editForm.reference_date
      });
      setEditingId(null);
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar saldo:', error);
      alert('Erro ao atualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBalance = async (id) => {
    if (!confirm('Deseja excluir este saldo?')) return;
    try {
      await api.delete(`/balances/${id}`);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  };

  if (loading) {
    return <p className="text-gray-500">Carregando...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Configurações</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Adicionar Saldo Inicial</h2>

        <form onSubmit={handleBalanceSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Conta</label>
              <select
                value={balanceForm.account_type}
                onChange={(e) => setBalanceForm({ ...balanceForm, account_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="bank">Banco (Nubank)</option>
                <option value="broker">Corretora (Clear)</option>
                <option value="broker_international">Corretora Int. (Binance)</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Saldo Inicial ({balanceForm.account_type === 'broker_international' ? 'USD' : 'R$'})
              </label>
              <input
                type="number"
                step="0.01"
                value={balanceForm.initial_balance}
                onChange={(e) => setBalanceForm({ ...balanceForm, initial_balance: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Data Ref.</label>
              <input
                type="date"
                value={balanceForm.reference_date}
                onChange={(e) => setBalanceForm({ ...balanceForm, reference_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-bold text-gray-800">Saldos Cadastrados</h2>
        </div>

        {balances.length === 0 ? (
          <p className="text-gray-500 text-sm p-6">Nenhum saldo cadastrado</p>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conta</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo Inicial</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Data Ref.</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {balances.map(balance => (
                <tr key={balance.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${ACCOUNT_COLORS[balance.account_type]}`}>
                      {ACCOUNT_LABELS[balance.account_type]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingId === balance.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.initial_balance}
                        onChange={(e) => setEditForm({ ...editForm, initial_balance: e.target.value })}
                        className="w-40 px-2 py-1 border border-gray-300 rounded-md text-right"
                        autoFocus
                      />
                    ) : (
                      <span className="text-gray-800 font-medium">
                        {balance.account_type === 'broker_international'
                          ? formatCurrencyUSD(balance.initial_balance)
                          : formatCurrency(balance.initial_balance)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {editingId === balance.id ? (
                      <input
                        type="date"
                        value={editForm.reference_date}
                        onChange={(e) => setEditForm({ ...editForm, reference_date: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded-md"
                      />
                    ) : (
                      <span className="text-sm text-gray-500">
                        {new Date(balance.reference_date).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingId === balance.id ? (
                      <>
                        <button
                          onClick={() => handleEditSubmit(balance.id)}
                          disabled={saving}
                          className="text-green-600 hover:text-green-800 text-sm mr-3"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-gray-500 hover:text-gray-700 text-sm"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(balance)}
                          className="text-blue-600 hover:text-blue-800 text-sm mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteBalance(balance.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Excluir
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
