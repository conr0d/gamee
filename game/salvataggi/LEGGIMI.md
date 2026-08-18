# salvataggi/

Cartella **vuota di proposito**. Nessun codice la usa: oggi il gioco non salva
niente e ricaricare la pagina azzera la partita.

Sta qui perché il salvataggio è stato rimandato **a gioco finito**, e quando
toccherà il posto è già pronto — sia per i file di partita esportati dal
giocatore, sia per `engine/salvataggio.js` se si deciderà di scriverlo.

## Cosa è già stato accertato (9 agosto 2026, Chrome su `file://`)

Perché non serva rifare la prova quando si riaprirà il discorso:

- `localStorage` **funziona**, anche aprendo il gioco con un doppio clic.
- `indexedDB` è presente.
- `<a download>` + `Blob` + `FileReader` ci sono tutti: si può esportare e
  reimportare una partita come file, senza `fetch()`.

**L'insidia da ricordare:** su `file://` tutte le pagine locali condividono
**una sola origine**. Un `localStorage` sarebbe quindi in comune con qualunque
altro HTML aperto da quel browser — non è uno spazio riservato a questo gioco.
