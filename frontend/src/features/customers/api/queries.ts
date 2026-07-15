import { useQuery } from '@tanstack/react-query';
import { customersApi, suppliersApi } from '@/services/api-endpoints';
import type { Customer, Supplier } from '@/types';

export function useCustomers(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: async () => {
      const { data } = await customersApi.list(params);
      return data;
    },
  });
}

export function useCustomer(id: number) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: async () => {
      const { data } = await customersApi.get(id);
      return data.data as Customer;
    },
    enabled: !!id,
  });
}

export function useSuppliers(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['suppliers', params],
    queryFn: async () => {
      const { data } = await suppliersApi.list(params);
      return data;
    },
  });
}

export function useSupplier(id: number) {
  return useQuery({
    queryKey: ['suppliers', id],
    queryFn: async () => {
      const { data } = await suppliersApi.get(id);
      return data.data as Supplier;
    },
    enabled: !!id,
  });
}
