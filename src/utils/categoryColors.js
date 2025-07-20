// Category color scheme utility
const categoryColors = [
  // Primary colors with different shades
  {
    name: 'primary',
    bg: 'bg-primary-50 dark:bg-primary-900/20',
    border: 'border-primary-200 dark:border-primary-700',
    text: 'text-primary-700 dark:text-primary-300',
    header: 'bg-primary-100 dark:bg-primary-800/30',
    hover: 'hover:bg-primary-100 dark:hover:bg-primary-800/40'
  },
  {
    name: 'secondary',
    bg: 'bg-secondary-50 dark:bg-secondary-900/20',
    border: 'border-secondary-200 dark:border-secondary-700',
    text: 'text-secondary-700 dark:text-secondary-300',
    header: 'bg-secondary-100 dark:bg-secondary-800/30',
    hover: 'hover:bg-secondary-100 dark:hover:bg-secondary-800/40'
  },
  {
    name: 'accent',
    bg: 'bg-accent-50 dark:bg-accent-900/20',
    border: 'border-accent-200 dark:border-accent-700',
    text: 'text-accent-700 dark:text-accent-300',
    header: 'bg-accent-100 dark:bg-accent-800/30',
    hover: 'hover:bg-accent-100 dark:hover:bg-accent-800/40'
  },
  // Additional color variations
  {
    name: 'green',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-700',
    text: 'text-green-700 dark:text-green-300',
    header: 'bg-green-100 dark:bg-green-800/30',
    hover: 'hover:bg-green-100 dark:hover:bg-green-800/40'
  },
  {
    name: 'blue',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-700',
    text: 'text-blue-700 dark:text-blue-300',
    header: 'bg-blue-100 dark:bg-blue-800/30',
    hover: 'hover:bg-blue-100 dark:hover:bg-blue-800/40'
  },
  {
    name: 'purple',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-700',
    text: 'text-purple-700 dark:text-purple-300',
    header: 'bg-purple-100 dark:bg-purple-800/30',
    hover: 'hover:bg-purple-100 dark:hover:bg-purple-800/40'
  },
  {
    name: 'orange',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-700',
    text: 'text-orange-700 dark:text-orange-300',
    header: 'bg-orange-100 dark:bg-orange-800/30',
    hover: 'hover:bg-orange-100 dark:hover:bg-orange-800/40'
  },
  {
    name: 'pink',
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    border: 'border-pink-200 dark:border-pink-700',
    text: 'text-pink-700 dark:text-pink-300',
    header: 'bg-pink-100 dark:bg-pink-800/30',
    hover: 'hover:bg-pink-100 dark:hover:bg-pink-800/40'
  },
  {
    name: 'indigo',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-700',
    text: 'text-indigo-700 dark:text-indigo-300',
    header: 'bg-indigo-100 dark:bg-indigo-800/30',
    hover: 'hover:bg-indigo-100 dark:hover:bg-indigo-800/40'
  },
  {
    name: 'teal',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    border: 'border-teal-200 dark:border-teal-700',
    text: 'text-teal-700 dark:text-teal-300',
    header: 'bg-teal-100 dark:bg-teal-800/30',
    hover: 'hover:bg-teal-100 dark:hover:bg-teal-800/40'
  }
];

// Get color scheme for a category based on its name or index
export const getCategoryColor = (categoryName, index = 0) => {
  if (!categoryName) {
    return categoryColors[0]; // Default to primary
  }
  
  // Use the category name to generate a consistent color
  const hash = categoryName.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const colorIndex = Math.abs(hash) % categoryColors.length;
  return categoryColors[colorIndex];
};

// Get color scheme by index
export const getCategoryColorByIndex = (index) => {
  return categoryColors[index % categoryColors.length];
};

// Get all available colors
export const getAllCategoryColors = () => {
  return categoryColors;
};

export default categoryColors; 