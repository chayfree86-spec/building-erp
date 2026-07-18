import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Phone, MapPin, FileText, ShoppingCart, CreditCard, TrendingUp, ArrowDownLeft, ArrowUpRight, Trash2, Edit2 } from 'lucide-react';
import { suppliersApi, purchasesApi, paymentsApi } from '@/services/api-endpoints';
import { formatCurrency, formatDate } from '@/utils/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useCategories } from '@/features/products/api/queries';
import { MasterFormModal, type FieldDef } from '@/components/shared/MasterFormModal';
import toast from 'react-hot-toast';

const baseSupplierFields: FieldDef[] = [
  { key: 'name', label: 'Supplier Name', required: true, placeholder: 'Company or individual name' },
  { key: 'category_ids', label: 'Supplier Categories', type: 'multiselect', options: [], placeholder: 'Select categories' },
  { key: 'mobile', label: 'Mobile', placeholder: '10-digit mobile number' },
  { key: 'email', label: 'Email', placeholder: 'supplier@example.com' },
  { key: 'gst_number', label: 'GST Number', placeholder: 'GSTIN' },
  { key: 'opening_balance', label: 'Opening Balance', type: 'number', placeholder: '0', defaultValue: '0' },
  { key: 'address', label: 'Address', type: 'textarea', placeholder: 'Address' },
  { key: 'city', label: 'City', placeholder: 'City' },
  { key: 'state', label: 'State', placeholder: 'State' },
  { key: 'pincode', label: 'Pincode', placeholder: 'Pincode' },
  { key: 'status', label: 'Status', type: 'switch', defaultValue: 'active' },
];

const MONTHS = [
  { value: '', label: 'All Time' },
  { value: '2026-07', label: 'July 2026' },
  { value: '2026-06', label: 'June 2026' },
  { value: '2026-05', label: 'May 2026' },
  { value: '2026-04', label: 'April 2026' },
  { value: '2026-03', label: 'March 2026' },
];

