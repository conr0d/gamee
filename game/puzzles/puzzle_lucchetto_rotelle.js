/* =========================================================================
   PUZZLE — Lucchetto a rotelle
   Un lucchetto a combinazione vero: una rotella per cifra, ciascuna con un
   tasto ▲ e un tasto ▼ che la fanno girare su e giù (con giro completo:
   da 9 si torna a 0 e viceversa, come una rotella meccanica). Niente
   tastiera, niente campo di testo: solo le due frecce per rotella.
   Non conosce il motore: riceve container, parametri e api.
   Lo stesso file gira dentro il gioco e dentro tools/sandbox.html.

   Nessun contenuto narrativo e nessuna soluzione stanno qui dentro:
   arriva tutto da `parametri`.

   parametri: {
     domanda: 'consegna, può contenere HTML semplice (<br>, <em>)',
     codice: '1072',            // la soluzione. Stringa o array di simboli,
                                // un carattere per rotella.
     simboli: ['0','1',...],    // valori che ogni rotella può assumere, IN
                                // ORDINE di rotazione. Default: cifre 0-9.
     lunghezza: 4,              // numero di rotelle. Default: quelle del codice.
     testoCorretto: 'messaggio al codice giusto',
     testoErrato:   'messaggio al codice sbagliato',
     tentativiMax: 3,           // OPZIONALE: se assente, tentativi infiniti
     testoTentativi: 'Tentativi rimasti: {n}',
     testoEsauriti: 'messaggio quando i tentativi finiscono',
     etichettaConferma: 'Conferma'
   }

   api: { risolto(), registraListener(t,ev,fn,opts), abilitaDropZone(...), inventario() }

   Nota sulla riservatezza: la soluzione resta in una variabile locale del
   render. Non finisce mai nel DOM (né in dataset, né in aria-*), e il modulo
   non deduce nulla da solo: confronta e basta.
   ========================================================================= */
window.Puzzles = window.Puzzles || {};

