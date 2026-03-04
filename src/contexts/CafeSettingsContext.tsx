import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

export interface CafeSettings {
  cafe_name: string | null;
  logo_url: string | null;
  address: string;
  phone: string;
  email: string;
  website: string;
  opening_hours: string;
  description: string;
  show_kitchen_tab: boolean;
  show_customers_tab: boolean;
  show_payment_methods_tab: boolean;
  show_menu_tab: boolean;
  show_inventory_tab: boolean;
  show_history_tab: boolean;
  show_menu_images: boolean;
  chef_show_kitchen_tab: boolean;
  chef_show_menu_tab: boolean;
  chef_show_inventory_tab: boolean;
  chef_show_history_tab: boolean;
  chef_can_edit_orders: boolean;
  chef_can_view_customers: boolean;
  chef_can_view_payments: boolean;
  reception_show_kitchen_tab: boolean;
  reception_show_menu_tab: boolean;
  reception_show_inventory_tab: boolean;
  reception_show_history_tab: boolean;
  reception_can_edit_orders: boolean;
  reception_can_view_customers: boolean;
  reception_can_view_payments: boolean;
  reception_can_create_orders: boolean;
  admin_can_access_settings: boolean;
  admin_can_manage_users: boolean;
  admin_can_view_reports: boolean;
  admin_can_manage_inventory: boolean;
  admin_can_manage_menu: boolean;
  enable_thermal_printer: boolean;
  default_printer_type: string;
  printer_name: string | null;
  printer_port: string | null;
  printer_baud_rate: number;
  auto_print_new_orders: boolean;
  print_order_copies: number;
  light_primary_color: string;
  light_secondary_color: string;
  light_accent_color: string;
  light_background_color: string;
  light_text_color: string;
  light_surface_color: string;
  dark_primary_color: string;
  dark_secondary_color: string;
  dark_accent_color: string;
  dark_background_color: string;
  dark_text_color: string;
  dark_surface_color: string;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  hero_image_url?: string | null;
  promo_banner_image_url?: string | null;
  [key: string]: unknown;
}

const INITIAL_CAFE_SETTINGS: CafeSettings = {
  cafe_name: null,
  logo_url: null,
  address: '',
  phone: '',
  email: '',
  website: '',
  opening_hours: '',
  description: '',
  show_kitchen_tab: true,
  show_customers_tab: true,
  show_payment_methods_tab: true,
  show_menu_tab: true,
  show_inventory_tab: true,
  show_history_tab: true,
  show_menu_images: true,
  chef_show_kitchen_tab: true,
  chef_show_menu_tab: false,
  chef_show_inventory_tab: false,
  chef_show_history_tab: true,
  chef_can_edit_orders: true,
  chef_can_view_customers: false,
  chef_can_view_payments: false,
  reception_show_kitchen_tab: true,
  reception_show_menu_tab: false,
  reception_show_inventory_tab: false,
  reception_show_history_tab: true,
  reception_can_edit_orders: true,
  reception_can_view_customers: true,
  reception_can_view_payments: true,
  reception_can_create_orders: true,
  admin_can_access_settings: false,
  admin_can_manage_users: false,
  admin_can_view_reports: true,
  admin_can_manage_inventory: true,
  admin_can_manage_menu: true,
  enable_thermal_printer: false,
  default_printer_type: 'system',
  printer_name: null,
  printer_port: null,
  printer_baud_rate: 9600,
  auto_print_new_orders: false,
  print_order_copies: 1,
  light_primary_color: '#3B82F6',
  light_secondary_color: '#6B7280',
  light_accent_color: '#10B981',
  light_background_color: '#FFFFFF',
  light_text_color: '#1F2937',
  light_surface_color: '#F9FAFB',
  dark_primary_color: '#60A5FA',
  dark_secondary_color: '#9CA3AF',
  dark_accent_color: '#34D399',
  dark_background_color: '#111827',
  dark_text_color: '#F9FAFB',
  dark_surface_color: '#1F2937'
};

export interface CafeSettingsContextValue {
  cafeSettings: CafeSettings;
  loading: boolean;
  error: string | null;
  fetchCafeSettings: () => Promise<void>;
  updateCafeSettings: (newSettings: Partial<CafeSettings>) => Promise<{ success: boolean; error?: string }>;
  updateLogo: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  updateHeroImage: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  updatePromoBannerImage: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  removeHeroImage: () => Promise<{ success: boolean; error?: string }>;
  removePromoBannerImage: () => Promise<{ success: boolean; error?: string }>;
  removeLogo: () => Promise<{ success: boolean; error?: string }>;
}

