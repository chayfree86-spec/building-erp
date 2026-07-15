// API Types — Building ERP

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors: Record<string, string[]> | null;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: { url: string | null; label: string; active: boolean }[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface User {
  id: number;
  name: string;
  mobile: string;
  email: string | null;
  status: 'active' | 'inactive';
  last_login_at: string | null;
  roles?: Role[];
  stores?: Store[];
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_system: boolean;
  status: 'active' | 'inactive';
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  slug: string;
  module: string;
  action: string;
  description: string | null;
}

export interface Store {
  id: number;
  name: string;
  code: string;
  mobile: string | null;
  email: string | null;
  gst_number: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  invoice_prefix: string | null;
  status: 'active' | 'inactive';
  created_by: number;
}

export interface Unit {
  id: number;
  name: string;
  short_name: string;
  decimal_places: number;
  allow_fraction: boolean;
  status: 'active' | 'inactive';
}

export interface Category {
  id: number;
  name: string;
  unit_id: number | null;
  description: string | null;
  status: 'active' | 'inactive';
  unit?: Unit;
}

export interface Brand {
  id: number;
  name: string;
  description: string | null;
  status: 'active' | 'inactive';
}

export interface GstRate {
  id: number;
  name: string;
  rate: number;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  description: string | null;
  status: 'active' | 'inactive';
}

export interface Product {
  id: number;
  category_id: number | null;
  unit_id: number;
  brand_id: number | null;
  gst_rate_id: number;
  name: string;
  sku: string;
  barcode: string | null;
  hsn_code: string | null;
  description: string | null;
  minimum_stock: number;
  status: 'active' | 'inactive';
  category?: Category;
  unit?: Unit;
  brand?: Brand;
  gstRate?: GstRate;
  barcodes?: ProductBarcode[];
}

export interface ProductBarcode {
  id: number;
  product_id: number;
  barcode: string;
}

export interface Customer {
  id: number;
  name: string;
  mobile: string | null;
  normalized_mobile: string | null;
  alternate_mobile: string | null;
  email: string | null;
  gst_number: string | null;
  opening_balance: number;
  opening_balance_type: 'debit' | 'credit';
  credit_limit: number;
  status: 'active' | 'inactive';
  addresses?: CustomerAddress[];
}

export interface CustomerAddress {
  id: number;
  customer_id: number;
  address: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  is_default: boolean;
}

export interface Supplier {
  id: number;
  name: string;
  mobile: string | null;
  normalized_mobile: string | null;
  alternate_mobile: string | null;
  email: string | null;
  gst_number: string | null;
  opening_balance: number;
  opening_balance_type: 'debit' | 'credit';
  status: 'active' | 'inactive';
  addresses?: SupplierAddress[];
}

export interface SupplierAddress {
  id: number;
  supplier_id: number;
  address: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  is_default: boolean;
}

export interface PaymentMode {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
}

export type PurchaseStatus = 'draft' | 'submitted' | 'approved' | 'confirmed' | 'cancelled' | 'paid' | 'partially_paid';
export type InvoiceStatus = 'draft' | 'confirmed' | 'cancelled' | 'reversed';
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid';
export type TransferStatus = 'draft' | 'submitted' | 'approved' | 'dispatched' | 'received' | 'cancelled';
export type AdjustmentType = 'addition' | 'deduction' | 'damage';
export type AdjustmentStatus = 'draft' | 'submitted' | 'approved' | 'confirmed' | 'cancelled';
