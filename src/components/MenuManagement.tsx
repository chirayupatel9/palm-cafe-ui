import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Save, X, Download, Upload, FolderOpen, RefreshCw, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useCurrency } from '../contexts/CurrencyContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useCafeSettings } from '../contexts/CafeSettingsContext';
import { getImageUrl, getPlaceholderImage } from '../utils/imageUtils';
import { TableSkeleton, CardSkeleton } from './ui/Skeleton';
import { EmptyMenu } from './ui/EmptyState';
import ConfirmModal from './ui/ConfirmModal';
import Dialog from './ui/Dialog';
import Select from './ui/Select';
import { GlassButton } from './ui/GlassButton';

export interface MenuManagementProps {
  menuItems: any[];
  onUpdate: (id: string | number, updatedItem: any) => void | Promise<void>;
  onAdd: (item: any) => void | Promise<void>;
  onDelete: (id: string | number) => void | Promise<void>;
  onMenuRefresh?: () => void | Promise<void>;
}

const MenuManagement: React.FC<MenuManagementProps> = ({ menuItems, onUpdate, onAdd, onDelete, onMenuRefresh }) => {
  const { formatCurrency } = useCurrency();
  const { isDarkMode } = useDarkMode();
  const { cafeSettings } = useCafeSettings();
  const [activeTab, setActiveTab] = useState('menu-items');
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    sort_order: '',
    image_url: '',
    featured_priority: ''
  });
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [removingImage, setRemovingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Category management state
  const [categoryEditingId, setCategoryEditingId] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    sort_order: ''
  });
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [autoGenerating, setAutoGenerating] = useState(false);

  const importExcelInputRef = useRef<HTMLInputElement>(null);
  const importZipInputRef = useRef<HTMLInputElement>(null);
  const addFormImageInputRef = useRef<HTMLInputElement>(null);
  const editFormImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/categories/with-counts');
      setCategories(response.data);
      
      // Set default category for new items
      if (response.data.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: response.data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setCategoryLoading(false);
    }
  };

  // Helper function to ensure price is a number
  const ensureNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  const generateItemDescription = (itemName, categoryId = '', itemCategoryName = '', itemPrice = 0) => {
    const cleanName = (itemName || '').trim();
    if (!cleanName) return '';

    const selectedCategoryName =
      itemCategoryName ||
      categories.find((category) => String(category.id) === String(categoryId))?.name ||
      '';

    const lowerName = cleanName.toLowerCase();
    const lowerCategory = selectedCategoryName.toLowerCase();
    const combinedText = `${lowerName} ${lowerCategory}`;
    const normalizedPrice = ensureNumber(itemPrice);

    const hasKeyword = (keywords) => keywords.some((keyword) => combinedText.includes(keyword));

    const isBeverage = hasKeyword(['coffee', 'latte', 'cappuccino', 'mocha', 'espresso', 'tea', 'smoothie', 'juice', 'shake', 'frappe']);
    const isDessert = hasKeyword(['cake', 'brownie', 'cookie', 'muffin', 'pastry', 'tart', 'donut', 'dessert', 'ice cream']);
    const isSavory = hasKeyword(['sandwich', 'burger', 'wrap', 'pasta', 'pizza', 'salad', 'panini', 'noodle', 'rice', 'toast']);
    const isCold = hasKeyword(['iced', 'cold', 'chilled', 'frozen']);
    const isSpicy = hasKeyword(['spicy', 'masala', 'chili', 'schezwan', 'peri', 'pepper']);

    const getStableIndex = (seed, length) => {
      let hash = 0;
      for (let i = 0; i < seed.length; i += 1) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash) % length;
    };

    const pick = (options) => options[getStableIndex(cleanName, options.length)];

    let prepPhrase = 'prepared fresh to order with quality ingredients';
    let pairingPhrase = 'A great pick for any time of day.';

    if (isBeverage && isCold) {
      prepPhrase = 'served chilled with a smooth, refreshing finish';
      pairingPhrase = 'Perfect for a cool, easy cafe break.';
    } else if (isBeverage) {
      prepPhrase = 'crafted fresh for a rich, comforting sip';
      pairingPhrase = 'Perfect for a morning boost or afternoon reset.';
    } else if (isDessert) {
      prepPhrase = 'made with a soft texture and balanced sweetness';
      pairingPhrase = 'Great with coffee or as a sweet anytime treat.';
    } else if (isSavory && isSpicy) {
      prepPhrase = 'made fresh with bold spices and satisfying flavor';
      pairingPhrase = 'Ideal when you want something hearty with a kick.';
    } else if (isSavory) {
      prepPhrase = 'made fresh with a satisfying, savory bite';
      pairingPhrase = 'A solid choice for lunch, snacking, or sharing.';
    }

    const intros = [
      `${cleanName} is ${prepPhrase}.`,
      `Our ${cleanName} is ${prepPhrase}.`,
      `A customer favorite, ${cleanName} is ${prepPhrase}.`
    ];

    const categorySentence = selectedCategoryName
      ? `From our ${selectedCategoryName} selection.`
      : '';

    let valueSentence = 'Great value for a quality cafe item.';
    if (normalizedPrice > 0 && normalizedPrice <= 4) {
      valueSentence = 'A budget-friendly option that is easy to love.';
    } else if (normalizedPrice > 4 && normalizedPrice <= 8) {
      valueSentence = 'A well-balanced everyday pick with great value.';
    } else if (normalizedPrice > 8) {
      valueSentence = 'A premium cafe pick worth savoring.';
    }

    return [pick(intros), categorySentence, pairingPhrase, valueSentence].filter(Boolean).join(' ');
  };

  const getDisplayDescription = (item) => {
    const existingDescription = (item?.description || '').trim();
    if (existingDescription) {
      return existingDescription;
    }

    return generateItemDescription(item?.name, item?.category_id, item?.category_name, item?.price);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setSelectedImageFile(null); // Clear any selected file when editing
    setFormData({
      category_id: item.category_id || '',
      name: item.name,
      description: item.description,
      price: ensureNumber(item.price).toString(),
      sort_order: item.sort_order ? item.sort_order.toString() : '',
      image_url: item.image_url || '',
      featured_priority: item.featured_priority ? item.featured_priority.toString() : ''
    });
  };

  const handleSave = async () => {
    if (!formData.category_id || !formData.name.trim() || !formData.price) {
      toast.error('Fill in all required fields to continue');
      return;
    }

    const price = ensureNumber(formData.price);
    if (price <= 0) {
      toast.error('Enter a valid price amount');
      return;
    }

    try {
      const finalDescription =
        formData.description.trim() || generateItemDescription(formData.name, formData.category_id, '', price);

      if (editingId) {
        const updateData = {
          category_id: formData.category_id,
          name: formData.name.trim(),
          description: finalDescription,
          price: price,
          sort_order: parseInt(formData.sort_order) || 0,
          image_url: formData.image_url,
          featured_priority: formData.featured_priority && formData.featured_priority.trim() !== '' 
            ? parseInt(formData.featured_priority) 
            : null
        };
        await onUpdate(editingId, updateData);
        toast.success('Changes saved');
      } else {
        const addData = {
          category_id: formData.category_id,
          name: formData.name.trim(),
          description: finalDescription,
          price: price,
          sort_order: parseInt(formData.sort_order) || 0,
          image_url: formData.image_url,
          featured_priority: formData.featured_priority && formData.featured_priority.trim() !== '' 
            ? parseInt(formData.featured_priority) 
            : null
        };
        await onAdd(addData);
        toast.success('Menu item added');
      }
      
      // Auto-generate categories from menu items
      try {
        await axios.post('/categories/generate');
      } catch (error) {
        console.error('Error auto-generating categories:', error);
      }
      
      setEditingId(null);
      setShowAddForm(false);
      setFormData({ 
        category_id: categories.length > 0 ? categories[0].id : '',
        name: '', 
        description: '', 
        price: '',
        sort_order: '',
        image_url: '',
        featured_priority: ''
      });
    } catch (error) {
      console.error('Error saving menu item:', error);
      const errorMessage = error.response?.data?.error || 'We couldn\'t save your changes. Please try again.';
      toast.error(errorMessage);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    setSelectedImageFile(null);
    setFormData({ 
      category_id: categories.length > 0 ? categories[0].id : '',
      name: '', 
      description: '', 
      price: '',
      sort_order: '',
      image_url: '',
      featured_priority: ''
    });
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    setIsDeleting(true);
    try {
      await onDelete(deleteConfirm.id);
      toast.success(`"${deleteConfirm.name}" has been deleted successfully`);
      setDeleteConfirm(null);
      
      // Auto-generate categories from menu items after deletion
      try {
        await axios.post('/categories/generate');
      } catch (error) {
        console.error('Error auto-generating categories:', error);
      }
    } catch (error) {
      toast.error('Failed to delete menu item. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isImageFile = (file) => {
    if (!file) return false;
    if (file.type && file.type.startsWith('image/')) return true;
    const ext = (file.name || '').toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic'].includes(ext);
  };

  const handleImageFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedImageFile(null);
      return;
    }

    if (!isImageFile(file)) {
      toast.error('Please select an image file (e.g. JPG, PNG, WebP)');
      event.target.value = '';
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      event.target.value = '';
      return;
    }

    setSelectedImageFile(file);
    event.target.value = '';
    handleImageUpload(file);
  };

  const handleImageUpload = async (fileFromEvent) => {
    const fileToUpload = fileFromEvent || selectedImageFile;
    if (!fileToUpload) {
      toast.error('Please select an image file first');
      return;
    }
    if (!isImageFile(fileToUpload)) {
      toast.error('Please select an image file (e.g. JPG, PNG, WebP)');
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (fileToUpload.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setImageUploading(true);
      const formData = new FormData();
      formData.append('image', fileToUpload);

      // If editing an existing item, use item-specific endpoint
      if (editingId) {
        const response = await axios.post(`/menu/${editingId}/image`, formData);

        if (response.data.success) {
          setFormData(prev => ({ ...prev, image_url: response.data.image_url }));
          toast.success('Image uploaded successfully');
          setSelectedImageFile(null);
          // Refresh menu items to show updated image
          if (onUpdate) {
            await onUpdate(editingId, { ...formData, image_url: response.data.image_url });
          }
        } else {
          toast.error('Failed to upload image');
        }
      } else {
        // For new items, use generic upload endpoint
        const response = await axios.post('/menu/upload-image', formData);

        if (response.data.success) {
          setFormData(prev => ({ ...prev, image_url: response.data.image_url }));
          toast.success('Image uploaded successfully');
          setSelectedImageFile(null);
        } else {
          toast.error('Failed to upload image');
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!editingId) {
      // For new items, just clear the form
      setFormData(prev => ({ ...prev, image_url: '' }));
      setSelectedImageFile(null);
      return;
    }

    try {
      setRemovingImage(true);
      const response = await axios.delete(`/menu/${editingId}/image`);

      if (response.data.success) {
        setFormData(prev => ({ ...prev, image_url: '' }));
        toast.success('Image removed successfully');
        // Refresh menu items to show updated state
        if (onUpdate) {
          await onUpdate(editingId, { ...formData, image_url: null });
        }
      } else {
        toast.error('Failed to remove image');
      }
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error(error.response?.data?.error || 'Failed to remove image');
    } finally {
      setRemovingImage(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/menu/export', { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cafeSettings.cafe_name || 'cafe'}-menu.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Menu exported successfully');
    } catch (error) {
      console.error('Error exporting menu:', error);
      toast.error('Failed to export menu');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please select an Excel file (.xlsx or .xls)');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/menu/import', formData);

      toast.success(response.data.message, { duration: 5000 });

      const rowErrors = response.data?.errors;
      if (Array.isArray(rowErrors) && rowErrors.length > 0) {
        const preview = rowErrors.slice(0, 8).join('\n');
        const more = rowErrors.length > 8 ? `\n… and ${rowErrors.length - 8} more (see browser console)` : '';
        console.warn('Menu import row issues:', rowErrors);
        toast.error(`Some rows had issues:\n${preview}${more}`, {
          duration: 20000,
          style: { whiteSpace: 'pre-line' }
        });
      }

      try {
        await axios.post('/categories/generate');
      } catch (err) {
        console.error('Error auto-generating categories:', err);
        toast.error('Import saved but category sync failed. Try “Generate categories” manually.', { duration: 8000 });
      }

      await fetchCategories();
      if (onMenuRefresh) {
        await onMenuRefresh();
      }
    } catch (error: any) {
      console.error('Error importing menu:', error);
      const data = error.response?.data;
      const detail =
        (typeof data?.error === 'string' && data.error) ||
        (typeof data?.details === 'string' && data.details) ||
        (Array.isArray(data?.errors) && data.errors.length > 0 && data.errors.slice(0, 5).join('; ')) ||
        error?.message;
      toast.error(detail || 'Failed to import menu', { duration: 12000 });
    } finally {
      setLoading(false);
      event.target.value = ''; // Reset file input
    }
  };

  const handleZipImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      toast.error('Please select a ZIP file (.zip)');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/menu/import-zip', formData);

      // Show detailed import results
      const { successCount, failureCount, imageStats, errors } = response.data;
      
      let message = `Import completed: ${successCount} items imported`;
      if (failureCount > 0) {
        message += `, ${failureCount} failed`;
      }
      if (imageStats) {
        message += `. Images: ${imageStats.attached} attached`;
        if (imageStats.missing > 0) {
          message += `, ${imageStats.missing} missing`;
        }
        if (imageStats.invalid > 0) {
          message += `, ${imageStats.invalid} invalid`;
        }
      }
      
      toast.success(message, { duration: 6000 });

      if (errors && errors.length > 0) {
        console.warn('Import errors:', errors);
        const preview = errors.slice(0, 8).join('\n');
        const more = errors.length > 8 ? `\n… and ${errors.length - 8} more (see console)` : '';
        toast.error(`Import issues:\n${preview}${more}`, {
          duration: 20000,
          style: { whiteSpace: 'pre-line' }
        });
      }

      try {
        await axios.post('/categories/generate');
      } catch (err) {
        console.error('Error auto-generating categories:', err);
        toast.error('ZIP import saved but category sync failed. Try “Generate categories” manually.', { duration: 8000 });
      }

      await fetchCategories();
      if (onMenuRefresh) {
        await onMenuRefresh();
      }
    } catch (error: any) {
      console.error('Error importing menu ZIP:', error);
      const data = error.response?.data;
      const errorMessage =
        (typeof data?.error === 'string' && data.error) ||
        (typeof data?.details === 'string' && data.details) ||
        (Array.isArray(data?.errors) && data.errors.slice(0, 5).join('; ')) ||
        error?.message ||
        'Failed to import menu ZIP';
      toast.error(errorMessage, { duration: 12000 });
    } finally {
      setLoading(false);
      event.target.value = ''; // Reset file input
    }
  };

  // Category Management Functions
  const generateCategoriesFromMenu = async () => {
    try {
      setAutoGenerating(true);
      const response = await axios.post('/categories/generate');
      toast.success(response.data.message);
      fetchCategories(); // Refresh the list
    } catch (error) {
      console.error('Error generating categories:', error);
      toast.error('Failed to generate categories from menu');
    } finally {
      setAutoGenerating(false);
    }
  };

  const handleCategoryEdit = (category) => {
    setCategoryEditingId(category.id);
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      sort_order: category.sort_order ? category.sort_order.toString() : ''
    });
  };

  const handleCategorySave = async () => {
    if (!categoryFormData.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      if (categoryEditingId) {
        const response = await axios.put(`/categories/${categoryEditingId}`, {
          name: categoryFormData.name.trim(),
          description: categoryFormData.description.trim(),
          sort_order: parseInt(categoryFormData.sort_order) || 0,
          is_active: true
        });
        toast.success('Category updated successfully');
      } else {
        const response = await axios.post('/categories', {
          name: categoryFormData.name.trim(),
          description: categoryFormData.description.trim(),
          sort_order: parseInt(categoryFormData.sort_order) || 0
        });
        toast.success('Category created successfully');
      }
      
      setCategoryEditingId(null);
      setShowCategoryForm(false);
      setCategoryFormData({ name: '', description: '', sort_order: '' });
      fetchCategories(); // Refresh the list
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    }
  };

  const handleCategoryCancel = () => {
    setCategoryEditingId(null);
    setShowCategoryForm(false);
    setCategoryFormData({ name: '', description: '', sort_order: '' });
  };

  const handleCategoryDelete = async (id, name, itemCount) => {
    if (itemCount > 0) {
      toast.error(`Cannot delete category "${name}" - it has ${itemCount} menu items. Please move or delete the items first.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await axios.delete(`/categories/${id}`);
        
        toast.success('Category deleted successfully');
        fetchCategories(); // Refresh the list
      } catch (error) {
        console.error('Error deleting category:', error);
        toast.error('Failed to delete category');
      }
    }
  };

  const handleCategoryInputChange = (field, value) => {
    setCategoryFormData(prev => ({ ...prev, [field]: value }));
  };

  // Filter menu items by category
  const filteredMenuItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category_id === selectedCategory);

  // Group menu items by category for display
  const groupedMenuItems = menuItems.reduce<Record<string, any[]>>((groups, item) => {
    const categoryName = item.category_name || 'Uncategorized';
    if (!groups[categoryName]) {
      groups[categoryName] = [];
    }
    groups[categoryName].push(item);
    return groups;
  }, {});

  if (categoryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <FolderOpen className="h-6 w-6 text-[var(--color-primary)]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[var(--color-on-surface)] truncate">Menu</h1>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">Manage menu items and categories</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation – same as Reports & Invoices */}
      <div className="flex gap-2 p-1 rounded-2xl glass-card w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('menu-items')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'menu-items'
              ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
              : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--surface-table)]/50 hover:text-[var(--color-on-surface)]'
          }`}
        >
          <FolderOpen className="h-4 w-4 shrink-0" />
          Menu Items
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'categories'
              ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
              : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--surface-table)]/50 hover:text-[var(--color-on-surface)]'
          }`}
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          Categories
        </button>
      </div>

      {/* Menu Items Tab */}
      {activeTab === 'menu-items' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <FolderOpen className="h-6 w-6 text-[var(--color-primary)]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-on-surface)] truncate">Menu Items</h2>
                <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">Manage your cafe's menu items</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <input
                ref={importExcelInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                className="hidden"
                disabled={loading}
              />
              <input
                ref={importZipInputRef}
                type="file"
                accept=".zip"
                onChange={handleZipImport}
                className="hidden"
                disabled={loading}
              />
              <div className="relative group inline-flex">
                <span
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 w-64 text-xs font-normal text-[var(--color-on-surface)] bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none"
                  role="tooltip"
                >
                  Upload a .xlsx or .xls file with a sheet named &quot;Menu Items&quot; (columns: Item Name, Price, Category, Description, Sort Order, Image). No images in file—use Import ZIP to include images.
                </span>
                <GlassButton
                  type="button"
                  onClick={() => importExcelInputRef.current?.click()}
                  disabled={loading}
                  size="sm"
                  className="glass-button-secondary"
                  contentClassName="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Import Excel
                </GlassButton>
              </div>
              <div className="relative group inline-flex">
                <span
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 w-64 text-xs font-normal text-[var(--color-on-surface)] bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none"
                  role="tooltip"
                >
                  Upload a .zip containing an Excel file (e.g. menu.xlsx) with a &quot;Menu Items&quot; sheet and an optional &quot;images&quot; folder. Image column in Excel should match filenames in the images folder.
                </span>
                <GlassButton
                  type="button"
                  onClick={() => importZipInputRef.current?.click()}
                  disabled={loading}
                  size="sm"
                  className="glass-button-secondary"
                  contentClassName="flex items-center gap-2"
                >
                  <FolderOpen className="h-4 w-4" />
                  Import ZIP
                </GlassButton>
              </div>
              <GlassButton
                onClick={handleExport}
                disabled={loading}
                size="sm"
                className="glass-button-secondary"
                contentClassName="flex items-center gap-2"
                title="Export menu to Excel (includes image filenames)"
              >
                <Download className="h-4 w-4" />
                Export Excel
              </GlassButton>
              <GlassButton
                onClick={() => setShowAddForm(true)}
                size="sm"
                className="glass-button-primary"
                contentClassName="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add New Item
              </GlassButton>
            </div>
          </div>

          {/* Category Filter – glass card (relative z-10 so dropdown opens above category cards) */}
          <div className="glass-card p-4 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <label className="text-sm font-medium text-[var(--color-on-surface)]">Filter by Category:</label>
              <Select
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...categories.map(c => ({ value: String(c.id), label: c.name }))
                ]}
                value={String(selectedCategory)}
                onChange={setSelectedCategory}
                className="sm:max-w-xs select-trigger-glass select-trigger-glass-hover rounded-full"
                placeholder="All Categories"
              />
            </div>
          </div>

          {/* Add New Item Form */}
          {showAddForm && (
            <div className="glass-card overflow-hidden rounded-2xl shadow-sm">
              <div className="px-5 py-4 border-b border-[var(--color-outline)]/20 bg-[var(--color-surface-container)]/50">
                <h3 className="text-lg font-semibold text-[var(--color-on-surface)]">Add New Menu Item</h3>
                <p className="text-sm text-[var(--color-on-surface-variant)] mt-0.5">Fill in the details below</p>
              </div>
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div className="[&_button]:min-h-[40px] [&_button]:rounded-xl">
                    <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Category *</label>
                    <Select
                      options={[
                        { value: '', label: 'Select Category' },
                        ...categories.map(c => ({ value: String(c.id), label: c.name }))
                      ]}
                      value={formData.category_id === '' || formData.category_id == null ? '' : String(formData.category_id)}
                      onChange={(v) => handleInputChange('category_id', v)}
                      placeholder="Select Category"
                      className="select-trigger-glass select-trigger-glass-hover"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Item Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Cappuccino"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="glass-input w-full min-h-[40px] rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Description</label>
                    <input
                      type="text"
                      placeholder="Optional"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="glass-input w-full min-h-[40px] rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      className="glass-input w-full min-h-[40px] rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Sort Order</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.sort_order}
                      onChange={(e) => handleInputChange('sort_order', e.target.value)}
                      className="glass-input w-full min-h-[40px] rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Featured Priority</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Leave empty to not feature"
                      value={formData.featured_priority}
                      onChange={(e) => handleInputChange('featured_priority', e.target.value)}
                      className="glass-input w-full min-h-[40px] rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5 text-sm"
                      title="Higher = more prominent on featured section"
                    />
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="pt-4 border-t border-[var(--color-outline)]/20">
                  <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Item Image</label>
                  <p className="text-xs text-[var(--color-on-surface-variant)] mb-3">JPEG, PNG or WebP, max 5MB. Optional.</p>
                  <div className="flex flex-wrap items-center gap-3">
                    {(formData.image_url || selectedImageFile) && (
                      <div className="relative shrink-0">
                        <img
                          src={selectedImageFile ? URL.createObjectURL(selectedImageFile) : getImageUrl(formData.image_url)}
                          alt="Preview"
                          className="w-24 h-24 object-cover rounded-xl border-2 border-[var(--color-outline-variant)]/50"
                        />
                        {selectedImageFile && (
                          <span className="absolute -top-1.5 -right-1.5 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                            New
                          </span>
                        )}
                      </div>
                    )}
                    <input
                      ref={addFormImageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageFileChange}
                      className="hidden"
                      disabled={imageUploading || removingImage}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative group inline-flex">
                        <span
                          className="absolute bottom-full left-0 mb-2 px-3 py-2 w-56 text-xs font-normal text-[var(--color-on-surface)] bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none"
                          role="tooltip"
                        >
                          Click to choose an image (JPEG, PNG, or WebP). Max 5MB. After selecting, click Upload to save.
                        </span>
                        <GlassButton
                          type="button"
                          onClick={() => addFormImageInputRef.current?.click()}
                          disabled={imageUploading || removingImage}
                          size="sm"
                          className="glass-button-secondary"
                          contentClassName="flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          {formData.image_url || selectedImageFile ? 'Replace' : 'Select'} Image
                        </GlassButton>
                      </div>
                      {selectedImageFile && (
                        <GlassButton
                          type="button"
                          onClick={handleImageUpload}
                          disabled={imageUploading}
                          size="sm"
                          className="glass-button-primary"
                          contentClassName="flex items-center gap-2"
                        >
                          {imageUploading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              Upload
                            </>
                          )}
                        </GlassButton>
                      )}
                      {(formData.image_url || selectedImageFile) && (
                        <GlassButton
                          type="button"
                          onClick={handleRemoveImage}
                          disabled={removingImage || imageUploading}
                          size="sm"
                          className="glass-button-secondary"
                          contentClassName="flex items-center gap-2 text-[var(--color-error)]"
                        >
                          {removingImage ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-[var(--color-error)] border-t-transparent" />
                              Removing...
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4" />
                              Remove
                            </>
                          )}
                        </GlassButton>
                      )}
                    </div>
                    {selectedImageFile && (
                      <p className="text-xs text-[var(--color-on-surface-variant)] w-full">
                        {selectedImageFile.name} ({(selectedImageFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
                  <GlassButton onClick={handleCancel} size="default" className="glass-button-secondary" contentClassName="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Cancel
                  </GlassButton>
                  <GlassButton
                    onClick={handleSave}
                    size="default"
                    className="glass-button-primary"
                    contentClassName="flex items-center gap-2"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save
                      </>
                    )}
                  </GlassButton>
                </div>
              </div>
            </div>
          )}

          {/* Menu Items by Category */}
          {Object.keys(groupedMenuItems).length === 0 ? (
            <EmptyMenu onAdd={() => setShowAddForm(true)} />
          ) : (
            Object.entries(groupedMenuItems).map(([categoryName, items], index) => {
              return (
                <div key={categoryName} className="glass-card overflow-hidden rounded-2xl shadow-sm">
                  <div className="px-5 py-4 border-b border-white/20 bg-black/[0.04] dark:bg-white/[0.06] backdrop-blur-sm">
                    <h3 className="flex items-center text-base font-semibold text-[var(--color-on-surface)]">
                      <FolderOpen className="h-5 w-5 mr-2.5 text-[var(--color-primary)] opacity-90" />
                      {categoryName}
                      <span className="ml-2 text-sm font-normal text-[var(--color-on-surface-variant)]">
                        {items.length} item{items.length !== 1 ? 's' : ''}
                      </span>
                    </h3>
                  </div>

                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto scrollbar-hide">
                  <table className="w-full table-fixed" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '72px' }} />
                      <col style={{ width: '110px' }} />
                      <col style={{ width: '160px' }} />
                      <col />
                      <col style={{ width: '100px' }} />
                      <col style={{ width: '88px' }} />
                      <col style={{ width: '88px' }} />
                      <col style={{ width: '96px' }} />
                    </colgroup>
                    <thead>
                      <tr className="text-left text-xs font-semibold uppercase tracking-wider bg-[var(--surface-table)]/60 text-[var(--color-on-surface)]">
                        <th className="px-4 py-3.5 rounded-tl-lg">Image</th>
                        <th className="px-4 py-3.5">Category</th>
                        <th className="px-4 py-3.5">Item</th>
                        <th className="px-4 py-3.5 min-w-0">Description</th>
                        <th className="px-4 py-3.5">Price</th>
                        <th className="px-4 py-3.5">Sort</th>
                        <th className="px-4 py-3.5">Priority</th>
                        <th className="px-4 py-3.5 text-right rounded-tr-lg">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y divide-[var(--color-outline)]/30`}>
                      {items.map((item) => (
                        <tr
                          key={item.id}
                          className={`transition-colors ${editingId === item.id
                            ? 'bg-[var(--color-primary-container)]/40'
                            : 'hover:bg-[var(--surface-table)]/50'
                          }`}
                        >
                          <td className="px-4 py-3 align-middle">
                            <img
                              src={item.image_url ? getImageUrl(item.image_url) : getPlaceholderImage(item.category_name, item.name)}
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded-xl border border-[var(--color-outline)]/40 shadow-sm"
                            />
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <div className="text-sm truncate text-[var(--color-on-surface-variant)]">
                              {categories.find(cat => cat.id === item.category_id)?.name || 'Unknown'}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <div className="text-sm font-medium truncate text-[var(--color-on-surface)]">{item.name}</div>
                          </td>
                          <td className="px-4 py-3 align-middle min-w-0">
                            <div className="text-sm truncate text-[var(--color-on-surface-variant)]" title={getDisplayDescription(item)}>
                              {getDisplayDescription(item)}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <div className="text-sm font-semibold tabular-nums text-[var(--color-on-surface)]">
                              {formatCurrency(ensureNumber(item.price))}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <div className="text-sm tabular-nums text-[var(--color-on-surface-variant)]">{item.sort_order ?? 0}</div>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <div className="text-sm tabular-nums text-[var(--color-on-surface-variant)]">
                              {item.featured_priority !== null && item.featured_priority !== undefined ? item.featured_priority : '–'}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-middle text-right">
                            <div className="flex justify-end gap-1.5">
                              <GlassButton
                                onClick={() => handleEdit(item)}
                                size="icon"
                                className="glass-button-secondary [&_.glass-button]:!min-w-[36px] [&_.glass-button]:!h-9 [&_.glass-button-text]:!min-w-[36px] [&_.glass-button-text]:!h-9 [&_.glass-button]:!border-blue-200 [&_.glass-button]:text-blue-600 [&_.glass-button:hover]:!bg-blue-50 [&_.glass-button:hover]:!border-blue-300"
                                aria-label="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </GlassButton>
                              <GlassButton
                                onClick={() => setDeleteConfirm({ id: item.id, name: item.name })}
                                disabled={isDeleting}
                                size="icon"
                                className="glass-button-destructive [&_.glass-button]:!min-w-[36px] [&_.glass-button]:!h-9 [&_.glass-button-text]:!min-w-[36px] [&_.glass-button-text]:!h-9"
                                aria-label="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </GlassButton>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden p-4 space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`glass-card p-4 rounded-xl ${editingId === item.id ? 'ring-2 ring-[var(--color-primary)]/30' : ''}`}
                    >
                      <div>
                          <div className="flex items-start space-x-3 mb-3">
                            <img
                              src={item.image_url ? getImageUrl(item.image_url) : getPlaceholderImage(item.category_name, item.name)}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-xl border border-[var(--color-outline)]/40 shadow-sm flex-shrink-0"
                            />
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-[var(--color-on-surface)]">{item.name}</h4>
                                <div className="flex gap-1.5">
                                  <GlassButton
                                    onClick={() => handleEdit(item)}
                                    size="icon"
                                    className="glass-button-secondary [&_.glass-button]:!min-w-[36px] [&_.glass-button]:!h-9 [&_.glass-button-text]:!min-w-[36px] [&_.glass-button-text]:!h-9 [&_.glass-button]:!border-blue-200 [&_.glass-button]:text-blue-600 [&_.glass-button:hover]:!bg-blue-50"
                                    aria-label="Edit"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </GlassButton>
                                  <GlassButton
                                    onClick={() => setDeleteConfirm({ id: item.id, name: item.name })}
                                    disabled={isDeleting}
                                    size="icon"
                                    className="glass-button-destructive [&_.glass-button]:!min-w-[36px] [&_.glass-button]:!h-9 [&_.glass-button-text]:!min-w-[36px] [&_.glass-button-text]:!h-9"
                                    aria-label="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </GlassButton>
                                </div>
                              </div>
                              <p className="text-sm mb-2 text-[var(--color-on-surface-variant)]">{getDisplayDescription(item)}</p>
                              <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-[var(--color-primary)]">
                                  {formatCurrency(ensureNumber(item.price))}
                                </span>
                                <span className="text-[var(--color-on-surface-variant)]">Sort: {item.sort_order || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <FolderOpen className="h-6 w-6 text-[var(--color-primary)]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-on-surface)] truncate">Category Management</h2>
                <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">Organize your menu with categories</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <GlassButton
                onClick={generateCategoriesFromMenu}
                disabled={autoGenerating}
                size="sm"
                className="glass-button-secondary"
                contentClassName="flex items-center gap-2"
              >
                {autoGenerating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {autoGenerating ? 'Generating...' : 'Auto-Generate'}
              </GlassButton>
              <GlassButton
                onClick={() => setShowCategoryForm(true)}
                size="sm"
                className="glass-button-primary"
                contentClassName="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add New Category
              </GlassButton>
            </div>
          </div>

          {/* Add New Category Form */}
          {showCategoryForm && (
            <div className="glass-card p-5 rounded-2xl">
              <h3 className="text-lg font-semibold mb-4 text-[var(--color-on-surface)]">Add New Category</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Category Name *"
                  value={categoryFormData.name}
                  onChange={(e) => handleCategoryInputChange('name', e.target.value)}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={categoryFormData.description}
                  onChange={(e) => handleCategoryInputChange('description', e.target.value)}
                  className="input-field"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Sort Order"
                  value={categoryFormData.sort_order}
                  onChange={(e) => handleCategoryInputChange('sort_order', e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
                <GlassButton onClick={handleCategoryCancel} size="default" className="glass-button-secondary" contentClassName="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Cancel
                </GlassButton>
                <GlassButton onClick={handleCategorySave} size="default" className="glass-button-primary" contentClassName="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save
                </GlassButton>
              </div>
            </div>
          )}

          {/* Categories List – same glass as Menu Items */}
          <div className="glass-card overflow-hidden rounded-2xl shadow-sm">
            <div className="px-5 py-4 border-b border-white/20 bg-black/[0.04] dark:bg-white/[0.06] backdrop-blur-sm">
              <h3 className="text-base font-semibold text-[var(--color-on-surface)]">Current Categories</h3>
            </div>
            {categories.length === 0 ? (
              <div className="text-center py-8 px-4 text-[var(--color-on-surface-variant)]">
                {cafeSettings.logo_url ? (
                  <img 
                    src={getImageUrl(cafeSettings.logo_url)} 
                    alt={`${cafeSettings.cafe_name || 'Cafe'} Logo`} 
                    className="h-16 w-16 mx-auto mb-4 opacity-50"
                  />
                ) : (
                  <div className="h-16 w-16 mx-auto mb-4 bg-primary rounded flex items-center justify-center text-on-primary font-bold opacity-50">
                    {cafeSettings.cafe_name ? cafeSettings.cafe_name.charAt(0).toUpperCase() : 'C'}
                  </div>
                )}
                <p>No categories found</p>
                <p className="text-sm">Add your first category to get started</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto scrollbar-hide">
                  <table className="min-w-full">
                    <thead>
                      <tr className="text-left text-xs font-semibold uppercase tracking-wider bg-[var(--surface-table)]/60 text-[var(--color-on-surface)]">
                        <th className="px-6 py-3.5 rounded-tl-lg">Category</th>
                        <th className="px-6 py-3.5">Description</th>
                        <th className="px-6 py-3.5">Items</th>
                        <th className="px-6 py-3.5">Sort Order</th>
                        <th className="px-6 py-3.5 text-right rounded-tr-lg">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-outline)]/30">
                      {categories.map((category, index) => {
                        return (
                        <tr key={category.id} className={`transition-colors ${categoryEditingId === category.id ? 'bg-[var(--color-primary-container)]/40' : 'hover:bg-[var(--surface-table)]/50'}`}>
                          {categoryEditingId === category.id ? (
                            // Edit Mode
                            <>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={categoryFormData.name}
                                  onChange={(e) => handleCategoryInputChange('name', e.target.value)}
                                  className="input-field"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={categoryFormData.description}
                                  onChange={(e) => handleCategoryInputChange('description', e.target.value)}
                                  className="input-field"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-[var(--color-on-surface-variant)]">{category.item_count} items</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="number"
                                  min="0"
                                  value={categoryFormData.sort_order}
                                  onChange={(e) => handleCategoryInputChange('sort_order', e.target.value)}
                                  className="input-field"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end gap-1.5">
                                  <GlassButton onClick={handleCategorySave} size="icon" className="glass-button-primary [&_.glass-button]:!min-w-[36px] [&_.glass-button]:!h-9 [&_.glass-button-text]:!min-w-[36px] [&_.glass-button-text]:!h-9" aria-label="Save">
                                    <Save className="h-4 w-4" />
                                  </GlassButton>
                                  <GlassButton onClick={handleCategoryCancel} size="icon" className="glass-button-secondary [&_.glass-button]:!min-w-[36px] [&_.glass-button]:!h-9 [&_.glass-button-text]:!min-w-[36px] [&_.glass-button-text]:!h-9" aria-label="Cancel">
                                    <X className="h-4 w-4" />
                                  </GlassButton>
                                </div>
                              </td>
                            </>
                          ) : (
                            // View Mode
                            <>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <FolderOpen className="h-5 w-5 text-[var(--color-primary)] opacity-90 mr-3" />
                                  <div className="text-sm font-medium text-[var(--color-on-surface)]">{category.name}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-[var(--color-on-surface-variant)]">{category.description}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  category.item_count > 0 
                                    ? isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                                    : isDarkMode ? 'bg-accent-900/30 text-accent-300' : 'bg-accent-100 text-accent-800'
                                }`}>
                                  {category.item_count} items
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-[var(--color-on-surface-variant)] tabular-nums">{category.sort_order}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end gap-1.5">
                                  <GlassButton
                                    onClick={() => handleCategoryEdit(category)}
                                    size="icon"
                                    className="glass-button-secondary [&_.glass-button]:!min-w-[36px] [&_.glass-button]:!h-9 [&_.glass-button-text]:!min-w-[36px] [&_.glass-button-text]:!h-9"
                                    aria-label="Edit category"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </GlassButton>
                                  <GlassButton
                                    onClick={() => handleCategoryDelete(category.id, category.name, category.item_count)}
                                    size="icon"
                                    className="glass-button-destructive [&_.glass-button]:!min-w-[36px] [&_.glass-button]:!h-9 [&_.glass-button-text]:!min-w-[36px] [&_.glass-button-text]:!h-9"
                                    aria-label="Delete category"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </GlassButton>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden p-4 space-y-3">
                  {categories.map((category) => (
                    <div key={category.id} className={`glass-card p-4 rounded-xl ${categoryEditingId === category.id ? 'ring-2 ring-[var(--color-primary)]/30' : ''}`}>
                      {categoryEditingId === category.id ? (
                        // Edit Mode Mobile
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Category Name"
                            value={categoryFormData.name}
                            onChange={(e) => handleCategoryInputChange('name', e.target.value)}
                            className="input-field"
                          />
                          <input
                            type="text"
                            placeholder="Description"
                            value={categoryFormData.description}
                            onChange={(e) => handleCategoryInputChange('description', e.target.value)}
                            className="input-field"
                          />
                          <input
                            type="number"
                            min="0"
                            placeholder="Sort Order"
                            value={categoryFormData.sort_order}
                            onChange={(e) => handleCategoryInputChange('sort_order', e.target.value)}
                            className="input-field"
                          />
                          <div className="flex space-x-2">
                            <GlassButton onClick={handleCategorySave} size="default" className="flex-1 glass-button-primary" contentClassName="flex items-center justify-center gap-2">
                              <Save className="h-4 w-4" />
                              Save
                            </GlassButton>
                            <GlassButton onClick={handleCategoryCancel} size="default" className="flex-1 glass-button-secondary" contentClassName="flex items-center justify-center gap-2">
                              <X className="h-4 w-4" />
                              Cancel
                            </GlassButton>
                          </div>
                        </div>
                      ) : (
                        // View Mode Mobile
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center">
                              <FolderOpen className="h-5 w-5 text-[var(--color-primary)] opacity-90 mr-3" />
                              <div>
                                <h4 className="font-medium text-[var(--color-on-surface)]">{category.name}</h4>
                                <p className="text-sm text-[var(--color-on-surface-variant)]">{category.description}</p>
                              </div>
                            </div>
                            <div className="flex gap-1.5">
                              <GlassButton
                                onClick={() => handleCategoryEdit(category)}
                                size="icon"
                                className="glass-button-secondary [&_.glass-button]:!min-w-[36px] [&_.glass-button]:!h-9 [&_.glass-button-text]:!min-w-[36px] [&_.glass-button-text]:!h-9"
                                aria-label="Edit category"
                              >
                                <Edit className="h-4 w-4" />
                              </GlassButton>
                              <GlassButton
                                onClick={() => handleCategoryDelete(category.id, category.name, category.item_count)}
                                size="icon"
                                className="glass-button-destructive [&_.glass-button]:!min-w-[36px] [&_.glass-button]:!h-9 [&_.glass-button-text]:!min-w-[36px] [&_.glass-button-text]:!h-9"
                                aria-label="Delete category"
                              >
                                <Trash2 className="h-4 w-4" />
                              </GlassButton>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              category.item_count > 0 
                                ? isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                                : isDarkMode ? 'bg-accent-900/30 text-accent-300' : 'bg-accent-100 text-accent-800'
                            }`}>
                              {category.item_count} items
                            </span>
                            <span className="text-[var(--color-on-surface-variant)]">Sort: {category.sort_order}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Menu Item Modal */}
      <Dialog
        open={!!editingId}
        onClose={handleCancel}
        title={editingId ? `Edit: ${formData.name || 'Menu Item'}` : 'Edit Menu Item'}
        size="2xl"
      >
        {editingId && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="[&_button]:min-h-[40px] [&_button]:rounded-xl">
                <label className="block text-sm font-medium mb-1.5 text-[var(--color-on-surface)]">Category *</label>
                <Select
                  options={categories.map(c => ({ value: String(c.id), label: c.name }))}
                  value={formData.category_id === '' || formData.category_id == null ? '' : String(formData.category_id)}
                  onChange={(v) => handleInputChange('category_id', v)}
                  placeholder="Category"
                  className="select-trigger-glass select-trigger-glass-hover"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--color-on-surface)]">Item Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="glass-input w-full min-h-[40px] rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5 text-sm"
                  placeholder="Item name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--color-on-surface)]">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="glass-input w-full min-h-[40px] rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5 text-sm"
                placeholder="Description"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--color-on-surface)]">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className="glass-input w-full min-h-[40px] rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--color-on-surface)]">Sort Order</label>
                <input
                  type="number"
                  min="0"
                  value={formData.sort_order}
                  onChange={(e) => handleInputChange('sort_order', e.target.value)}
                  className="glass-input w-full min-h-[40px] rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--color-on-surface)]">Featured Priority</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Optional"
                  value={formData.featured_priority}
                  onChange={(e) => handleInputChange('featured_priority', e.target.value)}
                  className="glass-input w-full min-h-[40px] rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5 text-sm"
                  title="Higher = more prominent on featured section"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--color-on-surface)]">Item Image</label>
              <p className="text-xs mb-3 text-[var(--color-on-surface-variant)]">JPEG, PNG or WebP, max 5MB. Optional.</p>
              <div className="flex flex-wrap items-center gap-3">
                {(formData.image_url || selectedImageFile) && (
                  <div className="relative shrink-0">
                    <img
                      src={selectedImageFile ? URL.createObjectURL(selectedImageFile) : getImageUrl(formData.image_url)}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-xl border-2 border-[var(--color-outline-variant)]/50"
                    />
                    {selectedImageFile && (
                      <span className="absolute -top-1.5 -right-1.5 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">New</span>
                    )}
                  </div>
                )}
                <input
                  ref={editFormImageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageFileChange}
                  className="hidden"
                  disabled={imageUploading || removingImage}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative group inline-flex">
                    <span
                      className="absolute bottom-full left-0 mb-2 px-3 py-2 w-56 text-xs font-normal text-[var(--color-on-surface)] bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none"
                      role="tooltip"
                    >
                      Click to choose an image (JPEG, PNG, or WebP). Max 5MB. After selecting, click Upload to save.
                    </span>
                    <GlassButton
                      type="button"
                      onClick={() => editFormImageInputRef.current?.click()}
                      disabled={imageUploading || removingImage}
                      size="sm"
                      className="glass-button-secondary"
                      contentClassName="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {formData.image_url || selectedImageFile ? 'Replace' : 'Select'} Image
                    </GlassButton>
                  </div>
                  {selectedImageFile && (
                    <GlassButton
                      type="button"
                      onClick={handleImageUpload}
                      disabled={imageUploading}
                      size="sm"
                      className="glass-button-primary"
                      contentClassName="flex items-center gap-2"
                    >
                      {imageUploading ? (
                        <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Uploading...</>
                      ) : (
                        <><Upload className="h-4 w-4" /> Upload</>
                      )}
                    </GlassButton>
                  )}
                  {(formData.image_url || selectedImageFile) && (
                    <GlassButton
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={removingImage || imageUploading}
                      size="sm"
                      className="glass-button-secondary"
                      contentClassName="flex items-center gap-2 text-[var(--color-error)]"
                    >
                      {removingImage ? (
                        <><div className="animate-spin rounded-full h-4 w-4 border-2 border-[var(--color-error)] border-t-transparent" /> Removing...</>
                      ) : (
                        <><X className="h-4 w-4" /> Remove</>
                      )}
                    </GlassButton>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <GlassButton type="button" onClick={handleCancel} size="default" className="glass-button-secondary" contentClassName="flex items-center gap-2">
                <X className="h-4 w-4" />
                Cancel
              </GlassButton>
              <GlassButton
                type="button"
                onClick={handleSave}
                size="default"
                className="glass-button-primary"
                contentClassName="flex items-center justify-center gap-2"
                disabled={isSaving}
              >
                {isSaving ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Saving...</>
                ) : (
                  <><Save className="h-4 w-4" /> Save</>
                )}
              </GlassButton>
            </div>
          </div>
        )}
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Menu Item"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Item"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default MenuManagement; 