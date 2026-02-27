import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCafeSettings } from '../contexts/CafeSettingsContext';
import { useAuth } from '../contexts/AuthContext';
import ColorSchemePreview from './ColorSchemePreview';
import ColorSchemeTest from './ColorSchemeTest';
import { getImageUrl } from '../utils/imageUtils';
import { Copy, ExternalLink, Check, Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CafeSettings = () => {
  const { cafeSettings, loading: cafeSettingsLoading, error: cafeSettingsError, fetchCafeSettings, updateCafeSettings, updateLogo, updateHeroImage, removeHeroImage, removeLogo } = useCafeSettings();
  const { user } = useAuth();
  const publicSlug = user?.cafe_slug || cafeSettings?.cafe_slug || null;
  const [copied, setCopied] = useState(false);
  const [showDebugTest, setShowDebugTest] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedHeroFile, setSelectedHeroFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);

  // Promo banners (multiple per cafe)
  const [promoBanners, setPromoBanners] = useState([]);
  const [loadingPromoBanners, setLoadingPromoBanners] = useState(true);
  const [promoBannerForm, setPromoBannerForm] = useState({ show: false, file: null, link_url: '', priority: 0, active: true });
  const [uploadingNewBanner, setUploadingNewBanner] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState(null);
  const [editingBannerForm, setEditingBannerForm] = useState({ link_url: '', priority: 0, active: true });
  const [editingBannerReplaceFile, setEditingBannerReplaceFile] = useState(null);
  const [updatingBanner, setUpdatingBanner] = useState(false);

  // Form state
  const [cafeName, setCafeName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [description, setDescription] = useState('');

  // Tab visibility state
  const [showKitchenTab, setShowKitchenTab] = useState(true);
  const [showCustomersTab, setShowCustomersTab] = useState(true);
  const [showPaymentMethodsTab, setShowPaymentMethodsTab] = useState(true);
  const [showMenuTab, setShowMenuTab] = useState(true);
  const [showInventoryTab, setShowInventoryTab] = useState(true);
  const [showHistoryTab, setShowHistoryTab] = useState(true);
  const [showMenuImages, setShowMenuImages] = useState(true);

  // Chef visibility state
  const [chefShowKitchenTab, setChefShowKitchenTab] = useState(true);
  const [chefShowMenuTab, setChefShowMenuTab] = useState(false);
  const [chefShowInventoryTab, setChefShowInventoryTab] = useState(false);
  const [chefShowHistoryTab, setChefShowHistoryTab] = useState(true);
  const [chefCanEditOrders, setChefCanEditOrders] = useState(true);
  const [chefCanViewCustomers, setChefCanViewCustomers] = useState(false);
  const [chefCanViewPayments, setChefCanViewPayments] = useState(false);

  // Reception visibility state
  const [receptionShowKitchenTab, setReceptionShowKitchenTab] = useState(true);
  const [receptionShowMenuTab, setReceptionShowMenuTab] = useState(false);
  const [receptionShowInventoryTab, setReceptionShowInventoryTab] = useState(false);
  const [receptionShowHistoryTab, setReceptionShowHistoryTab] = useState(true);
  const [receptionCanEditOrders, setReceptionCanEditOrders] = useState(true);
  const [receptionCanViewCustomers, setReceptionCanViewCustomers] = useState(true);
  const [receptionCanViewPayments, setReceptionCanViewPayments] = useState(true);
  const [receptionCanCreateOrders, setReceptionCanCreateOrders] = useState(true);

  // Admin permissions state
  const [adminCanAccessSettings, setAdminCanAccessSettings] = useState(false);
  const [adminCanManageUsers, setAdminCanManageUsers] = useState(false);
  const [adminCanViewReports, setAdminCanViewReports] = useState(true);
  const [adminCanManageInventory, setAdminCanManageInventory] = useState(true);
  const [adminCanManageMenu, setAdminCanManageMenu] = useState(true);

  // Color scheme state
  const [lightPrimaryColor, setLightPrimaryColor] = useState('#3B82F6');
  const [lightSecondaryColor, setLightSecondaryColor] = useState('#6B7280');
  const [lightAccentColor, setLightAccentColor] = useState('#10B981');
  const [lightBackgroundColor, setLightBackgroundColor] = useState('#FFFFFF');
  const [lightTextColor, setLightTextColor] = useState('#1F2937');
  const [lightSurfaceColor, setLightSurfaceColor] = useState('#F9FAFB');

  const [darkPrimaryColor, setDarkPrimaryColor] = useState('#60A5FA');
  const [darkSecondaryColor, setDarkSecondaryColor] = useState('#9CA3AF');
  const [darkAccentColor, setDarkAccentColor] = useState('#34D399');
  const [darkBackgroundColor, setDarkBackgroundColor] = useState('#111827');
  const [darkTextColor, setDarkTextColor] = useState('#F9FAFB');
  const [darkSurfaceColor, setDarkSurfaceColor] = useState('#1F2937');

  // Predefined color schemes
  const predefinedSchemes = {
    'default': {
      name: 'Default Blue',
      light: {
        primary: '#3B82F6',
        secondary: '#6B7280',
        accent: '#10B981',
        background: '#FFFFFF',
        text: '#1F2937',
        surface: '#F9FAFB'
      },
      dark: {
        primary: '#60A5FA',
        secondary: '#9CA3AF',
        accent: '#34D399',
        background: '#111827',
        text: '#F9FAFB',
        surface: '#1F2937'
      }
    },
    'coffee': {
      name: 'Coffee Shop',
      light: {
        primary: '#8B4513',
        secondary: '#A0522D',
        accent: '#D2691E',
        background: '#FFF8DC',
        text: '#2F1B14',
        surface: '#FFFFF'
      },
      dark: {
        primary: '#CD853F',
        secondary: '#DEB887',
        accent: '#F4A460',
        background: '#2F1B14',
        text: '#F7F4EF',
        surface: '#3C2A21'
      }
    },
    'modern': {
      name: 'Modern Dark',
      light: {
        primary: '#6366F1',
        secondary: '#8B5CF6',
        accent: '#EC4899',
        background: '#FAFAFA',
        text: '#1F2937',
        surface: '#FFFFFF'
      },
      dark: {
        primary: '#8B5CF6',
        secondary: '#A855F7',
        accent: '#F472B6',
        background: '#0F0F23',
        text: '#F8FAFC',
        surface: '#1E1B4B'
      }
    },
    'nature': {
      name: 'Nature Green',
      light: {
        primary: '#059669',
        secondary: '#10B981',
        accent: '#34D399',
        background: '#F0FDF4',
        text: '#064E3B',
        surface: '#ECFDF5'
      },
      dark: {
        primary: '#10B981',
        secondary: '#34D399',
        accent: '#6EE7B7',
        background: '#064E3B',
        text: '#ECFDF5',
        surface: '#065F46'
      }
    },
    'sunset': {
      name: 'Sunset Orange',
      light: {
        primary: '#F97316',
        secondary: '#FB923C',
        accent: '#FDBA74',
        background: '#FFF7ED',
        text: '#7C2D12',
        surface: '#FEF3C7'
      },
      dark: {
        primary: '#FB923C',
        secondary: '#FDBA74',
        accent: '#FED7AA',
        background: '#7C2D12',
        text: '#FEF3C7',
        surface: '#92400E'
      }
    },
    'ocean': {
      name: 'Ocean Blue',
      light: {
        primary: '#0EA5E9',
        secondary: '#38BDF8',
        accent: '#7DD3FC',
        background: '#F0F9FF',
        text: '#0C4A6E',
        surface: '#E0F2FE'
      },
      dark: {
        primary: '#38BDF8',
        secondary: '#7DD3FC',
        accent: '#BAE6FD',
        background: '#0C4A6E',
        text: '#E0F2FE',
        surface: '#075985'
      }
    },
    'lavender': {
      name: 'Lavender Purple',
      light: {
        primary: '#8B5CF6',
        secondary: '#A855F7',
        accent: '#C084FC',
        background: '#FAF5FF',
        text: '#4C1D95',
        surface: '#F3E8FF'
      },
      dark: {
        primary: '#A855F7',
        secondary: '#C084FC',
        accent: '#D8B4FE',
        background: '#4C1D95',
        text: '#F3E8FF',
        surface: '#581C87'
      }
    },
    'minimal': {
      name: 'Minimal Gray',
      light: {
        primary: '#6B7280',
        secondary: '#9CA3AF',
        accent: '#D1D5DB',
        background: '#FFFFFF',
        text: '#111827',
        surface: '#F9FAFB'
      },
      dark: {
        primary: '#9CA3AF',
        secondary: '#D1D5DB',
        accent: '#E5E7EB',
        background: '#111827',
        text: '#F9FAFB',
        surface: '#1F2937'
      }
    }
  };

  // Apply predefined color scheme
  const applyColorScheme = (schemeKey) => {
    const scheme = predefinedSchemes[schemeKey];
    if (scheme) {
      setLightPrimaryColor(scheme.light.primary);
      setLightSecondaryColor(scheme.light.secondary);
      setLightAccentColor(scheme.light.accent);
      setLightBackgroundColor(scheme.light.background);
      setLightTextColor(scheme.light.text);
      setLightSurfaceColor(scheme.light.surface);

      setDarkPrimaryColor(scheme.dark.primary);
      setDarkSecondaryColor(scheme.dark.secondary);
      setDarkAccentColor(scheme.dark.accent);
      setDarkBackgroundColor(scheme.dark.background);
      setDarkTextColor(scheme.dark.text);
      setDarkSurfaceColor(scheme.dark.surface);
    }
  };

  // Initialize form data
  const fetchPromoBanners = async () => {
    setLoadingPromoBanners(true);
    try {
      const res = await axios.get('/promo-banners');
      setPromoBanners(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching promo banners:', err);
      setPromoBanners([]);
      if (err.response?.status === 403) return;
      toast.error(err.response?.data?.error || 'Failed to load promo banners');
    } finally {
      setLoadingPromoBanners(false);
    }
  };

  useEffect(() => {
    fetchPromoBanners();
  }, []);

  const handleAddPromoBanner = async () => {
    if (!promoBannerForm.file) {
      toast.error('Please select an image');
      return;
    }
    setUploadingNewBanner(true);
    try {
      const formData = new FormData();
      formData.append('image', promoBannerForm.file);
      if (promoBannerForm.link_url.trim()) formData.append('link_url', promoBannerForm.link_url.trim());
      formData.append('priority', String(promoBannerForm.priority));
      formData.append('active', promoBannerForm.active ? 'true' : 'false');
      await axios.post('/promo-banners', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Banner added');
      setPromoBannerForm({ show: false, file: null, link_url: '', priority: 0, active: true });
      fetchPromoBanners();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add banner');
    } finally {
      setUploadingNewBanner(false);
    }
  };

  const handleUpdatePromoBanner = async () => {
    if (editingBannerId == null) return;
    const priority = Number(editingBannerForm.priority);
    setUpdatingBanner(true);
    try {
      if (editingBannerReplaceFile) {
        const formData = new FormData();
        formData.append('image', editingBannerReplaceFile);
        await axios.patch(`/promo-banners/${editingBannerId}/image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      await axios.put(`/promo-banners/${editingBannerId}`, {
        link_url: (editingBannerForm.link_url || '').toString().trim() || null,
        priority: Number.isFinite(priority) ? priority : 0,
        active: Boolean(editingBannerForm.active)
      });
      toast.success('Banner updated');
      setEditingBannerId(null);
      setEditingBannerReplaceFile(null);
      fetchPromoBanners();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update banner');
    } finally {
      setUpdatingBanner(false);
    }
  };

  const handleDeletePromoBanner = async (id) => {
    if (!window.confirm('Remove this banner?')) return;
    try {
      await axios.delete(`/promo-banners/${id}`);
      toast.success('Banner removed');
      fetchPromoBanners();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete banner');
    }
  };

  useEffect(() => {
    if (cafeSettings) {
      setCafeName(cafeSettings.cafe_name || '');
      setAddress(cafeSettings.address || '');
      setPhone(cafeSettings.phone || '');
      setEmail(cafeSettings.email || '');
      setWebsite(cafeSettings.website || '');
      setOpeningHours(cafeSettings.opening_hours || '');
      setDescription(cafeSettings.description || '');
      
      // Update document title to match cafe settings name
      if (cafeSettings.cafe_name) {
        document.title = cafeSettings.cafe_name;
      }

      setShowKitchenTab(cafeSettings.show_kitchen_tab !== false);
      setShowCustomersTab(cafeSettings.show_customers_tab !== false);
      setShowPaymentMethodsTab(cafeSettings.show_payment_methods_tab !== false);
      setShowMenuTab(cafeSettings.show_menu_tab !== false);
      setShowInventoryTab(cafeSettings.show_inventory_tab !== false);
      setShowHistoryTab(cafeSettings.show_history_tab !== false);
      setShowMenuImages(cafeSettings.show_menu_images !== false);

      setChefShowKitchenTab(cafeSettings.chef_show_kitchen_tab !== false);
      setChefShowMenuTab(cafeSettings.chef_show_menu_tab !== false);
      setChefShowInventoryTab(cafeSettings.chef_show_inventory_tab !== false);
      setChefShowHistoryTab(cafeSettings.chef_show_history_tab !== false);
      setChefCanEditOrders(cafeSettings.chef_can_edit_orders !== false);
      setChefCanViewCustomers(cafeSettings.chef_can_view_customers !== false);
      setChefCanViewPayments(cafeSettings.chef_can_view_payments !== false);

      setReceptionShowKitchenTab(cafeSettings.reception_show_kitchen_tab !== false);
      setReceptionShowMenuTab(cafeSettings.reception_show_menu_tab !== false);
      setReceptionShowInventoryTab(cafeSettings.reception_show_inventory_tab !== false);
      setReceptionShowHistoryTab(cafeSettings.reception_show_history_tab !== false);
      setReceptionCanEditOrders(cafeSettings.reception_can_edit_orders !== false);
      setReceptionCanViewCustomers(cafeSettings.reception_can_view_customers !== false);
      setReceptionCanViewPayments(cafeSettings.reception_can_view_payments !== false);
      setReceptionCanCreateOrders(cafeSettings.reception_can_create_orders !== false);

      setAdminCanAccessSettings(cafeSettings.admin_can_access_settings !== false);
      setAdminCanManageUsers(cafeSettings.admin_can_manage_users !== false);
      setAdminCanViewReports(cafeSettings.admin_can_view_reports !== false);
      setAdminCanManageInventory(cafeSettings.admin_can_manage_inventory !== false);
      setAdminCanManageMenu(cafeSettings.admin_can_manage_menu !== false);

      setLightPrimaryColor(cafeSettings.light_primary_color || '#3B82F6');
      setLightSecondaryColor(cafeSettings.light_secondary_color || '#6B7280');
      setLightAccentColor(cafeSettings.light_accent_color || '#10B981');
      setLightBackgroundColor(cafeSettings.light_background_color || '#FFFFFF');
      setLightTextColor(cafeSettings.light_text_color || '#1F2937');
      setLightSurfaceColor(cafeSettings.light_surface_color || '#F9FAFB');

      setDarkPrimaryColor(cafeSettings.dark_primary_color || '#60A5FA');
      setDarkSecondaryColor(cafeSettings.dark_secondary_color || '#9CA3AF');
      setDarkAccentColor(cafeSettings.dark_accent_color || '#34D399');
      setDarkBackgroundColor(cafeSettings.dark_background_color || '#111827');
      setDarkTextColor(cafeSettings.dark_text_color || '#F9FAFB');
      setDarkSurfaceColor(cafeSettings.dark_surface_color || '#1F2937');
    }
  }, [cafeSettings]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleLogoUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a file first' });
      setShowMessage(true);
      return;
    }

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('logo', selectedFile);

    try {
      const result = await updateLogo(formData);
      if (result.success) {
        setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
        setSelectedFile(null);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to upload logo' });
      }
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while uploading logo' });
      setShowMessage(true);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm('Are you sure you want to remove the logo?')) {
      return;
    }

    setUploadingLogo(true);
    try {
      const result = await removeLogo();
      if (result.success) {
        setMessage({ type: 'success', text: 'Logo removed successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to remove logo' });
      }
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while removing logo' });
      setShowMessage(true);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleHeroImageUpload = async () => {
    if (!selectedHeroFile) {
      setMessage({ type: 'error', text: 'Please select a file first' });
      setShowMessage(true);
      return;
    }

    setUploadingHero(true);
    const formData = new FormData();
    formData.append('hero_image', selectedHeroFile);

    try {
      const result = await updateHeroImage(formData);
      if (result.success) {
        setMessage({ type: 'success', text: 'Hero image uploaded successfully!' });
        setSelectedHeroFile(null);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to upload hero image' });
      }
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while uploading hero image' });
      setShowMessage(true);
    } finally {
      setUploadingHero(false);
    }
  };

  const handleRemoveHeroImage = async () => {
    if (!window.confirm('Are you sure you want to remove the hero image?')) {
      return;
    }

    setUploadingHero(true);
    try {
      const result = await removeHeroImage();
      if (result.success) {
        setMessage({ type: 'success', text: 'Hero image removed successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to remove hero image' });
      }
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while removing hero image' });
      setShowMessage(true);
    } finally {
      setUploadingHero(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = {
        cafe_name: cafeName,
        logo_url: cafeSettings?.logo_url,
        address,
        phone,
        email,
        website,
        opening_hours: openingHours,
        description,
        show_kitchen_tab: showKitchenTab,
        show_customers_tab: showCustomersTab,
        show_payment_methods_tab: showPaymentMethodsTab,
        show_menu_tab: showMenuTab,
        show_inventory_tab: showInventoryTab,
        show_history_tab: showHistoryTab,
        show_menu_images: showMenuImages,
        chef_show_kitchen_tab: chefShowKitchenTab,
        chef_show_menu_tab: chefShowMenuTab,
        chef_show_inventory_tab: chefShowInventoryTab,
        chef_show_history_tab: chefShowHistoryTab,
        chef_can_edit_orders: chefCanEditOrders,
        chef_can_view_customers: chefCanViewCustomers,
        chef_can_view_payments: chefCanViewPayments,
        reception_show_kitchen_tab: receptionShowKitchenTab,
        reception_show_menu_tab: receptionShowMenuTab,
        reception_show_inventory_tab: receptionShowInventoryTab,
        reception_show_history_tab: receptionShowHistoryTab,
        reception_can_edit_orders: receptionCanEditOrders,
        reception_can_view_customers: receptionCanViewCustomers,
        reception_can_view_payments: receptionCanViewPayments,
        reception_can_create_orders: receptionCanCreateOrders,
        admin_can_access_settings: adminCanAccessSettings,
        admin_can_manage_users: adminCanManageUsers,
        admin_can_view_reports: adminCanViewReports,
        admin_can_manage_inventory: adminCanManageInventory,
        admin_can_manage_menu: adminCanManageMenu,
        light_primary_color: lightPrimaryColor,
        light_secondary_color: lightSecondaryColor,
        light_accent_color: lightAccentColor,
        light_background_color: lightBackgroundColor,
        light_text_color: lightTextColor,
        light_surface_color: lightSurfaceColor,
        dark_primary_color: darkPrimaryColor,
        dark_secondary_color: darkSecondaryColor,
        dark_accent_color: darkAccentColor,
        dark_background_color: darkBackgroundColor,
        dark_text_color: darkTextColor,
        dark_surface_color: darkSurfaceColor
      };

      const result = await updateCafeSettings(formData);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Cafe settings updated successfully!' });
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update settings' });
        setShowMessage(true);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating settings' });
      setShowMessage(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-nowrap justify-between items-start sm:items-center gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-on-surface truncate">Cafe Settings</h1>
            <p className="text-sm text-body-muted mt-1">Manage your cafe configuration and appearance.</p>
          </div>
          <button type="button" onClick={handleSubmit} disabled={isSubmitting || cafeSettingsLoading} className="btn-primary px-5 py-2.5 text-sm font-medium shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {showMessage && (
          <div className="w-full max-w-4xl mx-auto mb-6">
            <div
              className="p-4 rounded-xl text-sm border"
              style={{
                backgroundColor: message.type === 'success' ? 'color-mix(in srgb, var(--color-success) 12%, transparent)' : 'color-mix(in srgb, var(--color-error) 12%, transparent)',
                color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
                borderColor: message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)'
              }}
            >
              {message.text}
            </div>
          </div>
        )}

        {cafeSettingsLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mb-4" style={{ borderColor: 'var(--color-primary)' }} />
            <p className="text-body-muted">Loading cafe settings...</p>
          </div>
        ) : cafeSettingsError ? (
          <div className="w-full max-w-4xl mx-auto">
            <div className="card border-2 bg-red-50 dark:bg-red-900/20" style={{ borderColor: 'var(--color-error)' }}>
              <p className="font-medium mb-2" style={{ color: 'var(--color-error)' }}>Failed to load cafe settings</p>
              <p className="text-sm mb-4" style={{ color: 'var(--color-error)' }}>{cafeSettingsError}</p>
              <button type="button" onClick={() => fetchCafeSettings()} className="btn-primary">
                Retry
              </button>
            </div>
          </div>
        ) : (
        <div className="w-full max-w-4xl mx-auto">
          <div className="space-y-6">
            {/* Cafe Slug & Public URL Section (multi-cafe: show when admin/superadmin has a cafe slug) */}
            {(user?.role === 'admin' || user?.role === 'superadmin') && publicSlug && (
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Public Cafe URL</h2>
                  <p className="card-description">
                    Share this URL with your customers to access your cafe menu and place orders.
                  </p>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">Cafe Slug</label>
                    <input
                      type="text"
                      value={publicSlug}
                      readOnly
                      className="input-field w-full bg-[var(--surface-table)] cursor-not-allowed font-mono text-sm truncate"
                    />
                    <p className="text-xs text-body-muted mt-1">Cannot be changed after creation.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">Public Customer URL</label>
                    <div className="flex flex-wrap gap-2 items-stretch">
                      <input
                        type="text"
                        value={`${window.location.origin}/cafe/${publicSlug}`}
                        readOnly
                        className="input-field flex-1 min-w-[200px] bg-[var(--surface-table)] cursor-not-allowed font-mono text-sm truncate"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${window.location.origin}/cafe/${publicSlug}`;
                          navigator.clipboard.writeText(url);
                          setCopied(true);
                          toast.success('URL copied to clipboard!');
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="btn-primary inline-flex items-center gap-2 shrink-0"
                        title="Copy URL"
                      >
                        {copied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy</>}
                      </button>
                      <a
                        href={`/cafe/${publicSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary inline-flex items-center gap-2 shrink-0"
                        title="Open in new tab"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Basic Information</h2>
                <p className="card-description">Your cafe details shown to customers and used in invoices.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4" id="cafe-settings-form">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">Cafe Name *</label>
                    <input type="text" value={cafeName} onChange={(e) => setCafeName(e.target.value)} className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">Phone</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">Address</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="input-field" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">Website</label>
                    <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">Opening Hours</label>
                  <input type="text" value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} className="input-field" placeholder="e.g., Mon-Fri 8AM-6PM, Sat-Sun 9AM-5PM" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" rows={3} placeholder="Brief description of your cafe..." />
                </div>
              </form>
            </div>

            {/* Tab & Role Visibility */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Tab & Role Visibility</h2>
                <p className="card-description">Control which tabs and features are visible to each role.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-0" id="cafe-visibility-form" noValidate>
                <div className="space-y-6">
                  {/* Owner */}
                  <div className="pb-6 border-b border-[var(--color-outline)]">
                    <h3 className="text-sm font-semibold text-on-surface mb-3">Owner (your view)</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5">
                      {[
                        [showKitchenTab, setShowKitchenTab, 'Orders'],
                        [showMenuTab, setShowMenuTab, 'Menu'],
                        [showMenuImages, setShowMenuImages, 'Show Menu Images'],
                        [showCustomersTab, setShowCustomersTab, 'Customers'],
                        [showPaymentMethodsTab, setShowPaymentMethodsTab, 'Payment Methods'],
                        [showInventoryTab, setShowInventoryTab, 'Inventory'],
                        [showHistoryTab, setShowHistoryTab, 'History']
                      ].map(([checked, setter, label]) => (
                        <label key={label} className="flex items-center gap-2.5 cursor-pointer py-0.5">
                          <input type="checkbox" checked={checked} onChange={(e) => setter(e.target.checked)} className="rounded border-[var(--color-outline)] text-primary focus:ring-primary focus:ring-offset-0" />
                          <span className="text-sm text-on-surface">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Chef */}
                  <div className="pb-6 border-b border-[var(--color-outline)]">
                    <h3 className="text-sm font-semibold text-on-surface mb-3">Chef</h3>
                    <p className="text-xs font-medium uppercase tracking-wider text-body-muted mb-2">Visible tabs</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5 mb-4">
                      {[[chefShowKitchenTab, setChefShowKitchenTab, 'Orders'], [chefShowMenuTab, setChefShowMenuTab, 'Menu'], [chefShowInventoryTab, setChefShowInventoryTab, 'Inventory'], [chefShowHistoryTab, setChefShowHistoryTab, 'History']].map(([c, s, l]) => (
                        <label key={l} className="flex items-center gap-2.5 cursor-pointer py-0.5">
                          <input type="checkbox" checked={c} onChange={(e) => s(e.target.checked)} className="rounded border-[var(--color-outline)] text-primary focus:ring-primary focus:ring-offset-0" />
                          <span className="text-sm text-on-surface">{l}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs font-medium uppercase tracking-wider text-body-muted mb-2">Permissions</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5">
                      {[[chefCanEditOrders, setChefCanEditOrders, 'Can Edit Orders'], [chefCanViewCustomers, setChefCanViewCustomers, 'Can View Customers'], [chefCanViewPayments, setChefCanViewPayments, 'Can View Payments']].map(([c, s, l]) => (
                        <label key={l} className="flex items-center gap-2.5 cursor-pointer py-0.5">
                          <input type="checkbox" checked={c} onChange={(e) => s(e.target.checked)} className="rounded border-[var(--color-outline)] text-primary focus:ring-primary focus:ring-offset-0" />
                          <span className="text-sm text-on-surface">{l}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Reception */}
                  <div className="pb-6 border-b border-[var(--color-outline)]">
                    <h3 className="text-sm font-semibold text-on-surface mb-3">Reception</h3>
                    <p className="text-xs font-medium uppercase tracking-wider text-body-muted mb-2">Visible tabs</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5 mb-4">
                      {[[receptionShowKitchenTab, setReceptionShowKitchenTab, 'Orders'], [receptionShowMenuTab, setReceptionShowMenuTab, 'Menu'], [receptionShowInventoryTab, setReceptionShowInventoryTab, 'Inventory'], [receptionShowHistoryTab, setReceptionShowHistoryTab, 'History']].map(([c, s, l]) => (
                        <label key={l} className="flex items-center gap-2.5 cursor-pointer py-0.5">
                          <input type="checkbox" checked={c} onChange={(e) => s(e.target.checked)} className="rounded border-[var(--color-outline)] text-primary focus:ring-primary focus:ring-offset-0" />
                          <span className="text-sm text-on-surface">{l}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs font-medium uppercase tracking-wider text-body-muted mb-2">Permissions</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5">
                      {[[receptionCanEditOrders, setReceptionCanEditOrders, 'Can Edit Orders'], [receptionCanViewCustomers, setReceptionCanViewCustomers, 'Can View Customers'], [receptionCanViewPayments, setReceptionCanViewPayments, 'Can View Payments'], [receptionCanCreateOrders, setReceptionCanCreateOrders, 'Can Create Orders']].map(([c, s, l]) => (
                        <label key={l} className="flex items-center gap-2.5 cursor-pointer py-0.5">
                          <input type="checkbox" checked={c} onChange={(e) => s(e.target.checked)} className="rounded border-[var(--color-outline)] text-primary focus:ring-primary focus:ring-offset-0" />
                          <span className="text-sm text-on-surface">{l}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Admin */}
                  <div>
                    <h3 className="text-sm font-semibold text-on-surface mb-3">Admin</h3>
                    <p className="text-xs font-medium uppercase tracking-wider text-body-muted mb-2">Permissions</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5">
                      {[[adminCanAccessSettings, setAdminCanAccessSettings, 'Can Access Settings'], [adminCanManageUsers, setAdminCanManageUsers, 'Can Manage Users'], [adminCanViewReports, setAdminCanViewReports, 'Can View Reports'], [adminCanManageInventory, setAdminCanManageInventory, 'Can Manage Inventory'], [adminCanManageMenu, setAdminCanManageMenu, 'Can Manage Menu']].map(([c, s, l]) => (
                        <label key={l} className="flex items-center gap-2.5 cursor-pointer py-0.5">
                          <input type="checkbox" checked={c} onChange={(e) => s(e.target.checked)} className="rounded border-[var(--color-outline)] text-primary focus:ring-primary focus:ring-offset-0" />
                          <span className="text-sm text-on-surface">{l}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Branding Section */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Branding</h2>
                <p className="card-description">Images shown on the customer-facing menu page.</p>
              </div>
              <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">Logo</label>
                <p className="text-xs text-body-muted mb-2">
                  Headers, invoices, and customer-facing pages.
                </p>
                <div className="space-y-3">
                  {cafeSettings?.logo_url && (
                    <div className="relative">
                      <img
                        src={getImageUrl(cafeSettings.logo_url)}
                        alt="Cafe Logo"
                        className="w-48 h-48 object-contain border rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        disabled={uploadingLogo}
                        className="mt-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm disabled:opacity-50"
                      >
                        {uploadingLogo ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  )}
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                        accept="image/jpeg,image/png,image/webp"
                        className="input-field"
                        disabled={uploadingLogo}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleLogoUpload}
                      disabled={!selectedFile || uploadingLogo}
                      className="btn-primary disabled:opacity-50"
                    >
                      {uploadingLogo ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">Hero Image</label>
                <p className="text-xs text-body-muted mb-2">
                  Main background on the customer menu.
                </p>
                <div className="space-y-3">
                  {cafeSettings?.hero_image_url && (
                    <div className="relative">
                      <img
                        src={getImageUrl(cafeSettings.hero_image_url)}
                        alt="Hero Image"
                        className="w-full h-48 object-cover border rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveHeroImage}
                        disabled={uploadingHero}
                        className="mt-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm disabled:opacity-50"
                      >
                        {uploadingHero ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  )}
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        onChange={(e) => setSelectedHeroFile(e.target.files[0])}
                        accept="image/jpeg,image/png,image/webp"
                        className="input-field"
                        disabled={uploadingHero}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleHeroImageUpload}
                      disabled={!selectedHeroFile || uploadingHero}
                      className="btn-primary disabled:opacity-50"
                    >
                      {uploadingHero ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-[var(--color-outline)]">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">Promotional Banners</label>
                    <p className="text-xs text-body-muted">
                      Customer menu. Order by priority (lower first). Keep at least one.
                    </p>
                  </div>
                  {!loadingPromoBanners && !promoBannerForm.show && (
                    <button
                      type="button"
                      onClick={() => setPromoBannerForm((f) => ({ ...f, show: true }))}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium shadow-sm"
                    >
                      <Plus className="h-4 w-4" /> Add banner
                    </button>
                  )}
                </div>
                {loadingPromoBanners ? (
                  <p className="text-sm text-gray-500">Loading banners...</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                      {promoBanners.map((b) => (
                        <div key={b.id} className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800 w-48">
                          <div className="h-28 bg-gray-100 dark:bg-gray-700">
                            <img src={getImageUrl(b.image_url)} alt="Banner" className="w-full h-full object-cover" />
                          </div>
                          <div className="p-2 text-xs">
                            <div className="truncate" title={b.link_url || '—'}>{b.link_url || 'No link'}</div>
                            <div className="flex items-center justify-between mt-1">
                              <span>Priority: {b.priority}</span>
                              <span className={b.active ? 'text-green-600' : 'text-gray-400'}>{b.active ? 'On' : 'Off'}</span>
                            </div>
                            <div className="flex gap-1 mt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingBannerId(b.id);
                                  setEditingBannerForm({ link_url: b.link_url || '', priority: b.priority, active: b.active });
                                  setEditingBannerReplaceFile(null);
                                }}
                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs hover:bg-gray-300"
                              >
                                <Pencil className="h-3 w-3" /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePromoBanner(b.id)}
                                disabled={promoBanners.length <= 1}
                                title={promoBanners.length <= 1 ? 'Keep at least one banner' : 'Remove banner'}
                                className="flex items-center justify-center px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 rounded text-xs hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {editingBannerId != null && (() => {
                      const b = promoBanners.find((x) => x.id === editingBannerId);
                      if (!b) return null;
                      return (
                        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                          <p className="text-sm font-medium mb-2">Edit banner</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-xs text-gray-500 mb-1">Replace image (optional)</label>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => setEditingBannerReplaceFile(e.target.files?.[0] || null)}
                                className="input-field text-sm"
                              />
                              {editingBannerReplaceFile && <span className="text-xs text-gray-500 ml-2">{editingBannerReplaceFile.name}</span>}
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Link URL</label>
                              <input
                                type="url"
                                value={editingBannerForm.link_url}
                                onChange={(e) => setEditingBannerForm((f) => ({ ...f, link_url: e.target.value }))}
                                className="input-field text-sm"
                                placeholder="https://..."
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Priority</label>
                              <input
                                type="number"
                                value={editingBannerForm.priority}
                                onChange={(e) => setEditingBannerForm((f) => ({ ...f, priority: Number(e.target.value) || 0 }))}
                                className="input-field text-sm"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="edit-banner-active"
                                checked={editingBannerForm.active}
                                onChange={(e) => setEditingBannerForm((f) => ({ ...f, active: e.target.checked }))}
                              />
                              <label htmlFor="edit-banner-active" className="text-sm">Active</label>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button type="button" onClick={handleUpdatePromoBanner} disabled={updatingBanner} className="btn-primary text-sm disabled:opacity-50">
                              {updatingBanner ? 'Saving...' : 'Save'}
                            </button>
                            <button type="button" onClick={() => { setEditingBannerId(null); setEditingBannerReplaceFile(null); }} disabled={updatingBanner} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Cancel</button>
                          </div>
                        </div>
                      );
                    })()}
                    {promoBannerForm.show && (
                      <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                        <p className="text-sm font-medium mb-2">Add banner</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Image *</label>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={(e) => setPromoBannerForm((f) => ({ ...f, file: e.target.files?.[0] || null }))}
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Link URL (optional)</label>
                            <input
                              type="url"
                              value={promoBannerForm.link_url}
                              onChange={(e) => setPromoBannerForm((f) => ({ ...f, link_url: e.target.value }))}
                              className="input-field text-sm"
                              placeholder="https://..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Priority</label>
                            <input
                              type="number"
                              value={promoBannerForm.priority}
                              onChange={(e) => setPromoBannerForm((f) => ({ ...f, priority: Number(e.target.value) || 0 }))}
                              className="input-field text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="new-banner-active"
                              checked={promoBannerForm.active}
                              onChange={(e) => setPromoBannerForm((f) => ({ ...f, active: e.target.checked }))}
                            />
                            <label htmlFor="new-banner-active" className="text-sm">Active</label>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button type="button" onClick={handleAddPromoBanner} disabled={!promoBannerForm.file || uploadingNewBanner} className="btn-primary text-sm disabled:opacity-50">
                            {uploadingNewBanner ? 'Uploading...' : 'Add'}
                          </button>
                          <button type="button" onClick={() => setPromoBannerForm({ show: false, file: null, link_url: '', priority: 0, active: true })} className="px-3 py-1 border rounded text-sm">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              </div>
            </div>

            {/* Color Scheme Settings */}
            {/* COMMENTED OUT - Color scheme selection temporarily disabled */}
            {/*
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Color Scheme</h2>
              
              {/* Predefined Color Schemes */}
              {/* <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Quick Color Schemes</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(predefinedSchemes).map(([key, scheme]) => (
                    <button
                      key={key}
                      onClick={() => applyColorScheme(key)}
                      className="p-3 border rounded-lg hover:shadow-md transition-all text-left"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: scheme.light.primary }}></div>
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: scheme.light.accent }}></div>
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: scheme.light.secondary }}></div>
                      </div>
                      <div className="text-xs font-medium">{scheme.name}</div>
                    </button>
                  ))}
                </div>
              </div> */}

              {/* Light Mode Colors */}
              {/* <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Light Mode Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Primary</label>
                    <input
                      type="color"
                      value={lightPrimaryColor}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setLightPrimaryColor(newColor);
                        // Apply immediately for preview
                        const root = document.documentElement;
                        root.style.setProperty('--color-primary', newColor);
                      }}
                      className="w-full h-10 rounded border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Secondary</label>
                    <input
                      type="color"
                      value={lightSecondaryColor}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setLightSecondaryColor(newColor);
                        // Apply immediately for preview
                        const root = document.documentElement;
                        root.style.setProperty('--color-secondary', newColor);
                      }}
                      className="w-full h-10 rounded border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Accent</label>
                    <input
                      type="color"
                      value={lightAccentColor}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setLightAccentColor(newColor);
                        // Apply immediately for preview
                        const root = document.documentElement;
                        root.style.setProperty('--color-accent', newColor);
                      }}
                      className="w-full h-10 rounded border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Background</label>
                    <input
                      type="color"
                      value={lightBackgroundColor}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setLightBackgroundColor(newColor);
                        // Apply immediately for preview
                        const root = document.documentElement;
                        root.style.setProperty('--color-background', newColor);
                      }}
                      className="w-full h-10 rounded border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Text</label>
                    <input
                      type="color"
                      value={lightTextColor}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setLightTextColor(newColor);
                        // Apply immediately for preview
                        const root = document.documentElement;
                        root.style.setProperty('--color-text-primary', newColor);
                        root.style.setProperty('--color-text', newColor);
                      }}
                      className="w-full h-10 rounded border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Surface</label>
                    <input
                      type="color"
                      value={lightSurfaceColor}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setLightSurfaceColor(newColor);
                        // Apply immediately for preview
                        const root = document.documentElement;
                        root.style.setProperty('--color-surface', newColor);
                      }}
                      className="w-full h-10 rounded border"
                    />
                  </div>
                </div>
              </div> */}

              {/* Dark Mode Colors */}
              {/* <div>
                <h3 className="text-lg font-medium mb-3">Dark Mode Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Primary</label>
                    <input
                      type="color"
                      value={darkPrimaryColor}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setDarkPrimaryColor(newColor);
                        // Apply immediately for preview (only if in dark mode)
                        const root = document.documentElement;
                        if (document.documentElement.classList.contains('dark')) {
                          root.style.setProperty('--color-primary', newColor);
                        }
                      }}
                      className="w-full h-10 rounded border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Secondary</label>
                    <input
                      type="color"
                      value={darkSecondaryColor}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setDarkSecondaryColor(newColor);
                        // Apply immediately for preview (only if in dark mode)
                        const root = document.documentElement;
                        if (document.documentElement.classList.contains('dark')) {
                          root.style.setProperty('--color-secondary', newColor);
                        }
                      }}
                      className="w-full h-10 rounded border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Accent</label>
                    <input
                      type="color"
                      value={darkAccentColor}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setDarkAccentColor(newColor);
                        // Apply immediately for preview (only if in dark mode)
                        const root = document.documentElement;
                        if (document.documentElement.classList.contains('dark')) {
                          root.style.setProperty('--color-accent', newColor);
                        }
                      }}
                      className="w-full h-10 rounded border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Background</label>
                    <input
                      type="color"
                      value={darkBackgroundColor}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setDarkBackgroundColor(newColor);
                        // Apply immediately for preview (only if in dark mode)
                        const root = document.documentElement;
                        if (document.documentElement.classList.contains('dark')) {
                          root.style.setProperty('--color-background', newColor);
                        }
                      }}
                      className="w-full h-10 rounded border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Text</label>
                    <input
                      type="color"
                      value={darkTextColor}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setDarkTextColor(newColor);
                        // Apply immediately for preview (only if in dark mode)
                        const root = document.documentElement;
                        if (document.documentElement.classList.contains('dark')) {
                          root.style.setProperty('--color-text-primary', newColor);
                          root.style.setProperty('--color-text', newColor);
                        }
                      }}
                      className="w-full h-10 rounded border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Surface</label>
                    <input
                      type="color"
                      value={darkSurfaceColor}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setDarkSurfaceColor(newColor);
                        // Apply immediately for preview (only if in dark mode)
                        const root = document.documentElement;
                        if (document.documentElement.classList.contains('dark')) {
                          root.style.setProperty('--color-surface', newColor);
                        }
                      }}
                      className="w-full h-10 rounded border"
                    />
                  </div>
                </div>
              </div> */}
            {/* </div> */}
          </div>

          {/* Preview Sidebar */}
          {/* COMMENTED OUT - Color scheme preview temporarily disabled */}
          {/*
          <div className="space-y-6">
            <ColorSchemePreview />
            
            {showDebugTest && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Debug Information</h3>
                <ColorSchemeTest />
              </div>
            )}
          </div>
          */}
        </div>
        )}
      </div>
    </div>
  );
};

export default CafeSettings; 