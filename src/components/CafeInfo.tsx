import React from 'react';
import { useCafeSettings } from '../contexts/CafeSettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../utils/imageUtils';

interface CafeInfoProps {
  showLogo?: boolean;
  showName?: boolean;
  logoSize?: string;
  nameSize?: string;
  className?: string;
  logoClassName?: string;
  nameClassName?: string;
}

const CafeInfo: React.FC<CafeInfoProps> = ({
  showLogo = true,
  showName = true,
  logoSize = 'h-10 w-10',
  nameSize = 'text-xl sm:text-2xl',
  className = '',
  logoClassName = '',
  nameClassName = ''
}) => {
  const { cafeSettings } = useCafeSettings();
  const { user } = useAuth();
  const displayName = cafeSettings?.cafe_name || user?.cafe_name || null;

  return (
    <div className={`flex items-center ${className}`}>
      {showLogo && (cafeSettings?.logo_url) && (
        <img
          src={getImageUrl(cafeSettings.logo_url ?? '') ?? ''}
          alt={`${displayName ?? 'Cafe'} Logo`}
          className={`${logoSize} mr-3 ${logoClassName}`}
        />
      )}
      {showName && displayName && (
        <h1 className={`font-bold ${nameSize} ${nameClassName}`}>
          {displayName}
        </h1>
      )}
    </div>
  );
};

export default CafeInfo;
