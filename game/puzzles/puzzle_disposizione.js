/* =========================================================================
   PUZZLE — Disposizione (arrange)
   Una fila di elementi disegnati, in un ordine mischiato: si tocca un
   elemento per selezionarlo, poi un secondo per scambiarli di posto.
   Nessun bottone di conferma: l'ordine si controlla da solo dopo ogni
   scambio, e a griglia risolta l'enigma si chiude da sé. Non conosce il
   motore: riceve container, parametri e api. Lo stesso file gira dentro
   il gioco e dentro tools/sandbox.html.

   Tocco (non trascinamento): ogni bottone è un <button> vero, quindi
   funziona anche da tastiera (Tab + Invio) senza codice apposito — un
   drag-and-drop fatto in casa non l'avrebbe dato gratis.

   Nessun contenuto narrativo e nessuna soluzione stanno qui dentro:
   arrivano tutti da `parametri`. Ogni scambio è sempre "legale" (non
   esiste una mossa sbagliata): non c'è un testoErrato, solo l'arrivo o
   meno all'ordine corretto.

   parametri: {
     domanda: 'consegna, può contenere HTML semplice (<br>, <em>)',
     elementi: [
       { id: 'falco', immagine: 'assets/img/vasi/falco.svg',
         alt: 'Vaso col coperchio a testa di falco' },
       ...
     ],
     ordineIniziale: ['babbuino','falco','uomo','sciacallo'],  // id, posizione di partenza
     ordineCorretto: ['falco','sciacallo','uomo','babbuino'],  // id, soluzione
     testoCorretto: 'messaggio a ordine ricomposto'
   }

   api: { risolto(), registraListener(t,ev,fn,opts), abilitaDropZone(...), inventario() }
   ========================================================================= */
window.Puzzles = window.Puzzles || {};

Puzzles.disposizione = {
  // Parametri d'esempio per tools/sandbox.html — non li usa il motore.
  esempio: {
    domanda: 'Quattro vasi in fila, mischiati. Tocca due vasi per scambiarli, ' +
             'finché l’ordine non è quello del cartiglio.',
    elementi: [
      { id: 'falco', immagine: 'assets/img/vasi/falco.svg', alt: 'Vaso col coperchio a testa di falco' },
      { id: 'sciacallo', immagine: 'assets/img/vasi/sciacallo.svg', alt: 'Vaso col coperchio a testa di sciacallo' },
      { id: 'uomo', immagine: 'assets/img/vasi/uomo.svg', alt: 'Vaso col coperchio a testa umana' },
      { id: 'babbuino', immagine: 'assets/img/vasi/babbuino.svg', alt: 'Vaso col coperchio a testa di babbuino' }
    ],
    ordineIniziale: ['babbuino', 'falco', 'uomo', 'sciacallo'],
    ordineCorretto: ['falco', 'sciacallo', 'uomo', 'babbuino'],
    testoCorretto: 'I quattro vasi risuonano un istante, come vuoti.'
  },

  render(container, parametri, api) {
    const p = parametri || {};
    const elementi = Array.isArray(p.elementi) ? p.elementi : [];
    const perId = {};
    elementi.forEach(e => { if (e && e.id != null) perId[e.id] = e; });

    const corretto = Array.isArray(p.ordineCorretto) ? p.ordineCorretto : [];
    const stato = (Array.isArray(p.ordineIniziale) ? p.ordineIniziale : elementi.map(e => e.id)).slice();

    let selezionato = -1;
    let bloccato = false;

    container.innerHTML = '';

    /* ---------- consegna ---------- */

    const domanda = document.createElement('p');
    domanda.className = 'enigma-domanda';        // mattone condiviso, sta in engine.css
    domanda.innerHTML = p.domanda || '';
    container.appendChild(domanda);

    /* ---------- fila ---------- */

    const fila = document.createElement('div');
    fila.className = 'pz-disp-fila';
    fila.setAttribute('role', 'group');
    fila.setAttribute('aria-label', 'Tocca due elementi per scambiarli di posto');
    container.appendChild(fila);

    const celle = stato.map((_, i) => {
      const cella = document.createElement('button');
      cella.type = 'button';
      cella.className = 'pz-disp-tessera';
      fila.appendChild(cella);
      api.registraListener(cella, 'click', () => tocca(i));
      return cella;
    });

    /* ---------- esito ---------- */

    const esito = document.createElement('div');
    esito.className = 'enigma-esito';            // mattone condiviso
    esito.setAttribute('role', 'status');        // annunciato dai lettori di schermo
    container.appendChild(esito);

    /* ---------- comportamento ---------- */

    function vinta() {
      return stato.length === corretto.length && stato.every((id, i) => id === corretto[i]);
    }

    function aggiorna() {
      stato.forEach((id, i) => {
        const el = perId[id];
        const cella = celle[i];
        cella.className = 'pz-disp-tessera' + (i === selezionato ? ' pz-disp-tessera--selezionata' : '');
        cella.disabled = bloccato;
        cella.setAttribute('aria-pressed', i === selezionato ? 'true' : 'false');
        cella.setAttribute('aria-label', (el && el.alt) || String(id));
        cella.innerHTML = '';
        if (el && el.immagine) {
          const img = document.createElement('img');
          img.className = 'pz-disp-disegno';
          img.src = el.immagine;
          // l'etichetta descrittiva sta già sul bottone (aria-label sopra):
          // ripeterla sull'immagine farebbe annunciare la stessa cosa due volte
          img.alt = '';
          img.setAttribute('aria-hidden', 'true');
          cella.appendChild(img);
        }
      });
    }

    function tocca(i) {
      if (bloccato) return;

      if (selezionato === -1) {
        selezionato = i;
        aggiorna();
        return;
      }
      if (selezionato === i) {
        // secondo tocco sullo stesso elemento: si deseleziona, non è uno scambio
        selezionato = -1;
        aggiorna();
        return;
      }

      const scambio = stato[selezionato];
      stato[selezionato] = stato[i];
      stato[i] = scambio;
      selezionato = -1;
      aggiorna();

      if (vinta()) {
        bloccato = true;
        celle.forEach(c => { c.disabled = true; });
        esito.className = 'enigma-esito ok';
        esito.textContent = p.testoCorretto || 'L’ordine è quello giusto.';
        setTimeout(() => api.risolto(), 750);
      }
    }

    aggiorna();
  }
};
