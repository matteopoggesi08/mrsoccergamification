export type TeamRole = 'allenatore' | 'vice' | 'collaboratore';

export interface TeamSummary {
  id: string;
  name: string;
  category: string | null;
  logoUrl: string | null;
  seasonId: string;
  seasonName: string;
  role: TeamRole;
}

/**
 * Forma di una riga "attendances" con la relazione trainings annidata,
 * così come restituita da .select('status, trainings(id, session_date, title)').
 * Postgrest, senza lo schema Database tipizzato, non può inferire da solo
 * che si tratta di una relazione many-to-one (un solo training per
 * attendance): questo tipo è la fonte unica di verità per quella forma,
 * usata sia per il cast della query sia dal componente che la consuma,
 * cosi che i due punti non possano più andare fuori sincrono.
 */
export interface AttendanceHistoryEntry {
  status: 'presente' | 'assente';
  trainings: { id: string; session_date: string; title: string | null } | null;
}
