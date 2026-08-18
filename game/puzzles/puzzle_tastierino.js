/* =========================================================================
   PUZZLE — Tastierino / codice
   Tipo parametrico: l'utente scrive un codice con la tastiera del dispositivo
   (fisica o quella che il telefono apre da solo) e conferma. Non c'è più una
   griglia di tasti disegnata a schermo: il tocco sul campo apre la tastiera
   nativa, più familiare e più veloce di una replicata a mano.
   Non conosce il motore: riceve container, parametri e api.
   Lo stesso file gira dentro il gioco e dentro tools/sandbox.html.

   Nessun contenuto narrativo e nessuna soluzione stanno qui dentro:
   arriva tutto da `parametri`.

   parametri: {
     domanda: 'consegna, può contenere HTML semplice (<br>, <em>)',
     codice: '4392',            // la soluzione. Stringa (un carattere per
                                // posizione) oppure array di simboli.
     simboli: ['0','1',...],    // caratteri ammessi. Default: cifre 0-9.
                                // Un solo carattere per simbolo: la tastiera
                                // scrive un tasto alla volta, non geroglifici.
     lunghezza: 4,              // posizioni del codice. Default: quelle del codice.
     testoCorretto: 'messaggio al codice giusto',
     testoErrato:   'messaggio al codice sbagliato',
     tentativiMax: 3,           // OPZIONALE: se assente, tentativi infiniti
     testoTentativi: 'Tentativi rimasti: {n}',   // {n} viene sostituito
     testoEsauriti: 'messaggio quando i tentativi finiscono',
     etichettaCancella: 'Cancella',
     etichettaConferma: 'Conferma'
   }

   api: { risolto(), registraListener(t,ev,fn,opts), abilitaDropZone(...), inventario() }

   Nota sulla riservatezza: la soluzione resta in una variabile locale del
   render. Non finisce mai nel DOM (né in dataset, né in aria-*), e il modulo
   non deduce nulla da solo: confronta e basta.
   ========================================================================= */
window.Puzzles = window.Puzzles || {};

