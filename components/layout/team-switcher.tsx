'use client';

import { setActiveTeamAction } from '@/actions/seasons.actions';
import { useTeamContext } from '@/hooks/use-team-context';
import { ChevronDown } from 'lucide-react';

export function TeamSwitcher() {
  const { activeTeam, teams } = useTeamContext();

  if (teams.length <= 1) {
    return (
      <div className="text-sm font-medium">
        {activeTeam.name}
        <span className="ml-1 text-muted-foreground">· {activeTeam.seasonName}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <select
        defaultValue={activeTeam.id}
        onChange={(e) => setActiveTeamAction(e.target.value)}
        className="appearance-none rounded-lg bg-transparent py-1 pl-1 pr-6 text-sm font-medium focus:outline-none"
      >
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} · {t.seasonName}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-0 top-1.5 h-4 w-4 text-muted-foreground" />
    </div>
  );
}
