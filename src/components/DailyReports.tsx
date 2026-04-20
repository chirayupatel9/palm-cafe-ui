import React, { useMemo, useState } from 'react';
import { Download, FileText, TrendingUp } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';
import { GlassButton } from './ui/GlassButton';
import Select from './ui/Select';

const REPORT_TYPES = [
  { id: 'sales_summary', label: 'Sales summary' },
  { id: 'top_items', label: 'Top items' },
  { id: 'orders_detail', label: 'Orders detail' },
  { id: 'inventory', label: 'Inventory' }
] as const;

const REPORT_COLUMNS: Record<string, { key: string; label: string; kind?: 'money' | 'date' | 'bool' | 'text' }[]> = {
  sales_summary: [
    { key: 'date', label: 'Date', kind: 'date' },
    { key: 'orders', label: 'Orders', kind: 'text' },
    { key: 'earnings', label: 'Earnings', kind: 'money' }
  ],
  top_items: [
    { key: 'name', label: 'Item', kind: 'text' },
    { key: 'category', label: 'Category', kind: 'text' },
    { key: 'total_orders', label: 'Orders', kind: 'text' },
    { key: 'total_revenue', label: 'Revenue', kind: 'money' }
  ],
  orders_detail: [
    { key: 'order_number', label: 'Order #', kind: 'text' },
    { key: 'created_at', label: 'Date', kind: 'date' },
    { key: 'status', label: 'Status', kind: 'text' },
    { key: 'payment_method', label: 'Payment', kind: 'text' },
    { key: 'customer_name', label: 'Customer', kind: 'text' },
    { key: 'item_name', label: 'Item', kind: 'text' },
    { key: 'item_quantity', label: 'Qty', kind: 'text' },
    { key: 'item_unit_price', label: 'Unit price', kind: 'money' },
    { key: 'item_total_price', label: 'Line total', kind: 'money' },
    { key: 'final_amount', label: 'Order total', kind: 'money' }
  ],
  inventory: [
    { key: 'name', label: 'Item', kind: 'text' },
    { key: 'category', label: 'Category', kind: 'text' },
    { key: 'quantity', label: 'Qty', kind: 'text' },
    { key: 'unit', label: 'Unit', kind: 'text' },
    { key: 'reorder_level', label: 'Reorder', kind: 'text' },
    { key: 'low_stock', label: 'Low stock', kind: 'bool' }
  ]
};

