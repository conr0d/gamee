/* =========================================================================
   PUZZLE — Travaso (interattivo)
   Due secchi di capienza diversa: si tocca un secchio per sollevarlo,
   un secondo secchio per versarci dentro, il lavandino per svuotarlo,
   un bottone "Riempi" per colmarlo alla fonte. Nessun bottone di conferma:
   si vince nell'istante in cui il secchio bersaglio contiene la quantità
   richiesta. Non conosce il motore: riceve container, parametri e api.
   Lo stesso file gira dentro il gioco e dentro tools/sandbox.html.

   Ogni azione è sempre "legale" (non esiste un travaso sbagliato, solo
   travasi che non portano ancora al bersaglio): niente testoErrato, come
   negli altri puzzle a stato (scorrimento, disposizione).

   Nessun contenuto narrativo e nessuna soluzione stanno qui dentro:
   capienze e bersaglio arrivano da `parametri`. La dimostrazione che il
   bersaglio sia raggiungibile, e in quante mosse minime, sta nello script
   di verifica di tools/verifiche — questo file non lo sa e non deve saperlo.

   parametri: {
     domanda: 'consegna, può contenere HTML semplice (<br>, <em>)',
     capienze: { a: 5, b: 9 },                 // litri, uno per secchio
     bersaglio: { secchio: 'a', litri: 4 },     // quale secchio e quanti litri
     etichette: { a: 'secchio da 5 litri', b: 'secchio da 9 litri' },  // minuscolo, per l'aria-label
     testoCorretto: 'messaggio al bersaglio raggiunto'
   }

   api: { risolto(), registraListener(t,ev,fn,opts), abilitaDropZone(...), inventario() }
   ========================================================================= */
window.Puzzles = window.Puzzles || {};

