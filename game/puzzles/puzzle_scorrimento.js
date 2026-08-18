/* =========================================================================
   PUZZLE — Scorrimento (sliding puzzle)
   Griglia di tessere con una casella vuota: si tocca una tessera adiacente
   (ortogonalmente) al vuoto per farla scivolare. Obiettivo: tessere in
   ordine crescente da sinistra a destra, riga per riga, vuoto nell'ultima
   posizione. Non conosce il motore: riceve container, parametri e api.
   Lo stesso file gira dentro il gioco e dentro tools/sandbox.html.

   Le tessere possono portare un NUMERO oppure un pezzo di un'IMMAGINE. Il
   modello sotto è numerico in entrambi i casi: `griglia` resta una
   permutazione di 0..n e la vittoria resta l'ordine crescente. L'immagine è
   solo la pelle — per questo la verifica di risolvibilità in
   tools/verifiche/s4_e3_scorrimento.py vale identica nei due casi.

   Nessun contenuto narrativo e nessuna soluzione stanno qui dentro:
   la griglia iniziale arriva da `parametri`. Ogni mossa è sempre legale
   (si tocca solo una tessera adiacente al vuoto): non esiste un tentativo
   "sbagliato" da segnalare, solo l'arrivo o meno al goal.

   parametri: {
     domanda: 'consegna, può contenere HTML semplice (<br>, <em>)',
     righe: 3,
     colonne: 3,
     griglia: [4,0,3, 2,1,8, 7,6,5],   // stato iniziale, riga per riga.
                                        // 0 = casella vuota. Deve essere
                                        // una permutazione risolvibile di
                                        // 0..(righe*colonne - 1) — la
                                        // risolvibilità si dimostra in
                                        // tools/verifiche, non qui.

     // --- facoltativi: senza `immagine` le tessere restano numerate ---
     immagine: 'assets/img/pz_scheda.png',  // percorso relativo al documento
     rapporto: 1,        // larghezza/altezza dell'IMMAGINE. 1 = quadrata,
                         // 1.5 per una 3:2. La griglia prende questo
                         // aspect-ratio e l'immagine ci viene stesa sopra
                         // esatta: se il rapporto è sbagliato, si deforma.
     numeri: false,      // true rimette il numero in un angolo, come aiuto
     anteprima: true,    // miniatura dell'immagine completa sopra la griglia
     testoImmagineMancante: 'avviso se il file non si carica',

     testoCorretto: 'messaggio a griglia ricomposta'
   }

   api: { risolto(), registraListener(t,ev,fn,opts), abilitaDropZone(...), inventario() }
   ========================================================================= */
window.Puzzles = window.Puzzles || {};

