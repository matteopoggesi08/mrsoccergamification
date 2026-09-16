import { LogOut } from 'lucide-react';
import { signOutAction } from '@/actions/auth.actions';
import { TeamSwitcher } from './team-switcher';

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-4 py-2.5 backdrop-blur">
      <TeamSwitcher />
      <form action={signOutAction}>
        <button
          type="submit"
          aria-label="Esci"
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent"
        >
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      </form>
    </header>
  );
}
