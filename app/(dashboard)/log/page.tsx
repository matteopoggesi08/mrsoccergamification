import { getActiveTeam } from '@/lib/active-team';

const ACTION_LABELS: Record<string, string> = {
  INSERT: 'ha creato',
  UPDATE: 'ha modificato',
};

export default async function LogPage() {
  const { supabase, activeTeam } = await getActiveTeam();

  const { data: entries } = await supabase
    .from('activity_log')
    .select('id, action, entity_type, created_at, profiles(full_name)')
    .eq('team_id', activeTeam.id)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Log attività</h2>
      <div className="space-y-2">
        {(entries ?? []).map((e) => (
          <div key={e.id} className="rounded-xl border bg-card p-3 text-sm">
            <p>
              <span className="font-medium">
                {(e.profiles as unknown as { full_name: string } | null)?.full_name ?? 'Utente'}
              </span>{' '}
              {ACTION_LABELS[e.action] ?? e.action} {e.entity_type}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(e.created_at).toLocaleString('it-IT')}
            </p>
          </div>
        ))}
        {(!entries || entries.length === 0) && (
          <p className="py-12 text-center text-sm text-muted-foreground">Nessuna attività registrata.</p>
        )}
      </div>
    </div>
  );
}
