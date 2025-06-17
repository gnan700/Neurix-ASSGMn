import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userAPI, settlementAPI } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';

const UserBalances = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const [userResponse, balancesResponse] = await Promise.all([
        userAPI.getUser(userId),
        userAPI.getUserBalances(userId)
      ]);
      setUser(userResponse.data);
      setBalances(balancesResponse.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettleUp = (balance) => {
    setSelectedBalance(balance);
    setShowSettleModal(true);
  };  const confirmSettle = async () => {
    try {
      // Determine who pays whom based on the balance structure
      let fromUserId, toUserId;
      
      if (selectedBalance.net_balance < 0) {
        // Current user owes money - they pay to someone who they owe
        fromUserId = parseInt(userId);
        if (selectedBalance.owes_to && selectedBalance.owes_to.length > 0) {
          toUserId = selectedBalance.owes_to[0].user_id;
        } else {
          alert('Unable to determine who to pay. Please check the balance details.');
          return;
        }
      } else {
        // Current user is owed money - someone pays them
        if (selectedBalance.owed_by && selectedBalance.owed_by.length > 0) {
          fromUserId = selectedBalance.owed_by[0].user_id;
          toUserId = parseInt(userId);
        } else {
          alert('Unable to determine who should pay. Please check the balance details.');
          return;
        }
      }
      
      const settlementData = {
        from_user_id: fromUserId,
        to_user_id: toUserId,
        amount: Math.abs(selectedBalance.net_balance),
        group_id: selectedBalance.group_id,
        description: `Settlement for ${selectedBalance.group_name}`
      };
      
      await settlementAPI.createSettlement(settlementData);
      
      // Show success message
      alert(`Settlement recorded successfully! Balance updated.`);
      
      setShowSettleModal(false);
      setSelectedBalance(null);
      
      // Refresh balances to show updated data
      fetchUserData();
    } catch (error) {
      console.error('Error creating settlement:', error);
      alert('Error recording settlement. Please try again.');
    }
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User not found</h2>
        </div>
      </div>
    );
  }

  const totalOwed = balances.reduce((sum, balance) => 
    balance.net_balance < 0 ? sum + Math.abs(balance.net_balance) : sum, 0
  );
  
  const totalOwing = balances.reduce((sum, balance) => 
    balance.net_balance > 0 ? sum + balance.net_balance : sum, 0
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/users" className="text-primary-600 dark:text-primary-400 hover:underline mb-2 inline-block">
              ← Back to Users
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {user.name}'s Balances
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">You owe</p>                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  ₹{totalOwed.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">You are owed</p>                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ₹{totalOwing.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Net balance</p>
                <p className={`text-2xl font-bold ${
                  (totalOwing - totalOwed) > 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : (totalOwing - totalOwed) < 0 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  ₹{(totalOwing - totalOwed).toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {balances.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                All settled up!
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                You have no outstanding balances across all groups.
              </p>
            </Card>
          ) : (
            balances.map((balance) => (
              <Card key={balance.user_id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-primary-600 dark:text-primary-400">
                        {balance.user_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4">                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {balance.group_name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {balance.net_balance > 0 
                          ? balance.owed_by.length > 0 
                            ? `${balance.owed_by[0].user_name} owes you ₹${balance.net_balance.toFixed(2)}`
                            : `You are owed ₹${balance.net_balance.toFixed(2)}`
                          : balance.net_balance < 0 
                          ? balance.owes_to.length > 0
                            ? `You owe ${balance.owes_to[0].user_name} ₹${Math.abs(balance.net_balance).toFixed(2)}`
                            : `You owe ₹${Math.abs(balance.net_balance).toFixed(2)}`
                          : 'You are settled up'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`text-xl font-bold ${
                      balance.net_balance > 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : balance.net_balance < 0 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {balance.net_balance > 0 ? '+' : ''}₹{balance.net_balance.toFixed(2)}
                    </span>
                    
                    {balance.net_balance !== 0 && (
                      <Button
                        size="sm"
                        variant={balance.net_balance < 0 ? "primary" : "outline"}
                        onClick={() => handleSettleUp(balance)}
                      >
                        {balance.net_balance < 0 ? "Settle Up" : "Record Payment"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <Modal
          isOpen={showSettleModal}
          onClose={() => setShowSettleModal(false)}
          title="Settle Up"
        >
          {selectedBalance && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedBalance.net_balance < 0 
                    ? selectedBalance.owes_to.length > 0
                      ? `You are about to pay ${selectedBalance.owes_to[0].user_name}:`
                      : 'You are about to settle your debt:'
                    : selectedBalance.owed_by.length > 0
                      ? `You are about to record payment from ${selectedBalance.owed_by[0].user_name}:`
                      : 'You are about to record a payment:'}
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedBalance.net_balance < 0 
                    ? `Pay ₹${Math.abs(selectedBalance.net_balance).toFixed(2)}` 
                    : `Confirm receipt of ₹${selectedBalance.net_balance.toFixed(2)}`}
                </p>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Note:</strong> This is a demo app. In a real application, this would integrate with payment systems like PayPal, Venmo, or bank transfers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSettleModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={confirmSettle}
                  className="flex-1"
                >
                  Confirm Settlement
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default UserBalances;
