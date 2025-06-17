import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { groupAPI, expenseAPI } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';

const GroupDetail = () => {
  const { groupId } = useParams();
  const location = useLocation();
  const [group, setGroup] = useState(null);
  const [balances, setBalances] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    paid_by: '',
    split_type: 'equal',
    splits: []
  });
  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  useEffect(() => {
    // Auto-open expense modal if URL contains /expenses
    if (location.pathname.includes('/expenses')) {
      setShowExpenseModal(true);
    }
  }, [location.pathname]);

  const fetchGroupData = async () => {
    try {
      const [groupResponse, balancesResponse, expensesResponse] = await Promise.all([
        groupAPI.getGroup(groupId),
        groupAPI.getGroupBalances(groupId),
        groupAPI.getGroupExpenses(groupId)
      ]);
      setGroup(groupResponse.data);
      setBalances(balancesResponse.data);
      setExpenses(expensesResponse.data);
    } catch (error) {
      console.error('Error fetching group data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      const expenseData = {
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        paid_by: parseInt(newExpense.paid_by)
      };

      if (newExpense.split_type === 'percentage') {
        expenseData.splits = newExpense.splits.map(split => ({
          ...split,
          percentage: parseFloat(split.percentage)
        }));
      }

      await expenseAPI.createExpense(groupId, expenseData);
      setShowExpenseModal(false);
      setNewExpense({
        description: '',
        amount: '',
        paid_by: '',
        split_type: 'equal',
        splits: []
      });
      fetchGroupData();
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  const initializePercentageSplits = () => {
    if (!group) return;
    const splitPercentage = 100 / group.members.length;
    setNewExpense(prev => ({
      ...prev,
      splits: group.members.map(member => ({
        user_id: member.id,
        percentage: splitPercentage.toFixed(2)
      }))
    }));
  };

  const updateSplitPercentage = (userId, percentage) => {
    setNewExpense(prev => ({
      ...prev,
      splits: prev.splits.map(split =>
        split.user_id === userId
          ? { ...split, percentage }
          : split
      )
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Group not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{group.name}</h1>
            {group.description && (
              <p className="mt-2 text-gray-600 dark:text-gray-400">{group.description}</p>
            )}
          </div>
          <Button onClick={() => {
            setShowExpenseModal(true);
            if (newExpense.split_type === 'percentage' && newExpense.splits.length === 0) {
              initializePercentageSplits();
            }
          }}>
            Add Expense
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Recent Expenses
              </h2>
              <div className="space-y-3">
                {expenses.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No expenses yet. Add your first expense to get started!
                  </p>
                ) : (
                  expenses.slice(0, 10).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {expense.description}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Paid by {expense.paid_by_user.name} • {expense.split_type} split
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(expense.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          ₹{expense.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Group Balances
              </h2>
              <div className="space-y-3">
                {balances.map((balance) => (
                  <div key={balance.user_id} className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {balance.user_name}
                      </h3>
                      <span className={`font-semibold ${
                        balance.net_balance > 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : balance.net_balance < 0 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {balance.net_balance > 0 ? '+' : ''}₹{balance.net_balance.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {balance.net_balance > 0 
                        ? 'Should receive' 
                        : balance.net_balance < 0 
                        ? 'Should pay' 
                        : 'Settled up'}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Group Info
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Members</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {group.members.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Total Expenses</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    ₹{group.total_expenses.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Created</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {new Date(group.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Members
              </h2>
              <div className="space-y-3">
                {group.members.map((member) => (
                  <div key={member.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{member.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <Modal
          isOpen={showExpenseModal}
          onClose={() => setShowExpenseModal(false)}
          title="Add New Expense"
        >
          <form onSubmit={handleCreateExpense} className="space-y-4">
            <Input
              label="Description"
              value={newExpense.description}
              onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What was this expense for?"
              required
            />
            
            <Input
              label="Amount (₹)"
              type="number"
              step="0.01"
              value={newExpense.amount}
              onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Who paid?
              </label>
              <select
                value={newExpense.paid_by}
                onChange={(e) => setNewExpense(prev => ({ ...prev, paid_by: e.target.value }))}
                className="block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100"
                required
              >
                <option value="">Select who paid</option>
                {group.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Split Type
              </label>
              <select
                value={newExpense.split_type}
                onChange={(e) => {
                  const splitType = e.target.value;
                  setNewExpense(prev => ({ ...prev, split_type: splitType }));
                  if (splitType === 'percentage') {
                    initializePercentageSplits();
                  }
                }}
                className="block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100"
              >
                <option value="equal">Equal Split</option>
                <option value="percentage">Percentage Split</option>
              </select>
            </div>

            {newExpense.split_type === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Split Percentages
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {newExpense.splits.map((split) => {
                    const member = group.members.find(m => m.id === split.user_id);
                    return (
                      <div key={split.user_id} className="flex items-center space-x-2">
                        <span className="text-sm text-gray-900 dark:text-gray-100 w-20">
                          {member?.name}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          value={split.percentage}
                          onChange={(e) => updateSplitPercentage(split.user_id, e.target.value)}
                          className="flex-1 rounded border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-2 py-1 text-sm text-gray-900 dark:text-gray-100"
                        />
                        <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Total: {newExpense.splits.reduce((sum, split) => sum + parseFloat(split.percentage || 0), 0).toFixed(2)}%
                </p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowExpenseModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={!newExpense.description || !newExpense.amount || !newExpense.paid_by}
              >
                Add Expense
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default GroupDetail;
