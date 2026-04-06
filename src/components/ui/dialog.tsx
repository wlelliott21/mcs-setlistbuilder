import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Dialog
interface DialogProps { open?: boolean; onOpenChange?: (v: boolean) => void; children: React.ReactNode; }

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/80" onClick={() => onOpenChange?.(false)} />
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>{children}</div>
      </div>
    </div>
  );
}

export function DialogContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { className?: string }) {
  return <div className={cn('w-full max-w-lg border bg-background p-6 shadow-lg rounded-lg relative', className)} {...props}>{children}</div>;
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

// Select
interface SelectCtx { value?: string; onValueChange?: (v: string) => void; open: boolean; setOpen: (v: boolean) => void; }
const SelectCtxObj = createContext<SelectCtx>({ open: false, setOpen: () => {} });

export function Select({ value, onValueChange, children }: { value?: string; onValueChange?: (v: string) => void; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <SelectCtxObj.Provider value={{ value, onValueChange, open, setOpen }}><div className="relative">{children}</div></SelectCtxObj.Provider>;
}

export function SelectTrigger({ className, children }: { className?: string; children: React.ReactNode }) {
  const { open, setOpen } = useContext(SelectCtxObj);
  return (
    <button type="button" className={cn('flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none', className)} onClick={() => setOpen(!open)}>
      {children}
      <svg className="h-4 w-4 opacity-50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = useContext(SelectCtxObj);
  return <span className="truncate">{value || placeholder || ''}</span>;
}

export function SelectContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const { open, setOpen } = useContext(SelectCtxObj);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <div ref={ref} className={cn('absolute z-50 max-h-60 min-w-[8rem] overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md mt-1 w-full', className)}>
      {children}
    </div>
  );
}

export function SelectItem({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const { value: selected, onValueChange, setOpen } = useContext(SelectCtxObj);
  return (
    <div
      className={cn('relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm hover:bg-accent', selected === value && 'bg-accent', className)}
      onClick={() => { onValueChange?.(value); setOpen(false); }}
    >
      {selected === value && <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center text-xs">✓</span>}
      <span>{children}</span>
    </div>
  );
}
