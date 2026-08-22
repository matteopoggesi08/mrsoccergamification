# Supabase setup — SOCCERMRGAMIFICATION

## Database già esistente

Se hai già installato la versione precedente dell'MVP e la migration v2 è stata eseguita con successo, esegui **una sola volta**:

`FINAL_MIGRATION.sql`

oppure:

`migrations/20260822_v3.sql`

Sono lo stesso contenuto.

## Database nuovo

Esegui in ordine:

1. `schema.sql`
2. `migrations/20260822_v2.sql`
3. `migrations/20260822_v3.sql`

## Cosa aggiunge la v3

- impostazioni della stagione;
- scoring classifica configurabile;
- penalità configurabili;
- RLS rifatta e più rigorosa;
- tipologie multe realmente gestibili;
- hard delete giocatore solo se privo di storico;
- player portal completo e sicuro;
- viste classifica e match aggiornate;
- audit trigger estesi;
- indici e vincoli di validazione.
