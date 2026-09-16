import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type QuickActionCardProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  variant?: 'primary' | 'default';
};

export function QuickActionCard({
  href,
  label,
  icon: Icon,
  variant = 'default',
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-xl border p-3.5 transition-colors active:scale-[0.98]',
        variant === 'primary'
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card hover:bg-accent'
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          variant === 'primary' ? 'bg-primary-foreground/15' : 'bg-primary/10'
        )}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
