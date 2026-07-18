import { useQuery } from '@tanstack/react-query';
import { productsApi, categoriesApi, unitsApi, brandsApi, gstRatesApi, usersApi } from '@/services/api-endpoints';
import type { Product, Category, Unit, Brand, GstRate, User } from '@/types';

export function useProducts(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const { data } = await productsApi.list(params);
      return data.data as Product[];
    },
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const { data } = await productsApi.get(id);
      return data.data as Product;
    },
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await categoriesApi.list();
      return data.data as Category[];
    },
  });
}

export function useUnits() {
  return useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data } = await unitsApi.list();
      return data.data as Unit[];
    },
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data } = await brandsApi.list();
      return data.data as Brand[];
    },
  });
}

export function useGstRates() {
  return useQuery({
    queryKey: ['gstRates'],
    queryFn: async () => {
      const { data } = await gstRatesApi.list();
      return data.data as GstRate[];
    },
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await usersApi.list();
      const raw = data.data;
      return Array.isArray(raw) ? raw : (raw?.data || []) as User[];
    },
  });
}
