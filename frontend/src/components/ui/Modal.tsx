import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const [visible, setVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) { setVisible(true); document.body.style.overflow = 'hidden'; }
    else { const t = setTimeout(() => setVisible(false), 200); document.body.style.overflow = ''; return () => clearTimeout(t); }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!visible && !open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        ref={overlayRef}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div className={`relative bg-white rounded-[18px] shadow-xl w-full ${sizeMap[size]} transition-all duration-200 ${open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} max-h-[90vh] flex flex-col`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 shrink-0">
            <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
            <button onClick={onClose} className="btn-icon !w-8 !h-8 !rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open, onClose, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Confirm', variant = 'danger',
}: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title?: string; message?: string; confirmLabel?: string; variant?: 'danger' | 'primary';
}) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
        {message && <p className="text-sm text-neutral-500 mt-2">{message}</p>}
        <div className="flex gap-3 mt-6 justify-center">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}>{confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
}
