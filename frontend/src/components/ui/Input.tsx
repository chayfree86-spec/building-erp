import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="label">{label}</label>
      )}
      <input
        ref={ref}
        id={id}
        className={`input-field ${error ? '!border-red-400 !focus:ring-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-xs">{error}</p>}
      {hint && !error && <p className="text-neutral-400 text-xs">{hint}</p>}
    </div>
  )
);
Input.displayName = 'Input';

export const CurrencyInput = forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => (
    <Input
      ref={ref}
      type="text"
      inputMode="decimal"
      className="text-right tabular-nums font-semibold"
      {...props}
    />
  )
);
CurrencyInput.displayName = 'CurrencyInput';

export const QuantityInput = forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => (
    <Input
      ref={ref}
      type="text"
      inputMode="decimal"
      className="text-right tabular-nums"
      {...props}
    />
  )
);
QuantityInput.displayName = 'QuantityInput';
