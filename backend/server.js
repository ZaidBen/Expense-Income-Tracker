// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/expenses');

const ExpenseSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  category: String,
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['income', 'expense'], default: 'expense' }
});

const Expense = mongoose.model('Expense', ExpenseSchema);

// Get expenses with optional filtering
app.get('/api/expenses', async (req, res) => {
  try {
    const { category, type, startDate, endDate } = req.query;
    let query = {};
    
    if (category) query.category = category;
    if (type) query.type = type;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get summary statistics
app.get('/api/summary', async (req, res) => {
  try {
    const [expenses, income] = await Promise.all([
      Expense.aggregate([
        { $match: { type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Expense.aggregate([
        { $match: { type: 'income' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);
    
    const totalExpenses = expenses[0]?.total || 0;
    const totalIncome = income[0]?.total || 0;
    
    res.json({
      totalExpenses,
      totalIncome,
      balance: totalIncome - totalExpenses
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));