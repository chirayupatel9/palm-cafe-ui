import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Users, Building, Search, Edit, KeyRound } from 'lucide-react';
import Dialog from './ui/Dialog';
import Select from './ui/Select';

const SuperAdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState([]);
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCafeId, setFilterCafeId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedCafeId, setSelectedCafeId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [superAdminPwdTarget, setSuperAdminPwdTarget] = useState<any>(null);
  const [saNewPassword, setSaNewPassword] = useState('');
  const [saConfirmPassword, setSaConfirmPassword] = useState('');
  const [saActorPassword, setSaActorPassword] = useState('');

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

  const handleSaveUser = async () => {
    if (!editingUser) return;
    const pwd = newPassword.trim();
    const hasPwd = pwd.length > 0;
    const cafeIdNum = selectedCafeId ? parseInt(String(selectedCafeId), 10) : null;
    const prevCafe = editingUser.cafe_id != null ? Number(editingUser.cafe_id) : null;
    const cafeChanged = cafeIdNum != null && cafeIdNum !== prevCafe;

    if (!hasPwd && !cafeChanged) {
      toast.error('Select a different cafe or enter a new password');
      return;
    }

    if (hasPwd) {
      if (pwd.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      if (pwd !== confirmPassword.trim()) {
        toast.error('Passwords do not match');
        return;
      }
      try {
        await axios.put(`/superadmin/users/${editingUser.id}`, { password: pwd });
      } catch (error: any) {
        console.error('Error resetting password:', error);
        toast.error(error?.response?.data?.error || 'Failed to reset password');
        return;
      }
    }

    if (cafeChanged && cafeIdNum != null) {
      try {
        await axios.put(`/superadmin/users/${editingUser.id}/assign-cafe`, { cafe_id: cafeIdNum });
      } catch (error: any) {
        console.error('Error assigning user to cafe:', error);
        toast.error(error?.response?.data?.error || 'Failed to assign user to cafe');
        return;
      }
    }

    toast.success(
      hasPwd && cafeChanged ? 'Password and cafe updated' : hasPwd ? 'Password reset' : 'Cafe assignment updated'
    );
    setEditingUser(null);
    setSelectedCafeId('');
    setNewPassword('');
    setConfirmPassword('');
    fetchUsers();
  };

  const handleSuperAdminPasswordSave = async () => {
    if (!superAdminPwdTarget) return;
    const pwd = saNewPassword.trim();
    if (pwd.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (pwd !== saConfirmPassword.trim()) {
      toast.error('New passwords do not match');
      return;
    }
    if (!saActorPassword) {
      toast.error('Enter your current password to confirm');
      return;
    }
    try {
      await axios.post(`/superadmin/users/${superAdminPwdTarget.id}/reset-superadmin-password`, {
        newPassword: pwd,
        actorPassword: saActorPassword
      });
      toast.success('Super Admin password updated');
      setSuperAdminPwdTarget(null);
      setSaNewPassword('');
      setSaConfirmPassword('');
      setSaActorPassword('');
      fetchUsers();
    } catch (error: any) {
      console.error('Error resetting superadmin password:', error);
      toast.error(error?.response?.data?.error || 'Failed to reset password');
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
                    {user.role === 'superadmin' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSuperAdminPwdTarget(user);
                          setSaNewPassword('');
                          setSaConfirmPassword('');
                          setSaActorPassword('');
                        }}
                        className="text-secondary-600 hover:text-secondary-900 dark:text-gray-400 dark:hover:text-gray-100 inline-flex items-center gap-1"
                        aria-label={`Reset password for ${user.username}`}
                        title="Reset Super Admin password"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUser(user);
                          setSelectedCafeId(user.cafe_id ? String(user.cafe_id) : '');
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        className="text-secondary-600 hover:text-secondary-900 dark:text-gray-400 dark:hover:text-gray-100"
                        aria-label={`Manage user ${user.username}`}
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

      {/* Assign cafe + reset password (superadmin) */}
      <Dialog
        open={!!editingUser}
        onClose={() => {
          setEditingUser(null);
          setSelectedCafeId('');
          setNewPassword('');
          setConfirmPassword('');
        }}
        title="Manage user"
      >
        {editingUser && (
            <div className="space-y-4 pt-0">
              <div>
                <p className="text-sm text-secondary-600 dark:text-gray-400 mb-2">
                  User: <span className="font-semibold">{editingUser.username}</span>
                </p>
                <p className="text-sm text-secondary-600 dark:text-gray-400">
                  Role: <span className="font-semibold">{editingUser.role}</span> — Current cafe:{' '}
                  <span className="font-semibold">{getCafeName(editingUser.cafe_id)}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                  Assign to cafe
                </label>
                <Select
                  options={cafes.map(c => ({ value: String(c.id), label: c.name }))}
                  value={selectedCafeId === '' ? '' : String(selectedCafeId)}
                  onChange={setSelectedCafeId}
                  placeholder="Choose cafe (optional if only resetting password)"
                />
                <p className="text-xs text-secondary-500 dark:text-gray-400 mt-1">
                  Pick a different cafe to move this user, or leave as-is and use reset password below only.
                </p>
              </div>

              <div className="border-t border-accent-200 dark:border-gray-700 pt-4 space-y-3">
                <p className="text-sm font-medium text-secondary-800 dark:text-gray-200">Reset password</p>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                    New password
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field"
                    placeholder="Leave blank to skip"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field"
                    placeholder="Leave blank to skip"
                  />
                </div>
                <p className="text-xs text-secondary-500 dark:text-gray-400">
                  At least 6 characters. Applies to admins, chefs, and reception only.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-accent-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    setSelectedCafeId('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveUser}
                  className="px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
        )}
      </Dialog>

      <Dialog
        open={!!superAdminPwdTarget}
        onClose={() => {
          setSuperAdminPwdTarget(null);
          setSaNewPassword('');
          setSaConfirmPassword('');
          setSaActorPassword('');
        }}
        title="Reset Super Admin password"
      >
        {superAdminPwdTarget && (
          <div className="space-y-4 pt-0">
            <p className="text-sm text-secondary-600 dark:text-gray-400">
              Account: <span className="font-semibold">{superAdminPwdTarget.username}</span> ({superAdminPwdTarget.email})
            </p>
            <p className="text-xs text-secondary-500 dark:text-gray-400">
              Enter your own Super Admin password to authorize this change.
            </p>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                Your current password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={saActorPassword}
                onChange={(e) => setSaActorPassword(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                New password for this account <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={saNewPassword}
                onChange={(e) => setSaNewPassword(e.target.value)}
                minLength={6}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                Confirm new password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={saConfirmPassword}
                onChange={(e) => setSaConfirmPassword(e.target.value)}
                minLength={6}
                className="input-field"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-accent-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setSuperAdminPwdTarget(null);
                  setSaNewPassword('');
                  setSaConfirmPassword('');
                  setSaActorPassword('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSuperAdminPasswordSave}
                className="px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg transition-colors"
              >
                Update password
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default SuperAdminUserManagement;