const CafeSettingsContext = createContext<CafeSettingsContextValue | null>(null);

export const useCafeSettings = (): CafeSettingsContextValue => {
  const context = useContext(CafeSettingsContext);
  if (!context) {
    throw new Error('useCafeSettings must be used within a CafeSettingsProvider');
  }
  return context;
};

function processCafeSettingsData(data: Record<string, unknown>): CafeSettings {
  return {
    ...INITIAL_CAFE_SETTINGS,
    ...data,
    show_kitchen_tab: Boolean(data.show_kitchen_tab),
    show_customers_tab: Boolean(data.show_customers_tab),
    show_payment_methods_tab: Boolean(data.show_payment_methods_tab),
    show_menu_tab: Boolean(data.show_menu_tab),
    show_inventory_tab: Boolean(data.show_inventory_tab),
    show_history_tab: Boolean(data.show_history_tab),
    show_menu_images: Boolean(data.show_menu_images),
    chef_show_kitchen_tab: Boolean(data.chef_show_kitchen_tab),
    chef_show_menu_tab: Boolean(data.chef_show_menu_tab),
    chef_show_inventory_tab: Boolean(data.chef_show_inventory_tab),
    chef_show_history_tab: Boolean(data.chef_show_history_tab),
    chef_can_edit_orders: Boolean(data.chef_can_edit_orders),
    chef_can_view_customers: Boolean(data.chef_can_view_customers),
    chef_can_view_payments: Boolean(data.chef_can_view_payments),
    reception_show_kitchen_tab: Boolean(data.reception_show_kitchen_tab),
    reception_show_menu_tab: Boolean(data.reception_show_menu_tab),
    reception_show_inventory_tab: Boolean(data.reception_show_inventory_tab),
    reception_show_history_tab: Boolean(data.reception_show_history_tab),
    reception_can_edit_orders: Boolean(data.reception_can_edit_orders),
    reception_can_view_customers: Boolean(data.reception_can_view_customers),
    reception_can_view_payments: Boolean(data.reception_can_view_payments),
    reception_can_create_orders: Boolean(data.reception_can_create_orders),
    admin_can_access_settings: Boolean(data.admin_can_access_settings),
    admin_can_manage_users: Boolean(data.admin_can_manage_users),
    admin_can_view_reports: Boolean(data.admin_can_view_reports),
    admin_can_manage_inventory: Boolean(data.admin_can_manage_inventory),
    admin_can_manage_menu: Boolean(data.admin_can_manage_menu),
    enable_thermal_printer: Boolean(data.enable_thermal_printer),
    default_printer_type: (data.default_printer_type as string) || 'system',
    printer_name: (data.printer_name as string) ?? null,
    printer_port: (data.printer_port as string) ?? null,
    printer_baud_rate: Number(data.printer_baud_rate) || 9600,
    auto_print_new_orders: Boolean(data.auto_print_new_orders),
    print_order_copies: Number(data.print_order_copies) || 1,
    light_primary_color: (data.light_primary_color as string) || '#3B82F6',
    light_secondary_color: (data.light_secondary_color as string) || '#6B7280',
    light_accent_color: (data.light_accent_color as string) || '#10B981',
    light_background_color: (data.light_background_color as string) || '#FFFFFF',
    light_text_color: (data.light_text_color as string) || '#1F2937',
    light_surface_color: (data.light_surface_color as string) || '#F9FAFB',
    dark_primary_color: (data.dark_primary_color as string) || '#60A5FA',
    dark_secondary_color: (data.dark_secondary_color as string) || '#9CA3AF',
    dark_accent_color: (data.dark_accent_color as string) || '#34D399',
    dark_background_color: (data.dark_background_color as string) || '#111827',
    dark_text_color: (data.dark_text_color as string) || '#F9FAFB',
    dark_surface_color: (data.dark_surface_color as string) || '#1F2937',
    primary_color: (data.primary_color as string) ?? null,
    secondary_color: (data.secondary_color as string) ?? null,
    accent_color: (data.accent_color as string) ?? null,
    hero_image_url: (data.hero_image_url as string) ?? null,
    promo_banner_image_url: (data.promo_banner_image_url as string) ?? null,
    logo_url: (data.logo_url as string) ?? null
  };
}

