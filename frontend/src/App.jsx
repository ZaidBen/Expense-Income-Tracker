import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

export default function ExpenseTracker() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalExpenses: 0, totalIncome: 0, balance: 0 });
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'food',
    type: 'expense'
  });

  const categories = ['food', 'transport', 'utilities', 'entertainment', 'other'];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    fetchTransactions();
    fetchSummary();
  }, []);

  const fetchTransactions = async () => {
    const response = await fetch('http://localhost:5000/api/expenses');
    const data = await response.json();
    setTransactions(data);
  };

  const fetchSummary = async () => {
    const response = await fetch('http://localhost:5000/api/summary');
    const data = await response.json();
    setSummary(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    await fetch('http://localhost:5000/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        amount: Number(formData.amount)
      })
    });

    setFormData({
      description: '',
      amount: '',
      category: 'food',
      type: 'expense'
    });

    fetchTransactions();
    fetchSummary();
  };

  const deleteTransaction = async (id) => {
    await fetch(`http://localhost:5000/api/expenses/${id}`, {
      method: 'DELETE'
    });
    fetchTransactions();
    fetchSummary();
  };

  // Prepare data for pie chart
  const categoryData = categories.map(cat => ({
    name: cat,
    value: transactions
      .filter(t => t.type === 'expense' && t.category === cat)
      .reduce((sum, t) => sum + t.amount, 0)
  })).filter(d => d.value > 0);

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6">
      {/* Income, Expenses, and Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Income</h2>
          <p className="text-2xl text-green-600">${summary.totalIncome.toFixed(2)}</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Expenses</h2>
          <p className="text-2xl text-red-600">${summary.totalExpenses.toFixed(2)}</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Balance</h2>
          <p className={`text-2xl ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${summary.balance.toFixed(2)}
          </p>
        </div>
        
      </div>

      {/* Add Transaction and Pie Chart */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          {/* Add Transaction Form */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Add Transaction</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Amount</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add Transaction
                </button>
              </div>
            </form>
          </div>

          {/* Pie Chart for Expense Categories */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Expense Categories</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {transactions.map(transaction => (
              <div 
                key={transaction._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-gray-600">
                    {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => deleteTransaction(transaction._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
