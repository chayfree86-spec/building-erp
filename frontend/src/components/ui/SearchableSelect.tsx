import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
  sub?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value?: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
  onCreateNew?: () => void;
  createLabel?: string;
  compact?: boolean;
  className?: string;
}

export function SearchableSelect({
  options, value, onChange, placeholder = 'Select...', label, error, disabled, loading, onCreateNew, createLabel, compact, className = '',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => String(o.value) === String(value));
  const filtered = options.filter(o =>
    !search || o.label.toLowerCase().includes(search.toLowerCase()) || o.sub?.toLowerCase().includes(search.toLowerCase())
  );

  const btnClass = compact
    ? `w-full border border-neutral-200 rounded-lg bg-white text-left flex items-center justify-between text-sm py-1.5 px-2 ${error ? '!border-red-400' : ''} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`
    : `input-field flex items-center justify-between text-left ${error ? '!border-red-400' : ''} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`;

  return (
    <div className="space-y-1.5" ref={ref}>
      {label && <label className="label">{label}</label>}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => { if (!disabled) { setOpen(!open); if (!open) setTimeout(() => inputRef.current?.focus(), 50); } }}
          className={btnClass}
        >
          <span className={selected ? 'text-neutral-900' : 'text-neutral-400'}>
            {loading ? 'Loading...' : selected ? selected.label : placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden animate-[fadeIn_150ms_ease] min-w-[220px]">
            <div className="p-2 border-b border-neutral-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              {filtered.length === 0 && onCreateNew && (
                <button
                  type="button"
                  onClick={() => { onCreateNew(); setOpen(false); }}
                  className="w-full text-left px-3 py-2.5 text-sm text-primary-600 hover:bg-primary-50 font-medium"
                >
                  + {createLabel || 'Create New'}
                </button>
              )}
              {filtered.length === 0 && !onCreateNew && (
                <div className="px-3 py-4 text-sm text-neutral-400 text-center">No options</div>
              )}
              {filtered.map(opt => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setSearch(''); }}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-neutral-50 transition-colors flex items-center justify-between ${String(opt.value) === String(value) ? 'bg-primary-50 text-primary-700 font-medium' : 'text-neutral-700'}`}
                >
                  <span>{opt.label}</span>
                  {opt.sub && <span className="text-xs text-neutral-400">{opt.sub}</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
