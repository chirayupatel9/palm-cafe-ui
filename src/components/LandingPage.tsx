import React from 'react';
import { User, Users, ArrowRight, Coffee } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCafeSettings } from '../contexts/CafeSettingsContext';
import { getImageUrl } from '../utils/imageUtils';

const LandingPage: React.FC = () => {
  const { cafeSettings } = useCafeSettings();

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            {cafeSettings?.logo_url && (
              <img
                src={getImageUrl(cafeSettings?.logo_url ?? null) ?? ''}
                alt={`${cafeSettings.cafe_name || 'Cafe'} Logo`}
                className="h-24 w-24"
              />
            )}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
            Welcome{cafeSettings?.cafe_name ? ` to ${cafeSettings.cafe_name}` : ''}
          </h1>
          <p className="text-xl max-w-2xl mx-auto" style={{ color: 'var(--color-secondary)' }}>
            Choose your experience - order delicious food as a customer or manage operations as an admin
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="p-8">
              <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-6" style={{ backgroundColor: 'var(--color-accent)' }}>
                <Users className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-center mb-4" style={{ color: 'var(--color-text)' }}>
                I&apos;m a Customer
              </h2>
              <p className="text-center mb-6" style={{ color: 'var(--color-secondary)' }}>
                Browse our delicious menu, place orders, and earn loyalty points with every purchase.
              </p>
              <ul className="space-y-3 mb-8">
                {['Browse menu by categories', 'Easy cart management', 'Multiple payment options', 'Earn loyalty points'].map((item) => (
                  <li key={item} className="flex items-center text-sm" style={{ color: 'var(--color-secondary)' }}>
                    <Coffee className="h-4 w-4 mr-3" style={{ color: 'var(--color-accent)' }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/cafe/default"
                className="w-full flex items-center justify-center px-6 py-3 text-white font-medium rounded-lg transition-colors group"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                Start Ordering
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="p-8">
              <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-6" style={{ backgroundColor: 'var(--color-primary)' }}>
                <User className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-center mb-4" style={{ color: 'var(--color-text)' }}>
                I&apos;m an Admin
              </h2>
              <p className="text-center mb-6" style={{ color: 'var(--color-secondary)' }}>
                Manage menu, orders, customers, and business operations with full control.
              </p>
              <ul className="space-y-3 mb-8">
                {['Menu management', 'Order tracking', 'Customer management', 'Business analytics'].map((item) => (
                  <li key={item} className="flex items-center text-sm" style={{ color: 'var(--color-secondary)' }}>
                    <Coffee className="h-4 w-4 mr-3" style={{ color: 'var(--color-primary)' }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/login"
                className="w-full flex items-center justify-center px-6 py-3 text-white font-medium rounded-lg transition-colors group"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Admin Login
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
            © 2024 {cafeSettings?.cafe_name || 'Cafe'}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
