-- SOCCERMRGAMIFICATION V15: categoria competizione per le partite
-- Sicuro da rieseguire: aggiunge solo una colonna e un vincolo.
-- Le partite esistenti e i relativi dati non vengono cancellati o sovrascritti.

alter table public.matches
  add column if not exists competition_type text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'matches_competition_type_check'
      and conrelid = 'public.matches'::regclass
  ) then
    alter table public.matches
      add constraint matches_competition_type_check
      check (competition_type is null or competition_type in ('FRIENDLY','CUP','LEAGUE','CUP_2'));
  end if;
end
$$;

comment on column public.matches.competition_type is
  'Categoria della partita: FRIENDLY, CUP, LEAGUE, CUP_2. NULL identifica una partita storica non ancora classificata.';
