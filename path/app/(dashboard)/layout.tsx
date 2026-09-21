import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTeamsForCurrentUser } from '@/services/teams.service';
import { TeamProvider } from '@/providers/team-provider';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const teams = await getTeamsForCurrentUser(supabase, user.id);

  if (teams.length === 0) redirect('/onboarding');

  const cookieStore = await cookies();
  const preferredTeamId = cookieStore.get('active_team_id')?.value;
  // teams.length === 0 ha già fatto redirect sopra: teams[0] esiste sempre.
  const activeTeam = teams.find((t) => t.id === preferredTeamId) ?? teams[0]!;

  return (
    <TeamProvider activeTeam={activeTeam} teams={teams}>
      <div className="min-h-dvh bg-background pb-16">
        <Header />
        <main className="px-4 py-5">{children}</main>
        <BottomNav />
      </div>
    </TeamProvider>
  );
}
