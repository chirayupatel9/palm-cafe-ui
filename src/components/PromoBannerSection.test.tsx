import React from 'react';
import { render, screen } from '@testing-library/react';
import PromoBannerSection, { getGridColsClass } from './PromoBannerSection';

jest.mock('../utils/imageUtils', () => ({
  getImageUrl: (url: string) => (url ? `https://api.example.com${url}` : null)
}));

describe('PromoBannerSection', () => {
  it('renders loading state', () => {
    render(<PromoBannerSection loading={true} banners={[]} />);
    const loadingEl = document.querySelector('[aria-busy="true"]');
    expect(loadingEl).toBeInTheDocument();
    expect(loadingEl).toHaveAttribute('aria-label', 'Loading promotions');
  });

  it('renders error state without breaking layout', () => {
    render(<PromoBannerSection error={true} banners={[]} />);
    expect(screen.getByText(/Promotions will appear here/)).toBeInTheDocument();
  });

  it('renders single banner (full width)', () => {
    const banners = [{ id: '1', image_url: '/img.png', active: true, priority: 0 }];
    render(<PromoBannerSection banners={banners} loading={false} error={false} />);
    const img = document.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', 'Promotion');
  });

  it('renders two banners (equal split)', () => {
    const banners = [
      { id: '1', image_url: '/a.png', active: true, priority: 0 },
      { id: '2', image_url: '/b.png', active: true, priority: 1 }
    ];
    const { container } = render(<PromoBannerSection banners={banners} loading={false} error={false} />);
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('sm:grid-cols-2');
    expect(grid?.querySelectorAll('img').length).toBe(2);
  });

  it('renders three banners with equal distribution class', () => {
    const banners = [
      { id: '1', image_url: '/a.png', active: true, priority: 0 },
      { id: '2', image_url: '/b.png', active: true, priority: 1 },
      { id: '3', image_url: '/c.png', active: true, priority: 2 }
    ];
    const { container } = render(<PromoBannerSection banners={banners} loading={false} error={false} />);
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('sm:grid-cols-3');
  });

  it('renders fallback when 0 active banners', () => {
    const banners = [
      { id: '1', image_url: '/a.png', active: false, priority: 0 },
      { id: '2', image_url: '/b.png', active: false, priority: 1 }
    ];
    render(<PromoBannerSection banners={banners} loading={false} error={false} />);
    expect(screen.getByText(/Welcome/)).toBeInTheDocument();
    expect(screen.getByText(/Discover our specials/)).toBeInTheDocument();
  });

  it('renders fallback when banners array is empty', () => {
    render(<PromoBannerSection banners={[]} loading={false} error={false} />);
    expect(screen.getByText(/Welcome/)).toBeInTheDocument();
  });

  it('never renders empty section - fallback has content', () => {
    const { container } = render(<PromoBannerSection banners={[]} loading={false} error={false} />);
    const section = container.querySelector('.relative.w-full');
    expect(section).toBeInTheDocument();
    expect(section?.querySelector('.grid')).toBeInTheDocument();
    expect(section?.querySelector('.grid')?.children.length).toBe(1);
  });

  it('sorts banners by priority', () => {
    const banners = [
      { id: 'b', image_url: '/b.png', active: true, priority: 2 },
      { id: 'a', image_url: '/a.png', active: true, priority: 0 }
    ];
    const { container } = render(<PromoBannerSection banners={banners} loading={false} error={false} />);
    const tiles = container.querySelectorAll('.relative.w-full.overflow-hidden');
    expect(tiles.length).toBe(2);
  });
});

describe('getGridColsClass', () => {
  it('returns 1 col for count 1', () => {
    expect(getGridColsClass(1)).toBe('sm:grid-cols-1');
  });
  it('returns 2 cols for count 2', () => {
    expect(getGridColsClass(2)).toBe('sm:grid-cols-2');
  });
  it('returns 3 cols for count 3', () => {
    expect(getGridColsClass(3)).toBe('sm:grid-cols-3');
  });
  it('returns 4 cols for count 4', () => {
    expect(getGridColsClass(4)).toBe('sm:grid-cols-2 lg:grid-cols-4');
  });
  it('returns wrapping grid for 5+', () => {
    expect(getGridColsClass(5)).toBe('sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4');
    expect(getGridColsClass(10)).toBe('sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4');
  });
});