Puzzles.lucchettoRotelle = {
  // Parametri d'esempio per tools/sandbox.html — non li usa il motore.
  esempio: {
    domanda: 'Un lucchetto a quattro rotelle chiude il baule. Nessuna iscrizione: ' +
             'il codice va trovato altrove.',
    codice: '1072',
    lunghezza: 4,
    testoCorretto: 'Le rotelle scattano in fila. Il baule si apre.',
    testoErrato: 'Le rotelle non si sbloccano.'
  },

  render(container, parametri, api) {
    const p = parametri || {};
    container.innerHTML = '';

    /* ---------- normalizzazione dei parametri ---------- */

    const simboli = (Array.isArray(p.simboli) && p.simboli.length)
      ? p.simboli.map(String)
      : ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    function aSequenza(valore) {
      if (Array.isArray(valore)) return valore.map(String);
      const s = String(valore == null ? '' : valore);
      return Array.from(s);
    }

    const soluzione = aSequenza(p.codice);       // resta qui, in closure
    const lunghezza = Math.max(1, parseInt(p.lunghezza, 10) || soluzione.length || 4);
    const tentativiMax = (p.tentativiMax > 0) ? parseInt(p.tentativiMax, 10) : 0;

    // indice corrente in `simboli` per ciascuna rotella, tutte a zero all'avvio
    const indici = new Array(lunghezza).fill(0);
    let tentativiUsati = 0;
    let bloccato = false;

    /* ---------- consegna ---------- */

    const domanda = document.createElement('p');
    domanda.className = 'enigma-domanda';        // mattone condiviso, sta in engine.css
    domanda.innerHTML = p.domanda || '';
    container.appendChild(domanda);

    /* ---------- rotelle ---------- */

    const fila = document.createElement('div');
    fila.className = 'pz-lock-fila';
    container.appendChild(fila);

    const SVG_SU =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      '<path d="M5 15l7-7 7 7"/></svg>';
    const SVG_GIU =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      '<path d="M5 9l7 7 7-7"/></svg>';

    // Riga invisibile ma letta dallo screen reader: annuncia ogni giro di rotella.
    const annuncio = document.createElement('span');
    annuncio.className = 'pz-lock-sr';
    annuncio.setAttribute('aria-live', 'polite');

    const cifre = [];       // gli span che mostrano il valore corrente
    const rotelle = [];     // { su, giu } bottoni, per bloccarli/sbloccarli

    for (let i = 0; i < lunghezza; i++) {
      const rotella = document.createElement('div');
      rotella.className = 'pz-lock-rotella';

      const btnSu = document.createElement('button');
      btnSu.type = 'button';
      btnSu.className = 'pz-lock-freccia pz-lock-su';
      btnSu.innerHTML = SVG_SU;
      btnSu.setAttribute('aria-label', 'Rotella ' + (i + 1) + ': avanti');

      const cifra = document.createElement('span');
      cifra.className = 'pz-lock-cifra';
      cifra.setAttribute('aria-hidden', 'true');
      cifra.textContent = simboli[0];
      cifre.push(cifra);

      const btnGiu = document.createElement('button');
      btnGiu.type = 'button';
      btnGiu.className = 'pz-lock-freccia pz-lock-giu';
      btnGiu.innerHTML = SVG_GIU;
      btnGiu.setAttribute('aria-label', 'Rotella ' + (i + 1) + ': indietro');

      const indiceRotella = i;
      api.registraListener(btnSu, 'click', () => gira(indiceRotella, 1));
      api.registraListener(btnGiu, 'click', () => gira(indiceRotella, -1));

      rotella.appendChild(btnSu);
      rotella.appendChild(cifra);
      rotella.appendChild(btnGiu);
      fila.appendChild(rotella);
      rotelle.push({ su: btnSu, giu: btnGiu });
    }

    container.appendChild(annuncio);

    /* ---------- conferma ---------- */

    const azioni = document.createElement('div');
    azioni.className = 'pz-lock-azioni';
    container.appendChild(azioni);

    const SVG_CONFERMA =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      '<path d="M4 12.5l5.2 5.2L20 7"/></svg>';

    const btnConferma = document.createElement('button');
    btnConferma.type = 'button';
    btnConferma.className = 'pz-lock-conferma';
    btnConferma.innerHTML = SVG_CONFERMA +
      '<span>' + (p.etichettaConferma || 'Conferma') + '</span>';
    api.registraListener(btnConferma, 'click', conferma);
    azioni.appendChild(btnConferma);

    /* ---------- contatore tentativi (solo se dichiarato) ---------- */

    let contatore = null;
    if (tentativiMax) {
      contatore = document.createElement('p');
      contatore.className = 'pz-lock-tentativi';
      container.appendChild(contatore);
    }

    /* ---------- esito ---------- */

    const esito = document.createElement('div');
    esito.className = 'enigma-esito';            // mattone condiviso
    esito.setAttribute('role', 'status');        // annunciato dai lettori di schermo
    container.appendChild(esito);

    /* ---------- comportamento ---------- */

    function pulisciEsito() {
      esito.className = 'enigma-esito';
      esito.textContent = '';
      fila.classList.remove('pz-lock-scossa');
    }

    function gira(i, verso) {
      if (bloccato) return;
      const n = simboli.length;
      indici[i] = (indici[i] + verso + n) % n;
      cifre[i].textContent = simboli[indici[i]];
      annuncio.textContent = 'Rotella ' + (i + 1) + ': ' + simboli[indici[i]];
      pulisciEsito();
    }

    function scuoti() {
      fila.classList.remove('pz-lock-scossa');
      void fila.offsetWidth;                       // forza il riavvio dell'animazione
      fila.classList.add('pz-lock-scossa');
    }

    function blocca() {
      bloccato = true;
      rotelle.forEach(r => { r.su.disabled = true; r.giu.disabled = true; });
      btnConferma.disabled = true;
    }

    function conferma() {
      if (bloccato) return;
      const inserito = indici.map(i => simboli[i]);

      const giusto = inserito.length === soluzione.length &&
        inserito.every((s, i) => s === soluzione[i]);

      if (giusto) {
        blocca();
        fila.classList.add('pz-lock-ok');
        esito.className = 'enigma-esito ok';
        esito.textContent = p.testoCorretto || 'Il lucchetto scatta.';
        setTimeout(() => api.risolto(), 750);
        return;
      }

      tentativiUsati++;
      scuoti();
      esito.className = 'enigma-esito ko';

      if (tentativiMax && tentativiUsati >= tentativiMax) {
        blocca();
        fila.classList.add('pz-lock-ko');
        esito.textContent = p.testoEsauriti || 'Il lucchetto si blocca: nessun altro tentativo.';
        aggiornaContatore();
        return;
      }

      esito.textContent = p.testoErrato || 'Il lucchetto non si apre.';
      aggiornaContatore();
    }

    function aggiornaContatore() {
      if (!contatore) return;
      const rimasti = Math.max(0, tentativiMax - tentativiUsati);
      const modello = p.testoTentativi || 'Tentativi rimasti: {n}';
      contatore.textContent = modello.replace('{n}', rimasti);
      contatore.classList.toggle('pz-lock-allarme', rimasti <= 1);
    }
  }
};
