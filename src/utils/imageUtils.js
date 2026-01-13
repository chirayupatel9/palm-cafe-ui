// Utility function to get the correct image URL for menu items
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  // If the image URL is already a full URL, return it as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Get the API base URL from App.js (hardcoded since env vars not working)
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  
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
export const getPlaceholderImage = (categoryName, itemName = '') => {
  const name = (categoryName || itemName || 'food').toLowerCase();

  // Determine colors and icon based on category
  let bgColor = '#F3E5D8';
  let accentColor = '#8B7355';
  let icon = 'utensils';

  if (name.includes('burger') || name.includes('sandwich')) {
    bgColor = '#FFF4E6';
    accentColor = '#F97316';
    icon = 'burger';
  } else if (name.includes('pizza')) {
    bgColor = '#FFF1F2';
    accentColor = '#EF4444';
    icon = 'pizza';
  } else if (name.includes('pasta')) {
    bgColor = '#FFFBEB';
    accentColor = '#F59E0B';
    icon = 'pasta';
  } else if (name.includes('salad')) {
    bgColor = '#F0FDF4';
    accentColor = '#22C55E';
    icon = 'salad';
  } else if (name.includes('dessert') || name.includes('cake')) {
    bgColor = '#FCE7F3';
    accentColor = '#EC4899';
    icon = 'cake';
  } else if (name.includes('coffee')) {
    bgColor = '#FEF3C7';
    accentColor = '#92400E';
    icon = 'coffee';
  } else if (name.includes('tea')) {
    bgColor = '#F0FDF4';
    accentColor = '#059669';
    icon = 'tea';
  } else if (name.includes('drink') || name.includes('juice')) {
    bgColor = '#EFF6FF';
    accentColor = '#3B82F6';
    icon = 'drink';
  }

  // Icon paths for different food types
  const icons = {
    utensils: 'M16,3 L16,16 M16,3 C14,3 12,4 12,6 L12,10 M8,3 L8,10 C8,12 10,14 12,14 L12,21 M4,3 L4,10 C4,12 6,14 8,14 L8,21',
    burger: 'M3,12 L21,12 M3,8 C3,6 4,4 12,4 C20,4 21,6 21,8 M3,16 C3,18 4,20 12,20 C20,20 21,18 21,16',
    pizza: 'M12,2 L22,22 L2,22 Z M12,8 C13,8 14,9 14,10 M8,14 C9,14 10,15 10,16 M16,14 C17,14 18,15 18,16',
    pasta: 'M6,12 C6,8 8,4 12,4 C16,4 18,8 18,12 M12,4 L12,20 M8,10 L8,20 M16,10 L16,20',
    salad: 'M12,3 C8,3 5,6 5,10 C5,13 7,15 10,16 M12,3 C16,3 19,6 19,10 C19,13 17,15 14,16 M7,15 L17,15 C17,18 15,21 12,21 C9,21 7,18 7,15',
    cake: 'M4,20 L20,20 L20,12 L4,12 Z M6,12 L6,8 M12,12 L12,6 M18,12 L18,8 M6,6 L6,4 M12,4 L12,2 M18,6 L18,4',
    coffee: 'M6,8 L18,8 L17,16 C17,18 15,20 12,20 C9,20 7,18 7,16 Z M18,10 C20,10 21,11 21,12 C21,13 20,14 18,14',
    tea: 'M6,8 L16,8 L15,16 C15,18 13,20 11,20 C9,20 7,18 7,16 Z M16,10 C18,10 19,11 19,12 C19,13 18,14 16,14 M8,4 L10,8 M12,3 L12,8',
    drink: 'M8,2 L16,2 L14,22 L10,22 Z M7,8 L17,8'
  };

  const iconPath = icons[icon] || icons.utensils;

  // Create a modern, minimal SVG placeholder
  const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="400" fill="${bgColor}"/>
    <g transform="translate(200, 200)">
      <circle cx="0" cy="0" r="80" fill="white" opacity="0.9"/>
      <g transform="translate(-12, -12) scale(1.5)" stroke="${accentColor}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="${iconPath}"/>
      </g>
    </g>
    <text x="200" y="320" font-family="Arial, sans-serif" font-size="16" fill="${accentColor}" text-anchor="middle" opacity="0.6">No Image Available</text>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
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
    return 'from-pink-100 to-rose-100';
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