import apiClient from '@/services/api';
import type { ApiResponse, User, Store, PaginatedResponse } from '@/types';

export const authApi = {
  login: (login: string, password: string) =>
    apiClient.post<ApiResponse<{ user: User; token: string }>>('/auth/login', { login, password }),

  logout: () => apiClient.post<ApiResponse<null>>('/auth/logout'),

  me: () => apiClient.get<ApiResponse<User>>('/auth/me'),

  myStores: () => apiClient.get<ApiResponse<Store[]>>('/auth/stores'),
};

export const storesApi = {
  list: () => apiClient.get<ApiResponse<Store[]>>('/stores'),
  get: (id: number) => apiClient.get<ApiResponse<Store>>(`/stores/${id}`),
  create: (data: Partial<Store>) => apiClient.post<ApiResponse<Store>>('/stores', data),
  update: (id: number, data: Partial<Store>) => apiClient.put<ApiResponse<Store>>(`/stores/${id}`, data),
  remove: (id: number) => apiClient.delete<ApiResponse<null>>(`/stores/${id}`),
};

export const unitsApi = {
  list: () => apiClient.get<ApiResponse<import('@/types').Unit[]>>('/units'),
  create: (d: any) => apiClient.post('/units', d),
  get: (id: number) => apiClient.get(`/units/${id}`),
  update: (id: number, d: any) => apiClient.put(`/units/${id}`, d),
  remove: (id: number) => apiClient.delete(`/units/${id}`),
};

export const categoriesApi = {
  list: () => apiClient.get<ApiResponse<import('@/types').Category[]>>('/categories'),
  create: (d: any) => apiClient.post('/categories', d),
  get: (id: number) => apiClient.get(`/categories/${id}`),
  update: (id: number, d: any) => apiClient.put(`/categories/${id}`, d),
  remove: (id: number) => apiClient.delete(`/categories/${id}`),
};

export const brandsApi = {
  list: () => apiClient.get('/brands'),
  create: (d: any) => apiClient.post('/brands', d),
  get: (id: number) => apiClient.get(`/brands/${id}`),
  update: (id: number, d: any) => apiClient.put(`/brands/${id}`, d),
  remove: (id: number) => apiClient.delete(`/brands/${id}`),
};

export const gstRatesApi = {
  list: () => apiClient.get('/gst-rates'),
  create: (d: any) => apiClient.post('/gst-rates', d),
  get: (id: number) => apiClient.get(`/gst-rates/${id}`),
  update: (id: number, d: any) => apiClient.put(`/gst-rates/${id}`, d),
  remove: (id: number) => apiClient.delete(`/gst-rates/${id}`),
};

export const productsApi = {
  list: (params?: any) => apiClient.get('/products', { params }),
  create: (d: any) => apiClient.post('/products', d),
  get: (id: number) => apiClient.get(`/products/${id}`),
  update: (id: number, d: any) => apiClient.put(`/products/${id}`, d),
  remove: (id: number) => apiClient.delete(`/products/${id}`),
};

export const customersApi = {
  list: (params?: any) => apiClient.get('/customers', { params }),
  create: (d: any) => apiClient.post('/customers', d),
  get: (id: number) => apiClient.get(`/customers/${id}`),
  update: (id: number, d: any) => apiClient.put(`/customers/${id}`, d),
  remove: (id: number) => apiClient.delete(`/customers/${id}`),
};

export const suppliersApi = {
  list: (params?: any) => apiClient.get('/suppliers', { params }),
  create: (d: any) => apiClient.post('/suppliers', d),
  get: (id: number) => apiClient.get(`/suppliers/${id}`),
  update: (id: number, d: any) => apiClient.put(`/suppliers/${id}`, d),
  remove: (id: number) => apiClient.delete(`/suppliers/${id}`),
};

export const paymentModesApi = {
  list: () => apiClient.get('/payment-modes'),
  create: (d: any) => apiClient.post('/payment-modes', d),
  update: (id: number, d: any) => apiClient.put(`/payment-modes/${id}`, d),
  remove: (id: number) => apiClient.delete(`/payment-modes/${id}`),
};

export const purchasesApi = {
  list: (params?: any) => apiClient.get('/purchases', { params }),
  create: (d: any) => apiClient.post('/purchases', d),
  get: (id: number) => apiClient.get(`/purchases/${id}`),
  update: (id: number, d: any) => apiClient.put(`/purchases/${id}`, d),
  remove: (id: number) => apiClient.delete(`/purchases/${id}`),
  submit: (id: number) => apiClient.post(`/purchases/${id}/submit`),
  approve: (id: number) => apiClient.post(`/purchases/${id}/approve`),
  confirm: (id: number) => apiClient.post(`/purchases/${id}/confirm`),
  cancel: (id: number, reason?: string) => apiClient.post(`/purchases/${id}/cancel`, { reason }),
};

export const salesApi = {
  list: (params?: any) => apiClient.get('/invoices', { params }),
  create: (d: any) => apiClient.post('/invoices', d),
  get: (id: number) => apiClient.get(`/invoices/${id}`),
  update: (id: number, d: any) => apiClient.put(`/invoices/${id}`, d),
  remove: (id: number) => apiClient.delete(`/invoices/${id}`),
  confirm: (id: number) => apiClient.post(`/invoices/${id}/confirm`),
  cancel: (id: number, reason?: string) => apiClient.post(`/invoices/${id}/cancel`, { reason }),
  reverse: (id: number, reason?: string) => apiClient.post(`/invoices/${id}/reverse`, { reason }),
};

