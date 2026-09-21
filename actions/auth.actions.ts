'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loginSchema, registerSchema } from '@/features/auth/schemas';

export type AuthActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: 'Email o password non corrette.' };
  }

  redirect('/dashboard');
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName } },
  });

  if (error) {
    return {
      error:
        error.message === 'User already registered'
          ? 'Esiste già un account con questa email.'
          : 'Registrazione non riuscita. Riprova.',
    };
  }

  redirect('/dashboard');
}

/**
 * Login con Google, tenuto disponibile come opzione in più (non
 * obbligatoria): richiede aver configurato il provider su Supabase +
 * Google Cloud Console (vedi docs/deploy-guide.md, sezione 2.5). Se non
 * lo configuri, semplicemente non compare/non funziona il pulsante
 * Google, ma email+password restano sempre operativi senza nessuna
 * configurazione esterna.
 */
export async function signInWithGoogleAction() {
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${siteUrl}/auth/callback` },
  });

  if (error || !data?.url) {
    redirect('/login?error=oauth');
  }

  redirect(data.url);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