const DailyReports: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [reportType, setReportType] = useState('sales_summary');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [topLimit, setTopLimit] = useState(10);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);

  const canUseDateRange = reportType !== 'inventory';

  const toggleInList = (list: string[], value: string) => {
    if (list.includes(value)) return list.filter((v) => v !== value);
    return [...list, value];
  };

  const queryParams = useMemo(() => {
    const params: Record<string, any> = {};
    if (canUseDateRange) {
      params.startDate = startDate;
      params.endDate = endDate;
    }
    if (reportType === 'top_items') params.limit = topLimit;
    if (reportType === 'orders_detail') {
      if (statuses.length) params.status = statuses.join(',');
      if (paymentMethods.length) params.paymentMethod = paymentMethods.join(',');
    }
    return params;
  }, [canUseDateRange, startDate, endDate, reportType, topLimit, statuses, paymentMethods]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setRows([]);

      if (reportType === 'sales_summary') {
        const r = await axios.get('/reports/daily', { params: queryParams });
        setRows(r.data.dailyData || []);
        return;
      }
      if (reportType === 'top_items') {
        const r = await axios.get('/reports/top-items', { params: queryParams });
        setRows(r.data.topItems || []);
        return;
      }
      if (reportType === 'orders_detail') {
        const r = await axios.get('/reports/orders-detail', { params: queryParams });
        setRows(r.data.rows || []);
        return;
      }
      if (reportType === 'inventory') {
        const r = await axios.get('/reports/inventory');
        setRows(r.data.rows || []);
        return;
      }

      toast.error('Unknown report type');
    } catch (error: any) {
      console.error('Error fetching report:', error);
      const message = error?.response?.data?.error || 'Failed to generate report';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const downloadExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      const params: Record<string, any> = { type: reportType, ...queryParams };
      const r = await axios.get(`/reports/export/${format}`, {
        params,
        responseType: 'blob'
      });

      const blob = new Blob([r.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `palm-cafe-${reportType}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error: any) {
      console.error('Error exporting report:', error);
      const message = error?.response?.data?.error || 'Failed to export report';
      toast.error(message);
    }
  };

  const columns = useMemo(() => {
    const configured = REPORT_COLUMNS[reportType] || [];
    if (configured.length) return configured;
    const fallbackKeys = Object.keys(rows[0] || {}).slice(0, 10);
    return fallbackKeys.map((k) => ({ key: k, label: k.replace(/_/g, ' '), kind: 'text' as const }));
  }, [reportType, rows]);

  const formatCell = (kind: string | undefined, value: any) => {
    if (value == null) return '';
    if (kind === 'money') return formatCurrency(Number(value) || 0);
    if (kind === 'bool') return value ? 'Yes' : 'No';
    if (kind === 'date') {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toLocaleString();
    }
    return String(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
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

      <div className="glass-card p-4 rounded-2xl border border-[var(--color-outline)]/20 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <label className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-2">
              Report type
            </label>
            <Select
              id="reportType"
              value={reportType}
              onChange={(value) => {
                setReportType(value);
                setRows([]);
              }}
              options={REPORT_TYPES.map((t) => ({ value: t.id, label: t.label }))}
            />
          </div>

          <div className="lg:col-span-3">
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${!canUseDateRange ? 'opacity-70' : ''}`}>
              <div>
                <label htmlFor="startDate" className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-2">
                  Start date
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={!canUseDateRange}
                  className="glass-input w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] py-2.5 px-3 disabled:opacity-60"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-2">
                  End date
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={!canUseDateRange}
                  className="glass-input w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] py-2.5 px-3 disabled:opacity-60"
                />
              </div>

              {reportType === 'top_items' ? (
                <div>
                  <label htmlFor="topLimit" className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-2">
                    Top N
                  </label>
                  <input
                    id="topLimit"
                    type="number"
                    min={1}
                    max={100}
                    value={topLimit}
                    onChange={(e) => setTopLimit(parseInt(e.target.value, 10) || 10)}
                    className="glass-input w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] py-2.5 px-3"
                  />
                </div>
              ) : (
                <div className="hidden lg:block" />
              )}

              <div className="flex items-end gap-2">
                <div className="w-full">
                  <GlassButton
                    type="button"
                    onClick={fetchReport}
                    disabled={loading || (canUseDateRange && (!startDate || !endDate))}
                    size="sm"
                    className="glass-button-primary w-full"
                    contentClassName="w-full flex items-center justify-center"
                  >
                    {loading ? 'Generating…' : 'Generate'}
                  </GlassButton>
                </div>
              </div>
            </div>

            {reportType === 'orders_detail' && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-2">Status</div>
                  <div className="flex flex-wrap gap-2">
                    {['pending', 'preparing', 'ready', 'completed', 'cancelled'].map((s) => (
                      <label key={s} className="flex items-center gap-2 text-sm text-[var(--color-on-surface)]">
                        <input
                          type="checkbox"
                          checked={statuses.includes(s)}
                          onChange={() => setStatuses((prev) => toggleInList(prev, s))}
                          className="h-4 w-4 rounded border-[var(--color-outline)] text-primary focus:ring-primary focus:ring-offset-0"
                        />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-2">Payment</div>
                  <div className="flex flex-wrap gap-2">
                    {['cash', 'upi', 'card'].map((p) => (
                      <label key={p} className="flex items-center gap-2 text-sm text-[var(--color-on-surface)]">
                        <input
                          type="checkbox"
                          checked={paymentMethods.includes(p)}
                          onChange={() => setPaymentMethods((prev) => toggleInList(prev, p))}
                          className="h-4 w-4 rounded border-[var(--color-outline)] text-primary focus:ring-primary focus:ring-offset-0"
                        />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <GlassButton
            type="button"
            onClick={() => downloadExport('csv')}
            size="sm"
            className="glass-button-secondary"
            contentClassName="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            CSV
          </GlassButton>
          <GlassButton
            type="button"
            onClick={() => downloadExport('xlsx')}
            size="sm"
            className="glass-button-secondary"
            contentClassName="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Excel
          </GlassButton>
          <GlassButton
            type="button"
            onClick={() => downloadExport('pdf')}
            size="sm"
            className="glass-button-secondary"
            contentClassName="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            PDF
          </GlassButton>
        </div>
      </div>

      <div className="glass-card overflow-hidden rounded-2xl shadow-sm relative z-0">
        <div className="bg-[var(--surface-table)]/60 backdrop-blur-sm px-5 py-4 border-b border-[var(--color-outline)]/20 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-[var(--color-on-surface)] font-semibold">Results</h3>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-0.5">
              {rows.length ? `${rows.length} row(s)` : 'Generate a report to see results'}
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-10 text-[var(--color-on-surface-variant)]">
            No data yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-[var(--surface-table)]/60 text-[var(--color-on-surface)]">
                  {columns.map((c) => (
                    <th key={c.key} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-outline)]/30">
                {rows.slice(0, 200).map((r, idx) => (
                  <tr key={idx} className="hover:bg-[var(--surface-table)]/50 transition-colors">
                    {columns.map((c) => (
                      <td key={c.key} className="px-4 py-3 text-sm text-[var(--color-on-surface-variant)] whitespace-nowrap">
                        {formatCell(c.kind, r[c.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 200 && (
              <div className="px-5 py-3 text-sm text-[var(--color-on-surface-variant)]">
                Showing first 200 rows. Use export to download full data.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyReports;
