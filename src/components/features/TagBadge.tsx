import { cn } from '@/lib/utils';
import type { Tag } from '@/types';
import { TAG_COLORS } from '@/types';

export default function TagBadge({ tag, className }: { tag: Tag; className?: string }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border', TAG_COLORS[tag], className)}>
      {tag}
    </span>
  );
}
