# Supabase

## Database già esistente
Non rieseguire `schema.sql` sopra il database già usato dall'MVP.

1. Apri Supabase → SQL Editor.
2. Crea una nuova query.
3. Incolla `migrations/20260822_v2.sql`.
4. Premi Run.
5. Se termina senza errori, fai logout/login nell'app.

## Nuovo progetto Supabase
1. Esegui `schema.sql`.
2. Esegui `migrations/20260822_v2.sql`.
3. Configura Google OAuth.
4. Configura Site URL e Redirect URL per GitHub Pages.

RLS resta attivo: non disabilitarlo.