Puzzles.scorrimento = {
  // Parametri d'esempio per tools/sandbox.html — non li usa il motore.
  esempio: {
    domanda: 'Nove schede di restauro strappate. Ricomponile scorrendo le tessere: ' +
             'tocca quella adiacente allo spazio vuoto per spostarla.',
    righe: 3,
    colonne: 3,
    griglia: [4, 0, 3, 2, 1, 8, 7, 6, 5],
    testoCorretto: 'Le nove schede tornano a formare un unico foglio.'
  },

  render(container, parametri, api) {
    const p = parametri || {};
    container.innerHTML = '';

    const righe = Math.max(2, parseInt(p.righe, 10) || 3);
    const colonne = Math.max(2, parseInt(p.colonne, 10) || 3);
    const stato = (Array.isArray(p.griglia) ? p.griglia : []).slice();

    const rapporto = parseFloat(p.rapporto) > 0 ? parseFloat(p.rapporto) : 1;
    // `conImmagine` parte ottimista e si spegne se il file non si carica:
    // meglio un puzzle numerato che una griglia di riquadri vuoti.
    let conImmagine = !!p.immagine;
    const conNumeri = conImmagine ? !!p.numeri : true;

    let bloccato = false;

    /* ---------- consegna ---------- */

    const domanda = document.createElement('p');
    domanda.className = 'enigma-domanda';        // mattone condiviso, sta in engine.css
    domanda.innerHTML = p.domanda || '';
    container.appendChild(domanda);

    /* ---------- anteprima (solo con immagine) ---------- */

    let anteprima = null;
    if (conImmagine && p.anteprima) {
      anteprima = document.createElement('div');
      anteprima.className = 'pz-scorr-anteprima';
      anteprima.style.backgroundImage = 'url("' + p.immagine + '")';
      anteprima.style.aspectRatio = String(rapporto);
      // decorativa: il disegno completo è un aiuto, non un'informazione
      // che manchi altrove, e chi usa un lettore di schermo non ci perde nulla
      anteprima.setAttribute('aria-hidden', 'true');
      container.appendChild(anteprima);
    }

    /* ---------- griglia ---------- */

    const griglia = document.createElement('div');
    griglia.className = 'pz-scorr-griglia';
    griglia.style.gridTemplateColumns = 'repeat(' + colonne + ', 1fr)';
    if (conImmagine) {
      griglia.classList.add('pz-scorr-griglia--img');
      griglia.style.aspectRatio = String(rapporto);
    }
    griglia.setAttribute('role', 'group');
    griglia.setAttribute('aria-label', 'Tessere scorrevoli, ' + righe + ' righe per ' + colonne + ' colonne');
    container.appendChild(griglia);

    const celle = stato.map((_, i) => {
      const cella = document.createElement('button');
      cella.type = 'button';
      cella.className = 'pz-scorr-tessera';
      griglia.appendChild(cella);
      api.registraListener(cella, 'click', () => tocca(i));
      return cella;
    });

    /* ---------- esito ---------- */

    const esito = document.createElement('div');
    esito.className = 'enigma-esito';            // mattone condiviso
    esito.setAttribute('role', 'status');        // annunciato dai lettori di schermo
    container.appendChild(esito);

    /* ---------- comportamento ---------- */

    function adiacenti(i, j) {
      const ri = Math.floor(i / colonne), ci = i % colonne;
      const rj = Math.floor(j / colonne), cj = j % colonne;
      return (ri === rj && Math.abs(ci - cj) === 1) || (ci === cj && Math.abs(ri - rj) === 1);
    }

    function vinta() {
      for (let i = 0; i < stato.length - 1; i++) {
        if (stato[i] !== i + 1) return false;
      }
      return stato[stato.length - 1] === 0;
    }

    // Quale pezzo d'immagine porta la tessera di valore `v`: quello della
    // casella che occuperà a puzzle risolto, cioè la v-1esima. Dipende dal
    // VALORE, non da dove la tessera si trova adesso — è per questo che il
    // disegno segue la tessera mentre scivola.
    function sfondoDi(v) {
      const col = (v - 1) % colonne;
      const rig = Math.floor((v - 1) / colonne);
      return {
        size: (colonne * 100) + '% ' + (righe * 100) + '%',
        // con una sola colonna/riga il denominatore sarebbe 0: lì il pezzo
        // è unico e la posizione non ha gradi di libertà
        pos: (colonne > 1 ? (col / (colonne - 1)) * 100 : 0) + '% ' +
             (righe   > 1 ? (rig / (righe   - 1)) * 100 : 0) + '%'
      };
    }

    function aggiorna() {
      stato.forEach((valore, i) => {
        const cella = celle[i];

        if (valore === 0) {
          cella.innerHTML = '';
          cella.className = 'pz-scorr-tessera pz-scorr-vuota';
          cella.style.backgroundImage = '';
          cella.disabled = true;
          cella.setAttribute('aria-hidden', 'true');
          return;
        }

        cella.className = 'pz-scorr-tessera' + (conImmagine ? ' pz-scorr-tessera--img' : '');
        cella.disabled = bloccato;
        cella.removeAttribute('aria-hidden');
        // l'etichetta resta numerica anche a tessere illustrate: il valore
        // sotto c'è comunque, e senza di essa il puzzle sarebbe muto
        cella.setAttribute('aria-label', 'Tessera ' + valore);

        if (conImmagine) {
          const sf = sfondoDi(valore);
          cella.style.backgroundImage = 'url("' + p.immagine + '")';
          cella.style.backgroundSize = sf.size;
          cella.style.backgroundPosition = sf.pos;
          cella.innerHTML = conNumeri
            ? '<span class="pz-scorr-numero">' + valore + '</span>'
            : '';
        } else {
          cella.style.backgroundImage = '';
          cella.textContent = String(valore);
        }
      });
    }

    function tocca(i) {
      if (bloccato || stato[i] === 0) return;
      const vuoto = stato.indexOf(0);
      if (!adiacenti(i, vuoto)) return;

      stato[vuoto] = stato[i];
      stato[i] = 0;
      aggiorna();

      if (vinta()) {
        bloccato = true;
        celle.forEach(c => { c.disabled = true; });
        esito.className = 'enigma-esito ok';
        esito.textContent = p.testoCorretto || 'Le tessere sono in ordine.';
        setTimeout(() => api.risolto(), 750);
      }
    }

    /* ---------- caricamento dell'immagine ----------
       Un Image() e i suoi eventi, non fetch(): su file:// fetch è bloccato,
       questo no. Se il file non c'è si torna ai numeri e lo si dice, invece
       di lasciare in mano al giocatore otto riquadri vuoti. */

    if (conImmagine) {
      const prova = new Image();
      prova.onerror = () => {
        conImmagine = false;
        griglia.classList.remove('pz-scorr-griglia--img');
        griglia.style.aspectRatio = '';
        if (anteprima) anteprima.remove();
        esito.className = 'enigma-esito ko';
        esito.textContent = p.testoImmagineMancante ||
          'L’immagine non si carica: tessere numerate come ripiego.';
        aggiorna();
      };
      prova.src = p.immagine;
    }

    aggiorna();
  }
};
