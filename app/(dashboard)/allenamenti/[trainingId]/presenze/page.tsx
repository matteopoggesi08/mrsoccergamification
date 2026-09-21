import { getActiveTeam } from '@/lib/active-team';
import { AttendanceToggle } from '@/components/trainings/attendance-toggle';
import { StaffAttendanceToggle } from '@/components/staff/staff-attendance-toggle';
import { TrainingTabs } from '@/components/trainings/training-tabs';

export default async function PresenzePage({
  params,
}: {
  params: Promise<{ trainingId: string }>;
}) {
  const { trainingId } = await params;
  const { supabase, activeTeam } = await getActiveTeam();

  const [{ data: players }, { data: attendances }, { data: staff }, { data: staffAttendances }] =
    await Promise.all([
      supabase.from('players').select('id, first_name, last_name').eq('team_id', activeTeam.id),
      supabase.from('attendances').select('player_id, status').eq('training_id', trainingId),
      supabase.from('staff_members').select('id, first_name, last_name').eq('team_id', activeTeam.id),
      supabase.from('staff_attendances').select('staff_id, status').eq('training_id', trainingId),
    ]);

  const statusByPlayer = new Map((attendances ?? []).map((a) => [a.player_id, a.status]));
  const statusByStaff = new Map((staffAttendances ?? []).map((a) => [a.staff_id, a.status]));

  // Chi non ha ancora un record per questa seduta viene impostato subito
  // come "presente" di default (caso più comune): al mister basta un
  // tocco su "Assente" solo per le eccezioni, invece di dover scegliere
  // manualmente per ognuno. ignoreDuplicates evita di sovrascrivere
  // scelte già fatte in caso di doppio caricamento. Stessa logica
  // applicata sia ai giocatori sia allo staff tecnico.
  const missingPlayers = (players ?? []).filter((p) => !statusByPlayer.has(p.id));
  if (missingPlayers.length > 0) {
    await supabase.from('attendances').upsert(
      missingPlayers.map((p) => ({ training_id: trainingId, player_id: p.id, status: 'presente' as const })),
      { onConflict: 'training_id,player_id', ignoreDuplicates: true }
    );
    missingPlayers.forEach((p) => statusByPlayer.set(p.id, 'presente'));
  }

  const missingStaff = (staff ?? []).filter((s) => !statusByStaff.has(s.id));
  if (missingStaff.length > 0) {
    await supabase.from('staff_attendances').upsert(
      missingStaff.map((s) => ({ training_id: trainingId, staff_id: s.id, status: 'presente' as const })),
      { onConflict: 'training_id,staff_id', ignoreDuplicates: true }
    );
    missingStaff.forEach((s) => statusByStaff.set(s.id, 'presente'));
  }

  return (
    <div className="space-y-4">
      <TrainingTabs trainingId={trainingId} />
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Presenze</h2>
        <p className="text-xs text-muted-foreground">Tutti presenti di default, tocca per segnare le assenze</p>
      </div>

      <div className="space-y-2">
        {(players ?? []).map((p) => (
          <AttendanceToggle
            key={p.id}
            trainingId={trainingId}
            playerId={p.id}
            playerName={`${p.first_name} ${p.last_name}`}
            initialStatus={(statusByPlayer.get(p.id) as 'presente' | 'assente') ?? 'presente'}
          />
        ))}
      </div>

      {staff && staff.length > 0 && (
        <div className="space-y-2">
          <p className="pt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Staff tecnico
          </p>
          {staff.map((s) => (
            <StaffAttendanceToggle
              key={s.id}
              trainingId={trainingId}
              staffId={s.id}
              staffName={`${s.first_name} ${s.last_name}`}
              initialStatus={(statusByStaff.get(s.id) as 'presente' | 'assente') ?? 'presente'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
