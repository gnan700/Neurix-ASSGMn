import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import Users from './pages/Users';
import UserBalances from './pages/UserBalances';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors">
          <Header />
          <main>            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/groups/:groupId" element={<GroupDetail />} />
              <Route path="/groups/:groupId/expenses" element={<GroupDetail />} />
              <Route path="/users" element={<Users />} />
              <Route path="/users/:userId/balances" element={<UserBalances />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
