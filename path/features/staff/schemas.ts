import { z } from 'zod';

export const staffSchema = z.object({
  firstName: z.string().min(1, 'Obbligatorio').max(60),
  lastName: z.string().min(1, 'Obbligatorio').max(60),
  role: z.string().max(60).optional(),
  phone: z.string().max(30).optional(),
  notes: z.string().max(1000).optional(),
});
export type StaffInput = z.infer<typeof staffSchema>;
