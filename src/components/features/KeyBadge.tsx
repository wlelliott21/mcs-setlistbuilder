import { cn } from '@/lib/utils';

export default function KeyBadge({ musicKey, size = 'default', className }: { musicKey: string; size?: 'sm' | 'default' | 'lg'; className?: string }) {
  const sizes = { sm: 'px-1.5 py-0.5 text-[10px]', default: 'px-2 py-0.5 text-xs', lg: 'px-3 py-1 text-base' };
  return (
    <span className={cn('inline-flex items-center font-mono font-semibold bg-primary/15 text-primary border border-primary/20 rounded', sizes[size], className)}>
      {musicKey}
    </span>
  );
}
