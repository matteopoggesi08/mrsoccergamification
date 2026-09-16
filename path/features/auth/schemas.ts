import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'Minimo 6 caratteri'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Nome troppo corto'),
    email: z.string().email('Email non valida'),
    password: z.string().min(6, 'Minimo 6 caratteri'),
    confirmPassword: z.string().min(6, 'Minimo 6 caratteri'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Le password non coincidono',
    path: ['confirmPassword'],
  });
export type RegisterInput = z.infer<typeof registerSchema>;
