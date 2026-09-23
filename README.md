# SOCCERMRGAMIFICATION

MVP SaaS mobile-first per gestione di squadre di calcio dilettantistiche.

## Stack
- React + Vite
- Supabase Auth / Postgres / RLS
- Google OAuth
- Recharts
- jsPDF
- GitHub Pages / GitHub Actions

## Funzionalità
- Google login
- Stagioni e gestione membri/permessi
- Rosa con archiviazione/cestino
- Sedute allenamento/partita
- Presenze + motivi assenza
- Assenze programmate con previsione disponibilità
- RPE/Borg × durata (session-RPE)
- Carichi giornalieri, settimanali, mensili e trend
- Insight squadra e individuali prudenti e documentati
- Convocazioni e PDF
- Minutaggi, RPE e eventi partita
- Partitelle e classifica automatica
- Penalità
- Multe, tipologie, pagamenti parziali/totali
- Player Portal con token sicuro
- Report PDF
- Activity log
- Yo-Yo IR1
- Responsive mobile-first

## Supabase
Usare `supabase/MASTER_FINAL.sql` come script di riconciliazione del database esistente.

Il master non gestisce `auth.users` né il trigger `auth_profile`: il trigger esistente viene lasciato intatto.

## Deploy
Il repository è pensato per GitHub Pages tramite GitHub Actions. Le variabili pubbliche di Supabase (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`) possono essere configurate come repository variables; la sicurezza dei dati è affidata a RLS e autorizzazioni server-side.
