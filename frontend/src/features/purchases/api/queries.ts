import { useQuery } from '@tanstack/react-query';
import { purchasesApi, salesApi, stockApi, paymentsApi, returnsApi, adjustmentsApi, transfersApi } from '@/services/api-endpoints';
import type { Purchase, SalesInvoice, CustomerPayment, PurchaseReturn, StockAdjustment, StockTransfer } from '@/types';

// ─── Purchases ───
export function usePurchases(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['purchases', params],
    queryFn: async () => { const { data } = await purchasesApi.list(params); return data; },
  });
}

export function usePurchase(id: number) {
  return useQuery({
    queryKey: ['purchases', id],
    queryFn: async () => { const { data } = await purchasesApi.get(id); return data.data as Purchase; },
    enabled: !!id,
  });
}

// ─── Sales / Invoices ───
export function useInvoices(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: async () => { const { data } = await salesApi.list(params); return data; },
  });
}

export function useInvoice(id: number) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: async () => { const { data } = await salesApi.get(id); return data.data as SalesInvoice; },
    enabled: !!id,
  });
}

// ─── Stock ───
export function useStock(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['stock', params],
    queryFn: async () => { const { data } = await stockApi.list(params); return data; },
  });
}

// ─── Payments ───
export function useCustomerPayments(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['customer-payments', params],
    queryFn: async () => { const { data } = await paymentsApi.customerList(params); return data; },
  });
}

// ─── Returns ───
export function usePurchaseReturns(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['purchase-returns', params],
    queryFn: async () => { const { data } = await returnsApi.purchaseList(params); return data; },
  });
}

export function useSalesReturns(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['sales-returns', params],
    queryFn: async () => { const { data } = await returnsApi.salesList(params); return data; },
  });
}

// ─── Adjustments ───
export function useAdjustments(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['adjustments', params],
    queryFn: async () => { const { data } = await adjustmentsApi.list(params); return data; },
  });
}

// ─── Transfers ───
export function useTransfers(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['transfers', params],
    queryFn: async () => { const { data } = await transfersApi.list(params); return data; },
  });
}
