import React, { useState, useEffect } from 'react';
import { useCafeSettings } from '../contexts/CafeSettingsContext';
import { useAuth } from '../contexts/AuthContext';
import ColorSchemePreview from './ColorSchemePreview';
import ColorSchemeTest from './ColorSchemeTest';
import { getImageUrl } from '../utils/imageUtils';
import { Copy, ExternalLink, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const CafeSettings = () => {
  const { cafeSettings, updateCafeSettings, updateLogo, updateHeroImage, updatePromoBannerImage, removeHeroImage, removePromoBannerImage, removeLogo } = useCafeSettings();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showDebugTest, setShowDebugTest] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedHeroFile, setSelectedHeroFile] = useState(null);
  const [selectedPromoBannerFile, setSelectedPromoBannerFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingPromoBanner, setUploadingPromoBanner] = useState(false);

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
        surface: '#F5F5DC'
      },
      dark: {
        primary: '#CD853F',
        secondary: '#DEB887',
        accent: '#F4A460',
        background: '#2F1B14',
        text: '#F5F5DC',
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
  useEffect(() => {
    if (cafeSettings) {
      setCafeName(cafeSettings.cafe_name || '');
      setAddress(cafeSettings.address || '');
      setPhone(cafeSettings.phone || '');
      setEmail(cafeSettings.email || '');
      setWebsite(cafeSettings.website || '');
      setOpeningHours(cafeSettings.opening_hours || '');
      setDescription(cafeSettings.description || '');

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

  const handlePromoBannerUpload = async () => {
    if (!selectedPromoBannerFile) {
      setMessage({ type: 'error', text: 'Please select a file first' });
      setShowMessage(true);
      return;
    }

    setUploadingPromoBanner(true);
    const formData = new FormData();
    formData.append('promo_banner_image', selectedPromoBannerFile);

    try {
      const result = await updatePromoBannerImage(formData);
      if (result.success) {
        setMessage({ type: 'success', text: 'Promo banner image uploaded successfully!' });
        setSelectedPromoBannerFile(null);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to upload promo banner image' });
      }
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while uploading promo banner image' });
      setShowMessage(true);
    } finally {
      setUploadingPromoBanner(false);
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

  const handleRemovePromoBannerImage = async () => {
    if (!window.confirm('Are you sure you want to remove the promo banner image?')) {
      return;
    }

    setUploadingPromoBanner(true);
    try {
      const result = await removePromoBannerImage();
      if (result.success) {
        setMessage({ type: 'success', text: 'Promo banner image removed successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to remove promo banner image' });
      }
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while removing promo banner image' });
      setShowMessage(true);
    } finally {
      setUploadingPromoBanner(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = {
        cafe_name: cafeName,
        logo_url: cafeSettings.logo_url,
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
    <div className="min-h-screen bg-accent-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-secondary-700 dark:text-white">Cafe Settings</h1>
            <p className="text-secondary-600 dark:text-gray-300 mt-2">Manage your cafe configuration and appearance</p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {showMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cafe Slug & Public URL Section */}
            {(user?.role === 'admin' || user?.role === 'superadmin') && user?.cafe_slug && (
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Public Cafe URL</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Share this URL with your customers to access your cafe menu and place orders.
                </p>
                
                <div className="space-y-4">
                  {/* Slug Display */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Cafe Slug
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={user.cafe_slug}
                        readOnly
                        className="input-field bg-gray-50 dark:bg-gray-700 cursor-not-allowed font-mono"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      This is your public cafe identifier. It cannot be changed after creation.
                    </p>
                  </div>

                  {/* Public URL Display */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Public Customer URL
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={`${window.location.origin}/cafe/${user.cafe_slug}`}
                        readOnly
                        className="input-field bg-gray-50 dark:bg-gray-700 cursor-not-allowed font-mono text-sm"
                      />
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/cafe/${user.cafe_slug}`;
                          navigator.clipboard.writeText(url);
                          setCopied(true);
                          toast.success('URL copied to clipboard!');
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                        title="Copy URL"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      <a
                        href={`/cafe/${user.cafe_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                        title="Open in new tab"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Open</span>
                      </a>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Share this link with your customers to access your cafe menu.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Cafe Name *</label>
                    <input
                      type="text"
                      value={cafeName}
                      onChange={(e) => setCafeName(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Website</label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Opening Hours</label>
                  <input
                    type="text"
                    value={openingHours}
                    onChange={(e) => setOpeningHours(e.target.value)}
                    className="input-field"
                    placeholder="e.g., Mon-Fri: 8AM-6PM, Sat-Sun: 9AM-5PM"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-field"
                    rows={3}
                    placeholder="Brief description of your cafe..."
                  />
                </div>

                {/* Tab Visibility */}
                <div>
                  <label className="block text-sm font-medium mb-4">Tab Visibility</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={showKitchenTab}
                        onChange={(e) => setShowKitchenTab(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Kitchen</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={showCustomersTab}
                        onChange={(e) => setShowCustomersTab(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Customers</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={showPaymentMethodsTab}
                        onChange={(e) => setShowPaymentMethodsTab(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Payment Methods</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={showMenuTab}
                        onChange={(e) => setShowMenuTab(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Menu</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={showInventoryTab}
                        onChange={(e) => setShowInventoryTab(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Inventory</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={showHistoryTab}
                        onChange={(e) => setShowHistoryTab(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">History</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={showMenuImages}
                        onChange={(e) => setShowMenuImages(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Show Menu Images</span>
                    </label>
                  </div>
                </div>

                {/* Chef Visibility Settings */}
                <div>
                  <label className="block text-sm font-medium mb-4">Chef Access Control</label>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Visible Tabs for Chefs</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={chefShowKitchenTab}
                            onChange={(e) => setChefShowKitchenTab(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Kitchen Orders</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={chefShowMenuTab}
                            onChange={(e) => setChefShowMenuTab(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Menu Management</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={chefShowInventoryTab}
                            onChange={(e) => setChefShowInventoryTab(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Inventory</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={chefShowHistoryTab}
                            onChange={(e) => setChefShowHistoryTab(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Order History</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chef Permissions</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={chefCanEditOrders}
                            onChange={(e) => setChefCanEditOrders(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Can Edit Orders</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={chefCanViewCustomers}
                            onChange={(e) => setChefCanViewCustomers(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Can View Customers</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={chefCanViewPayments}
                            onChange={(e) => setChefCanViewPayments(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Can View Payments</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reception Visibility Settings */}
                <div>
                  <label className="block text-sm font-medium mb-4">Reception Access Control</label>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Visible Tabs for Reception</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={receptionShowKitchenTab}
                            onChange={(e) => setReceptionShowKitchenTab(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Kitchen Orders</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={receptionShowMenuTab}
                            onChange={(e) => setReceptionShowMenuTab(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Menu Management</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={receptionShowInventoryTab}
                            onChange={(e) => setReceptionShowInventoryTab(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Inventory</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={receptionShowHistoryTab}
                            onChange={(e) => setReceptionShowHistoryTab(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Order History</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reception Permissions</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={receptionCanEditOrders}
                            onChange={(e) => setReceptionCanEditOrders(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Can Edit Orders</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={receptionCanViewCustomers}
                            onChange={(e) => setReceptionCanViewCustomers(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Can View Customers</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={receptionCanViewPayments}
                            onChange={(e) => setReceptionCanViewPayments(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Can View Payments</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={receptionCanCreateOrders}
                            onChange={(e) => setReceptionCanCreateOrders(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Can Create Orders</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Access Control */}
                <div>
                  <label className="block text-sm font-medium mb-4">Admin Access Control</label>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Admin Permissions</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={adminCanAccessSettings}
                            onChange={(e) => setAdminCanAccessSettings(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Can Access Settings</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={adminCanManageUsers}
                            onChange={(e) => setAdminCanManageUsers(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Can Manage Users</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={adminCanViewReports}
                            onChange={(e) => setAdminCanViewReports(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Can View Reports</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={adminCanManageInventory}
                            onChange={(e) => setAdminCanManageInventory(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Can Manage Inventory</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={adminCanManageMenu}
                            onChange={(e) => setAdminCanManageMenu(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Can Manage Menu</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Branding Section */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Branding</h2>
              <p className="text-sm text-secondary-600 dark:text-gray-400 mb-6">
                Manage images displayed on the customer-facing menu page
              </p>

              {/* Logo */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Logo</label>
                <p className="text-xs text-secondary-500 dark:text-gray-500 mb-3">
                  Shown in headers, invoices, and customer-facing pages
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
                        accept="image/*"
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

              {/* Hero Image */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Hero Image</label>
                <p className="text-xs text-secondary-500 dark:text-gray-500 mb-3">
                  Shown as the main background image on the customer menu
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
                        accept="image/*"
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

              {/* Promotional Banner Image */}
              <div>
                <label className="block text-sm font-medium mb-2">Promotional Banner Image</label>
                <p className="text-xs text-secondary-500 dark:text-gray-500 mb-3">
                  Shown as the promotional banner on the customer menu
                </p>
                <div className="space-y-3">
                  {cafeSettings?.promo_banner_image_url && (
                    <div className="relative">
                      <img
                        src={getImageUrl(cafeSettings.promo_banner_image_url)}
                        alt="Promo Banner"
                        className="w-full h-48 object-cover border rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleRemovePromoBannerImage}
                        disabled={uploadingPromoBanner}
                        className="mt-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm disabled:opacity-50"
                      >
                        {uploadingPromoBanner ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  )}
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        onChange={(e) => setSelectedPromoBannerFile(e.target.files[0])}
                        accept="image/*"
                        className="input-field"
                        disabled={uploadingPromoBanner}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handlePromoBannerUpload}
                      disabled={!selectedPromoBannerFile || uploadingPromoBanner}
                      className="btn-primary disabled:opacity-50"
                    >
                      {uploadingPromoBanner ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
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
      </div>
    </div>
  );
};

export default CafeSettings; 