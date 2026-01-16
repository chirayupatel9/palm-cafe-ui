import React from 'react';
import { useCafeSettings } from '../contexts/CafeSettingsContext';
import { getImageUrl } from '../utils/imageUtils';

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
      {showLogo && cafeSettings.logo_url && (
        <img 
          src={getImageUrl(cafeSettings.logo_url)} 
          alt={`${cafeSettings.cafe_name || 'Cafe'} Logo`} 
          className={`${logoSize} mr-3 ${logoClassName}`}
        />
      )}
      {showName && cafeSettings.cafe_name && (
        <h1 className={`font-bold ${nameSize} ${nameClassName}`}>
          {cafeSettings.cafe_name}
        </h1>
      )}
    </div>
  );
};

export default CafeInfo; 