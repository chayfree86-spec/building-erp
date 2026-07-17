import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Building2, Calendar, IndianRupee, User } from 'lucide-react';
import { salesApi } from '@/services/api-endpoints';
import { formatCurrency, formatDate } from '@/utils/format';

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: invoice, isLoading, isError } = useQuery({
    queryKey: ['invoices', Number(id)],
    queryFn: async () => { const { data } = await salesApi.get(Number(id)); return data.data; },
    enabled: !!id,
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>;
  if (isError || !invoice) return <div className="card p-8 text-center text-red-500">Failed to load invoice details.</div>;

  const items = invoice.items || [];
  const customer = invoice.customer;

  const statusColors: Record<string, string> = {
    draft: 'bg-neutral-100 text-neutral-700', confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700', reversed: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/invoices')} className="p-2 hover:bg-neutral-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-900">Invoice #{invoice.invoice_number}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[invoice.status] || 'bg-neutral-100'}`}>
              {invoice.status?.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">Created on {formatDate(invoice.created_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2"><User className="w-4 h-4" /> Customer</div>
          <p className="font-semibold text-neutral-900">{customer?.name || invoice.customer_name_snapshot || 'N/A'}</p>
          {customer?.mobile && <p className="text-sm text-neutral-500">{customer.mobile}</p>}
          {customer?.gst_number && <p className="text-xs text-neutral-400">GST: {customer.gst_number}</p>}
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2"><Calendar className="w-4 h-4" /> Invoice Date</div>
          <p className="font-semibold text-neutral-900">{formatDate(invoice.invoice_date)}</p>
          <p className="text-xs text-neutral-400">Payment: {invoice.payment_status || 'unpaid'}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2"><IndianRupee className="w-4 h-4" /> Amount</div>
          <p className="font-semibold text-lg text-neutral-900">{formatCurrency(Number(invoice.total_amount))}</p>
          <p className="text-xs text-neutral-400">Paid: {formatCurrency(Number(invoice.paid_amount || 0))}</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Items ({items.length})</h2>
        <div className="overflow-visible">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-neutral-500">
                <th className="pb-2 px-2">#</th><th className="pb-2 px-2">Product</th><th className="pb-2 text-right px-2">Qty</th>
                <th className="pb-2 text-right px-2">Rate</th><th className="pb-2 text-right px-2">Disc.</th>
                <th className="pb-2 text-right px-2">GST%</th><th className="pb-2 text-right px-2">Tax</th><th className="pb-2 text-right px-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, idx: number) => (
                <tr key={item.id || idx} className="border-b border-neutral-100">
                  <td className="py-3 px-2 text-neutral-400 align-middle">{idx + 1}</td>
                  <td className="py-3 px-2 font-medium align-middle">{item.product?.name || `Product #${item.product_id}`}</td>
                  <td className="py-3 px-2 text-right align-middle">{Number(item.quantity).toFixed(3)}</td>
                  <td className="py-3 px-2 text-right font-mono align-middle">{formatCurrency(Number(item.rate))}</td>
                  <td className="py-3 px-2 text-right font-mono text-red-600 align-middle">{formatCurrency(Number(item.discount_amount || 0))}</td>
                  <td className="py-3 px-2 text-right align-middle">{Number(item.gst_rate || 0)}%</td>
                  <td className="py-3 px-2 text-right font-mono align-middle">{formatCurrency(Number(item.tax_amount || 0))}</td>
                  <td className="py-3 px-2 text-right font-semibold font-mono align-middle">{formatCurrency(Number(item.line_total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 border-t pt-4 flex justify-end">
          <div className="w-64 space-y-1.5 text-sm">
            <div className="flex justify-between text-neutral-600"><span>Subtotal</span><span className="font-mono">{formatCurrency(Number(invoice.subtotal))}</span></div>
            <div className="flex justify-between text-neutral-600"><span>Discount</span><span className="font-mono text-red-600">-{formatCurrency(Number(invoice.item_discount || 0))}</span></div>
            <div className="flex justify-between text-neutral-600"><span>Tax</span><span className="font-mono">{formatCurrency(Number(invoice.tax_amount || 0))}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-1.5"><span>Total</span><span className="font-mono">{formatCurrency(Number(invoice.total_amount))}</span></div>
          </div>
        </div>
      </div>

      {invoice.remarks && (
        <div className="card p-4"><h3 className="text-sm font-medium text-neutral-500 mb-1">Remarks</h3><p className="text-neutral-700">{invoice.remarks}</p></div>
      )}
    </div>
  );
}
