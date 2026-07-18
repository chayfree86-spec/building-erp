import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, User, Phone, Mail, MapPin, FileText, IndianRupee } from 'lucide-react';
import { customersApi } from '@/services/api-endpoints';
import { formatCurrency } from '@/utils/format';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: customer, isLoading, isError } = useQuery({
    queryKey: ['customers', Number(id)],
    queryFn: async () => { const { data } = await customersApi.get(Number(id)); return data.data; },
    enabled: !!id,
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>;
  if (isError || !customer) return <div className="card p-8 text-center text-red-500">Failed to load customer.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/customers')} className="p-2 hover:bg-neutral-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{customer.name}</h1>
          <p className="text-sm text-neutral-500">Customer since {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2"><Phone className="w-4 h-4" /> Contact</div>
          <p className="font-semibold">{customer.mobile || 'No mobile'}</p>
          {customer.email && <p className="text-sm text-neutral-500">{customer.email}</p>}
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2"><FileText className="w-4 h-4" /> GST</div>
          <p className="font-semibold">{customer.gst_number || 'Not registered'}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2"><IndianRupee className="w-4 h-4" /> Financial</div>
          <p className="font-semibold">Outstanding: {formatCurrency(Number(customer.outstanding_balance ?? customer.opening_balance))}</p>
          <p className="text-xs text-neutral-500 mt-1">Credit Limit: {formatCurrency(Number(customer.credit_limit))}</p>
          <p className="text-xs text-neutral-400">Opening Bal: {formatCurrency(Number(customer.opening_balance))} ({customer.opening_balance_type})</p>
        </div>
      </div>

      {customer.addresses?.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Addresses</h2>
          <div className="space-y-3">
            {customer.addresses.map((addr: any) => (
              <div key={addr.id} className="p-3 bg-neutral-50 rounded-lg flex items-start gap-3">
                <MapPin className="w-4 h-4 text-neutral-400 mt-0.5" />
                <div>
                  <p className="font-medium">{addr.address}</p>
                  <p className="text-sm text-neutral-500">{[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}</p>
                  {addr.is_default && <span className="text-xs text-primary-600 font-medium">Default</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
