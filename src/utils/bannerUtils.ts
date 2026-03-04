export interface BannerItem {
  id: string;
  image_url: string;
  active: boolean;
  priority: number;
  link_url: string | null;
}

export interface BrandingData {
  banners?: Array<{
    id?: string | number;
    image_url?: string;
    promo_banner_image_url?: string;
    active?: boolean;
    priority?: number;
    link_url?: string;
  }>;
  promo_banner_image_url?: string;
}

/**
 * Normalizes branding API response into a list of banner items.
 */
export function normalizeBannersFromBranding(data: BrandingData | null | undefined): BannerItem[] {
  if (!data || typeof data !== 'object') {
    return [];
  }

  const banners = data.banners;
  if (Array.isArray(banners) && banners.length > 0) {
    return banners.map((b, i) => ({
      id: b.id != null ? String(b.id) : `banner-${i}`,
      image_url: b.image_url ?? b.promo_banner_image_url ?? '',
      active: b.active !== false,
      priority: typeof b.priority === 'number' && !Number.isNaN(b.priority) ? b.priority : i,
      link_url: typeof b.link_url === 'string' && b.link_url.trim() !== '' ? b.link_url.trim() : null
    }));
  }

  const legacyUrl = data.promo_banner_image_url;
  if (legacyUrl && typeof legacyUrl === 'string' && legacyUrl.trim() !== '') {
    return [
      {
        id: 'legacy-promo',
        image_url: legacyUrl.trim(),
        active: true,
        priority: 0,
        link_url: null
      }
    ];
  }

  return [];
}

/**
 * Filters to active banners and sorts by priority ASC.
 */
export function getActiveBannersSorted(
  banners: Array<{ active?: boolean; priority?: number }>
): Array<{ active?: boolean; priority?: number }> {
  if (!Array.isArray(banners)) return [];
  const active = banners.filter((b) => b.active === true);
  return active.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
}
