/**
 * Normalizes branding API response into a list of banner items.
 * Supports:
 * - Legacy: single promo_banner_image_url (scalar)
 * - Future: banners array with { image_url, active?, priority?, ... }
 * Does not mutate the response; returns a new array.
 *
 * @param {Object} data - API response (branding or similar)
 * @returns {Array<{ id: string, image_url: string, active: boolean, priority: number }>}
 */
export function normalizeBannersFromBranding(data) {
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
 * Preserves backend order when priority is equal.
 *
 * @param {Array<{ active?: boolean, priority?: number }>} banners
 * @returns {Array}
 */
export function getActiveBannersSorted(banners) {
  if (!Array.isArray(banners)) return [];
  const active = banners.filter((b) => b.active === true);
  return active.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
}
