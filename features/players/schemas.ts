import { z } from 'zod';

export const playerSchema = z.object({
  firstName: z.string().min(1, 'Obbligatorio').max(60),
  lastName: z.string().min(1, 'Obbligatorio').max(60),
  jerseyNumber: z.coerce.number().int().min(0).max(999).optional(),
  position: z.enum(['portiere', 'difensore', 'centrocampista', 'attaccante']).optional(),
  phone: z.string().max(30).optional(),
  birthDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
});
export type PlayerInput = z.infer<typeof playerSchema>;
