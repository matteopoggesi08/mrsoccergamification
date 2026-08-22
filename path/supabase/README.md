# Supabase

## Master definitivo

Usare **`MASTER_FINAL.sql`** come unico script di riconciliazione del database.

Il master è progettato per mantenere i dati esistenti e aggiungere/sistemare:
- tabelle e colonne mancanti;
- RLS e policy;
- ruoli e permessi;
- assenze programmate;
- Yo-Yo IR1;
- impostazioni;
- classifiche;
- multe;
- token giocatore;
- audit log;
- view e funzioni.

### Importante

Il master **NON gestisce `auth.users` e NON crea/distrugge il trigger `auth_profile`**. Quel trigger è già gestito nel progetto Supabase e deve essere lasciato intatto.

Non eseguire le migration storiche in sequenza. Sono mantenute solo come riferimento storico.

Prima di applicare il master in produzione eseguire un backup del progetto/database.
