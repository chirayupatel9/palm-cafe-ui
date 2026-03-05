import React, { useState, useEffect } from 'react';
import { ShoppingBag, FileText, TrendingUp } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';

interface TopItem {
  id?: number;
  name: string;
  category?: string;
  total_orders: number;
  total_revenue: number;
}

const DailyReports: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDailyReports = async () => {
      try {
        setLoading(true);
        const topItemsResponse = await axios.get('/reports/top-items');
        setTopItems(topItemsResponse.data.topItems || []);
      } catch (error) {
        console.error('Error fetching daily reports:', error);
        toast.error('Failed to load daily reports');
      } finally {
        setLoading(false);
      }
    };
    fetchDailyReports();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
        <p className="mt-3 text-sm text-[var(--color-on-surface-variant)]">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-container)]">
          <FileText className="h-6 w-6 text-[var(--color-primary)]" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-on-surface)] truncate">Operational Reports</h1>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">Detailed item-level data and operational insights</p>
        </div>
      </div>

      <div className="glass-card p-4 rounded-2xl border border-[var(--color-outline)]/20">
        <div className="flex items-start">
          <TrendingUp className="h-5 w-5 text-[var(--color-primary)] mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-[var(--color-on-surface)]">
              <strong>Tip:</strong> For high-level business insights, revenue trends, and performance metrics, visit the <a href="/analytics" className="font-semibold text-[var(--color-primary)] hover:underline">Analytics</a> dashboard.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden rounded-2xl shadow-sm">
        <div className="bg-[var(--surface-table)]/60 backdrop-blur-sm px-5 py-4 border-b border-[var(--color-outline)]/20">
          <h3 className="text-[var(--color-on-surface)] font-semibold">Top 5 Most Ordered Items</h3>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-0.5">Item-level performance data for operational planning</p>
        </div>
        {topItems.length > 0 ? (
          <div className="divide-y divide-[var(--color-outline)]/30">
            {topItems.slice(0, 5).map((item, index) => (
              <div
                key={item.id ?? index}
                className="flex items-center justify-between px-5 py-4 hover:bg-[var(--surface-table)]/50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-[var(--color-primary-container)]">
                    <span className="text-sm font-bold text-[var(--color-on-primary-container)]">
                      #{index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-[var(--color-on-surface)]">{item.name}</p>
                    <p className="text-sm text-[var(--color-on-surface-variant)]">{item.category || 'Uncategorized'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[var(--color-on-surface)]">{item.total_orders} orders</p>
                  <p className="text-sm text-[var(--color-on-surface-variant)]">{formatCurrency(item.total_revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[var(--color-on-surface-variant)]">
            <ShoppingBag className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No order data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyReports;