Puzzles.travaso = {
  // Parametri d'esempio per tools/sandbox.html — non li usa il motore.
  esempio: {
    domanda: 'Due secchi vuoti accanto al lavandino: uno da 5 litri, uno da 9.<br><br>' +
             'Riempi, svuota, versa cliccando su un secchio: lascia esattamente 7 litri nel secchio da 9.',
    capienze: { a: 5, b: 9 },
    bersaglio: { secchio: 'b', litri: 7 },
    etichette: { a: 'secchio da 5 litri', b: 'secchio da 9 litri' },
    testoCorretto: 'Il secchio da 9 pesa esattamente il giusto: sette litri, non uno di più.'
  },

  render(container, parametri, api) {
    const p = parametri || {};
    const cap = { a: parseInt((p.capienze || {}).a, 10) || 1, b: parseInt((p.capienze || {}).b, 10) || 1 };
    const bersaglio = { secchio: (p.bersaglio || {}).secchio === 'a' ? 'a' : 'b',
                         litri: parseInt((p.bersaglio || {}).litri, 10) || 0 };
    const etichette = { a: (p.etichette || {}).a || 'primo secchio',
                         b: (p.etichette || {}).b || 'secondo secchio' };

    const stato = { a: 0, b: 0 };
    let tenuto = null;          // 'a' | 'b' | null: il secchio sollevato
    let storico = [];           // stack di {a,b} per l'annulla
    let bloccato = false;

    container.innerHTML = '';

    /* ---------- consegna ---------- */

    const domanda = document.createElement('p');
    domanda.className = 'enigma-domanda';        // mattone condiviso, sta in engine.css
    domanda.innerHTML = p.domanda || '';
    container.appendChild(domanda);

    /* ---------- scena: secchio, lavandino, secchio ---------- */

    const scena = document.createElement('div');
    scena.className = 'pz-trav-scena';
    container.appendChild(scena);

    function creaSecchio(chiave) {
      const wrap = document.createElement('div');
      wrap.className = 'pz-trav-colonna';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pz-trav-secchio';
      // l'altezza riflette la capienza: il secchio più grande si vede più grande
      btn.style.height = (58 + cap[chiave] * 9) + 'px';
      const livello = document.createElement('div');
      livello.className = 'pz-trav-livello';
      btn.appendChild(livello);
      api.registraListener(btn, 'click', () => toccaSecchio(chiave));
      wrap.appendChild(btn);

      const valore = document.createElement('div');
      valore.className = 'pz-trav-valore';
      wrap.appendChild(valore);

      const riempi = document.createElement('button');
      riempi.type = 'button';
      riempi.className = 'pz-trav-azione';
      riempi.textContent = 'Riempi';
      api.registraListener(riempi, 'click', () => riempiSecchio(chiave));
      wrap.appendChild(riempi);

      return { wrap, btn, livello, valore, riempi };
    }

    const colA = creaSecchio('a');
    const colonnaLavandino = document.createElement('div');
    colonnaLavandino.className = 'pz-trav-colonna';
    // vaschetta vera (orlo, vasca, scarico, tubo), non un'icona: si legge
    // subito come lavandino anche senza etichetta
    const lavandino = document.createElement('button');
    lavandino.type = 'button';
    lavandino.className = 'pz-trav-lavandino';
    lavandino.setAttribute('aria-label', 'Lavandino: svuota qui il secchio sollevato');
    lavandino.innerHTML =
      '<span class="pz-trav-lav-orlo" aria-hidden="true"></span>' +
      '<span class="pz-trav-lav-vasca" aria-hidden="true">' +
        '<span class="pz-trav-lav-scarico"></span>' +
        '<span class="pz-trav-lav-tappo"></span>' +
      '</span>' +
      '<span class="pz-trav-lav-tubo" aria-hidden="true"></span>';
    api.registraListener(lavandino, 'click', () => svuota());
    colonnaLavandino.appendChild(lavandino);
    const spazioLavandino = document.createElement('div');
    spazioLavandino.className = 'pz-trav-vuoto';
    colonnaLavandino.appendChild(spazioLavandino);
    const colB = creaSecchio('b');

    scena.appendChild(colA.wrap);
    scena.appendChild(colonnaLavandino);
    scena.appendChild(colB.wrap);

    const colonne = { a: colA, b: colB };

    /* ---------- mosse, annulla, ricomincia: una riga sotto la scena,
       centrata — non affiancata al puzzle ---------- */

    const barra = document.createElement('div');
    barra.className = 'pz-trav-barra';
    container.appendChild(barra);

    const contatore = document.createElement('div');
    contatore.className = 'pz-trav-mosse';
    barra.appendChild(contatore);

    const rigaBottoni = document.createElement('div');
    rigaBottoni.className = 'pz-trav-riga-bottoni';
    barra.appendChild(rigaBottoni);

    const btnAnnulla = document.createElement('button');
    btnAnnulla.type = 'button';
    btnAnnulla.className = 'pz-trav-secondario';
    btnAnnulla.textContent = 'Annulla';
    api.registraListener(btnAnnulla, 'click', () => annulla());
    rigaBottoni.appendChild(btnAnnulla);

    const btnRicomincia = document.createElement('button');
    btnRicomincia.type = 'button';
    btnRicomincia.className = 'pz-trav-secondario';
    btnRicomincia.textContent = 'Ricomincia';
    api.registraListener(btnRicomincia, 'click', () => ricomincia());
    rigaBottoni.appendChild(btnRicomincia);

    /* ---------- esito ---------- */

    const esito = document.createElement('div');
    esito.className = 'enigma-esito';            // mattone condiviso
    esito.setAttribute('role', 'status');        // annunciato dai lettori di schermo
    container.appendChild(esito);

    /* ---------- comportamento ---------- */

    function salvaStorico() {
      storico.push({ a: stato.a, b: stato.b });
    }

    function vinta() {
      return stato[bersaglio.secchio] === bersaglio.litri;
    }

    function aggiorna() {
      ['a', 'b'].forEach(chiave => {
        const col = colonne[chiave];
        const pct = Math.round((stato[chiave] / cap[chiave]) * 100);
        col.livello.style.height = pct + '%';
        col.valore.textContent = stato[chiave] + ' L';
        col.btn.disabled = bloccato;
        col.btn.classList.toggle('pz-trav-secchio--tenuto', tenuto === chiave);
        col.btn.setAttribute('aria-pressed', tenuto === chiave ? 'true' : 'false');
        col.btn.setAttribute('aria-label',
          'Solleva il ' + etichette[chiave] + ', contiene ' + stato[chiave] + ' litri');
        col.riempi.disabled = bloccato || stato[chiave] === cap[chiave];
        col.riempi.setAttribute('aria-label', 'Riempi il ' + etichette[chiave] + ' alla fonte');
      });

      lavandino.disabled = bloccato;
      lavandino.classList.toggle('pz-trav-lavandino--attivo', tenuto !== null);

      btnAnnulla.disabled = bloccato || storico.length === 0;
      btnRicomincia.disabled = bloccato || (stato.a === 0 && stato.b === 0 && storico.length === 0);

      contatore.textContent = storico.length === 1 ? '1 mossa' : storico.length + ' mosse';
    }

    function controllaVittoria() {
      if (!vinta()) return;
      bloccato = true;
      aggiorna();
      esito.className = 'enigma-esito ok';
      esito.textContent = p.testoCorretto || 'Il livello è quello giusto.';
      setTimeout(() => api.risolto(), 750);
    }

    function toccaSecchio(chiave) {
      if (bloccato) return;

      if (tenuto === null) {
        if (stato[chiave] > 0) tenuto = chiave;
        aggiorna();
        return;
      }
      if (tenuto === chiave) {
        tenuto = null;
        aggiorna();
        return;
      }

      const destinazione = chiave;
      const spazio = cap[destinazione] - stato[destinazione];
      const travasati = Math.min(stato[tenuto], spazio);
      if (travasati > 0) {
        salvaStorico();
        stato[tenuto] -= travasati;
        stato[destinazione] += travasati;
      }
      tenuto = null;
      aggiorna();
      controllaVittoria();
    }

    function svuota() {
      if (bloccato) return;
      if (tenuto === null || stato[tenuto] === 0) {
        tenuto = null;
        aggiorna();
        return;
      }
      salvaStorico();
      stato[tenuto] = 0;
      tenuto = null;
      aggiorna();
      controllaVittoria();
    }

    function riempiSecchio(chiave) {
      if (bloccato || stato[chiave] === cap[chiave]) return;
      salvaStorico();
      stato[chiave] = cap[chiave];
      tenuto = null;
      aggiorna();
      controllaVittoria();
    }

    function annulla() {
      if (bloccato || !storico.length) return;
      const prec = storico.pop();
      stato.a = prec.a;
      stato.b = prec.b;
      tenuto = null;
      aggiorna();
    }

    function ricomincia() {
      if (bloccato) return;
      stato.a = 0;
      stato.b = 0;
      tenuto = null;
      storico = [];
      aggiorna();
    }

    aggiorna();
  }
};
