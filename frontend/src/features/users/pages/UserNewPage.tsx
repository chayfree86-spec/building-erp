import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui/Button';
import { usersApi, rolesApi, storesApi } from '@/services/api-endpoints';
import { handleFormKeyDown } from '@/utils/formNavigation';
import type { Role, Store } from '@/types';

const formSchema = (isEdit: boolean) => z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  mobile: z.string().min(1, 'Mobile is required').max(15),
  password: isEdit ? z.string().optional().or(z.literal('')) : z.string().min(6, 'Min 6 characters'),
  pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits').optional().or(z.literal('')),
  role_ids: z.array(z.number()).min(1, 'At least 1 role required'),
  store_ids: z.array(z.number()).min(1, 'At least 1 store required'),
});

type FormData = {
  name: string;
  email: string;
  mobile: string;
  password?: string;
  pin?: string;
  role_ids: number[];
  store_ids: number[];
};

export function UserNewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const userId = Number(id);
  const queryClient = useQueryClient();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema(isEdit)) as Resolver<FormData>,
    defaultValues: { name: '', email: '', mobile: '', password: '', pin: '', role_ids: [], store_ids: [] },
  });

  const { data: userData } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const { data } = await usersApi.get(userId);
      return data.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (userData) {
      reset({
        name: userData.name || '',
        email: userData.email || '',
        mobile: userData.mobile || '',
        password: '',
        pin: '',
        role_ids: Array.isArray(userData.roles) ? userData.roles.map((r: any) => r.id) : [],
        store_ids: Array.isArray(userData.stores) ? userData.stores.map((s: any) => s.id) : [],
      });
    }
  }, [userData, reset]);

  const { data: rolesData } = useQuery({
    queryKey: ['roles-list'],
    queryFn: async () => { const { data } = await rolesApi.list(); return data.data || []; },
  });
  const { data: storesData } = useQuery({
    queryKey: ['stores-list'],
    queryFn: async () => { const { data } = await storesApi.list(); return data.data || []; },
  });

  const roles: Role[] = Array.isArray(rolesData) ? rolesData : [];
  const stores: Store[] = Array.isArray(storesData) ? storesData : [];

  const saveMutation = useMutation({
    mutationFn: (payload: any) => isEdit ? usersApi.update(userId, payload) : usersApi.create(payload),
    onSuccess: () => {
      toast.success(isEdit ? 'User updated!' : 'User created!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const onSubmit = (data: FormData) => {
    saveMutation.mutate({
      name: data.name,
      email: data.email || undefined,
      mobile: data.mobile,
      password: data.password || undefined,
      pin: data.pin || undefined,
      role_ids: data.role_ids,
      store_ids: data.store_ids,
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/users')} className="p-2 hover:bg-neutral-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div><h1 className="text-2xl font-bold text-neutral-900">{isEdit ? 'Edit User' : 'New User'}</h1><p className="text-sm text-neutral-500">{isEdit ? 'Edit system user details' : 'Create a new system user account'}</p></div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleFormKeyDown} className="card p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center"><UserPlus className="w-4 h-4 text-green-600" /></div>
          <h2 className="text-base font-semibold text-neutral-900">User Details</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="label">Name <span className="text-red-500">*</span></label><input {...register('name')} className="input-field" placeholder="Full name" />{errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}</div>
          <div><label className="label">Mobile <span className="text-red-500">*</span></label><input {...register('mobile')} className="input-field" placeholder="Mobile number" />{errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile.message}</p>}</div>
          <div><label className="label">Email</label><input {...register('email')} className="input-field" placeholder="Email address" />{errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}</div>
          <div><label className="label">Password {!isEdit && <span className="text-red-500">*</span>}</label><input {...register('password')} type="password" className="input-field" placeholder={isEdit ? 'Leave blank to keep current' : 'Min 6 characters'} />{errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}</div>
          <div>
            <label className="label">4-Digit PIN</label>
            <input 
              {...register('pin')} 
              className="input-field" 
              placeholder={isEdit ? 'Leave blank to keep current' : '4-digit PIN'} 
              maxLength={4} 
              inputMode="numeric"
              pattern="[0-9]*"
              onChange={(e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
                setValue('pin', e.target.value);
              }}
            />
            {errors.pin && <p className="text-red-500 text-xs mt-1">{errors.pin.message}</p>}
          </div>
        </div>
        <div><label className="label">Roles <span className="text-red-500">*</span></label>
          <div className="flex flex-wrap gap-2">
            {roles.map(r => {
              const selected = (watch('role_ids') || []).includes(r.id);
              return <button key={r.id} type="button" onClick={() => { const ids = watch('role_ids') || []; setValue('role_ids', selected ? ids.filter(id => id !== r.id) : [...ids, r.id]); }} className={`px-3 py-1.5 rounded-lg text-sm border ${selected ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>{r.name}</button>;
            })}
          </div>
          {errors.role_ids && <p className="text-red-500 text-xs mt-1">{errors.role_ids.message}</p>}
        </div>
        <div><label className="label">Stores <span className="text-red-500">*</span></label>
          <div className="flex flex-wrap gap-2">
            {stores.map(s => {
              const selected = (watch('store_ids') || []).includes(s.id);
              return <button key={s.id} type="button" onClick={() => { const ids = watch('store_ids') || []; setValue('store_ids', selected ? ids.filter(id => id !== s.id) : [...ids, s.id]); }} className={`px-3 py-1.5 rounded-lg text-sm border ${selected ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>{s.name}</button>;
            })}
          </div>
          {errors.store_ids && <p className="text-red-500 text-xs mt-1">{errors.store_ids.message}</p>}
        </div>
        <div className="flex items-center gap-3 justify-end pt-4 border-t">
          <Button type="button" variant="ghost" onClick={() => navigate('/users')}>Cancel</Button>
          <Button type="submit" disabled={saveMutation.isPending} icon={saveMutation.isPending ? Loader2 : undefined} variant="primary">{saveMutation.isPending ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create User')}</Button>
        </div>
      </form>
    </div>
  );
}
