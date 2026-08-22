# SOCCERMRGAMIFICATION v2.0

MVP SaaS per la gestione di squadre di calcio dilettantistiche.

## Stack
- React + Vite
- Supabase Auth + Postgres + RLS
- Google OAuth
- GitHub Pages
- jsPDF
- Recharts

## Migrazione database
Se hai già il database della prima versione, **non rieseguire il vecchio schema.sql**. Apri Supabase → SQL Editor e applica:

`supabase/migrations/20260822_v2.sql`

La migrazione mantiene RLS attivo e corregge il riconoscimento dell'OWNER, i token del player portal e gli indici.

## Deploy GitHub Pages
Il repository è pensato per essere pubblicato sotto `/mrsoccergamification/`.

## Variabili
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Non inserire mai la service-role key nel frontend.

## Funzionalità v2
- Google login
- stagioni e richieste di accesso
- ruoli OWNER/COLLABORATOR/CAPTAIN
- rosa con archiviazione + cestino + ripristino + eliminazione definitiva confermata
- form giocatore sempre resettato
- sedute allenamento/partita
- presenze precompilate automaticamente alla creazione della seduta
- RPE × durata
- partite, convocazioni, minutaggi, RPE, gol
- partitelle e classifica automatica
- penalità classifica
- multe e pagamenti
- carichi con trend e insight descrittivi
- player portal con token casuale hashato
- PDF
- activity log
- responsive mobile-first
