/* =========================================================================
   PUZZLE — Scelta multipla
   Non conosce il motore: riceve container, parametri e api.
   Lo stesso file gira dentro il gioco e dentro tools/sandbox.html.

   Un'opzione può essere di due forme:

     'Teca 4'                      → riga con pallino-lettera e testo (default)

     { immagine: 'assets/img/reperti/r4.svg',
       testo: '4',
       alt: 'Reperto 4: specchio di bronzo, senza iscrizioni' }
                                   → tessera illustrata: disegno grande e
                                     numero nel pallino sotto. Le opzioni
                                     illustrate si dispongono a griglia.

   `alt` non si vede: finisce nell'aria-label del bottone ed è l'unico modo
   che ha chi non vede i disegni di risolvere un enigma tutto visivo. Va
   scritto sempre quando si usa `immagine`.

   parametri: {
     domanda: 'testo, può contenere HTML semplice (<br>, <em>)',
     opzioni: [...],            // stringhe oppure oggetti, vedi sopra
     indiceCorretto: 1,
     testoCorretto: 'messaggio alla risposta giusta',
     testoErrato:   'messaggio alla risposta sbagliata'
   }

   api: { risolto(), registraListener(t,ev,fn), abilitaDropZone(...), inventario() }
   ========================================================================= */
window.Puzzles = window.Puzzles || {};

Puzzles.sceltaMultipla = {
  // Parametri d'esempio per tools/sandbox.html — non li usa il motore.
  esempio: {
    domanda: 'Sulla pagina ingiallita:<br><br><em>«Cammina su quattro zampe al mattino, ' +
             'su due a mezzogiorno e su tre la sera. Chi è?»</em>',
    opzioni: ['Il coccodrillo del Nilo', 'L’uomo', 'Lo scarabeo stercorario', 'Il dio Anubi'],
    indiceCorretto: 1,
    testoCorretto: 'Il leggio scatta e libera un cassetto nascosto.',
    testoErrato: 'Nulla si muove. La pagina resta muta.'
  },

  render(container, parametri, api) {
    const lettere = 'ABCDEFGH';
    const opzioni = parametri.opzioni || [];
    // basta una sola opzione illustrata perché il gruppo diventi una vetrina:
    // mescolare righe di testo e tessere darebbe una griglia sbilenca
    const conImmagini = opzioni.some(o => o && typeof o === 'object' && o.immagine);

    container.innerHTML = '';

    const domanda = document.createElement('p');
    domanda.className = 'enigma-domanda';        // mattone condiviso, sta in engine.css
    domanda.innerHTML = parametri.domanda || '';
    container.appendChild(domanda);

    const scelte = document.createElement('div');
    scelte.className = 'pz-scelte' + (conImmagini ? ' pz-scelte--vetrina' : '');
    container.appendChild(scelte);

    const esito = document.createElement('div');
    esito.className = 'enigma-esito';            // mattone condiviso
    esito.setAttribute('role', 'status');        // annunciato dai lettori di schermo
    container.appendChild(esito);

    opzioni.forEach((opzione, i) => {
      const oggetto = opzione && typeof opzione === 'object' ? opzione : null;
      const testo = oggetto ? (oggetto.testo || String(i + 1)) : opzione;

      const btn = document.createElement('button');
      btn.type = 'button';

      if (oggetto && oggetto.immagine) {
        btn.className = 'pz-scelta pz-scelta--img';
        const img = document.createElement('img');
        img.className = 'pz-scelta-disegno';
        img.src = oggetto.immagine;
        // il bottone porta già l'etichetta completa: ripeterla sull'immagine
        // farebbe annunciare due volte la stessa cosa
        img.alt = '';
        img.setAttribute('aria-hidden', 'true');
        btn.appendChild(img);

        const numero = document.createElement('span');
        numero.className = 'pz-scelta-numero';
        numero.textContent = testo;
        btn.appendChild(numero);

        // senza didascalie a schermo, questa è l'unica descrizione del reperto
        btn.setAttribute('aria-label', oggetto.alt || testo);
      } else {
        btn.className = 'pz-scelta';
        btn.innerHTML = '<span class="pz-lettera">' + lettere[i] + '</span><span>' + testo + '</span>';
      }

      api.registraListener(btn, 'click', () => {
        if (i === parametri.indiceCorretto) {
          btn.classList.add('corretta');
          scelte.querySelectorAll('button').forEach(b => b.disabled = true);
          esito.className = 'enigma-esito ok';
          esito.textContent = parametri.testoCorretto || 'Esatto.';
          setTimeout(() => api.risolto(), 750);
        } else {
          btn.classList.add('errata');
          btn.disabled = true;
          esito.className = 'enigma-esito ko';
          esito.textContent = parametri.testoErrato || 'Non è la risposta giusta.';
        }
      });
      scelte.appendChild(btn);
    });
  }
};
