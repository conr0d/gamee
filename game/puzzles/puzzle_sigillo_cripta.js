/* =========================================================================
   PUZZLE — Sigillo della Cripta
   Quattro caselle vuote accettano, in qualunque ordine, le quattro chiavi
   trovate nel museo (trascinate dall'inventario). Incastrate tutte e
   quattro, l'enigma è risolto. Non conosce il motore: riceve container,
   parametri e api. Lo stesso file gira dentro il gioco e dentro
   tools/sandbox.html.

   Non è un enigma a risposta ma un gate d'inventario: nessuna verifica di
   unicità da dimostrare in tools/verifiche/. Il meccanismo a cifre che
   segue non sta più qui: è un enigma a sé, nella stanza dell'altare.

   Nella sandbox il drag non esiste (vedi tools/sandbox.html): l'api finta
   simula un drop con un click sulla casella, ma passa l'idAtteso che le è
   stato dato — qui è `null` (qualunque chiave va bene in qualunque
   casella), quindi in sandbox il click da solo non basta a completarlo.
   Verifica il flusso completo delle chiavi nel gioco vero, dove il drag
   trascina l'id reale dell'oggetto.

   Nessun contenuto narrativo sta qui dentro: arriva tutto da `parametri`.

   parametri: {
     domanda: 'consegna: quattro incavi vuoti',
     chiaviAttese: ['s1-E3-ricompensa', 's2-E2-ricompensa',
                    's4-E3-ricompensa', 's3-I1'],   // id degli oggetti-chiave
     testoCorretto: 'messaggio quando le 4 chiavi sono incastrate'
   }

   api: { risolto(), registraListener(t,ev,fn,opts), abilitaDropZone(...),
          inventario(), consumaOggetto(id), progresso(), salvaProgresso(dati) }

   Le chiavi incastrate si ricordano: `salvaProgresso([id, …])` a ogni
   incastro, `progresso()` alla riapertura. Senza, uscire dalla schermata a
   metà perderebbe chiavi già consumate dall'inventario — irrecuperabili.
   ========================================================================= */
window.Puzzles = window.Puzzles || {};

Puzzles.sigilloCripta = {
  // Parametri d'esempio per tools/sandbox.html — non li usa il motore.
  esempio: {
    domanda: 'Il sigillo ha quattro incavi vuoti, sagomati per accogliere le chiavi trovate nel museo.',
    chiaviAttese: ['chiave-falco', 'chiave-scriba', 'chiave-restauro', 'chiave-biblioteca'],
    testoCorretto: 'Le quattro chiavi scattano in sede. Il sigillo si apre.'
  },

  render(container, parametri, api) {
    const p = parametri || {};
    const chiaviAttese = Array.isArray(p.chiaviAttese) ? p.chiaviAttese.slice() : [];
    container.innerHTML = '';

    // Le chiavi già incastrate in una visita precedente: uscire dalla
    // schermata non le fa cadere. Il motore le tiene per noi (api.progresso /
    // api.salvaProgresso) perché gli oggetti sono già stati consumati
    // dall'inventario e senza memoria diventerebbero irrecuperabili.
    const salvate = (api.progresso && api.progresso()) || [];
    const piazzate = new Set(salvate.filter(id => chiaviAttese.indexOf(id) !== -1));

    /* ---------- consegna ---------- */

    const domanda = document.createElement('p');
    domanda.className = 'enigma-domanda';        // mattone condiviso, sta in engine.css
    domanda.innerHTML = p.domanda || '';
    container.appendChild(domanda);

    /* ---------- caselle ---------- */

    const caselle = document.createElement('div');
    caselle.className = 'pz-sigillo-caselle';
    caselle.setAttribute('role', 'group');
    caselle.setAttribute('aria-label', 'Incavi per le chiavi');
    container.appendChild(caselle);

    const stato = document.createElement('p');
    stato.className = 'pz-sigillo-stato';
    stato.setAttribute('aria-live', 'polite');
    container.appendChild(stato);

    function aggiornaStato() {
      stato.textContent = piazzate.size + ' di ' + chiaviAttese.length + ' chiavi incastrate.';
    }

    chiaviAttese.forEach((_, indice) => {
      const casella = document.createElement('div');
      casella.className = 'pz-sigillo-casella';
      // le caselle già occupate si ridisegnano piene: sono le prime tante
      // quante le chiavi ricordate (l'ordine non conta, mai contato)
      if (indice < piazzate.size) casella.classList.add('pz-sigillo-casella--piena');
      caselle.appendChild(casella);

      const riempi = (idOggetto) => {
        if (casella.classList.contains('pz-sigillo-casella--piena')) return;
        if (piazzate.has(idOggetto)) return;
        if (chiaviAttese.indexOf(idOggetto) === -1) return;

        piazzate.add(idOggetto);
        casella.classList.add('pz-sigillo-casella--piena');
        api.consumaOggetto(idOggetto);
        if (api.salvaProgresso) api.salvaProgresso([...piazzate]);
        aggiornaStato();

        if (piazzate.size === chiaviAttese.length) concludi();
      };

      // idAtteso null: la casella accetta una qualunque chiave ancora
      // mancante, non una specifica — l'ordine non conta. Si riempie solo
      // per drag&drop reale (api.abilitaDropZone): niente scorciatoie a
      // click, altrimenti si aggirerebbe la ricerca delle chiavi vere.
      api.abilitaDropZone(casella, null, riempi);
    });

    aggiornaStato();

    // rientro a chiavi già tutte incastrate: non può capitare (l'enigma è
    // risolto e il motore non lo riapre), ma se capitasse si conclude subito
    if (piazzate.size === chiaviAttese.length && chiaviAttese.length) concludi();

    function concludi() {
      const esito = document.createElement('div');
      esito.className = 'enigma-esito ok';
      esito.setAttribute('role', 'status');
      esito.textContent = p.testoCorretto || 'Le chiavi sono al loro posto.';
      container.appendChild(esito);

      // il tempo di leggere lo scatto, poi la schermata si chiude da sola
      setTimeout(() => api.risolto(), 900);
    }
  }
};
