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
  if (!logoUrl) return null;
  
  // If the logo URL is already a full URL, return it as is
  if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
    return logoUrl;
  }
  
  // Get the API base URL from App.js (hardcoded since env vars not working)
  const API_BASE_URL = "https://api.cafe.nevyaa.com" || "http://localhost:5000";
  
  // If it's a relative path starting with /images/, construct the full URL
  if (logoUrl.startsWith('/images/')) {
    return `${API_BASE_URL}${logoUrl}`;
  }
  
  // If it's just a filename, construct the full URL
  return `${API_BASE_URL}/images/${logoUrl}`;
}; 