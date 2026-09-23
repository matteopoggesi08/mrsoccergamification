import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Season } from '../types';

export type SeasonAccess = {
  role: 'OWNER'|'COLLABORATOR'|'CAPTAIN'|null;
  permissions: Record<string, boolean>;
};

export function useSeason(seasonId?: string) {
  const [season, setSeason] = useState<Season | null>(null);
  const [access, setAccess] = useState<SeasonAccess>({ role: null, permissions: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    if (!seasonId) {
      setSeason(null); setAccess({ role: null, permissions: {} }); setLoading(false); return;
    }
    setLoading(true);
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const [{ data: se }, { data: member }] = await Promise.all([
        supabase.from('seasons').select('*').eq('id', seasonId).single(),
        user ? supabase.from('season_members').select('role,permissions,status').eq('season_id', seasonId).eq('user_id', user.id).eq('status','ACTIVE').maybeSingle() : Promise.resolve({data:null})
      ]);
      if (!alive) return;
      setSeason((se as Season | null) ?? null);
      setAccess(se?.owner_id === user?.id
        ? { role: 'OWNER', permissions: { players:true,sessions:true,attendance:true,workload:true,games:true,matches:true,leaderboard:true,fines:true,reports:true,members:true,tests:true } }
        : { role: member?.role ?? null, permissions: member?.permissions ?? {} });
      setLoading(false);
    })().catch(() => { if (alive) { setSeason(null); setAccess({ role:null,permissions:{} }); setLoading(false); }});
    return () => { alive = false; };
  }, [seasonId]);

  return { season, access, loading };
}
