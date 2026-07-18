import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  align?: 'left' | 'right';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function DatePicker({ value, onChange, placeholder = 'Select date...', label, error, className = '', align = 'left' }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => value ? new Date(value + 'T00:00:00') : new Date());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const selectDate = (day: number) => {
    const d = new Date(year, month, day);
    const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    onChange(formatted);
    setOpen(false);
  };

  const today = () => {
    const d = new Date();
    const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    onChange(formatted);
    setOpen(false);
  };

  const clear = () => {
    onChange('');
    setOpen(false);
  };

  const displayValue = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  return (
    <div className="space-y-1.5" ref={ref}>
      {label && <label className="label">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`input-field flex items-center justify-between text-left ${error ? '!border-red-400' : ''} ${className}`}
        >
          <span className={displayValue ? 'text-neutral-900' : 'text-neutral-400'}>
            {displayValue || placeholder}
          </span>
          <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
        </button>

        {open && (
          <div className={`absolute top-full mt-1 ${align === 'right' ? 'right-0' : 'left-0'} z-50 bg-white border border-neutral-200 rounded-xl shadow-lg p-3 w-64 animate-[fadeIn_150ms_ease]`}>
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={prevMonth} className="p-1 hover:bg-neutral-100 rounded-lg">
                <ChevronLeft className="w-4 h-4 text-neutral-600" />
              </button>
              <span className="text-sm font-semibold text-neutral-900">
                {MONTHS[month]} {year}
              </span>
              <button type="button" onClick={nextMonth} className="p-1 hover:bg-neutral-100 rounded-lg">
                <ChevronRight className="w-4 h-4 text-neutral-600" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[10px] font-semibold text-neutral-400 uppercase py-1">{d}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                const isSelected = value === `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => selectDate(day)}
                    className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors flex items-center justify-center
                      ${isSelected ? 'bg-primary-600 text-white' : isToday ? 'bg-blue-50 text-primary-600 font-bold' : 'text-neutral-700 hover:bg-neutral-100'}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
              <button type="button" onClick={clear} className="text-xs font-medium text-neutral-500 hover:text-neutral-700">Clear</button>
              <button type="button" onClick={today} className="text-xs font-semibold text-primary-600 hover:text-primary-700">Today</button>
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
