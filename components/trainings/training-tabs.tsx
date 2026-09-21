'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, CheckSquare, Swords, Trophy, Activity, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '', label: 'Panoramica', icon: LayoutGrid },
  { href: 'presenze', label: 'Presenze', icon: CheckSquare },
  { href: 'partitelle', label: 'Partitelle', icon: Swords },
  { href: 'tornei', label: 'Tornei', icon: Trophy },
  { href: 'rpe', label: 'RPE', icon: Activity },
  { href: 'minutaggi', label: 'Minuti', icon: Timer },
];

export function TrainingTabs({ trainingId }: { trainingId: string }) {
  const pathname = usePathname();

  return (
    <div className="-mx-4 mb-1 overflow-x-auto px-4 pb-1">
      <div className="flex w-max gap-2">
        {TABS.map(({ href, label, icon: Icon }) => {
          const full = href ? `/allenamenti/${trainingId}/${href}` : `/allenamenti/${trainingId}`;
          const active = pathname === full;
          return (
            <Link
              key={href || 'panoramica'}
              href={full}
              className={cn(
                'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:bg-accent'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
