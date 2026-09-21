'use client';

import { createContext, useContext } from 'react';
import type { TeamSummary } from '@/types/domain';

type TeamContextValue = {
  activeTeam: TeamSummary;
  teams: TeamSummary[];
};

const TeamContext = createContext<TeamContextValue | null>(null);

export function TeamProvider({
  activeTeam,
  teams,
  children,
}: TeamContextValue & { children: React.ReactNode }) {
  return (
    <TeamContext.Provider value={{ activeTeam, teams }}>{children}</TeamContext.Provider>
  );
}

export function useTeamContext() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeamContext deve essere usato dentro <TeamProvider>');
  return ctx;
}
