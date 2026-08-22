# SOCCERMRGAMIFICATION — metodologia dei carichi

## Metodo principale

L'app utilizza come misura principale del carico interno il **session-RPE (sRPE)**:

`carico = RPE × durata della seduta in minuti`

La scala RPE è 1–10. Per una seduta con RPE 7 e 90 minuti, il carico registrato è 630 AU (arbitrary units).

Questa scelta è coerente con la letteratura sul monitoraggio del carico interno nel calcio: una revisione sistematica ha rilevato che il session-RPE moltiplicato per la durata è una delle metodologie RPE più utilizzate nel calcio professionistico. Un lavoro sperimentale sul calcio ha inoltre applicato direttamente la formula RPE × durata per quantificare il carico interno. [Rago et al., 2020](https://pubmed.ncbi.nlm.nih.gov/31663318/) · [Impellizzeri et al., 2004](https://pubmed.ncbi.nlm.nih.gov/15179175/)

## Partite

Per le partite il sistema utilizza i minuti effettivamente giocati come durata e l'RPE inserito dal giocatore/staff come percezione dello sforzo. Il valore confluisce nello stesso dataset dei carichi, così allenamenti e partite possono essere analizzati insieme.

## Presenze

Un giocatore assente non genera carico. Se è presente ma non viene registrato un RPE, il carico resta non quantificato anziché essere inventato.

## Insight

Gli insight automatici sono volutamente **descrittivi**. Il sistema può segnalare:

- aumento o diminuzione del carico rispetto al periodo precedente;
- differenza tra ultimi 7 giorni e 7 giorni precedenti;
- carico individuale rispetto alla propria storia recente;
- andamento giornaliero, settimanale e mensile.

L'app **non** dichiara automaticamente "rischio infortunio", "overtraining" o soglie cliniche sulla sola base dello sRPE. Le revisioni disponibili sottolineano che non esiste consenso su un unico sistema universale di monitoraggio e interpretazione del carico nel calcio. [Rago et al., 2020](https://pubmed.ncbi.nlm.nih.gov/31663318/) · [Miguel et al., 2021](https://pubmed.ncbi.nlm.nih.gov/33800275/) · [Teixeira et al., 2021](https://pubmed.ncbi.nlm.nih.gov/33917802/)

## Cosa non viene fatto

Non viene utilizzato automaticamente un rapporto ACWR come indicatore di rischio. Non vengono applicate soglie universali prese da un singolo campione, perché la trasferibilità a squadre dilettantistiche, ruoli diversi e contesti diversi non è sufficientemente robusta.

## Interpretazione pratica

L'allenatore deve leggere il carico insieme a:

- contenuto e obiettivo della seduta;
- minutaggio;
- RPE individuale;
- ruolo e stato del giocatore;
- calendario;
- storico individuale;
- eventuali informazioni qualitative disponibili.

Il software è uno strumento di supporto alla decisione, non un sistema diagnostico.
