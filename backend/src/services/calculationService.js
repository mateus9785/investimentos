const Balance = require('../models/Balance');
const Expense = require('../models/Expense');
const Trade = require('../models/Trade');
const InternationalTrade = require('../models/InternationalTrade');
const Goal = require('../models/Goal');

async function fetchExchangeRate() {
  try {
    const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
    const data = await response.json();
    return parseFloat(data.USDBRL.ask);
  } catch {
    return 0;
  }
}

const calculationService = {
  async getDashboardSummary(userId, month, year) {
    const [
      bankBalance,
      brokerBalance,
      brokerInternationalBalance,
      totalExpenses,
      totalPnl,
      dailyAverage,
      expensesByCategory,
      goal,
      totalPnlUsd,
      totalPnlIntBrl,
      exchangeRate
    ] = await Promise.all([
      Balance.findByType(userId, 'bank'),
      Balance.findByType(userId, 'broker'),
      Balance.findByType(userId, 'broker_international'),
      Expense.sumByUser(userId, month, year),
      Trade.sumByUser(userId, month, year),
      Trade.getDailyAverage(userId, month, year),
      Expense.sumByCategory(userId, month, year),
      Goal.findByUser(userId),
      InternationalTrade.sumByUserUsd(userId, month, year),
      InternationalTrade.sumByUser(userId, month, year),
      fetchExchangeRate()
    ]);

    const initialBankBalance = bankBalance ? parseFloat(bankBalance.initial_balance) : 0;
    const initialBrokerBalance = brokerBalance ? parseFloat(brokerBalance.initial_balance) : 0;
    const initialBrokerInternationalBalance = brokerInternationalBalance ? parseFloat(brokerInternationalBalance.initial_balance) : 0;

    const currentBankBalance = initialBankBalance - totalExpenses;
    const currentBrokerBalance = initialBrokerBalance + totalPnl;
    const currentBrokerInternationalBalance = initialBrokerInternationalBalance + totalPnlUsd;
    const brokerInternationalBrl = currentBrokerInternationalBalance * exchangeRate;
    const totalBalance = currentBankBalance + currentBrokerBalance + brokerInternationalBrl;

    const combinedPnl = totalPnl + totalPnlIntBrl;

    let goalProgress = {
      totalBalance: { target: 0, current: totalBalance, percentage: 0 },
      monthlyProfit: { target: 0, current: combinedPnl, percentage: 0 }
    };

    if (goal) {
      const totalTarget = parseFloat(goal.total_balance) || 0;
      const profitTarget = parseFloat(goal.monthly_profit) || 0;

      goalProgress = {
        totalBalance: {
          target: totalTarget,
          current: totalBalance,
          percentage: totalTarget > 0 ? Math.min((totalBalance / totalTarget) * 100, 100) : 0
        },
        monthlyProfit: {
          target: profitTarget,
          current: combinedPnl,
          percentage: profitTarget > 0 ? Math.min((combinedPnl / profitTarget) * 100, 100) : 0
        }
      };
    }

    return {
      balances: {
        bank: {
          initial: initialBankBalance,
          current: currentBankBalance
        },
        broker: {
          initial: initialBrokerBalance,
          current: currentBrokerBalance
        },
        broker_international: {
          initial: initialBrokerInternationalBalance,
          current: currentBrokerInternationalBalance
        },
        total: totalBalance
      },
      month: {
        expenses: totalExpenses,
        pnl: combinedPnl,
        pnlDomestic: totalPnl,
        pnlInternationalBrl: totalPnlIntBrl,
        dailyAverage
      },
      exchangeRate,
      expensesByCategory,
      goalProgress
    };
  }
};

module.exports = calculationService;
