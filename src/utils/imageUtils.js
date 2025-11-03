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
export const getPlaceholderImage = (categoryName, itemName = '') => {
  // Create beautiful SVG placeholders with food emojis
  const name = (categoryName || itemName || 'food').toLowerCase();

  // Determine emoji and colors based on category
  let emoji = '🍽️';
  let gradientStart = '#D4A574';
  let gradientEnd = '#8B6F47';

  if (name.includes('burger')) {
    emoji = '🍔';
    gradientStart = '#FED7AA';
    gradientEnd = '#FDBA74';
  } else if (name.includes('pizza')) {
    emoji = '🍕';
    gradientStart = '#FECACA';
    gradientEnd = '#FCA5A5';
  } else if (name.includes('pasta')) {
    emoji = '🍝';
    gradientStart = '#FEF08A';
    gradientEnd = '#FDE047';
  } else if (name.includes('salad')) {
    emoji = '🥗';
    gradientStart = '#BBF7D0';
    gradientEnd = '#86EFAC';
  } else if (name.includes('dessert') || name.includes('cake')) {
    emoji = '🍰';
    gradientStart = '#FBCFE8';
    gradientEnd = '#F9A8D4';
  } else if (name.includes('coffee')) {
    emoji = '☕';
    gradientStart = '#D4A574';
    gradientEnd = '#92400E';
  } else if (name.includes('tea')) {
    emoji = '🍵';
    gradientStart = '#BBF7D0';
    gradientEnd = '#86EFAC';
  } else if (name.includes('sandwich')) {
    emoji = '🥪';
    gradientStart = '#FED7AA';
    gradientEnd = '#FDBA74';
  } else if (name.includes('rice') || name.includes('biryani')) {
    emoji = '🍚';
    gradientStart = '#FEF3C7';
    gradientEnd = '#FDE68A';
  } else if (name.includes('noodles') || name.includes('ramen')) {
    emoji = '🍜';
    gradientStart = '#FEF08A';
    gradientEnd = '#FDE047';
  } else if (name.includes('seafood') || name.includes('fish')) {
    emoji = '🐟';
    gradientStart = '#BAE6FD';
    gradientEnd = '#7DD3FC';
  } else if (name.includes('chicken')) {
    emoji = '🍗';
    gradientStart = '#FED7AA';
    gradientEnd = '#FDBA74';
  } else if (name.includes('vegetable') || name.includes('veg')) {
    emoji = '🥬';
    gradientStart = '#BBF7D0';
    gradientEnd = '#86EFAC';
  } else if (name.includes('fruit')) {
    emoji = '🍎';
    gradientStart = '#FECACA';
    gradientEnd = '#FCA5A5';
  } else if (name.includes('drink') || name.includes('juice')) {
    emoji = '🥤';
    gradientStart = '#DBEAFE';
    gradientEnd = '#BFDBFE';
  } else if (name.includes('ice cream')) {
    emoji = '🍦';
    gradientStart = '#E0E7FF';
    gradientEnd = '#C7D2FE';
  } else if (name.includes('taco')) {
    emoji = '🌮';
    gradientStart = '#FED7AA';
    gradientEnd = '#FDBA74';
  } else if (name.includes('sushi')) {
    emoji = '🍣';
    gradientStart = '#FECACA';
    gradientEnd = '#FCA5A5';
  }

  // Create a beautiful gradient SVG with emoji
  const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${gradientStart};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${gradientEnd};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#grad)"/>
    <text x="50%" y="50%" font-size="120" text-anchor="middle" dy=".3em">${emoji}</text>
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