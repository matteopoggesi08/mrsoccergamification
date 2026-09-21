'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Trophy, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/squadra/rosa', label: 'Rosa', icon: Users },
  { href: '/classifica', label: 'Classifica', icon: Trophy },
  { href: '/squadra/impostazioni', label: 'Impostazioni', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur">
      <ul className="grid grid-cols-4">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 py-2.5 text-xs',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
