export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  STORES: '/stores',
  UNITS: '/units',
  CATEGORIES: '/categories',
  BRANDS: '/brands',
  GST_RATES: '/gst-rates',
  PRODUCTS: '/products',
  CUSTOMERS: '/customers',
  SUPPLIERS: '/suppliers',
  PAYMENT_MODES: '/payment-modes',
  PURCHASES: '/purchases',
  PURCHASE_NEW: '/purchases/new',
  PURCHASE_DETAIL: '/purchases/:id',
  PURCHASE_RETURNS: '/purchase-returns',
  INVOICES: '/invoices',
  INVOICE_NEW: '/invoices/new',
  INVOICE_DETAIL: '/invoices/:id',
  SALES_RETURNS: '/sales-returns',
  CUSTOMER_PAYMENTS: '/customer-payments',
  SUPPLIER_PAYMENTS: '/supplier-payments',
  STOCK: '/stock',
  STOCK_BATCH: '/stock/batch',
  STOCK_ADJUSTMENTS: '/stock-adjustments',
  STOCK_TRANSFERS: '/stock-transfers',
  LEDGER_CUSTOMER: '/ledgers/customer',
  LEDGER_SUPPLIER: '/ledgers/supplier',
  LEDGER_INVENTORY: '/ledgers/inventory',
  REPORTS: '/reports',
  USERS: '/users',
  ROLES: '/roles',
  PERMISSIONS: '/permissions',
  AUDIT_LOGS: '/audit-logs',
  SETTINGS: '/settings',
  PROFILE: '/profile',
} as const;

export const STORE_HEADER_KEY = 'X-Store-Id';

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;