interface CafeSettingsProviderProps {
  children: ReactNode;
}

export const CafeSettingsProvider: React.FC<CafeSettingsProviderProps> = ({ children }) => {
  const { user, impersonation } = useAuth();
  const effectiveCafeId = impersonation?.isImpersonating ? impersonation?.cafeId : user?.cafe_id;

  const [cafeSettings, setCafeSettings] = useState<CafeSettings>(INITIAL_CAFE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCafeSettings = async () => {
    try {
      if (
        window.location.pathname === '/customer' ||
        window.location.pathname.startsWith('/customer/') ||
        window.location.pathname.startsWith('/cafe/')
      ) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const response = await axios.get('/cafe-settings');
      setCafeSettings(processCafeSettingsData(response.data as Record<string, unknown>));
      setError(null);
    } catch (err) {
      console.error('Error fetching cafe settings:', err);
      setError('Failed to load cafe settings');
    } finally {
      setLoading(false);
    }
  };

  const updateCafeSettings = async (newSettings: Partial<CafeSettings>) => {
    try {
      const response = await axios.put('/cafe-settings', newSettings);
      setCafeSettings(processCafeSettingsData(response.data as Record<string, unknown>));
      return { success: true };
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error('Error updating cafe settings:', err);
      return { success: false, error: error.response?.data?.message || 'Failed to update settings' };
    }
  };

  const updateLogo = async (formData: FormData) => {
    try {
      const response = await axios.post('/cafe-settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCafeSettings((prev) => ({ ...prev, logo_url: (response.data as { logo_url: string }).logo_url }));
      return { success: true };
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      return { success: false, error: error.response?.data?.error || 'Failed to update logo' };
    }
  };

  const updateHeroImage = async (formData: FormData) => {
    try {
      const response = await axios.post('/cafe-settings/hero-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCafeSettings((prev) => ({ ...prev, hero_image_url: (response.data as { hero_image_url: string }).hero_image_url }));
      return { success: true };
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      return { success: false, error: error.response?.data?.error || 'Failed to update hero image' };
    }
  };

  const updatePromoBannerImage = async (formData: FormData) => {
    try {
      const response = await axios.post('/cafe-settings/promo-banner-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCafeSettings((prev) => ({ ...prev, promo_banner_image_url: (response.data as { promo_banner_image_url: string }).promo_banner_image_url }));
      return { success: true };
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      return { success: false, error: error.response?.data?.error || 'Failed to update promo banner image' };
    }
  };

  const removeHeroImage = async () => {
    try {
      await axios.delete('/cafe-settings/hero-image');
      setCafeSettings((prev) => ({ ...prev, hero_image_url: null }));
      return { success: true };
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      return { success: false, error: error.response?.data?.error || 'Failed to remove hero image' };
    }
  };

  const removePromoBannerImage = async () => {
    try {
      await axios.delete('/cafe-settings/promo-banner-image');
      setCafeSettings((prev) => ({ ...prev, promo_banner_image_url: null }));
      return { success: true };
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      return { success: false, error: error.response?.data?.error || 'Failed to remove promo banner image' };
    }
  };

  const removeLogo = async () => {
    try {
      await axios.delete('/cafe-settings/logo');
      setCafeSettings((prev) => ({ ...prev, logo_url: null }));
      return { success: true };
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      return { success: false, error: error.response?.data?.error || 'Failed to remove logo' };
    }
  };

  useEffect(() => {
    if (effectiveCafeId === undefined || effectiveCafeId === null) {
      setCafeSettings(INITIAL_CAFE_SETTINGS);
      setError(null);
      setLoading(false);
      return;
    }
    setCafeSettings(INITIAL_CAFE_SETTINGS);
    setError(null);
    setLoading(true);
    fetchCafeSettings();
  }, [effectiveCafeId]);

  const value: CafeSettingsContextValue = {
    cafeSettings,
    loading,
    error,
    fetchCafeSettings,
    updateCafeSettings,
    updateLogo,
    updateHeroImage,
    updatePromoBannerImage,
    removeHeroImage,
    removePromoBannerImage,
    removeLogo
  };

  return <CafeSettingsContext.Provider value={value}>{children}</CafeSettingsContext.Provider>;
};
