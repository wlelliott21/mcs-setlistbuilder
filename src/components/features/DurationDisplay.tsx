import { formatDuration } from '@/lib/helpers';
import { cn } from '@/lib/utils';

export default function DurationDisplay({ seconds, className }: { seconds: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs text-muted-foreground font-mono', className)}>
      ⏱ {formatDuration(seconds)}
    </span>
  );
}
