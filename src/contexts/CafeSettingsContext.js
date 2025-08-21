import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const CafeSettingsContext = createContext();

export const useCafeSettings = () => {
  const context = useContext(CafeSettingsContext);
  if (!context) {
    throw new Error('useCafeSettings must be used within a CafeSettingsProvider');
  }
  return context;
};

export const CafeSettingsProvider = ({ children }) => {
  const [cafeSettings, setCafeSettings] = useState({
    cafe_name: 'Our Cafe',
    logo_url: '/images/palm-cafe-logo.png',
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
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCafeSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/cafe-settings');
      
      // Convert numeric boolean values to actual booleans
      const processedData = {
        ...response.data,
        show_kitchen_tab: Boolean(response.data.show_kitchen_tab),
        show_customers_tab: Boolean(response.data.show_customers_tab),
        show_payment_methods_tab: Boolean(response.data.show_payment_methods_tab),
        show_menu_tab: Boolean(response.data.show_menu_tab),
        show_inventory_tab: Boolean(response.data.show_inventory_tab),
        show_history_tab: Boolean(response.data.show_history_tab),
        show_menu_images: Boolean(response.data.show_menu_images),
        chef_show_kitchen_tab: Boolean(response.data.chef_show_kitchen_tab),
        chef_show_menu_tab: Boolean(response.data.chef_show_menu_tab),
        chef_show_inventory_tab: Boolean(response.data.chef_show_inventory_tab),
        chef_show_history_tab: Boolean(response.data.chef_show_history_tab),
        chef_can_edit_orders: Boolean(response.data.chef_can_edit_orders),
        chef_can_view_customers: Boolean(response.data.chef_can_view_customers),
        chef_can_view_payments: Boolean(response.data.chef_can_view_payments),
        reception_show_kitchen_tab: Boolean(response.data.reception_show_kitchen_tab),
        reception_show_menu_tab: Boolean(response.data.reception_show_menu_tab),
        reception_show_inventory_tab: Boolean(response.data.reception_show_inventory_tab),
        reception_show_history_tab: Boolean(response.data.reception_show_history_tab),
        reception_can_edit_orders: Boolean(response.data.reception_can_edit_orders),
        reception_can_view_customers: Boolean(response.data.reception_can_view_customers),
        reception_can_view_payments: Boolean(response.data.reception_can_view_payments),
        reception_can_create_orders: Boolean(response.data.reception_can_create_orders),
        admin_can_access_settings: Boolean(response.data.admin_can_access_settings),
        admin_can_manage_users: Boolean(response.data.admin_can_manage_users),
        admin_can_view_reports: Boolean(response.data.admin_can_view_reports),
        admin_can_manage_inventory: Boolean(response.data.admin_can_manage_inventory),
        admin_can_manage_menu: Boolean(response.data.admin_can_manage_menu),
        enable_thermal_printer: Boolean(response.data.enable_thermal_printer),
        default_printer_type: response.data.default_printer_type || 'system',
        printer_name: response.data.printer_name,
        printer_port: response.data.printer_port,
        printer_baud_rate: response.data.printer_baud_rate || 9600,
        auto_print_new_orders: Boolean(response.data.auto_print_new_orders),
        print_order_copies: response.data.print_order_copies || 1
      };
      
      setCafeSettings(processedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching cafe settings:', err);
      setError('Failed to load cafe settings');
      // Keep default values if API fails
    } finally {
      setLoading(false);
    }
  };

  const updateCafeSettings = async (newSettings) => {
    try {
      const response = await axios.put('/cafe-settings', newSettings);
      
      // Convert numeric boolean values to actual booleans, just like in fetchCafeSettings
      const processedData = {
        ...response.data,
        show_kitchen_tab: Boolean(response.data.show_kitchen_tab),
        show_customers_tab: Boolean(response.data.show_customers_tab),
        show_payment_methods_tab: Boolean(response.data.show_payment_methods_tab),
        show_menu_tab: Boolean(response.data.show_menu_tab),
        show_inventory_tab: Boolean(response.data.show_inventory_tab),
        show_history_tab: Boolean(response.data.show_history_tab),
        show_menu_images: Boolean(response.data.show_menu_images),
        chef_show_kitchen_tab: Boolean(response.data.chef_show_kitchen_tab),
        chef_show_menu_tab: Boolean(response.data.chef_show_menu_tab),
        chef_show_inventory_tab: Boolean(response.data.chef_show_inventory_tab),
        chef_show_history_tab: Boolean(response.data.chef_show_history_tab),
        chef_can_edit_orders: Boolean(response.data.chef_can_edit_orders),
        chef_can_view_customers: Boolean(response.data.chef_can_view_customers),
        chef_can_view_payments: Boolean(response.data.chef_can_view_payments),
        reception_show_kitchen_tab: Boolean(response.data.reception_show_kitchen_tab),
        reception_show_menu_tab: Boolean(response.data.reception_show_menu_tab),
        reception_show_inventory_tab: Boolean(response.data.reception_show_inventory_tab),
        reception_show_history_tab: Boolean(response.data.reception_show_history_tab),
        reception_can_edit_orders: Boolean(response.data.reception_can_edit_orders),
        reception_can_view_customers: Boolean(response.data.reception_can_view_customers),
        reception_can_view_payments: Boolean(response.data.reception_can_view_payments),
        reception_can_create_orders: Boolean(response.data.reception_can_create_orders),
        admin_can_access_settings: Boolean(response.data.admin_can_access_settings),
        admin_can_manage_users: Boolean(response.data.admin_can_manage_users),
        admin_can_view_reports: Boolean(response.data.admin_can_view_reports),
        admin_can_manage_inventory: Boolean(response.data.admin_can_manage_inventory),
        admin_can_manage_menu: Boolean(response.data.admin_can_manage_menu),
        enable_thermal_printer: Boolean(response.data.enable_thermal_printer),
        default_printer_type: response.data.default_printer_type || 'system',
        printer_name: response.data.printer_name,
        printer_port: response.data.printer_port,
        printer_baud_rate: response.data.printer_baud_rate || 9600,
        auto_print_new_orders: Boolean(response.data.auto_print_new_orders),
        print_order_copies: response.data.print_order_copies || 1
      };
      
      setCafeSettings(processedData);
      return { success: true };
    } catch (err) {
      console.error('Error updating cafe settings:', err);
      return { success: false, error: err.response?.data?.message || 'Failed to update settings' };
    }
  };

  const updateLogo = async (logoUrl) => {
    try {
      const response = await axios.post('/cafe-settings/logo', { logo_url: logoUrl });
      setCafeSettings(prev => ({ ...prev, logo_url: response.data.logo_url }));
      return { success: true };
    } catch (err) {
      console.error('Error updating logo:', err);
      return { success: false, error: err.response?.data?.message || 'Failed to update logo' };
    }
  };

  useEffect(() => {
    fetchCafeSettings();
  }, []);

  const value = {
    cafeSettings,
    loading,
    error,
    fetchCafeSettings,
    updateCafeSettings,
    updateLogo
  };

  return (
    <CafeSettingsContext.Provider value={value}>
      {children}
    </CafeSettingsContext.Provider>
  );
}; 