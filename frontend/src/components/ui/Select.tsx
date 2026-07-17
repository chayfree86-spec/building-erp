import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
  sub?: string;
}

interface SelectProps {
  options: Option[];
  value?: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
}

export function Select({ options, value, onChange, placeholder = 'Select...', label, error, disabled, className = '', compact }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => String(o.value) === String(value));
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
          onClick={() => !disabled && setOpen(!open)}
          className={btnClass}
        >
          <span className={selected ? 'text-neutral-900' : 'text-neutral-400'}>
            {selected ? (
              <span className="flex items-center gap-2">
                {selected.label}
                {selected.sub && <span className="text-xs text-neutral-400 font-normal">{selected.sub}</span>}
              </span>
            ) : placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden animate-[fadeIn_150ms_ease]">
            <div className="max-h-56 overflow-y-auto py-1">
              {options.length === 0 && (
                <div className="px-3 py-4 text-sm text-neutral-400 text-center">No options</div>
              )}
              {options.map(opt => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 text-sm flex items-center justify-between hover:bg-neutral-50 transition-colors ${String(opt.value) === String(value) ? 'bg-primary-50 text-primary-700 font-medium' : 'text-neutral-700'}`}
                >
                  <span>{opt.label}</span>
                  <span className="flex items-center gap-2">
                    {opt.sub && <span className="text-xs text-neutral-400">{opt.sub}</span>}
                    {String(opt.value) === String(value) && <Check className="w-4 h-4 text-primary-600" />}
                  </span>
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
