import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Users, Building, Search, Edit, Check } from 'lucide-react';
import Dialog from './ui/Dialog';
import Select from './ui/Select';

const SuperAdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState([]);
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCafeId, setFilterCafeId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [selectedCafeId, setSelectedCafeId] = useState('');

  useEffect(() => {
    fetchCafes();
    fetchUsers();
  }, [filterCafeId]);

  const fetchCafes = async () => {
    try {
      const response = await axios.get('/superadmin/cafes');
      setCafes(response.data);
    } catch (error) {
      console.error('Error fetching cafes:', error);
      toast.error('Failed to load cafes');
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const url = filterCafeId 
        ? `/superadmin/users?cafe_id=${filterCafeId}`
        : '/superadmin/users';
      const response = await axios.get(url);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCafe = async (userId, cafeId) => {
    if (!cafeId) {
      toast.error('Please select a cafe');
      return;
    }

    try {
      await axios.put(`/superadmin/users/${userId}/assign-cafe`, { cafe_id: parseInt(cafeId) });
      toast.success('User assigned to cafe successfully');
      setEditingUser(null);
      setSelectedCafeId('');
      fetchUsers();
    } catch (error) {
      console.error('Error assigning user to cafe:', error);
      toast.error(error.response?.data?.error || 'Failed to assign user to cafe');
    }
  };

  const getCafeName = (cafeId) => {
    if (!cafeId) return 'No Cafe';
    const cafe = cafes.find(c => c.id === cafeId);
    return cafe ? cafe.name : 'Unknown Cafe';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-secondary-700 dark:text-gray-100">
          User Management
        </h2>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              Filter by Cafe
            </label>
            <Select
              options={[
                { value: '', label: 'All Cafes' },
                ...cafes.map(c => ({ value: String(c.id), label: c.name }))
              ]}
              value={filterCafeId === '' ? '' : String(filterCafeId)}
              onChange={(v) => setFilterCafeId(v)}
              placeholder="All Cafes"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              Search Users
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by username, email, or role..."
                className="input-field pl-12"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-accent-200 dark:divide-gray-700">
            <thead className="bg-accent-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                  User
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                  Role
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                  Cafe
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                  Created
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                  Last Login
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-accent-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-accent-50 dark:hover:bg-gray-700">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-secondary-900 dark:text-gray-100">
                        {user.username}
                      </div>
                      <div className="text-sm text-secondary-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'superadmin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      user.role === 'admin' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      user.role === 'chef' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-secondary-500 dark:text-gray-400">
                      <Building className="h-4 w-4 mr-1" />
                      {user.cafe_name || user.cafe_slug || 'No Cafe'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-gray-400">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-gray-400">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {user.role !== 'superadmin' && (
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setSelectedCafeId(user.cafe_id || '');
                        }}
                        className="text-secondary-600 hover:text-secondary-900 dark:text-gray-400 dark:hover:text-gray-100"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-secondary-500 dark:text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No users found</p>
          </div>
        )}
      </div>

      {/* Assign Cafe Modal - Template Dialog */}
      <Dialog
        open={!!editingUser}
        onClose={() => { setEditingUser(null); setSelectedCafeId(''); }}
        title="Assign User to Cafe"
      >
        {editingUser && (
            <div className="space-y-4 pt-0">
              <div>
                <p className="text-sm text-secondary-600 dark:text-gray-400 mb-2">
                  User: <span className="font-semibold">{editingUser.username}</span>
                </p>
                <p className="text-sm text-secondary-600 dark:text-gray-400">
                  Current Cafe: <span className="font-semibold">{getCafeName(editingUser.cafe_id)}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                  Select Cafe
                </label>
                <Select
                  options={[
                    { value: '', label: 'No Cafe (Unassign)' },
                    ...cafes.map(c => ({ value: String(c.id), label: c.name }))
                  ]}
                  value={selectedCafeId === '' ? '' : String(selectedCafeId)}
                  onChange={setSelectedCafeId}
                  placeholder="No Cafe (Unassign)"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-accent-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setEditingUser(null);
                    setSelectedCafeId('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAssignCafe(editingUser.id, selectedCafeId)}
                  className="px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg transition-colors"
                >
                  Assign
                </button>
              </div>
            </div>
        )}
      </Dialog>
    </div>
  );
};

export default SuperAdminUserManagement;
