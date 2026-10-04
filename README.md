# Telaio String Art

Generatore di string art: carichi una foto e ottieni la lista di lavoro passo per passo (chiodo → chiodo) per tendere il filo su un telaio con chiodi numerati.

- `index.html`: l'app completa. L'app per Windows la scarica da qui all'avvio per aggiornarsi da sola.
- `app/`: il guscio Electron dell'app Windows (finestra, aggiornamento automatico, configurazione).
- `pagina-web.html`: la stessa app senza l'involucro HTML, usata per la versione web.

## Come funziona l'aggiornamento
All'avvio l'app per Windows legge `index.html` da questo repository. Se la versione indicata in `<meta name="telaio-version">` è più recente di quella installata, la salva nella cartella dati dell'utente e propone di usarla subito. Senza internet l'app continua con la versione che ha già.

Per pubblicare una nuova versione basta aumentare il numero in `telaio-version` e aggiornare `index.html`.