export const paymentsApi = {
  customerList: (params?: any) => apiClient.get('/customer-payments', { params }),
  customerCreate: (d: any) => apiClient.post('/customer-payments', d),
  customerConfirm: (id: number, allocations: any[]) => apiClient.post(`/customer-payments/${id}/confirm`, { allocations }),
  customerReverse: (id: number, reason?: string) => apiClient.post(`/customer-payments/${id}/reverse`, { reason }),
  supplierList: (params?: any) => apiClient.get('/supplier-payments', { params }),
  supplierCreate: (d: any) => apiClient.post('/supplier-payments', d),
  supplierConfirm: (id: number, allocations: any[]) => apiClient.post(`/supplier-payments/${id}/confirm`, { allocations }),
  supplierReverse: (id: number, reason?: string) => apiClient.post(`/supplier-payments/${id}/reverse`, { reason }),
};

export const stockApi = {
  list: (params?: any) => apiClient.get('/stock', { params }),
  batchWise: (params?: any) => apiClient.get('/stock/batch-wise', { params }),
  productStock: (productId: number, params?: any) => apiClient.get(`/stock/product/${productId}`, { params }),
};

export const adjustmentsApi = {
  list: (params?: any) => apiClient.get('/stock-adjustments', { params }),
  create: (d: any) => apiClient.post('/stock-adjustments', d),
  get: (id: number) => apiClient.get(`/stock-adjustments/${id}`),
  update: (id: number, d: any) => apiClient.put(`/stock-adjustments/${id}`, d),
  remove: (id: number) => apiClient.delete(`/stock-adjustments/${id}`),
  submit: (id: number) => apiClient.post(`/stock-adjustments/${id}/submit`),
  approve: (id: number) => apiClient.post(`/stock-adjustments/${id}/approve`),
  confirm: (id: number) => apiClient.post(`/stock-adjustments/${id}/confirm`),
};

export const transfersApi = {
  list: (params?: any) => apiClient.get('/stock-transfers', { params }),
  create: (d: any) => apiClient.post('/stock-transfers', d),
  get: (id: number) => apiClient.get(`/stock-transfers/${id}`),
  update: (id: number, d: any) => apiClient.put(`/stock-transfers/${id}`, d),
  remove: (id: number) => apiClient.delete(`/stock-transfers/${id}`),
  submit: (id: number) => apiClient.post(`/stock-transfers/${id}/submit`),
  approve: (id: number) => apiClient.post(`/stock-transfers/${id}/approve`),
  dispatch: (id: number) => apiClient.post(`/stock-transfers/${id}/dispatch`),
  receive: (id: number) => apiClient.post(`/stock-transfers/${id}/receive`),
};

export const ledgersApi = {
  customer: (params?: any) => apiClient.get('/customer-ledgers', { params }),
  supplier: (params?: any) => apiClient.get('/supplier-ledgers', { params }),
  inventory: (params?: any) => apiClient.get('/inventory-ledgers', { params }),
};

export const reportsApi = {
  stock: (params?: any) => apiClient.get('/reports/stock', { params }),
  sales: (params?: any) => apiClient.get('/reports/sales', { params }),
  purchases: (params?: any) => apiClient.get('/reports/purchases', { params }),
  profit: (params?: any) => apiClient.get('/reports/profit', { params }),
  gst: (params?: any) => apiClient.get('/reports/gst', { params }),
  customerOutstanding: (params?: any) => apiClient.get('/reports/customer-outstanding', { params }),
  supplierOutstanding: (params?: any) => apiClient.get('/reports/supplier-outstanding', { params }),
  lowStock: (params?: any) => apiClient.get('/reports/low-stock', { params }),
  dailySales: (params?: any) => apiClient.get('/reports/daily-sales', { params }),
};

export const usersApi = {
  list: (params?: any) => apiClient.get('/users', { params }),
  create: (d: any) => apiClient.post('/users', d),
  get: (id: number) => apiClient.get(`/users/${id}`),
  update: (id: number, d: any) => apiClient.put(`/users/${id}`, d),
  remove: (id: number) => apiClient.delete(`/users/${id}`),
};

export const rolesApi = {
  list: () => apiClient.get('/roles'),
  create: (d: any) => apiClient.post('/roles', d),
  get: (id: number) => apiClient.get(`/roles/${id}`),
  update: (id: number, d: any) => apiClient.put(`/roles/${id}`, d),
  remove: (id: number) => apiClient.delete(`/roles/${id}`),
};

export const permissionsApi = {
  list: () => apiClient.get('/permissions'),
  create: (d: any) => apiClient.post('/permissions', d),
  update: (id: number, d: any) => apiClient.put(`/permissions/${id}`, d),
  remove: (id: number) => apiClient.delete(`/permissions/${id}`),
};

export const auditApi = {
  list: (params?: any) => apiClient.get('/audit-logs', { params }),
};

export const settingsApi = {
  get: () => apiClient.get('/settings'),
  update: (settings: any[]) => apiClient.put('/settings', { settings }),
};

export const returnsApi = {
  purchaseList: (params?: any) => apiClient.get('/purchase-returns', { params }),
  purchaseCreate: (d: any) => apiClient.post('/purchase-returns', d),
  purchaseConfirm: (id: number) => apiClient.post(`/purchase-returns/${id}/confirm`),
  purchaseCancel: (id: number, reason?: string) => apiClient.post(`/purchase-returns/${id}/cancel`, { reason }),
  salesList: (params?: any) => apiClient.get('/sales-returns', { params }),
  salesCreate: (d: any) => apiClient.post('/sales-returns', d),
  salesConfirm: (id: number) => apiClient.post(`/sales-returns/${id}/confirm`),
  salesCancel: (id: number, reason?: string) => apiClient.post(`/sales-returns/${id}/cancel`, { reason }),
};
