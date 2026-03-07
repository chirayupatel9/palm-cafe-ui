import React, { useMemo, useState } from 'react';
import { getImageUrl } from '../utils/imageUtils';
import { getActiveBannersSorted } from '../utils/bannerUtils';
import type { BannerItem } from '../utils/bannerUtils';

export interface PromoBannerItem extends BannerItem {
  alt?: string;
  title?: string;
  isFallback?: boolean;
}

export const FALLBACK_BANNER: PromoBannerItem & { isFallback: true } = {
  id: 'fallback',
  image_url: '',
  active: true,
  priority: 0,
  link_url: null,
  alt: 'Welcome',
  isFallback: true
};

const GAP_CLASS = 'gap-4';
const BANNER_MIN_HEIGHT = 'min-h-[280px] sm:min-h-[400px]';

export function getGridColsClass(count: number): string {
  if (count <= 1) return 'sm:grid-cols-1';
  if (count === 2) return 'sm:grid-cols-2';
  if (count === 3) return 'sm:grid-cols-3';
  if (count === 4) return 'sm:grid-cols-2 lg:grid-cols-4';
  return 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
}

interface BannerTileProps {
  banner: PromoBannerItem;
  imageUrl: string | null;
  alt: string;
  isFallback: boolean;
  linkUrl: string | null;
}

function BannerTile({ banner, imageUrl, alt, isFallback, linkUrl }: BannerTileProps): React.ReactElement {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const showImage = Boolean(imageUrl && !imgError && !isFallback);
  const showPlaceholder = isFallback || imgError || !imageUrl;
  const isExternal = Boolean(linkUrl && (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')));

  const tileContent = (
    <>
      {showImage && imageUrl && (
        <img
          src={imageUrl}
          alt={alt || 'Promotion'}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
        />
      )}
      {showPlaceholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-6">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800 sm:text-xl">Welcome</p>
            <p className="mt-1 text-sm text-gray-600">Discover our specials</p>
          </div>
        </div>
      )}
    </>
  );

  const wrapperClass = `relative w-full overflow-hidden rounded-lg ${BANNER_MIN_HEIGHT} bg-cover bg-center bg-no-repeat bg-gray-200 block`;

  if (linkUrl && !isFallback) {
    return (
      <a
        href={linkUrl}
        className={wrapperClass}
        style={showImage && imageUrl ? { backgroundImage: `url('${imageUrl}')` } : undefined}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
      >
        {tileContent}
      </a>
    );
  }

  return (
    <div
      className={wrapperClass}
      style={showImage && imageUrl ? { backgroundImage: `url('${imageUrl}')` } : undefined}
    >
      {tileContent}
    </div>
  );
}

export interface PromoBannerSectionProps {
  banners?: PromoBannerItem[];
  loading?: boolean;
  error?: boolean;
  className?: string;
}

function PromoBannerSection({
  banners = [],
  loading = false,
  error = false,
  className = ''
}: PromoBannerSectionProps): React.ReactElement {
  const displayBanners = useMemo(() => {
    const active = getActiveBannersSorted(banners as Array<{ active?: boolean; priority?: number }>) as PromoBannerItem[];
    if (active.length === 0) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[PromoBannerSection] No active banners; showing fallback.');
      }
      return [FALLBACK_BANNER];
    }
    return active;
  }, [banners]);

  const gridClass = useMemo(() => getGridColsClass(displayBanners.length), [displayBanners.length]);

  if (loading) {
    return (
      <div
        className={`relative w-full -mt-8 sm:-mt-12 mb-16 ${className}`}
        aria-busy="true"
        aria-label="Loading promotions"
      >
        <div className={`grid grid-cols-1 ${GAP_CLASS} ${BANNER_MIN_HEIGHT} animate-pulse bg-gray-200 rounded-lg`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative w-full -mt-8 sm:-mt-12 mb-16 ${className}`}>
        <div className={`${BANNER_MIN_HEIGHT} flex items-center justify-center rounded-lg bg-gray-100`}>
          <p className="text-sm text-gray-500">Promotions will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full -mt-8 sm:-mt-12 mb-16 ${className}`}>
      <div className={`grid grid-cols-1 ${GAP_CLASS} ${gridClass}`}>
        {displayBanners.map((banner) => {
          const isFallback = banner.isFallback === true || banner.id === 'fallback';
          const imageUrl = banner.image_url ? getImageUrl(banner.image_url) : null;
          const alt = ((banner as PromoBannerItem).alt || (banner as PromoBannerItem).title || 'Promotion')
            .toString()
            .slice(0, 100);
          const linkUrl = banner.link_url ?? null;
          return (
            <BannerTile
              key={banner.id}
              banner={banner}
              imageUrl={imageUrl}
              alt={alt}
              isFallback={isFallback}
              linkUrl={linkUrl}
            />
          );
        })}
      </div>
    </div>
  );
}

export default React.memo(PromoBannerSection);