export function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [monthFilter, setMonthFilter] = useState('');
  const [txnFilter, setTxnFilter] = useState('all');
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const { data: categories = [] } = useCategories();

  const dynamicFields = baseSupplierFields.map(f => {
    if (f.key === 'category_ids') {
      return {
        ...f,
        options: categories.map(c => ({ value: String(c.id), label: c.name })),
      };
    }
    return f;
  });

  const handleSave = async (formData: Record<string, any>) => {
    const payload = {
      ...formData,
      category_ids: Array.isArray(formData.category_ids) ? formData.category_ids.map(Number) : [],
      opening_balance: Number(formData.opening_balance) || 0,
    };
    delete (payload as any).category_id;
    try {
      await suppliersApi.update(Number(id), payload);
      toast.success('Supplier updated successfully');
      queryClient.invalidateQueries({ queryKey: ['suppliers', Number(id)] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this supplier? This action cannot be undone.')) return;
    try {
      await suppliersApi.remove(Number(id));
      toast.success('Supplier deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      navigate('/suppliers');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  const { data: supplier, isLoading, isError } = useQuery({
    queryKey: ['suppliers', Number(id)],
    queryFn: async () => { const { data } = await suppliersApi.get(Number(id)); return data.data; },
    enabled: !!id,
  });

  const { data: purchasesData } = useQuery({
    queryKey: ['supplier-purchases', Number(id), monthFilter],
    queryFn: async () => {
      const params: any = { supplier_id: Number(id), per_page: 50 };
      if (monthFilter) { params.date_from = monthFilter + '-01'; params.date_to = monthFilter + '-31'; }
      const { data } = await purchasesApi.list(params);
      return data.data?.data || data.data || [];
    },
    enabled: !!id,
  });
  const purchases = Array.isArray(purchasesData) ? purchasesData : [];

  const { data: paymentsData } = useQuery({
    queryKey: ['supplier-payment-history', Number(id), monthFilter],
    queryFn: async () => {
      const params: any = { supplier_id: Number(id), per_page: 50 };
      if (monthFilter) { params.date_from = monthFilter + '-01'; params.date_to = monthFilter + '-31'; }
      const { data } = await paymentsApi.supplierList(params);
      return data.data?.data || data.data || [];
    },
    enabled: !!id,
  });
  const payments = Array.isArray(paymentsData) ? paymentsData : [];

  const totalPurchased = purchases.reduce((sum: number, p: any) => sum + (Number(p.total_amount) || 0), 0);
  const totalPaid = payments.filter((p: any) => p.status === 'confirmed').reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
  const openingBal = Number(supplier?.opening_balance) || 0;
  const openingType = supplier?.opening_balance_type;
  const effectiveOpening = openingType === 'credit' ? openingBal : (openingType === 'debit' ? -openingBal : 0);
  const outstanding = supplier?.outstanding_balance !== undefined ? Number(supplier.outstanding_balance) : (effectiveOpening + totalPurchased - totalPaid);

  const initialDataForEdit = supplier ? {
    ...supplier,
    category_ids: supplier.categories?.map((c: any) => String(c.id)) || [],
    address: supplier.addresses?.[0]?.address || '',
    city: supplier.addresses?.[0]?.city || '',
    state: supplier.addresses?.[0]?.state || '',
    pincode: supplier.addresses?.[0]?.pincode || '',
  } : null;



  const formatCurrencyPDF = (amount: number | string): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return 'Rs. 0.00';
    return 'Rs. ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const generatePDFDoc = async () => {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    
    // Set title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('SUPPLIER LEDGER STATEMENT', 14, 20);
    
    // Add supplier details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Supplier Name: ${supplier.name}`, 14, 30);
    doc.text(`Mobile: ${supplier.mobile || 'N/A'}`, 14, 35);
    doc.text(`GSTIN: ${supplier.gst_number || 'N/A'}`, 14, 40);
    doc.text(`Date Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 45);
    
    // Card 1: Opening Balance (Cyan)
    doc.setFillColor(236, 254, 255); // cyan-50
    doc.roundedRect(14, 52, 88, 22, 2, 2, 'F');
    doc.setFillColor(14, 116, 144); // cyan-700
    doc.rect(14, 52, 3, 22, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(115, 115, 115);
    doc.text('Opening Balance', 21, 58);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(14, 116, 144);
    doc.text(formatCurrencyPDF(openingBal), 21, 65);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(163, 163, 163);
    doc.text(openingType ? openingType.toUpperCase() : 'N/A', 21, 70);

    // Card 2: Total Purchased (Blue)
    doc.setFillColor(239, 246, 255); // blue-50
    doc.roundedRect(108, 52, 88, 22, 2, 2, 'F');
    doc.setFillColor(29, 78, 216); // blue-700
    doc.rect(108, 52, 3, 22, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(115, 115, 115);
    doc.text('Total Purchased', 115, 58);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(29, 78, 216);
    doc.text(formatCurrencyPDF(totalPurchased), 115, 65);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(163, 163, 163);
    doc.text(`${purchases.length} purchase(s)`, 115, 70);

    // Card 3: Total Paid (Emerald)
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.roundedRect(14, 78, 88, 22, 2, 2, 'F');
    doc.setFillColor(4, 120, 87); // emerald-700
    doc.rect(14, 78, 3, 22, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(115, 115, 115);
    doc.text('Total Paid', 21, 84);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(4, 120, 87);
    doc.text(formatCurrencyPDF(totalPaid), 21, 91);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(163, 163, 163);
    doc.text(`${payments.filter((p: any) => p.status === 'confirmed').length} payment(s)`, 21, 96);

    // Card 4: Outstanding (Rose / Green)
    const isOwe = outstanding > 0;
    const isAdv = outstanding < 0;
    const bgRGB: [number, number, number] = isOwe ? [255, 241, 242] : [240, 253, 244]; // rose-50 or green-50
    const textRGB: [number, number, number] = isOwe ? [226, 92, 106] : [21, 128, 61]; // strawberry red or green-700
    const labelText = isOwe ? 'You Owe' : isAdv ? 'Advance' : 'Settled';
    
    doc.setFillColor(...bgRGB);
    doc.roundedRect(108, 78, 88, 22, 2, 2, 'F');
    doc.setFillColor(...textRGB);
    doc.rect(108, 78, 3, 22, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(115, 115, 115);
    doc.text('Outstanding Balance', 115, 84);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...textRGB);
    doc.text(formatCurrencyPDF(Math.abs(outstanding)), 115, 91);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(163, 163, 163);
    doc.text(labelText, 115, 96);
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Transactions Table
    const tableColumn = ["Date", "Type", "Reference #", "Details", "Amount", "Status"];
    const tableRows: any[] = [];
    
    const allTxns: any[] = [];
    purchases.forEach((p: any) => allTxns.push({ ...p, _type: 'purchase', _date: p.purchase_date, _ref: p.purchase_number, _amount: Number(p.total_amount) || 0, _paid: Number(p.paid_amount) || 0, _mode: null, _txnRef: null }));
    payments.forEach((p: any) => allTxns.push({ ...p, _type: 'payment', _date: p.payment_date, _ref: p.payment_number || ('#' + p.id), _amount: Number(p.amount) || 0, _paid: 0, _mode: p.payment_mode?.name, _txnRef: p.transaction_reference }));
    allTxns.sort((a: any, b: any) => new Date(b._date).getTime() - new Date(a._date).getTime());
    
    allTxns.forEach((txn: any) => {
      const isPurchase = txn._type === 'purchase';
      const dateStr = formatDate(txn._date);
      const typeStr = isPurchase ? 'Purchase' : 'Payment';
      const refStr = txn._ref;
      const detailsStr = isPurchase ? `${txn.items?.length || 0} items` : (txn._mode ? `Via ${txn._mode}` : '-');
      const amountStr = `${isPurchase ? '-' : '+'}${formatCurrencyPDF(txn._amount)}`;
      const statusStr = txn.status;
      
      tableRows.push([dateStr, typeStr, refStr, detailsStr, amountStr, statusStr]);
    });
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 106,
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105] }, // slate-600
      columnStyles: {
        4: { halign: 'right' } // Align amount column to right
      }
    });

    return doc;
  };

  const shareOnWhatsApp = async () => {
    try {
      toast.loading('Preparing PDF statement...', { id: 'pdf-share' });
      const doc = await generatePDFDoc();
      const pdfBlob = doc.output('blob');
      const fileName = `${supplier.name.replace(/\s+/g, '_')}_statement.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      // Attempt Web Share if browser supports sharing PDF files
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        toast.dismiss('pdf-share');
        await navigator.share({
          files: [pdfFile],
          title: `${supplier.name} Statement`,
          text: `Financial summary statement for ${supplier.name}.`
        });
      } else {
        // Fallback for desktops or browsers without file sharing support
        toast.success('PDF statement downloaded. Opening WhatsApp...', { id: 'pdf-share' });
        doc.save(fileName);
        
        const statusText = outstanding > 0 ? 'You owe' : outstanding < 0 ? 'Advance' : 'Settled';
        const text = `*Supplier Financial Summary:*
*Name:* ${supplier.name}
*Outstanding Balance:* ${formatCurrency(Math.abs(outstanding))} (${statusText})
*Total Purchased:* ${formatCurrency(totalPurchased)}
*Total Paid:* ${formatCurrency(totalPaid)}

_Downloaded PDF statement downloaded locally to attach._`;

        const encodedText = encodeURIComponent(text);
        window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to share PDF statement', { id: 'pdf-share' });
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>;
  if (isError || !supplier) return <div className="card p-8 text-center text-red-500">Failed to load supplier.</div>;

  return (
    <div className="space-y-6">
      
      {/* ─── DESKTOP VIEW (Unchanged) ─── */}
      <div className="hidden md:block space-y-6">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/suppliers')} className="p-2 hover:bg-neutral-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">{supplier.name}</h1>
              <p className="text-sm text-neutral-500">Supplier since {supplier.created_at ? new Date(supplier.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="success"
              onClick={shareOnWhatsApp}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.966a9.9 9.9 0 0 0-6.98-2.879c-5.443 0-9.866 4.372-9.87 9.802 0 1.96.516 3.878 1.494 5.58l-1.019 3.72 3.841-1.008zm11.378-5.321c-.302-.15-.179-.226-.789-.916-.61-.69-1.28-1.447-1.393-1.577-.113-.13-.208-.282-.132-.433.075-.15.113-.226.226-.377.113-.15.226-.226.339-.452.113-.151.245-.316.113-.526-.13-.21-1.168-2.779-1.262-3.003-.092-.22-.187-.19-.257-.19-.068-.003-.146-.003-.224-.003-.078 0-.205.029-.313.146-.108.117-.412.399-.412.973 0 .574.422 1.128.48 1.206.058.078.814 1.229 1.973 1.723 1.159.493 1.159.329 1.369.31.21-.019.678-.276.772-.544.094-.268.094-.497.066-.544-.029-.047-.104-.078-.406-.228z"/>
              </svg>
              WhatsApp
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate(`/supplier-payments/new?supplier=${supplier.id}`)}
              icon={CreditCard}
              className="flex items-center gap-2"
            >
              Pay Supplier
            </Button>
          </div>
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2"><Phone className="w-4 h-4" /> Contact</div>
            <p className="font-semibold">{supplier.mobile || 'No mobile'}</p>
            {supplier.email && <p className="text-sm text-neutral-500">{supplier.email}</p>}
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2"><FileText className="w-4 h-4" /> GST / Category</div>
            <p className="font-semibold">{supplier.gst_number || 'Not registered'}</p>
            {supplier.category && <p className="text-sm text-primary-600 font-medium">{supplier.category.name}</p>}
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2"><MapPin className="w-4 h-4" /> Address</div>
            <p className="font-semibold text-sm">{supplier.addresses?.[0]?.address || 'No address'}</p>
            {supplier.addresses?.[0]?.city && <p className="text-xs text-neutral-500">{supplier.addresses[0].city}, {supplier.addresses[0].state} {supplier.addresses[0].pincode}</p>}
          </div>
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-5 bg-gradient-to-br from-cyan-50 to-white border-cyan-100">
            <div className="flex items-center gap-2 text-cyan-600 text-sm mb-2"><FileText className="w-4 h-4" /> Opening Balance</div>
            <p className="text-2xl font-bold text-cyan-700">{formatCurrency(openingBal)}</p>
            <p className="text-xs text-cyan-400 mt-1 capitalize">{openingType || 'N/A'}</p>
          </div>
          <div className="card p-5 bg-gradient-to-br from-blue-50 to-white border-blue-100">
            <div className="flex items-center gap-2 text-blue-600 text-sm mb-2"><ShoppingCart className="w-4 h-4" /> Total Purchased</div>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalPurchased)}</p>
            <p className="text-xs text-blue-400 mt-1">{purchases.length} purchase{purchases.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="card p-5 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-600 text-sm mb-2"><CreditCard className="w-4 h-4" /> Total Paid</div>
            <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-emerald-400 mt-1">{payments.filter((p: any) => p.status === 'confirmed').length} confirmed</p>
          </div>
          <div className={"card p-5 bg-gradient-to-br " + (outstanding > 0 ? 'from-rose-50 to-white border-rose-100' : 'from-green-50 to-white border-green-100')}>
            <div className="flex items-center gap-2 text-sm mb-2" style={{ color: outstanding > 0 ? '#e25c6a' : '#059669' }}>
              <TrendingUp className="w-4 h-4" /> Outstanding
            </div>
            <p className="text-2xl font-bold" style={{ color: outstanding > 0 ? '#e25c6a' : '#059669' }}>{formatCurrency(Math.abs(outstanding))}</p>
            <p className="text-xs mt-1" style={{ color: outstanding > 0 ? '#fda4af' : '#6ee7b7' }}>
              {outstanding > 0 ? 'You owe' : outstanding < 0 ? 'In advance' : 'Settled'}
            </p>
          </div>
        </div>
  
        {/* Transaction History - Combined Table */}
        <div className="card rounded-2xl">
          <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <ArrowDownLeft className="w-5 h-5 text-neutral-500" /> Transaction History
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex bg-neutral-100 rounded-xl p-1">
                {(['all', 'purchases', 'payments'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTxnFilter(t)}
                    className={'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ' + (txnFilter === t ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700')}
                  >
                    {t === 'all' ? 'All' : t === 'purchases' ? 'Purchases' : 'Payments'}
                  </button>
                ))}
              </div>
              <Select options={MONTHS} value={monthFilter} onChange={(v) => setMonthFilter(String(v))} placeholder="All Time" className="w-36" />
            </div>
          </div>
  
          {/* Merge purchases and payments into single timeline */}
          {(() => {
            const allTxns: any[] = [];
            purchases.forEach((p: any) => allTxns.push({ ...p, _type: 'purchase', _date: p.purchase_date, _ref: p.purchase_number, _amount: Number(p.total_amount) || 0, _paid: Number(p.paid_amount) || 0, _mode: null, _txnRef: null }));
            payments.forEach((p: any) => allTxns.push({ ...p, _type: 'payment', _date: p.payment_date, _ref: p.payment_number || ('#' + p.id), _amount: Number(p.amount) || 0, _paid: 0, _mode: p.payment_mode?.name, _txnRef: p.transaction_reference }));
  
            const filtered = txnFilter === 'all' ? allTxns : allTxns.filter((t: any) => t._type === (txnFilter === 'purchases' ? 'purchase' : 'payment'));
            filtered.sort((a: any, b: any) => new Date(b._date).getTime() - new Date(a._date).getTime());
  
            if (filtered.length === 0) return (
              <div className="p-12 text-center">
                <ArrowDownLeft className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500 font-medium">No transactions found</p>
                <p className="text-sm text-neutral-400 mt-1">Try changing the filter or date range.</p>
              </div>
            );
  
            return (
              <div className="overflow-visible">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-neutral-500">
                      <th className="px-5 py-3 font-medium w-12">Type</th>
                      <th className="px-5 py-3 font-medium">Reference #</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium">Details</th>
                      <th className="px-5 py-3 font-medium text-right">Amount</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((txn: any) => {
                      const isPurchase = txn._type === 'purchase';
                      return (
                        <tr
                          key={txn._type + '-' + txn.id}
                          onClick={() => isPurchase ? navigate('/purchases/' + txn.id) : null}
                          className={'border-b border-neutral-50 transition-colors ' + (isPurchase ? 'cursor-pointer hover:bg-red-50/50' : 'hover:bg-emerald-50/50')}
                        >
                          <td className="px-5 py-3">
                            <div className={'w-8 h-8 rounded-xl flex items-center justify-center ' + (isPurchase ? 'bg-red-50' : 'bg-emerald-50')}>
                              {isPurchase ? (
                                <ArrowDownLeft className="w-4 h-4 text-red-500" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <p className={'font-medium ' + (isPurchase ? 'text-neutral-900' : 'text-emerald-700')}>{txn._ref}</p>
                            <p className="text-xs text-neutral-400">{isPurchase ? 'Purchase' : 'Payment'}{txn._mode ? ' via ' + txn._mode : ''}</p>
                          </td>
                          <td className="px-5 py-3 text-neutral-600">{formatDate(txn._date)}</td>
                          <td className="px-5 py-3 text-neutral-500 text-sm">
                            {isPurchase ? (
                              <span>{txn.items?.length || 0} items | Paid: <span className="font-medium text-emerald-600">{formatCurrency(txn._paid)}</span></span>
                            ) : (
                              <span>{txn._txnRef || '-'}</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right font-mono font-semibold tabular-nums">
                            <span className={isPurchase ? 'text-red-600' : 'text-emerald-600'}>
                              {isPurchase ? '-' : '+'}{formatCurrency(txn._amount)}
                            </span>
                          </td>
                          <td className="px-5 py-3"><StatusBadge status={txn.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ─── PWA MOBILE VIEW (Optimized) ─── */}
      <div className="md:hidden space-y-4 pb-20">
        
        {/* Navigation & Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/suppliers')} className="p-2.5 bg-white text-neutral-600 border border-neutral-200 shadow-sm rounded-xl active:scale-95 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-neutral-800 tracking-tight leading-none">{supplier.name}</h1>
            <p className="text-[10px] text-neutral-400 font-semibold mt-1">
              Supplier since {supplier.created_at ? new Date(supplier.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' }) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Action Buttons in Grid */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={shareOnWhatsApp}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-100"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.966a9.9 9.9 0 0 0-6.98-2.879c-5.443 0-9.866 4.372-9.87 9.802 0 1.96.516 3.878 1.494 5.58l-1.019 3.72 3.841-1.008zm11.378-5.321c-.302-.15-.179-.226-.789-.916-.61-.69-1.28-1.447-1.393-1.577-.113-.13-.208-.282-.132-.433.075-.15.113-.226.226-.377.113-.15.226-.226.339-.452.113-.151.245-.316.113-.526-.13-.21-1.168-2.779-1.262-3.003-.092-.22-.187-.19-.257-.19-.068-.003-.146-.003-.224-.003-.078 0-.205.029-.313.146-.108.117-.412.399-.412.973 0 .574.422 1.128.48 1.206.058.078.814 1.229 1.973 1.723 1.159.493 1.159.329 1.369.31.21-.019.678-.276.772-.544.094-.268.094-.497.066-.544-.029-.047-.104-.078-.406-.228z"/>
              </svg>
              WhatsApp
            </button>
            <button
              onClick={() => navigate(`/supplier-payments/new?supplier=${supplier.id}`)}
              className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-100"
            >
              <CreditCard className="w-4 h-4 shrink-0" /> Pay Supplier
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setModalOpen(true)}
              className="py-2.5 px-3 bg-white text-neutral-700 border border-neutral-200 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Profile
            </button>
            <button
              onClick={handleDelete}
              className="py-2.5 px-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Supplier
            </button>
          </div>
        </div>

        {/* Financial metrics (Double-Bezel Card) */}
        <div className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm">
          <div className="rounded-[20px] bg-white p-4 space-y-4 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
            
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Financial Overview</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-cyan-50/50 border border-cyan-100/60 rounded-xl">
                <span className="text-[8px] uppercase font-extrabold text-cyan-600 block tracking-wider">Opening Bal</span>
                <span className="text-sm font-black text-cyan-700 tabular-nums block mt-1">{formatCurrency(openingBal)}</span>
                <span className="text-[8px] text-cyan-500 font-bold uppercase mt-1 block">{openingType || 'N/A'}</span>
              </div>
              <div className="p-3 bg-blue-50/50 border border-blue-100/60 rounded-xl">
                <span className="text-[8px] uppercase font-extrabold text-blue-600 block tracking-wider">Purchased</span>
                <span className="text-sm font-black text-blue-700 tabular-nums block mt-1">{formatCurrency(totalPurchased)}</span>
                <span className="text-[8px] text-blue-500 font-bold uppercase mt-1 block">{purchases.length} bills</span>
              </div>
              <div className="p-3 bg-emerald-50/50 border border-emerald-100/60 rounded-xl">
                <span className="text-[8px] uppercase font-extrabold text-emerald-600 block tracking-wider">Total Paid</span>
                <span className="text-sm font-black text-emerald-700 tabular-nums block mt-1">{formatCurrency(totalPaid)}</span>
                <span className="text-[8px] text-emerald-500 font-bold uppercase mt-1 block">
                  {payments.filter((p: any) => p.status === 'confirmed').length} paid
                </span>
              </div>
              <div className="p-3 border rounded-xl bg-rose-50/50 border-rose-100/60">
                <span className="text-[8px] uppercase font-extrabold block tracking-wider text-rose-600">Outstanding</span>
                <span className="text-sm font-black tabular-nums block mt-1 text-rose-700">
                  {formatCurrency(Math.abs(outstanding))}
                </span>
                <span className="text-[8px] font-bold uppercase mt-1 block text-rose-500">
                  {outstanding > 0 ? 'You owe' : outstanding < 0 ? 'Advance' : 'Settled'}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Transaction History (Double-Bezel List) */}
        <div className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm">
          <div className="rounded-[20px] bg-white p-4 space-y-4 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
            
            <div className="flex flex-col gap-2 pb-2.5 border-b border-neutral-50">
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Transaction History</h2>
              <div className="flex items-center justify-between gap-2 mt-1">
                <div className="flex bg-neutral-100/70 border border-neutral-200/40 rounded-xl p-0.5">
                  {(['all', 'purchases', 'payments'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTxnFilter(t)}
                      className={'px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors ' + (txnFilter === t ? 'bg-white text-neutral-800 shadow-sm' : 'text-neutral-500')}
                    >
                      {t === 'all' ? 'All' : t === 'purchases' ? 'Purchs' : 'Pmnts'}
                    </button>
                  ))}
                </div>
                <Select options={MONTHS} value={monthFilter} onChange={(v) => setMonthFilter(String(v))} placeholder="All Time" className="!py-1 !px-2 !h-[28px] !w-[96px] text-[10px] rounded-lg bg-neutral-50 border border-neutral-200" />
              </div>
            </div>

            {/* Combined Timeline Cards */}
            {(() => {
              const allTxns: any[] = [];
              purchases.forEach((p: any) => allTxns.push({ ...p, _type: 'purchase', _date: p.purchase_date, _ref: p.purchase_number, _amount: Number(p.total_amount) || 0, _paid: Number(p.paid_amount) || 0, _mode: null, _txnRef: null }));
              payments.forEach((p: any) => allTxns.push({ ...p, _type: 'payment', _date: p.payment_date, _ref: p.payment_number || ('#' + p.id), _amount: Number(p.amount) || 0, _paid: 0, _mode: p.payment_mode?.name, _txnRef: p.transaction_reference }));

              const filtered = txnFilter === 'all' ? allTxns : allTxns.filter((t: any) => t._type === (txnFilter === 'purchases' ? 'purchase' : 'payment'));
              filtered.sort((a: any, b: any) => new Date(b._date).getTime() - new Date(a._date).getTime());

              if (filtered.length === 0) return (
                <div className="py-8 text-center">
                  <p className="text-neutral-400 font-semibold text-xs">No transactions found</p>
                </div>
              );

              return (
                <div className="space-y-2.5">
                  {filtered.map((txn: any) => {
                    const isPurchase = txn._type === 'purchase';
                    return (
                      <div
                        key={txn._type + '-' + txn.id}
                        onClick={() => isPurchase ? navigate('/purchases/' + txn.id) : null}
                        className={`p-3 rounded-2xl border transition-colors flex items-center justify-between gap-3 text-xs ${isPurchase ? 'border-red-100 bg-red-50/20 active:bg-red-50/40 cursor-pointer' : 'border-emerald-100 bg-emerald-50/20'}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isPurchase ? 'bg-red-50' : 'bg-emerald-50'}`}>
                            {isPurchase ? (
                              <ArrowDownLeft className="w-4 h-4 text-red-500" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className={`font-bold truncate ${isPurchase ? 'text-neutral-800' : 'text-emerald-700'}`}>{txn._ref}</p>
                            <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
                              {formatDate(txn._date)} {txn._mode ? '• ' + txn._mode : ''}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className={`font-black tabular-nums ${isPurchase ? 'text-red-600' : 'text-emerald-600'}`}>
                            {isPurchase ? '-' : '+'}{formatCurrency(txn._amount)}
                          </p>
                          <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-wider mt-0.5">{txn.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

          </div>
        </div>

        {/* Contact & Business Profile (Double-Bezel Card) */}
        <div className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm">
          <div className="rounded-[20px] bg-white p-4 space-y-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,1)] text-xs">
            
            <div 
              onClick={() => supplier.mobile && (window.location.href = `tel:${supplier.mobile}`)}
              className="flex items-center justify-between pb-3 border-b border-neutral-50 cursor-pointer active:bg-neutral-50 transition-colors rounded-lg p-1 -m-1"
            >
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Contact</span>
                  <p className="font-bold text-indigo-650 text-xs mt-0.5">
                    {supplier.mobile || 'No mobile'}
                  </p>
                  {supplier.email && <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">{supplier.email}</p>}
                </div>
              </div>
              
              {supplier.mobile && (
                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-650 shrink-0 shadow-sm active:scale-90 transition-transform">
                  <Phone className="w-4 h-4 fill-indigo-100" />
                </div>
              )}
            </div>

            <div className="flex items-start gap-2.5 pb-3 border-b border-neutral-50">
              <FileText className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">GST & Category</span>
                <p className="font-bold text-neutral-800 text-xs mt-0.5">{supplier.gst_number || 'Not registered'}</p>
                {supplier.category && <p className="text-[10px] text-indigo-600 font-bold mt-0.5">{supplier.category.name}</p>}
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Address</span>
                <p className="font-bold text-neutral-700 text-[11px] leading-relaxed mt-0.5">
                  {supplier.addresses?.[0]?.address || 'No address'}
                </p>
                {supplier.addresses?.[0]?.city && (
                  <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
                    {supplier.addresses[0].city}, {supplier.addresses[0].state} - {supplier.addresses[0].pincode}
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      <MasterFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Edit Supplier"
        fields={dynamicFields}
        initialData={initialDataForEdit}
        onSave={handleSave}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['suppliers', Number(id)] });
          queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        }}
      />
    </div>
  );
}
