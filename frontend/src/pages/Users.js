import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userAPI } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';

const Users = () => {  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await userAPI.createUser(newUser);
      setShowCreateModal(false);
      setNewUser({ name: '', email: '' });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await userAPI.updateUser(editingUser.id, editingUser);
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user. Please try again.');
    }
  };

  const handleDeleteUser = (user) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    try {
      await userAPI.deleteUser(deletingUser.id);
      setShowDeleteModal(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      if (error.response?.status === 400) {
        alert('Cannot delete user with outstanding balances. Please settle all debts first.');
      } else {
        alert('Failed to delete user. Please try again.');
      }
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Users</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage users in your system
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            Add User
          </Button>
        </div>

        {users.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No users yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Add users to start creating groups and tracking expenses
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              Add Your First User
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <Card key={user.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-primary-600 dark:text-primary-400">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {user.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Member since</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>                </div>
                
                <div className="space-x-2 mb-3">
                  <Link to={`/users/${user.id}/balances`}>
                    <Button variant="outline" className="w-full">
                      View Balances
                    </Button>
                  </Link>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditUser(user)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteUser(user)}
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Add New User"
        >
          <form onSubmit={handleCreateUser} className="space-y-4">
            <Input
              label="Full Name"
              value={newUser.name}
              onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter full name"
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
              required
            />

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={!newUser.name || !newUser.email}
              >
                Add User
              </Button>            </div>
          </form>
        </Modal>

        {/* Edit User Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingUser(null);
          }}
          title="Edit User"
        >
          {editingUser && (
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <Input
                label="Full Name"
                value={editingUser.name}
                onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
                required
              />
              <Input
                label="Email Address"
                type="email"
                value={editingUser.email}
                onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                required
              />

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!editingUser.name || !editingUser.email}
                >
                  Update User
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* Delete User Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeletingUser(null);
          }}
          title="Delete User"
        >
          {deletingUser && (
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Warning: This action cannot be undone
                    </h3>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                      Are you sure you want to delete "{deletingUser.name}"? The user will be removed from all groups and their expense history will be deleted.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingUser(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={confirmDeleteUser}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete User
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Users;
