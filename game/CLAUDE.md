# Museo del Faraone — regole del progetto

Escape room 2D per smartphone in verticale. Vanilla HTML/CSS/JS, nessuna libreria.

## Come si lavora

**Ponytail sempre attivo, livello `ultra`.** Prima di scrivere: serve davvero?
esiste già qui? lo fa il browser da solo? Cancellare batte aggiungere, la
riga più corta che funziona vince. Non vale sulla comprensione del problema:
si legge tutto prima, si taglia dopo. E non si tocca ciò che è già stato
approvato.

## Struttura

`index.html` (solo markup) · `engine.js` (motore, zero contenuto) · `game_data.js`
(TUTTO il contenuto) · `assets/css/engine.css` · `puzzles/` · `tools/` ·
`salvataggi/` (solo un `LEGGIMI.md`: il salvataggio è rimandato a gioco finito) ·
`testi/` (magazzino di frasi **non** caricate dal gioco, da cui ripescare).

Il vecchio codice sta **fuori dal progetto**, in `../game-archivio/`: non va
letto né cercato. Dentro c'è anche `storia_migrazione.md`.

Il motore è un disegnatore cieco: **il contenuto è dati, le meccaniche sono codice**.
Nessun testo di gioco dentro `engine.js` o dentro un puzzle — sta in `game_data.js`.

## Vincoli tecnici (non negoziabili)

- **Niente `fetch()`, niente `type="module"`, niente localStorage/sessionStorage.**
  Il gioco deve aprirsi con un doppio clic su `file://`, dove Chrome li blocca.
  Solo `<script src>` classici, caricati in quest'ordine: dati → puzzle → motore.
- `game_data.js` **deve** finire con `window.GAME_DATA = GAME_DATA;` — un `const`
  globale è un binding lessicale, **non** una proprietà di `window`.
- Il `?v=N` sugli `<script src>` in `index.html` è anticache: se il browser mostra
  una versione vecchia dopo una modifica, alza il numero.
- Ricaricare la pagina azzera la partita: è voluto, non c'è persistenza.

## Contratto dei puzzle

```javascript
window.Puzzles = window.Puzzles || {};
Puzzles.nome = { render(container, parametri, api) { … } };
```

`api` è l'**unica** superficie del motore utilizzabile: `risolto()`,
`registraListener(t, ev, fn, opts)`, `abilitaDropZone(el, idAtteso, onOk)`,
`inventario()`, `consumaOggetto(id)`, e per gli enigmi a più passi
`progresso()` / `salvaProgresso(dati)` — chi fa fare qualcosa di irreversibile
(consumare un oggetto) **deve** salvare, o uscire dalla schermata lo cancella. Mai `Engine`, mai `gameState`, mai `getElementById` su elementi
del motore. Usare sempre `api.registraListener`, non `addEventListener`.

CSS di ogni puzzle nel suo file, prefissato `.pz-`. Due mattoni condivisi da
`engine.css`: `.enigma-domanda` e `.enigma-esito` (con `role="status"`).

`tools/sandbox.html` fa girare un puzzle senza motore, con un'`api` finta: ciò che
funziona lì funziona nel gioco.

## Interfaccia

- **Niente emoji come icone**: solo SVG inline.
- Target touch ≥44px, spaziatura ≥8px, ~340px utili di larghezza (schermo 375×812).
- Transizioni 150-300ms, sempre con `@media (prefers-reduced-motion: reduce)`.
- Focus visibile (`:focus-visible`), `aria-label` dove il testo non basta.
- Comandi a L in basso a destra: mappa a sinistra dello zaino, bussola sopra.
- Inventario: 5 cerchi (oggetti) + 5 punti (piume), **senza scritte**.

## Enigmi

- **Un solo indizio** per enigma, pagato con una piuma.
- Nessun enigma entra in `game_data.js` senza il suo script in `tools/verifiche/`
  che ne dimostri l'**unicità della risposta** (`python tools/verifiche/X.py --test`
  deve stampare OK e uscire con 0).
- La skill `puzzle-forge` sta in
  `~/.claude/marketplace-locale/plugins/puzzle-forge/skills/puzzle-forge`.
  Riusare i suoi motori (`unique_answer`, `minimize`, `bfs`) senza modificarli.
- `../game-archivio/puzzles_sospesi/` contiene due tipi **mai verificati**: non cablarli.

## Verifica

**Niente screenshot.** Si ispeziona il DOM con `mcp__Claude_Browser__javascript_tool`,
raggruppando i controlli in pochi blocchi. Per misurare geometrie iniettare prima
`*{transition:none!important;animation:none!important}` e toglierlo dopo.
