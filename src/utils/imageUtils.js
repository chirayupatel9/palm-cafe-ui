// Utility function to get the correct image URL for menu items
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  // If the image URL is already a full URL, return it as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Get the API base URL from App.js (hardcoded since env vars not working)
  const API_BASE_URL = "https://api.cafe.nevyaa.com" || "http://localhost:5000";
  
  // If it's a relative path starting with /images/, construct the full URL
  if (imageUrl.startsWith('/images/')) {
    return `${API_BASE_URL}${imageUrl}`;
  }
  
  // If it's just a filename, construct the full URL
  return `${API_BASE_URL}/images/${imageUrl}`;
};

// Utility function to get the correct logo URL
export const getLogoUrl = (logoUrl) => {
  if (!logoUrl) return '/images/palm-cafe-logo.png';
  
  // If the logo URL is already a full URL, return it as is
  if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
    return logoUrl;
  }
  
  // If it's a relative path, construct the full URL
  if (logoUrl.startsWith('/')) {
    return logoUrl;
  }
  
  // If it's just a filename, construct the full URL
  return `/images/${logoUrl}`;
};

// Utility function to get placeholder images for different food categories
export const getPlaceholderImage = (categoryName) => {
  if (!categoryName) return '/images/palm-cafe-logo.png';
  
  const name = categoryName.toLowerCase();
  
  // Use the logo as a fallback for all categories since we don't have food images
  return '/images/palm-cafe-logo.png';
};

// Utility function to get a colored background for categories when images are not available
export const getCategoryBackground = (categoryName) => {
  if (!categoryName) return 'from-gray-100 to-gray-200';
  
  const name = categoryName.toLowerCase();
  
  if (name.includes('burger') || name.includes('sandwich') || name.includes('fast food')) {
    return 'from-orange-100 to-red-100';
  }
  if (name.includes('pizza') || name.includes('italian')) {
    return 'from-red-100 to-pink-100';
  }
  if (name.includes('salad') || name.includes('vegetable') || name.includes('healthy')) {
    return 'from-green-100 to-emerald-100';
  }
  if (name.includes('dessert') || name.includes('cake') || name.includes('sweet')) {
    return 'from-pink-100 to-purple-100';
  }
  if (name.includes('coffee') || name.includes('tea') || name.includes('drink') || name.includes('beverage')) {
    return 'from-amber-100 to-orange-100';
  }
  if (name.includes('pasta') || name.includes('noodles')) {
    return 'from-yellow-100 to-amber-100';
  }
  if (name.includes('seafood') || name.includes('fish')) {
    return 'from-blue-100 to-cyan-100';
  }
  
  // Default background
  return 'from-gray-100 to-gray-200';
}; 