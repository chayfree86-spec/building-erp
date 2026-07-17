import { useQuery } from '@tanstack/react-query';
import { purchasesApi, salesApi, stockApi, paymentsApi, returnsApi, adjustmentsApi, transfersApi } from '@/services/api-endpoints';

// Helper: extract data from either paginated or plain response
function extractItems(response: any) {
  const d = response?.data;
  if (!d) return [];
  // Paginated: { current_page, data: [...], ... }
  if (d.data && Array.isArray(d.data)) return d.data;
  // Plain array or object
  return Array.isArray(d) ? d : [];
}

function extractPagination(response: any) {
  const d = response?.data;
  if (d && d.data && Array.isArray(d.data)) {
    return { currentPage: d.current_page, lastPage: d.last_page, total: d.total, perPage: d.per_page };
  }
  return null;
}

// ─── Purchases ───
export function usePurchases(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['purchases', params],
    queryFn: async () => { const { data } = await purchasesApi.list(params); return { items: extractItems(data), pagination: extractPagination(data) }; },
  });
}

export function usePurchase(id: number) {
  return useQuery({
    queryKey: ['purchases', id],
    queryFn: async () => { const { data } = await purchasesApi.get(id); return data.data; },
    enabled: !!id,
  });
}

// ─── Sales / Invoices ───
export function useInvoices(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: async () => { const { data } = await salesApi.list(params); return { items: extractItems(data), pagination: extractPagination(data) }; },
  });
}

export function useInvoice(id: number) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: async () => { const { data } = await salesApi.get(id); return data.data; },
    enabled: !!id,
  });
}

// ─── Stock ───
export function useStock(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['stock', params],
    queryFn: async () => { const { data } = await stockApi.list(params); return { items: extractItems(data), pagination: extractPagination(data) }; },
  });
}

// ─── Payments ───
export function useCustomerPayments(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['customer-payments', params],
    queryFn: async () => { const { data } = await paymentsApi.customerList(params); return { items: extractItems(data), pagination: extractPagination(data) }; },
  });
}

// ─── Returns ───
export function usePurchaseReturns(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['purchase-returns', params],
    queryFn: async () => { const { data } = await returnsApi.purchaseList(params); return { items: extractItems(data), pagination: extractPagination(data) }; },
  });
}

export function useSalesReturns(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['sales-returns', params],
    queryFn: async () => { const { data } = await returnsApi.salesList(params); return { items: extractItems(data), pagination: extractPagination(data) }; },
  });
}

// ─── Adjustments ───
export function useAdjustments(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['adjustments', params],
    queryFn: async () => { const { data } = await adjustmentsApi.list(params); return { items: extractItems(data), pagination: extractPagination(data) }; },
  });
}

// ─── Transfers ───
export function useTransfers(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['transfers', params],
    queryFn: async () => { const { data } = await transfersApi.list(params); return { items: extractItems(data), pagination: extractPagination(data) }; },
  });
}

// ─── Supplier Payments ───
export function useSupplierPayments(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['supplier-payments', params],
    queryFn: async () => { const { data } = await paymentsApi.supplierList(params); return { items: extractItems(data), pagination: extractPagination(data) }; },
  });
}
