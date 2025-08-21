import React from 'react';
import { useCafeSettings } from '../contexts/CafeSettingsContext';

const CafeInfo = ({ 
  showLogo = true, 
  showName = true, 
  logoSize = 'h-10 w-10',
  nameSize = 'text-xl sm:text-2xl',
  className = '',
  logoClassName = '',
  nameClassName = ''
}) => {
  const { cafeSettings } = useCafeSettings();

  return (
    <div className={`flex items-center ${className}`}>
      {showLogo && (
        <img 
          src={cafeSettings.logo_url} 
          alt={`${cafeSettings.cafe_name} Logo`} 
          className={`${logoSize} mr-3 ${logoClassName}`}
        />
      )}
      {showName && (
        <h1 className={`font-bold text-secondary-700 dark:text-gray-100 ${nameSize} ${nameClassName}`}>
          {cafeSettings.cafe_name}
        </h1>
      )}
    </div>
  );
};

export default CafeInfo; 