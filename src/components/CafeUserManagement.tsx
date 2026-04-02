import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useFeatures } from '../contexts/FeatureContext';
import { Users, Plus, Edit, Trash2, Search, Loader, AlertCircle } from 'lucide-react';
import LockedFeature from './ui/LockedFeature';
import Dialog from './ui/Dialog';
import Select from './ui/Select';
import { GlassButton } from './ui/GlassButton';

const CafeUserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { hasFeature, loading: featuresLoading } = useFeatures();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState<{ username: string; email: string; password?: string; role: string }>({
    username: '',
    email: '',
    password: '',
    role: 'admin'
  });
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

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
    } catch (error: any) {
      console.error('Error fetching users:', error);
      if (error?.response?.status === 403) {
        toast.error('Access denied. Admin privileges required.');
      } else {
        toast.error('Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await axios.post('/users', formData);
      toast.success('User added');
      setShowCreateModal(false);
      setFormData({ username: '', email: '', password: '', role: 'admin' });
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error?.response?.data?.error || 'Failed to create user');
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const updateData: any = {
        username: formData.username,
        email: formData.email,
        role: formData.role
      };
      
      // Only include password if provided
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      if (!editingUser) return;
      await axios.put(`/users/${editingUser.id}`, updateData);
      toast.success('Changes saved');
      setShowEditModal(false);
      setEditingUser(null);
      setFormData({ username: '', email: '', password: '', role: 'admin' });
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error?.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDelete = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!window.confirm(`This will deactivate ${userToDelete?.username || 'this user'} and revoke their access to the system. They will no longer be able to log in. Continue?`)) {
      return;
    }
    
    try {
      setDeletingUserId(userId);
      await axios.delete(`/users/${userId}`);
      toast.success('User deactivated');
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error?.response?.data?.error || 'Failed to disable user');
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <Users className="h-6 w-6 text-[var(--color-primary)]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[var(--color-on-surface)] truncate">User Management</h1>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">Add team members, assign roles, and manage access permissions</p>
          </div>
        </div>
        <GlassButton
          onClick={() => setShowCreateModal(true)}
          size="default"
          className="glass-button-primary"
          contentClassName="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add User
        </GlassButton>
      </div>

      {/* Search */}
      <div className="glass-card p-4 rounded-2xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--color-on-surface-variant)] pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users by username, email, or role..."
            className="glass-input w-full pl-12 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] py-2.5"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card overflow-hidden rounded-2xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[var(--surface-table)]/60 text-[var(--color-on-surface)]">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Created</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Last Login</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-outline)]/30">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[var(--surface-table)]/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-[var(--color-on-surface)]">{user.username}</div>
                      <div className="text-sm text-[var(--color-on-surface-variant)]">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]' :
                      user.role === 'chef' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      user.role === 'reception' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                      'bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)]'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-on-surface-variant)]">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-on-surface-variant)]">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center justify-end gap-1.5">
                      <GlassButton
                        onClick={() => handleEdit(user)}
                        size="icon"
                        className="glass-button-secondary [&_.glass-button]:!min-w-[36px] [&_.glass-button]:!h-9 [&_.glass-button-text]:!min-w-[36px] [&_.glass-button-text]:!h-9"
                        title="Edit user"
                      >
                        <Edit className="h-4 w-4" />
                      </GlassButton>
                      {user.id !== currentUser?.id && (
                        <GlassButton
                          onClick={() => handleDelete(user.id)}
                          disabled={deletingUserId === user.id}
                          size="icon"
                          className="glass-button-destructive [&_.glass-button]:!min-w-[36px] [&_.glass-button]:!h-9 [&_.glass-button-text]:!min-w-[36px] [&_.glass-button-text]:!h-9"
                          title="Disable user"
                        >
                          {deletingUserId === user.id ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </GlassButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-[var(--color-on-surface-variant)]">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{searchTerm ? `No users found matching "${searchTerm}". Try a different search term.` : 'Team members will appear here once you add them. Add your first user to start managing access and permissions.'}</p>
          </div>
        )}
      </div>

      {/* Create User Modal - Template Dialog */}
      <Dialog
        open={showCreateModal}
        onClose={() => { setShowCreateModal(false); setFormData({ username: '', email: '', password: '', role: 'admin' }); }}
        title="Add User"
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-0">
              <div>
                <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="input-field"
                />
                <p className="text-xs text-secondary-500 dark:text-gray-400 mt-1">
                  At least 6 characters (same as server requirement)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <Select
                  options={[
                    { value: 'admin', label: 'Admin' },
                    { value: 'chef', label: 'Chef' },
                    { value: 'reception', label: 'Reception' }
                  ]}
                  value={formData.role}
                  onChange={(v) => handleInputChange({ target: { name: 'role', value: v } })}
                  placeholder="Role"
                  className="select-trigger-glass select-trigger-glass-hover"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-[var(--color-outline)]/30">
                <GlassButton
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ username: '', email: '', password: '', role: 'admin' });
                  }}
                  size="default"
                  className="glass-button-secondary"
                >
                  Cancel
                </GlassButton>
                <GlassButton type="submit" size="default" className="glass-button-primary">
                  Add User
                </GlassButton>
              </div>
            </form>
      </Dialog>

      {/* Edit User Modal - Template Dialog */}
      <Dialog
        open={!!(showEditModal && editingUser)}
        onClose={() => { setShowEditModal(false); setEditingUser(null); setFormData({ username: '', email: '', password: '', role: 'admin' }); }}
        title="Edit User"
      >
        {showEditModal && editingUser && (
            <form onSubmit={handleUpdate} className="space-y-4 pt-0">
              <div>
                <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-2">
                  Reset password (optional)
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  autoComplete="new-password"
                  minLength={6}
                  className="input-field"
                  placeholder="Leave blank to keep current"
                />
                <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
                  At least 6 characters when setting a new password for this team member.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <Select
                  options={[
                    { value: 'admin', label: 'Admin' },
                    { value: 'chef', label: 'Chef' },
                    { value: 'reception', label: 'Reception' }
                  ]}
                  value={formData.role}
                  onChange={(v) => handleInputChange({ target: { name: 'role', value: v } })}
                  placeholder="Role"
                  className="select-trigger-glass select-trigger-glass-hover"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-[var(--color-outline)]/30">
                <GlassButton
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    setFormData({ username: '', email: '', password: '', role: 'admin' });
                  }}
                  size="default"
                  className="glass-button-secondary"
                >
                  Cancel
                </GlassButton>
                <GlassButton type="submit" size="default" className="glass-button-primary">
                  Update User
                </GlassButton>
              </div>
            </form>
        )}
      </Dialog>
    </div>
  );
};

export default CafeUserManagement;
