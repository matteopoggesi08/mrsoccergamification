# SOCCERMRGAMIFICATION — FINAL CHECKLIST

## Account e sicurezza
- Google OAuth
- profilo automatico
- stagioni isolate
- OWNER / COLLABORATOR / CAPTAIN
- permessi lato database
- RLS
- token giocatore hashati e revocabili
- activity log
- trigger Auth esistente preservato, non ricreato dal master

## Stagioni
- creazione
- modifica dati stagione
- rigenerazione codice
- membri
- richieste di accesso
- permessi configurabili

## Rosa
- inserimento
- modifica
- archiviazione
- cestino
- ripristino
- eliminazione definitiva con conferma
- storico preservato

## Sedute
- allenamento
- partita
- presenze
- motivi assenza
- durata default 90'
- RPE 1-10
- session-RPE
- partitelle
- convocazioni
- minutaggi
- eventi partita

## Presenze
- riepilogo per giocatore
- percentuale
- filtri
- registro cronologico giorno per giorno
- assenze programmate
- previsione indisponibili/presenti

## Carichi
- carico giornaliero
- settimanale
- mensile
- volume
- RPE medio
- durata
- trend
- confronto
- insight individuali e squadra

## Classifica
- 3/1/0 configurabile
- vittorie/pareggi/sconfitte
- GF/GA/differenza reti
- gol nelle partitelle
- penalità

## Multe
- tipologie
- nome
- descrizione
- importo
- attiva/disattiva
- assegnazione
- pagamenti parziali/totali
- residuo
- storico

## Player Portal
- token sicuro
- dati personali
- classifica
- partite
- minutaggi
- gol
- presenze
- carichi
- volume/RPE
- grafico
- insight
- multe
- Yo-Yo
- filtri settimana/mese/stagione/personalizzato
- PDF filtrato

## Test
- Yo-Yo IR1
- data
- risultato per giocatore
- indicazione automatica
- media squadra
- miglior risultato
- storico
- profilo giocatore
- Player Portal
- report

## Report
- stagione
- rosa
- sedute
- presenze
- carichi
- minutaggi
- classifica
- multe
- test
- statistiche giocatori
- andamento squadra

## Nota di collaudo
Il codice è stato aggiornato per coprire la specifica funzionale. Il build completo non è stato eseguito nell'ambiente di generazione perché l'installazione npm delle dipendenze ha raggiunto il timeout; il controllo definitivo del build resta quindi GitHub Actions dopo il commit.