Puzzles.tastierino = {
  // Parametri d'esempio per tools/sandbox.html — non li usa il motore.
  esempio: {
    domanda: 'Sul quadrante di bronzo, quattro incavi. Attorno, incise nella pietra:' +
             '<br><br><em>«La prima cifra è il doppio dell’ultima.<br>' +
             'La somma delle quattro fa diciotto.<br>' +
             'La terza è un quadrato perfetto, e non è l’unità.<br>' +
             'La seconda è dispari, e minore della terza.»</em>',
    codice: '4392',
    simboli: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    lunghezza: 4,
    testoCorretto: 'I quattro incavi si allineano. Il quadrante ruota.',
    testoErrato: 'Il bronzo resta immobile. Qualcosa non torna.'
  },

  render(container, parametri, api) {
    const p = parametri || {};
    container.innerHTML = '';

    /* ---------- normalizzazione dei parametri ---------- */

    // I simboli sono i caratteri ammessi. Di default il codice è numerico.
    const simboli = (Array.isArray(p.simboli) && p.simboli.length)
      ? p.simboli.map(String)
      : ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const soloNumeri = simboli.every(s => /^[0-9]$/.test(s));

    // Il codice arriva come array o come stringa: qui conta solo la sequenza
    // di caratteri, un tasto della tastiera per posizione.
    function aSequenza(valore) {
      if (Array.isArray(valore)) return valore.map(String);
      const s = String(valore == null ? '' : valore);
      return Array.from(s);
    }

    const soluzione = aSequenza(p.codice);       // resta qui, in closure
    const lunghezza = Math.max(1, parseInt(p.lunghezza, 10) || soluzione.length || 4);
    const tentativiMax = (p.tentativiMax > 0) ? parseInt(p.tentativiMax, 10) : 0;

    let tentativiUsati = 0;
    let bloccato = false;

    /* ---------- consegna ---------- */

    const domanda = document.createElement('p');
    domanda.className = 'enigma-domanda';        // mattone condiviso, sta in engine.css
    domanda.innerHTML = p.domanda || '';
    container.appendChild(domanda);

    /* ---------- campo di inserimento (tastiera del dispositivo) ---------- */

    const campo = document.createElement('input');
    campo.type = 'text';
    campo.className = 'pz-tast-input';
    campo.maxLength = lunghezza;
    campo.autocomplete = 'off';
    campo.autocapitalize = 'off';
    campo.spellcheck = false;
    campo.setAttribute('aria-label', 'Codice, ' + lunghezza + ' caratteri');
    campo.placeholder = '•'.repeat(lunghezza);
    if (soloNumeri) {
      campo.setAttribute('inputmode', 'numeric');
      campo.setAttribute('pattern', '[0-9]*');
    }
    container.appendChild(campo);

    // Riga invisibile ma letta dallo screen reader: dice quante posizioni
    // sono piene senza costringere a "leggere" il campo carattere per carattere.
    const annuncio = document.createElement('span');
    annuncio.className = 'pz-tast-sr';
    annuncio.setAttribute('aria-live', 'polite');
    container.appendChild(annuncio);

    /* ---------- azioni: cancella e conferma (SVG inline, mai emoji) ---------- */

    const azioni = document.createElement('div');
    azioni.className = 'pz-tast-azioni';
    container.appendChild(azioni);

    const SVG_CANCELLA =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      '<path d="M20 5H9L3 12l6 7h11a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z"/>' +
      '<path d="M17 9l-5 6M12 9l5 6"/></svg>';
    const SVG_CONFERMA =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      '<path d="M4 12.5l5.2 5.2L20 7"/></svg>';

    const btnCancella = document.createElement('button');
    btnCancella.type = 'button';
    btnCancella.className = 'pz-tast-azione pz-tast-cancella';
    btnCancella.innerHTML = SVG_CANCELLA +
      '<span>' + (p.etichettaCancella || 'Cancella') + '</span>';
    btnCancella.setAttribute('aria-label', p.etichettaCancella || 'Cancella il codice inserito');
    api.registraListener(btnCancella, 'click', cancella);
    azioni.appendChild(btnCancella);

    const btnConferma = document.createElement('button');
    btnConferma.type = 'button';
    btnConferma.className = 'pz-tast-azione pz-tast-conferma';
    btnConferma.innerHTML = SVG_CONFERMA +
      '<span>' + (p.etichettaConferma || 'Conferma') + '</span>';
    api.registraListener(btnConferma, 'click', conferma);
    azioni.appendChild(btnConferma);

    /* ---------- contatore tentativi (solo se dichiarato) ---------- */

    let contatore = null;
    if (tentativiMax) {
      contatore = document.createElement('p');
      contatore.className = 'pz-tast-tentativi';
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
      campo.classList.remove('pz-tast-scossa');
    }

    // Filtra ciò che l'utente digita ai soli simboli ammessi: chi scrive
    // lettere su un codice numerico non vede comparire nulla di strano.
    function filtra(valore) {
      return Array.from(valore)
        .filter(c => simboli.includes(c))
        .slice(0, lunghezza)
        .join('');
    }

    function aggiorna() {
      const pulito = filtra(campo.value);
      if (pulito !== campo.value) campo.value = pulito;
      const completo = pulito.length === lunghezza;
      btnConferma.disabled = bloccato || !completo;
      btnCancella.disabled = bloccato || pulito.length === 0;
      annuncio.textContent = completo
        ? 'Codice completo, ' + lunghezza + ' caratteri su ' + lunghezza + '.'
        : pulito.length + ' caratteri su ' + lunghezza + '.';
      aggiornaContatore();
    }

    function cancella() {
      if (bloccato) return;
      campo.value = '';
      pulisciEsito();
      aggiorna();
      campo.focus();
    }

    function scuoti() {
      // la scossa dura 300ms: micro-interazione, non un'animazione di scena
      campo.classList.remove('pz-tast-scossa');
      void campo.offsetWidth;                     // forza il riavvio dell'animazione
      campo.classList.add('pz-tast-scossa');
    }

    function blocca() {
      bloccato = true;
      campo.disabled = true;
      btnCancella.disabled = true;
      btnConferma.disabled = true;
    }

    function conferma() {
      if (bloccato) return;
      const inserito = Array.from(filtra(campo.value));
      if (inserito.length < lunghezza) return;

      const giusto = inserito.length === soluzione.length &&
        inserito.every((s, i) => s === soluzione[i]);

      if (giusto) {
        blocca();
        campo.classList.add('pz-tast-ok');
        esito.className = 'enigma-esito ok';
        esito.textContent = p.testoCorretto || 'Il meccanismo scatta.';
        setTimeout(() => api.risolto(), 750);
        return;
      }

      tentativiUsati++;
      scuoti();
      esito.className = 'enigma-esito ko';

      if (tentativiMax && tentativiUsati >= tentativiMax) {
        blocca();
        campo.classList.add('pz-tast-ko');
        esito.textContent = p.testoEsauriti || 'Il meccanismo si blocca: nessun altro tentativo.';
        aggiornaContatore();
        return;
      }

      esito.textContent = p.testoErrato || 'Il codice non apre nulla.';
      aggiornaContatore();
    }

    function aggiornaContatore() {
      if (!contatore) return;
      const rimasti = Math.max(0, tentativiMax - tentativiUsati);
      const modello = p.testoTentativi || 'Tentativi rimasti: {n}';
      contatore.textContent = modello.replace('{n}', rimasti);
      contatore.classList.toggle('pz-tast-allarme', rimasti <= 1);
    }

    api.registraListener(campo, 'input', () => { pulisciEsito(); aggiorna(); });
    api.registraListener(campo, 'keydown', (ev) => {
      if (ev.key === 'Enter') conferma();
    });

    aggiorna();
    campo.focus();
  }
};
