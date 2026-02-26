import { normalizeBannersFromBranding, getActiveBannersSorted } from './bannerUtils';

describe('bannerUtils', () => {
  describe('normalizeBannersFromBranding', () => {
    it('returns empty array for null or undefined', () => {
      expect(normalizeBannersFromBranding(null)).toEqual([]);
      expect(normalizeBannersFromBranding(undefined)).toEqual([]);
    });

    it('returns empty array for non-object', () => {
      expect(normalizeBannersFromBranding('')).toEqual([]);
      expect(normalizeBannersFromBranding(0)).toEqual([]);
    });

    it('uses legacy promo_banner_image_url when no banners array', () => {
      const data = { promo_banner_image_url: '/images/promo.png' };
      expect(normalizeBannersFromBranding(data)).toEqual([
        { id: 'legacy-promo', image_url: '/images/promo.png', active: true, priority: 0, link_url: null }
      ]);
    });

    it('returns empty array when no banners and no legacy URL', () => {
      expect(normalizeBannersFromBranding({})).toEqual([]);
      expect(normalizeBannersFromBranding({ cafe_name: 'Test' })).toEqual([]);
    });

    it('uses banners array when present', () => {
      const data = {
        banners: [
          { id: 1, image_url: '/a.png', active: true, priority: 1 },
          { id: 2, image_url: '/b.png', active: false, priority: 0 }
        ]
      };
      expect(normalizeBannersFromBranding(data)).toEqual([
        { id: '1', image_url: '/a.png', active: true, priority: 1, link_url: null },
        { id: '2', image_url: '/b.png', active: false, priority: 0, link_url: null }
      ]);
    });

    it('passes through link_url when present', () => {
      const data = {
        banners: [{ id: 1, image_url: '/a.png', link_url: 'https://example.com/promo' }]
      };
      const result = normalizeBannersFromBranding(data);
      expect(result[0].link_url).toBe('https://example.com/promo');
    });

    it('prefers banners array over legacy URL', () => {
      const data = {
        promo_banner_image_url: '/legacy.png',
        banners: [{ id: 1, image_url: '/new.png', active: true, priority: 0 }]
      };
      expect(normalizeBannersFromBranding(data)).toHaveLength(1);
      expect(normalizeBannersFromBranding(data)[0].image_url).toBe('/new.png');
    });

    it('generates id when banner has no id', () => {
      const data = { banners: [{ image_url: '/x.png' }] };
      expect(normalizeBannersFromBranding(data)[0].id).toBe('banner-0');
    });

    it('defaults active to true when omitted', () => {
      const data = { banners: [{ id: 1, image_url: '/x.png' }] };
      expect(normalizeBannersFromBranding(data)[0].active).toBe(true);
    });
  });

  describe('getActiveBannersSorted', () => {
    it('returns empty array for non-array', () => {
      expect(getActiveBannersSorted(null)).toEqual([]);
      expect(getActiveBannersSorted(undefined)).toEqual([]);
    });

    it('filters to active only and sorts by priority ASC', () => {
      const banners = [
        { id: 'a', active: true, priority: 2 },
        { id: 'b', active: false, priority: 0 },
        { id: 'c', active: true, priority: 0 }
      ];
      expect(getActiveBannersSorted(banners)).toEqual([
        { id: 'c', active: true, priority: 0 },
        { id: 'a', active: true, priority: 2 }
      ]);
    });

    it('preserves order when priority equal', () => {
      const banners = [
        { id: 'a', active: true, priority: 0 },
        { id: 'b', active: true, priority: 0 }
      ];
      expect(getActiveBannersSorted(banners).map((b) => b.id)).toEqual(['a', 'b']);
    });

    it('treats missing priority as 0', () => {
      const banners = [
        { id: 'a', active: true },
        { id: 'b', active: true, priority: -1 }
      ];
      const result = getActiveBannersSorted(banners);
      expect(result[0].id).toBe('b');
    });
  });
});
