import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { groupAPI, userAPI } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [deletingGroup, setDeletingGroup] = useState(null);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    user_ids: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [groupsResponse, usersResponse] = await Promise.all([
        groupAPI.getGroups(),
        userAPI.getUsers()
      ]);
      setGroups(groupsResponse.data);
      setUsers(usersResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await groupAPI.createGroup(newGroup);
      setShowCreateModal(false);
      setNewGroup({ name: '', description: '', user_ids: [] });
      fetchData();
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleEditGroup = (group) => {
    setEditingGroup({
      ...group,
      user_ids: group.members.map(member => member.id)
    });
    setShowEditModal(true);
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    try {
      await groupAPI.updateGroup(editingGroup.id, editingGroup);
      setShowEditModal(false);
      setEditingGroup(null);
      fetchData();
    } catch (error) {
      console.error('Error updating group:', error);
      alert('Failed to update group. Please try again.');
    }
  };

  const handleDeleteGroup = (group) => {
    setDeletingGroup(group);
    setShowDeleteModal(true);
  };

  const confirmDeleteGroup = async () => {
    try {
      await groupAPI.deleteGroup(deletingGroup.id);
      setShowDeleteModal(false);
      setDeletingGroup(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting group:', error);
      if (error.response?.status === 400) {
        alert('Cannot delete group with outstanding balances. Please settle all debts first.');
      } else {
        alert('Failed to delete group. Please try again.');
      }
    }
  };

  const handleUserToggle = (userId) => {
    setNewGroup(prev => ({
      ...prev,
      user_ids: prev.user_ids.includes(userId)
        ? prev.user_ids.filter(id => id !== userId)
        : [...prev.user_ids, userId]
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Groups</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your expense groups
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            Create Group
          </Button>
        </div>

        {groups.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No groups yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Create your first group to start tracking shared expenses
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create Your First Group
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <Card key={group.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {group.name}
                    </h3>
                    {group.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {group.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Members</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {group.members.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      ₹{(group.total_expenses || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex -space-x-2 mb-4">
                  {group.members.slice(0, 4).map((member) => (
                    <div
                      key={member.id}
                      className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 border-2 border-white dark:border-dark-800 flex items-center justify-center"
                      title={member.name}
                    >
                      <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  ))}
                  {group.members.length > 4 && (
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-dark-800 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        +{group.members.length - 4}
                      </span>
                    </div>
                  )}
                </div>                <div className="flex space-x-2 mb-2">
                  <Link to={`/groups/${group.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Link to={`/groups/${group.id}/expenses`} className="flex-1">
                    <Button className="w-full">
                      Add Expense
                    </Button>
                  </Link>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditGroup(group)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteGroup(group)}
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
          title="Create New Group"
        >
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <Input
              label="Group Name"
              value={newGroup.name}
              onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter group name"
              required
            />
            <Input
              label="Description (Optional)"
              value={newGroup.description}
              onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter group description"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Members
              </label>
              <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-300 dark:border-dark-600 rounded-lg p-3">
                {users.map((user) => (
                  <label key={user.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newGroup.user_ids.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100">{user.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">({user.email})</span>
                  </label>
                ))}
                {users.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                    No users available. Create users first.
                  </p>
                )}
              </div>
            </div>

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
                disabled={!newGroup.name || newGroup.user_ids.length === 0}
              >
                Create Group
              </Button>            </div>
          </form>
        </Modal>

        {/* Edit Group Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingGroup(null);
          }}
          title="Edit Group"
        >
          {editingGroup && (
            <form onSubmit={handleUpdateGroup} className="space-y-4">
              <Input
                label="Group Name"
                value={editingGroup.name}
                onChange={(e) => setEditingGroup(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter group name"
                required
              />
              <Input
                label="Description"
                value={editingGroup.description || ''}
                onChange={(e) => setEditingGroup(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter group description (optional)"
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Group Members
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {users.map((user) => (
                    <label key={user.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingGroup.user_ids.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditingGroup(prev => ({
                              ...prev,
                              user_ids: [...prev.user_ids, user.id]
                            }));
                          } else {
                            setEditingGroup(prev => ({
                              ...prev,
                              user_ids: prev.user_ids.filter(id => id !== user.id)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{user.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingGroup(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!editingGroup.name || editingGroup.user_ids.length === 0}
                >
                  Update Group
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* Delete Group Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeletingGroup(null);
          }}
          title="Delete Group"
        >
          {deletingGroup && (
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
                      Are you sure you want to delete "{deletingGroup.name}"? All expenses and settlements for this group will be permanently deleted.
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
                    setDeletingGroup(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={confirmDeleteGroup}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Group
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Groups;
