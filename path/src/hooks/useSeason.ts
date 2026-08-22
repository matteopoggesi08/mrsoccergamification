import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Season } from '../types';

export function useSeason(seasonId?: string) {
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    if (!seasonId) {
      setSeason(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    supabase
      .from('seasons')
      .select('*')
      .eq('id', seasonId)
      .single()
      .then(
        ({ data }) => {
          if (!alive) return;
          setSeason((data as Season | null) ?? null);
          setLoading(false);
        },
        () => {
          if (!alive) return;
          setSeason(null);
          setLoading(false);
        },
      );

    return () => {
      alive = false;
    };
  }, [seasonId]);

  return { season, loading };
}
