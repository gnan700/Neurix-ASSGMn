import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User API
export const userAPI = {
  createUser: (userData) => api.post('/users/', userData),
  getUsers: () => api.get('/users/'),
  getUser: (userId) => api.get(`/users/${userId}`),
  updateUser: (userId, userData) => api.put(`/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/users/${userId}`),
  getUserBalances: (userId) => api.get(`/users/${userId}/balances`),
};

// Group API
export const groupAPI = {
  createGroup: (groupData) => api.post('/groups/', groupData),
  getGroups: () => api.get('/groups/'),
  getGroup: (groupId) => api.get(`/groups/${groupId}`),
  updateGroup: (groupId, groupData) => api.put(`/groups/${groupId}`, groupData),
  deleteGroup: (groupId) => api.delete(`/groups/${groupId}`),
  getGroupBalances: (groupId) => api.get(`/groups/${groupId}/balances`),
  getGroupExpenses: (groupId) => api.get(`/groups/${groupId}/expenses`),
  addMembersToGroup: (groupId, userIds) => api.post(`/groups/${groupId}/members`, { user_ids: userIds }),
  removeMemberFromGroup: (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}`),
};

// Expense API
export const expenseAPI = {
  createExpense: (groupId, expenseData) => api.post(`/groups/${groupId}/expenses`, expenseData),
};

// Settlement API
export const settlementAPI = {
  createSettlement: (settlementData) => api.post('/settlements/', settlementData),
  getGroupSettlements: (groupId) => api.get(`/groups/${groupId}/settlements`),
};

export default api;
