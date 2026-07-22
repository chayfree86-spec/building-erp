import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { X, Save, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export interface FieldDef {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'textarea' | 'select' | 'switch' | 'multiselect';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[] | ((formData: Record<string, any>) => { value: string; label: string }[]);
  defaultValue?: string;
  /** multiselect only: lets the user type a name that isn't in `options` yet.
   * `onCreateCustom` is called to create the real master record (e.g. a new
   * Brand), and the returned option is auto-checked. Never required. */
  allowCustom?: boolean;
  onCreateCustom?: (label: string, formData: Record<string, any>) => Promise<{ value: string; label: string }>;
}

interface MasterFormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: FieldDef[];
  initialData?: Record<string, any>;
  onSave: (data: Record<string, any>) => Promise<any>;
  onSuccess?: () => void;
}

export function MasterFormModal({ open, onClose, title, fields, initialData, onSave, onSuccess }: MasterFormModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Options created on the fly via a field's `allowCustom` input, keyed by field key.
  // Kept separate from `options` since the parent's master list won't include
  // them until it refetches.
  const [customOptions, setCustomOptions] = useState<Record<string, { value: string; label: string }[]>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [customSaving, setCustomSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) {
      const init: Record<string, any> = {};
      fields.forEach(f => {
        let val = initialData?.[f.key];
        if (f.type === 'multiselect') {
          if (!val && f.key === 'unit_ids' && initialData?.units) {
            val = initialData.units.map((u: any) => u.id);
          }
          if (!val && f.key === 'brand_ids' && initialData?.brands) {
            val = initialData.brands.map((b: any) => b.id);
          }
          if (!val && f.key === 'category_ids' && initialData?.categories) {
            val = initialData.categories.map((c: any) => c.id);
          }
          if (!val && f.key === 'user_ids' && initialData?.users) {
            val = initialData.users.map((u: any) => u.id);
          }
          init[f.key] = Array.isArray(val) ? val : [];
        } else {
          init[f.key] = val !== undefined && val !== null ? String(val) : (f.defaultValue || '');
        }
      });
      setFormData(init);
      setErrors({});
      setCustomOptions({});
      setCustomInputs({});
    }
    // Deliberately NOT depending on `fields`: parents often recompute their
    // fields array (new reference) after an unrelated query invalidation —
    // e.g. `onCreateCustom` refetching brands/categories — which would
    // otherwise reset formData and silently drop whatever the user just
    // selected.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData]);

  if (!open) return null;

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const handleAddCustom = async (f: FieldDef) => {
    const label = (customInputs[f.key] || '').trim();
    if (!label || !f.onCreateCustom) return;
    setCustomSaving(prev => ({ ...prev, [f.key]: true }));
    try {
      const opt = await f.onCreateCustom(label, formData);
      setCustomOptions(prev => ({ ...prev, [f.key]: [...(prev[f.key] || []), opt] }));
      const values = Array.isArray(formData[f.key]) ? formData[f.key] : [];
      handleChange(f.key, [...values, Number(opt.value)]);
      setCustomInputs(prev => ({ ...prev, [f.key]: '' }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Failed to add "${label}"`);
    } finally {
      setCustomSaving(prev => ({ ...prev, [f.key]: false }));
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    fields.forEach(f => {
      const val = formData[f.key];
      if (f.required) {
        if (Array.isArray(val)) {
          if (val.length === 0) errs[f.key] = `${f.label} is required`;
        } else if (!val || !String(val).trim()) {
          errs[f.key] = `${f.label} is required`;
        }
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(formData);
      toast.success(initialData ? 'Updated successfully' : 'Created successfully');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] md:max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 shrink-0">
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100"><X className="w-5 h-5 text-neutral-500" /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {fields.map(f => (
            <div key={f.key}>
              <label className="label">{f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}</label>
              {f.type === 'switch' ? (
                <label className="flex items-center gap-3 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={formData[f.key] === 'true' || formData[f.key] === '1' || formData[f.key] === 'active'}
                    onChange={e => handleChange(f.key, e.target.checked ? 'active' : 'inactive')}
                    className="w-5 h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">{formData[f.key] === 'active' || formData[f.key] === 'true' || formData[f.key] === '1' ? 'Active' : 'Inactive'}</span>
                </label>
              ) : f.type === 'multiselect' ? (
                <div className="mt-1">
                  <div className="grid grid-cols-2 gap-2">
                    {(() => {
                      const resolvedOptions = typeof f.options === 'function' ? f.options(formData) : f.options;
                      const merged = [...(resolvedOptions || []), ...(customOptions[f.key] || [])];
                      // De-dupe in case a custom-added option later appears in the real list too.
                      const seen = new Set<string>();
                      const deduped = merged.filter(o => {
                        if (seen.has(String(o.value))) return false;
                        seen.add(String(o.value));
                        return true;
                      });
                      return deduped.map(o => {
                        const values = Array.isArray(formData[f.key]) ? formData[f.key] : [];
                        const isChecked = values.includes(Number(o.value)) || values.includes(String(o.value));
                        return (
                          <label key={o.value} className="flex items-center gap-2 p-2 rounded-xl border border-neutral-100 hover:bg-neutral-50/50 cursor-pointer text-sm">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                const numVal = Number(o.value);
                                let newValues;
                                if (e.target.checked) {
                                  newValues = [...values, numVal];
                                } else {
                                  newValues = values.filter((v: any) => Number(v) !== numVal);
                                }
                                handleChange(f.key, newValues);
                              }}
                              className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-neutral-700">{o.label}</span>
                          </label>
                        );
                      });
                    })()}
                  </div>
                  {f.allowCustom && f.onCreateCustom && (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        value={customInputs[f.key] || ''}
                        onChange={e => setCustomInputs(prev => ({ ...prev, [f.key]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustom(f); } }}
                        className="input-field flex-1 text-sm"
                        placeholder={`Not listed? Type a new ${f.label.toLowerCase()} name...`}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCustom(f)}
                        disabled={!customInputs[f.key]?.trim() || customSaving[f.key]}
                        className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 shrink-0 disabled:opacity-50"
                      >
                        {customSaving[f.key] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Add
                      </button>
                    </div>
                  )}
                </div>
              ) : f.type === 'select' ? (
                (() => {
                  const resolvedOptions = typeof f.options === 'function' ? f.options(formData) : f.options;
                  return (
                    <Select
                      options={resolvedOptions?.map(o => ({ value: o.value, label: o.label })) || []}
                      value={formData[f.key] || ''}
                      onChange={(val) => handleChange(f.key, String(val))}
                      placeholder="Select..."
                    />
                  );
                })()
              ) : f.type === 'textarea' ? (
                <textarea value={formData[f.key] || ''} onChange={e => handleChange(f.key, e.target.value)} className="input-field min-h-[80px]" placeholder={f.placeholder} />
              ) : (
                <input value={formData[f.key] || ''} onChange={e => handleChange(f.key, e.target.value)} className="input-field" type={f.type || 'text'} placeholder={f.placeholder} />
              )}
              {errors[f.key] && <p className="text-red-500 text-xs mt-1">{errors[f.key]}</p>}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 shrink-0 bg-neutral-50/50">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={saving} icon={Save}>{initialData ? 'Update' : 'Create'}</Button>
        </div>
      </div>
    </div>
  );
}
