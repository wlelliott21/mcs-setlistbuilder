import { cn } from '@/lib/utils';

export default function DurationBar({ percentage, isOver, className }: { percentage: number; isOver: boolean; className?: string }) {
  return (
    <div className={cn('h-1.5 bg-muted/50 rounded-full overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500 ease-out', isOver ? 'bg-red-500' : percentage > 85 ? 'bg-amber-500' : 'bg-emerald-500')}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );
}
