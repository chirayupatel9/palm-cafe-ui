import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useFeatures } from '../contexts/FeatureContext';
import { 
  Users, Plus, Edit, Trash2, X, Search, 
  Loader, AlertCircle, Lock 
} from 'lucide-react';
import LockedFeature from './ui/LockedFeature';

const CafeUserManagement = () => {
  const { user: currentUser } = useAuth();
  const { hasFeature, loading: featuresLoading } = useFeatures();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'admin'
  });
  const [deletingUserId, setDeletingUserId] = useState(null);

  // Check access control
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      fetchUsers();
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 403) {
        toast.error('Access denied. Admin privileges required.');
      } else {
        toast.error('Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('/users', formData);
      toast.success('User added');
      setShowCreateModal(false);
      setFormData({ username: '', email: '', password: '', role: 'admin' });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.error || 'Failed to create user');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const updateData = {
        username: formData.username,
        email: formData.email,
        role: formData.role
      };
      
      // Only include password if provided
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      await axios.put(`/users/${editingUser.id}`, updateData);
      toast.success('Changes saved');
      setShowEditModal(false);
      setEditingUser(null);
      setFormData({ username: '', email: '', password: '', role: 'admin' });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDelete = async (userId) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!window.confirm(`This will deactivate ${userToDelete?.username || 'this user'} and revoke their access to the system. They will no longer be able to log in. Continue?`)) {
      return;
    }
    
    try {
      setDeletingUserId(userId);
      await axios.delete(`/users/${userId}`);
      toast.success('User deactivated');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.error || 'Failed to disable user');
    } finally {
      setDeletingUserId(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Access control check
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-secondary-600 dark:text-gray-400">Access denied. Admin privileges required.</p>
        </div>
      </div>
    );
  }

  // Feature flag check
  if (featuresLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-secondary-500" />
      </div>
    );
  }

  if (!hasFeature('users')) {
    return (
      <LockedFeature 
        featureName="User Management" 
        requiredPlan="Pro"
        description="Manage team members, roles, and permissions for your cafe. Create and manage admin, chef, and reception accounts."
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-secondary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-700 dark:text-gray-100 flex items-center">
            <Users className="h-6 w-6 mr-2" />
            User Management
          </h2>
          <p className="text-sm text-secondary-500 dark:text-gray-400 mt-1">
            Add team members, assign roles, and manage access permissions
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-secondary-600 hover:bg-secondary-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users by username, email, or role..."
            className="w-full pl-10 pr-3 py-2 border border-accent-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-accent-200 dark:divide-gray-700">
            <thead className="bg-accent-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-gray-300 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-accent-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-accent-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-secondary-900 dark:text-gray-100">
                        {user.username}
                      </div>
                      <div className="text-sm text-secondary-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      user.role === 'chef' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      user.role === 'reception' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-gray-400">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-gray-400">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-secondary-600 hover:text-secondary-900 dark:text-gray-400 dark:hover:text-gray-100"
                        title="Edit user"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={deletingUserId === user.id}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                          title="Disable user"
                        >
                          {deletingUserId === user.id ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-secondary-500 dark:text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{searchTerm ? `No users found matching "${searchTerm}". Try a different search term.` : 'Team members will appear here once you add them. Add your first user to start managing access and permissions.'}</p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-accent-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-secondary-700 dark:text-gray-100">
                  Add User
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ username: '', email: '', password: '', role: 'admin' });
                  }}
                  className="text-secondary-500 hover:text-secondary-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-accent-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-accent-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-accent-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 dark:bg-gray-700 dark:text-gray-100"
                />
                <p className="text-xs text-secondary-500 dark:text-gray-400 mt-1">
                  Must be at least 6 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-accent-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="admin">Admin</option>
                  <option value="chef">Chef</option>
                  <option value="reception">Reception</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-accent-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ username: '', email: '', password: '', role: 'admin' });
                  }}
                  className="px-4 py-2 border border-accent-300 dark:border-gray-600 text-secondary-700 dark:text-gray-300 rounded-lg hover:bg-accent-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg transition-colors"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-accent-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-secondary-700 dark:text-gray-100">
                  Edit User
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    setFormData({ username: '', email: '', password: '', role: 'admin' });
                  }}
                  className="text-secondary-500 hover:text-secondary-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-accent-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-accent-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                  Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  minLength={6}
                  className="w-full px-3 py-2 border border-accent-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 dark:bg-gray-700 dark:text-gray-100"
                />
                <p className="text-xs text-secondary-500 dark:text-gray-400 mt-1">
                  Leave blank to keep current password
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-accent-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="admin">Admin</option>
                  <option value="chef">Chef</option>
                  <option value="reception">Reception</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-accent-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    setFormData({ username: '', email: '', password: '', role: 'admin' });
                  }}
                  className="px-4 py-2 border border-accent-300 dark:border-gray-600 text-secondary-700 dark:text-gray-300 rounded-lg hover:bg-accent-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg transition-colors"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CafeUserManagement;
