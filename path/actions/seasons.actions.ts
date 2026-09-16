'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createSeasonTeamSchema } from '@/features/onboarding/schemas';

export type OnboardingActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

export async function createSeasonWithTeamAction(
  _prevState: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const parsed = createSeasonTeamSchema.safeParse({
    seasonName: formData.get('seasonName'),
    teamName: formData.get('teamName'),
    category: formData.get('category') || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_season_with_team', {
    p_season_name: parsed.data.seasonName,
    p_team_name: parsed.data.teamName,
    p_category: parsed.data.category ?? null,
  });

  if (error || !data || data.length === 0) {
    return { error: 'Non è stato possibile creare la squadra. Riprova.' };
  }

  const cookieStore = await cookies();
  cookieStore.set('active_team_id', data[0].team_id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });

  redirect('/dashboard');
}

export async function setActiveTeamAction(teamId: string) {
  const cookieStore = await cookies();
  cookieStore.set('active_team_id', teamId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
  redirect('/dashboard');
}
