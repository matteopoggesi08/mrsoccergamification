import { z } from 'zod';

export const createSeasonTeamSchema = z.object({
  seasonName: z.string().min(2, 'Nome stagione troppo corto').max(60),
  teamName: z.string().min(2, 'Nome squadra troppo corto').max(60),
  category: z.string().max(60).optional(),
});
export type CreateSeasonTeamInput = z.infer<typeof createSeasonTeamSchema>;
