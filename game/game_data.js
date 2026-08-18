/* =========================================================================
   MUSEO DEL FARAONE — CONTENUTO DEL GIOCO

   Qui c'è TUTTO ciò che è contenuto: stanze, testi, percorsi delle immagini,
   parametri degli enigmi. Il motore non conosce nulla di tutto questo.
   Nessuna funzione: se serve logica, quella sta in /puzzles.

   È un .js e non un .json di proposito: caricato con un normale <script src>
   funziona anche aprendo il gioco con un doppio clic (file://), dove Chrome
   di norma blocca fetch() e i moduli ES.

     LA MAPPA
                                  ▲ d1 Bagno
                                  │
  s1 Magazzino ──▶ s2 Sala Centrale ──▶ s3 Biblioteca
                                  │              │
                                  ▼              ▼
                      sF Cripta Segreta   s4 Sala Restauri
                          │ (le 4 chiavi)         │
                          ▼                       ▼
                      sF-Altar (TESORO)   d2 Ufficio Direttore
                                                   │
                                                   ▼ (scorciatoia)
                                          s3 Biblioteca

   La sigla è l'id della stanza: s… il percorso principale, sF la stanza
   finale, d… le diramazioni. Gli id degli hotspot sono sempre prefissati
   con l'id della stanza, poi la sigla del tipo — I item, F piume, T toast,
   E enigmi — e un progressivo: s2-T1, d2-I1, sF-E1.

   sF-Altar sta oltre il sigillo: ci si arriva solo incastrando le quattro
   chiavi in sF, e da lì non si torna indietro.

   Ogni stanza dichiara la sua immagine e il `pan.rapporto` di quell'immagine:
   senza il rapporto il motore la ritaglia con cover e le coordinate degli
   hotspot non cadono più sui punti scelti.

   Ogni enigma è già scritto e verificato: per ciascuno c'è uno script in
   tools/verifiche/ che ne dimostra l'unicità della risposta. Restano da
   riempire alcune frasi d'ambiente: l'elenco sta in testi/testi_da_scrivere.md.
   ========================================================================= */

const GAME_DATA = {

  avvio: 's1',

  configurazione: {
    // capienze: 5 cerchi per gli oggetti, 5 punti per le piume
    maxSlotInventario: 5,
    maxPiume: 5,
    // true: tutte le uscite sono percorribili ignorando gli enigmi della stanza.
    // Da tenere false in partita: l'uscita principale si apre solo quando ogni
    // enigma della stanza è risolto.
    spostamentiSempreAttivi: false,
    // false: le zone restano cliccabili ma non si vedono (per le scene con immagini vere)
    hotspotVisibili: false,
    // quanto è grande una stanza rispetto allo schermo, quando non lo dice lei.
    // {x:1, y:1} = la stanza sta tutta nella finestra e non si trascina.
    pan: { x: 1, y: 1 },
    // COLLAUDO — true: niente tutorial, zaino piume sempre pieno (l'AIUTO non
    // si consuma mai), tutte le uscite libere ignorando gli enigmi della
    // stanza. Serve per girare le stanze avanti e indietro senza rifare da
    // capo ogni volta. Rimettere false prima di consegnare il gioco.
    testMode: true
  },

  // testi del motore: stanno qui e non in engine.js, come tutto il resto
  testi: {
    piumePiene: 'Usa prima le piume raccolte',
    tutorial1: 'Muoviti e clicca nella stanza per iniziare investigare',
    tutorial2: 'Hai appena trovato una piuma aiuto, usala saggiamente',
    tutorial3: 'Hai trovato un enigma! Risolvi tutti gli enigmi della stanza e potrai procedere alla stanza successiva',
    tutorial4: 'Hai appena trovato una chiave? Controlla il tuo inventario',
    // uscita sbarrata: {fatti} e {totale} li riempie il motore
    viaSbarrata: 'La via è ancora sbarrata: risolvi tutti gli enigmi della stanza ({fatti}/{totale} risolti).',

    // --- messaggi e pulsanti del motore ---
    enigmaGiaRisolto: 'Hai già risolto questo enigma.',
    enigmaBloccato: 'Manca qualcosa per proseguire qui.',
    puzzleMancante: 'Questa meccanica non è disponibile.',
    inventarioPienoTitolo: 'Inventario pieno',
    inventarioPieno: 'Non hai più spazio. Scarta qualcosa per fare posto.',
    nessunaPiumaTitolo: 'Nessuna piuma',
    nessunaPiuma: 'Non hai piume d’aiuto. Cercane in giro per il museo.',
    // {nome} è quello dell'oggetto
    scartoDomanda: 'Scartare {nome}?',
    scartoAvviso: 'Torna dov’era, se quella stanza è ancora raggiungibile. Altrimenti è perso.',
    btnPrendi: 'Prendi',
    btnLascia: 'Lascia',
    btnScarta: 'Scarta',
    btnAnnulla: 'Annulla',
    btnEntra: 'Entra',

    // --- etichette lette dai lettori di schermo (non si vedono a schermo) ---
    ariaPiuma: 'Piuma d’aiuto',
    ariaOggetto: 'Raccogli: {nome}',
    ariaEnigma: 'Enigma: {nome}',
    ariaEnigmaRisolto: 'Enigma risolto: {nome}',
    ariaTesto: 'Osserva',
    // {n} piume su {max}
    ariaPiume: '{n} piume d’aiuto su {max}',
    // nome di ripiego per un oggetto senza nome nei dati
    oggettoSenzaNome: 'Oggetto',
    piumaNome: 'Piuma d’Aiuto',
    piumaDescrizione: 'Una piuma spendibile per un indizio.'
  },

  stanze: {

    /* ---------------- PERCORSO PRINCIPALE ---------------- */

    s1: {
      tipo: 'principale',
      // posizione (percentuali di assets/img/map/gamemap1.png) del riquadro
      // di nebbia che copre "Magazzino" finché non si è visitata la stanza,
      // e dove appoggiare il segnalino quando si è qui — vedi Engine._apriMappa
      nomeMappa: 'Magazzino',
      mappa: { x: 17, y: 24, larghezza: 18, altezza: 9 },
      immagine: 'assets/img/map/s1.png',
      // s1.png è 1672x940: rapporto 1672/940. Dichiarandolo la stanza si vede
      // INTERA, senza ritagli, e l'eccedenza si guarda trascinando il dito.
      pan: { rapporto: 1672/940 },
      uscite: [
        { verso: 's2', tipo: 'procedi', posX: 84.4, posY: 49.7, direzione: 'destra' }
      ],
      // Coordinate scelte con tools/coordinate.html sopra s1.png. Sono
      // percentuali della STANZA: con pan.rapporto la stanza è l'immagine
      // intera, quindi indicano un punto preciso del magazzino.
      // Contenuti ancora vuoti: per ora conta che il tocco apra il guscio.
      hotspot: [
        { id: 's1-F1', tipo: 'piuma', posX: 29.3, posY: 33.9,
          nome: 'Piuma d’Aiuto',
          descrizione: '' },

        { id: 's1-E1', tipo: 'enigma', posX: 18.7, posY: 69.3,
          nome: 'I Quattro Coperchi',
          indizio: 'Comincia dai due che non possono stare al centro: falco e sciacallo sono uno accanto all’altro, non separati.',
          spiegazione: 'Falco e babbuino occupano gli estremi, quindi sciacallo e uomo stanno nei due posti centrali. Lo sciacallo è subito a sinistra dell’uomo: sciacallo in seconda, uomo in terza. Resta da decidere quale estremo tocca al falco, e lo dice l’ultimo vincolo: falco e sciacallo affiancati, quindi il falco è primo e il babbuino ultimo. Falco, Sciacallo, Uomo, Babbuino.',
          ricompensa: null,
          // Unicità dimostrata in tools/verifiche/s1_e1_canopi.py (permutazioni
          // delle 4 posizioni, 3 indizi tutti necessari, --test stampa OK). Lo
          // stesso script verifica anche che ordineIniziale sia una permutazione
          // valida di ordineCorretto e non coincida già con la soluzione.
          //
          // Puzzle a disposizione (arrange): si tocca un vaso per selezionarlo,
          // poi un secondo per scambiarli di posto. Nessun bottone di conferma,
          // l'ordine si controlla da solo dopo ogni scambio.
          puzzle: 'disposizione',
          parametri: {
            domanda: 'Sulla mensola, quattro vasi in fila, mischiati. ' +
                     'Un cartiglio ai piedi della fila recita:<br><br>' +
                     '<em>«Lo sciacallo è subito a sinistra dell’uomo.<br>' +
                     'Il falco e il babbuino occupano i due estremi della mensola.<br>' +
                     'Il falco e lo sciacallo sono affiancati, senza nulla tra loro.»</em><br><br>' +
                     'Tocca due vasi per scambiarli, finché l’ordine non è quello giusto.',
            elementi: [
              { id: 'falco', immagine: 'assets/img/vasi/falco.svg',
                alt: 'Vaso col coperchio a testa di falco' },
              { id: 'sciacallo', immagine: 'assets/img/vasi/sciacallo.svg',
                alt: 'Vaso col coperchio a testa di sciacallo' },
              { id: 'uomo', immagine: 'assets/img/vasi/uomo.svg',
                alt: 'Vaso col coperchio a testa umana' },
              { id: 'babbuino', immagine: 'assets/img/vasi/babbuino.svg',
                alt: 'Vaso col coperchio a testa di babbuino' }
            ],
            ordineIniziale: ['babbuino', 'falco', 'uomo', 'sciacallo'],
            ordineCorretto: ['falco', 'sciacallo', 'uomo', 'babbuino'],
            testoCorretto: 'I quattro vasi risuonano un istante, come vuoti. Qualcosa dentro si è sbloccato.'
          } },

        { id: 's1-T1', tipo: 'testo', posX: 30.6, posY: 61.9,
          testo: 'Qui non c’è niente.' },

        { id: 's1-T2', tipo: 'testo', posX: 72, posY: 22.6,
          testo: 'Da qui sei entrato!' },

        { id: 's1-T3', tipo: 'testo', posX: 75.8, posY: 71.3,
          testo: 'Qui non c\'è nulla di utile' },

        { id: 's1-E2', tipo: 'enigma', posX: 84.4, posY: 49.7,
          nome: 'Il Baule del Magazziniere',
          indizio: 'Il baule non nasconde il proprio codice: chi lo ha scritto pensava a qualcos’altro che si moltiplica in questa stanza.',
          spiegazione: 'Il baule non contiene il proprio codice: l’iscrizione «chi sa raddoppiare il grano» rimanda alle casse di grano della stanza. Il numero perduto della quinta cassa, 1072, è anche la combinazione delle quattro rotelle.',
          ricompensa: null,
          // Meta-enigma: il codice è quello dedotto in S1-E3. Nessun indizio
          // interno da enumerare (il codice "va trovato altrove", vedi la
          // nota in tastierino.py). Coerenza e allineamento con S1-E3
          // dimostrati in tools/verifiche/s1_e2_lucchetto.py (--test -> OK).
          // Lucchetto vero, non tastiera: quattro rotelle da girare su e giù.
          puzzle: 'lucchettoRotelle',
          parametri: {
            domanda: 'Un baule tarlato, chiuso da quattro rotelle di ottone annerito. ' +
                     'Sul coperchio, un’iscrizione quasi cancellata:<br><br>' +
                     '<em>«Chi sa raddoppiare il grano, apre senza chiave.»</em>',
            codice: '1072',
            lunghezza: 4,
            testoCorretto: 'Le rotelle scattano in fila. Il coperchio si solleva con un cigolio.',
            testoErrato: 'Le rotelle girano a vuoto. L’iscrizione resta un enigma.'
          } },

        { id: 's1-E3', tipo: 'enigma', posX: 64.1, posY: 48.8,
          nome: 'Il Grano che Raddoppia',
          indizio: 'Guarda il rapporto tra due numeri vicini, non la loro differenza.',
          spiegazione: 'Le differenze tra le casse crescono e non dicono nulla; i rapporti invece sono sempre 2: 134 è il doppio di 67, 268 di 134, 536 di 268. La quinta cassa porta quindi il doppio di 536, cioè 1072.',
          ricompensa: { nome: 'Chiave di Granito', descrizione: 'Trovata sul fondo della quinta cassa. Una delle quattro che aprono il sigillo della cripta.', chiave: true },
          // Unicità dimostrata in tools/verifiche/s1_e3_raddoppio.py: la
          // progressione geometrica di ragione 2 è l'unica regola compatibile
          // con i quattro numeri dati (--test -> OK).
          puzzle: 'tastierino',
          parametri: {
            domanda: 'Cinque casse in fila. Una nota dello scriba, incollata su un fianco:<br><br>' +
                     '<em>«Ogni cassa contiene il doppio della precedente.»</em><br><br>' +
                     'Le prime quattro portano i numeri: <strong>67, 134, 268, 536</strong>. ' +
                     'Il timbro della quinta è andato perso. Che numero dovrebbe portare?',
            codice: '1072',
            simboli: ['0','1','2','3','4','5','6','7','8','9'],
            lunghezza: 4,
            testoCorretto: 'Il timbro combacia. Sul fondo della cassa, un frammento di papiro.',
            testoErrato: 'Il timbro non combacia con nessun incavo della cassa.'
          } }
      ]
    },

    s2: {
      tipo: 'principale',
      nomeMappa: 'Sala Centrale',
      mappa: { x: 47, y: 56, larghezza: 22, altezza: 9 },
      immagine: 'assets/img/map/s2.png',
      pan: { rapporto: 1380/752 },    // s2.png è 1380x752
      // Tornando da s4 la sala centrale mostra i restauri in corso: s2f.png
      // è 1673x940, rapporto diverso da s2.png quindi va ridichiarato qui.
      immagineVariante: { seVisitata: 's4', immagine: 'assets/img/map/s2f.png', pan: { rapporto: 1673/940 } },
      uscite: [
        { verso: 's3', tipo: 'procedi',  posX: 82.7, posY: 46.4, direzione: 'destra' },
        { verso: 's1', tipo: 'torna',    posX: 30.5, posY: 47.2, direzione: 'sinistra' },
        { verso: 'd1', tipo: 'laterale', posX: 10, posY: 61, direzione: 'sinistra' },
        // Scorciatoia da collaudo: visibile solo su s2f (dopo s4) e solo in
        // testMode, per raggiungere la cripta senza rifare tutto il museo.
        { verso: 'sF', tipo: 'laterale', posX: 52.7, posY: 63.2, direzione: 'giu',
          seVisitata: 's4', soloTest: true }
      ],
      hotspot: [
        { id: 's2-F1', tipo: 'piuma', posX: 37, posY: 34.8,
          nome: 'Piuma d’Aiuto',
          descrizione: '' },

        { id: 's2-T1', tipo: 'testo', posX: 52, posY: 36.8,
          testo: 'Il cuore del museo. Le teche corrono lungo le pareti e da qui si raggiunge ogni altra sala.' },

        { id: 's2-T2', tipo: 'testo', posX: 59.5, posY: 36.9,
          testo: '' },

        { id: 's2-T3', tipo: 'testo', posX: 46.3, posY: 78,
          testo: '' },

        { id: 's2-E1', tipo: 'enigma', posX: 58.8, posY: 64.3,
          nome: 'Il Reperto Falso',
          indizio: 'Il falso non ha né l’una né l’altra proprietà: guarda il colore del metallo e cerca chi non porta alcun segno inciso.',
          spiegazione: 'La regola è un «oppure», non un «e»: per essere autentico basta una delle due proprietà. Il reperto 1 è d’oro pur senza incisioni, i reperti 2 e 5 sono incisi pur non essendo d’oro, il 3 ha entrambe. Solo lo specchio — bronzo scuro, e nessun segno sulla superficie — non è né d’oro né inciso: è il falso.',
          ricompensa: null,
          // Riprogettato per non ripetere S1-E1 (stessa famiglia: ordine per 3
          // indizi). Qui la famiglia è classificazione/intruso: una regola OR,
          // non AND, applicata a 5 reperti. Unicità e non-banalità della
          // connessione logica dimostrate in tools/verifiche/s2_e1_classificazione.py
          // (--test -> OK), che verifica anche la corrispondenza fra il
          // materiale disegnato e la proprietà "oro" dichiarata qui sotto.
          //
          // I cinque reperti non sono più descritti a parole: si guardano.
          // Materiale e incisioni stanno nei disegni di assets/img/reperti/,
          // e il testo di `alt` li ripete SOLO per i lettori di schermo — a
          // video non compare, altrimenti l'enigma si risolverebbe leggendo.
          puzzle: 'sceltaMultipla',
          parametri: {
            domanda: 'Una teca sola, cinque reperti allineati. Una placca di ottone recita:<br><br>' +
                     '<em>«Ogni reperto autentico di questa sala è d’oro, oppure porta ' +
                     'un’iscrizione — o entrambe le cose. Il falso non ha né l’una né l’altra.»</em><br><br>' +
                     'Quale reperto è il falso?',
            opzioni: [
              { immagine: 'assets/img/reperti/r1.svg', testo: '1',
                alt: 'Reperto 1: statuetta d’oro, superficie liscia' },
              { immagine: 'assets/img/reperti/r2.svg', testo: '2',
                alt: 'Reperto 2: amuleto d’argento, inciso' },
              { immagine: 'assets/img/reperti/r3.svg', testo: '3',
                alt: 'Reperto 3: anello d’oro, inciso' },
              { immagine: 'assets/img/reperti/r4.svg', testo: '4',
                alt: 'Reperto 4: specchio di bronzo, superficie liscia' },
              { immagine: 'assets/img/reperti/r5.svg', testo: '5',
                alt: 'Reperto 5: pettine d’avorio, inciso' }
            ],
            indiceCorretto: 3,
            testoCorretto: 'Il vetro davanti al reperto si appanna, come se qualcosa dentro avesse trattenuto il fiato per secoli.',
            testoErrato: 'Il vetro resta immobile. Quel reperto rispetta la regola.'
          } },

        { id: 's2-F2', tipo: 'piuma', posX: 87.8, posY: 78.4,
          nome: 'Piuma d’Aiuto',
          descrizione: '' },

        { id: 's2-E2', tipo: 'enigma', posX: 70.7, posY: 77.7,
          nome: 'L’Equazione dello Scriba',
          indizio: 'Il totale comincia sempre con 1: sommando due numeri di due cifre non si può superare 198.',
          spiegazione: 'Due numeri di due cifre non superano 198, quindi S vale 1. Le unità danno A+A che finisce per T: raddoppiando, solo 4 e 9 finiscono per 8, e A è dispari, quindi A vale 9 e T vale 8, con riporto. Le decine danno allora R+K+1 uguale a 10, cioè R+K uguale a 9; poiché K è il successore di R, R vale 4 e K vale 5. L’equazione è 49+59=108: SET vale 108.',
          ricompensa: { nome: 'Sigillo dello Scriba', descrizione: 'Incastonato nella tavoletta spaccata. Una delle quattro che aprono il sigillo della cripta.', chiave: true },
          // Unicità dimostrata in tools/verifiche/s2_e2_crittaritmo.py: l'equazione
          // da sola ammette molte assegnazioni, le tre note la riducono a una
          // sola (--test -> OK).
          puzzle: 'tastierino',
          parametri: {
            domanda: 'Su una tavoletta d’argilla, un’equazione incisa in geroglifici:<br><br>' +
                     '<em>RA + KA = SET</em><br><br>' +
                     'Ogni lettera è una cifra da 0 a 9, lettere uguali stessa cifra, lettere ' +
                     'diverse cifre diverse. Nessuna delle cifre iniziali (R, K, S) è zero. ' +
                     'Tre note dello scriba, incise a fianco:<br><br>' +
                     '<em>«A è dispari.<br>E vale zero.<br>K è il successore di R.»</em><br><br>' +
                     'Quanto vale SET?',
            codice: '108',
            simboli: ['0','1','2','3','4','5','6','7','8','9'],
            lunghezza: 3,
            testoCorretto: 'La tavoletta si spacca lungo una crepa nascosta, come se aspettasse solo quel numero.',
            testoErrato: 'La tavoletta resta intera. L’equazione non torna.'
          } },

        { id: 's2-E3', tipo: 'enigma', posX: 24.9, posY: 50.3,
          nome: 'Il Fregio Dipinto',
          indizio: 'Dividi 47 per la lunghezza del motivo: il resto ti dice quanti simboli avanzano oltre l’ultimo giro completo.',
          spiegazione: 'Il motivo è lungo 5 simboli e contiene 2 Piume. In 47 simboli ci stanno 9 motivi interi (45 simboli) più 2 avanzati. I 9 motivi danno 18 Piume; i 2 simboli finali sono Occhio e Piuma, che ne aggiungono una sola. In tutto 19 Piume.',
          ricompensa: null,
          // Verifica in tools/verifiche/s2_e3_fregio.py: il fregio è costruito
          // e contato in Python dalla stessa regola del testo (--test -> OK).
          puzzle: 'sceltaMultipla',
          parametri: {
            domanda: 'Il fregio ripete lo stesso motivo di 5 simboli: Occhio, Piuma, Scarabeo, Piuma, Occhio — ' +
                     'e continua identico per tutta la parete, per 47 simboli in totale ' +
                     '(l’ultimo giro si interrompe a metà, dove finisce la parete).<br><br>' +
                     'Quante Piume compaiono in tutto il fregio?',
            opzioni: ['19', '18', '20', '17'],
            indiceCorretto: 0,
            testoCorretto: 'Contando le piume a voce alta, una fessura tra due mattoni si allarga.',
            testoErrato: 'Il conteggio non corrisponde a nulla. Riconta dal principio.'
          } }
      ]
    },

    s3: {
      tipo: 'principale',
      nomeMappa: 'Biblioteca',
      mappa: { x: 76, y: 45, larghezza: 18, altezza: 9 },
      immagine: 'assets/img/map/s3.png',
      pan: { rapporto: 1376/768 },    // s3.png è 1376x768
      procedeVerso: 's4',             // il percorso principale scende ai restauri
      uscite: [
        { verso: 's2', tipo: 'torna',    posX: 50,   posY: 88, direzione: 'giu' },
        { verso: 's4', tipo: 'procedi',  posX: 88.8, posY: 60, direzione: 'destra' },
        { verso: 'd2', tipo: 'laterale', posX: 14,   posY: 60, direzione: 'sinistra' }
      ],
      hotspot: [
        { id: 's3-F1', tipo: 'piuma', posX: 44.8, posY: 68.7,
          nome: 'Piuma d’Aiuto',
          descrizione: '' },

        { id: 's3-T1', tipo: 'testo', posX: 57.1, posY: 50.3,
          testo: '' },

        { id: 's3-E1', tipo: 'enigma', posX: 50.8, posY: 54.6,
          nome: 'Il Valore delle Lettere',
          indizio: 'Somma le posizioni una lettera alla volta, come nell’esempio: non serve altro metodo.',
          spiegazione: 'Vale l’alfabeto di 21 lettere del cartiglio, non quello di 26: la I vale 9 e la O vale 13, come conferma l’esempio NILO=44. Allora PAPIRO fa 14+1+14+9+16+13, cioè 67.',
          ricompensa: { nome: 'Papiro Numerato', descrizione: 'Sembra possa essere utile altrove.', utile: true },
          // Verifica in tools/verifiche/s3_e1_cifrario.py: conferma l'esempio,
          // il codice, e che la regola sbagliata (alfabeto da 26) non collida
          // per caso con quella giusta (--test -> OK).
          puzzle: 'tastierino',
          parametri: {
            domanda: 'Un cartiglio elenca l’alfabeto italiano di 21 lettere (niente J, K, W, X, Y), ' +
                     'in ordine, a partire da 1:<br><br>' +
                     '<em>A=1  B=2  C=3  D=4  E=5  F=6  G=7  H=8  I=9  L=10  M=11  N=12  ' +
                     'O=13  P=14  Q=15  R=16  S=17  T=18  U=19  V=20  Z=21</em><br><br>' +
                     'Sotto, una mano diversa ha già tradotto un esempio:<br>' +
                     '<em>NILO = 12+9+10+13 = 44</em><br><br>' +
                     'Con lo stesso metodo, quanto vale PAPIRO?',
            codice: '67',
            simboli: ['0','1','2','3','4','5','6','7','8','9'],
            lunghezza: 2,
            testoCorretto: 'Il numero combacia con una tacca incisa sul dorso di un volume vicino.',
            testoErrato: 'Nessuna tacca corrisponde a questo numero.'
          } },

        { id: 's3-I1', tipo: 'oggetto', posX: 23.7, posY: 55.4,
          nome: 'Chiave di Biblioteca',
          descrizione: 'Caduta dietro uno scaffale, coperta di polvere. Una delle quattro che aprono il sigillo della cripta.',
          // chiave del sigillo: il motore le fa volare nello zaino girando
          chiave: true },

        { id: 's3-F2', tipo: 'piuma', posX: 75.9, posY: 13.7,
          nome: 'Piuma d’Aiuto',
          descrizione: '' },

        { id: 's3-T2', tipo: 'testo', posX: 68.5, posY: 66.1,
          testo: '' },

        { id: 's3-T3', tipo: 'testo', posX: 30, posY: 15.4,
          testo: '' },

        { id: 's3-E2', tipo: 'enigma', posX: 19.4, posY: 79.4,
          nome: 'Il Manoscritto Falso',
          indizio: 'Per ciascun manoscritto, chiediti: se fosse lui il più pesante, i piatti si sarebbero mossi proprio così?',
          spiegazione: 'Nella prima pesata scende il piatto con D, E, F: il falso è uno di quei tre, e G, A, B, C sono scagionati. Nella seconda si confrontano A, D contro B, E e scende ancora il piatto destro: se il falso fosse D scenderebbe il sinistro, e se fosse F i piatti resterebbero in equilibrio. Resta E.',
          ricompensa: { nome: 'Pergamena Sospetta', descrizione: 'Sembra possa essere utile altrove.', utile: true },
          // Sostituisce l'Indovinello della Sfinge (troppo noto). Il giocatore
          // non progetta una strategia di pesata (quello sarebbe il notissimo
          // enigma delle monete): interpreta due esiti già dati. Unicità
          // dimostrata in tools/verifiche/s3_e2_bilancia.py: le 7 coppie di
          // esiti possibili sono tutte diverse, ed entrambe le pesate servono
          // (--test -> OK).
          puzzle: 'sceltaMultipla',
          parametri: {
            domanda: 'Sette manoscritti, A-G: uno solo è un falso, scritto su una pergamena più ' +
                     'pesante delle altre. Gli appunti del bibliotecario riportano due pesate:<br><br>' +
                     '<em>Pesata 1: A, B, C contro D, E, F (G resta fuori) — il piatto destro scende.<br>' +
                     'Pesata 2: A, D contro B, E — il piatto destro scende di nuovo.</em><br><br>' +
                     'Quale manoscritto è il falso?',
            opzioni: ['E', 'A', 'D', 'G'],
            indiceCorretto: 0,
            testoCorretto: 'Il leggio scatta e libera un piccolo scomparto sotto il manoscritto indicato.',
            testoErrato: 'Il leggio non si muove. Le pesate dicono un altro nome.'
          }
        }
      ]
    },

    s4: {
      tipo: 'principale',
      nomeMappa: 'Laboratorio Restauri',
      mappa: { x: 76, y: 74, larghezza: 22, altezza: 14 },
      immagine: 'assets/img/map/s4.png',
      pan: { rapporto: 1365/768 },    // s4.png è 1365x768
      procedeVerso: null,             // capolinea: si torna solo indietro
      uscite: [
        { verso: 's3', tipo: 'torna', posX: 19.7, posY: 41, direzione: 'sinistra' }
      ],
      hotspot: [
        { id: 's4-E1', tipo: 'enigma', posX: 79.9, posY: 61.2,
          nome: 'La Miscela Corretta',
          indizio: 'Scrivi le due incognite come frazioni di 60ml: quanto deve pesare ciascuna nel bilancio della concentrazione?',
          spiegazione: '60ml al 20% contengono 12ml di solvente puro. Chiamando x i millilitri al 10% e 60−x quelli al 40%, il bilancio è 0,10x + 0,40(60−x) = 12, cioè 24 − 0,30x = 12, da cui x = 40. Servono 40ml al 10% e 20ml al 40%: il codice è 4020.',
          ricompensa: null,
          // Unicità (sistema lineare 2x2, non degenere) dimostrata in
          // tools/verifiche/s4_e1_diluizione.py (--test -> OK).
          puzzle: 'tastierino',
          parametri: {
            domanda: 'Due bottiglie sul banco di restauro: solvente al 10% e solvente al 40%. ' +
                     'La scheda del reperto chiede 60ml di soluzione al 20% — né uno né l’altro da soli vanno bene.<br><br>' +
                     'Quanti millilitri servono di ciascuno? Scrivi prima i ml del solvente al 10%, ' +
                     'poi quelli al 40%, due cifre ciascuno (es. 05 per 5ml).',
            codice: '4020',
            lunghezza: 4,
            testoCorretto: 'Le due dosi si amalgamano senza velature. La soluzione è quella giusta.',
            testoErrato: 'La miscela vela: la concentrazione non è al 20%.'
          } },

        { id: 's4-E2', tipo: 'enigma', posX: 18.4, posY: 87.2,
          nome: 'Chi Ha Rotto il Vaso',
          indizio: 'Se Bruno fosse innocente, la sua accusa ad Anna sarebbe vera — controlla se il resto regge insieme a questo.',
          spiegazione: 'Prova le tre ipotesi. Se fosse stata Anna, mentirebbe lei, ma allora Carla («è stato Bruno») direbbe il falso pur essendo innocente: impossibile. Se fosse stata Carla, mentirebbe lei, ma Bruno accuserebbe Anna dicendo il falso da innocente: impossibile. Se è stato Bruno, tutto regge: Anna dice il vero, Carla dice il vero e solo Bruno mente accusando Anna.',
          ricompensa: null,
          // Unicità dimostrata in tools/verifiche/s4_e2_bugiardi.py: un solo
          // colpevole rende coerenti tutte e tre le dichiarazioni (--test -> OK).
          puzzle: 'sceltaMultipla',
          parametri: {
            domanda: 'Un vaso è in cocci sul tavolo. Tre restauratori erano soli nella sala. ' +
                     'Chi lo ha rotto mente; gli altri due dicono il vero.<br><br>' +
                     '<em>Anna: «Non sono stata io.»<br>' +
                     'Bruno: «È stata Anna.»<br>' +
                     'Carla: «È stato Bruno.»</em><br><br>' +
                     'Chi ha rotto il vaso?',
            opzioni: ['Bruno', 'Anna', 'Carla'],
            indiceCorretto: 0,
            testoCorretto: 'Il nome giusto fa scattare il fermo di un cassetto degli attrezzi.',
            testoErrato: 'Nessun cassetto si apre. Le tre frasi non tornano con questo nome.'
          } },

        { id: 's4-T1', tipo: 'testo', posX: 55.1, posY: 54.6,
          testo: '' },

        { id: 's4-F1', tipo: 'piuma', posX: 26.9, posY: 63.2,
          nome: 'Piuma d’Aiuto',
          descrizione: '' },

        { id: 's4-T2', tipo: 'testo', posX: 43, posY: 72.8,
          testo: '' },

        { id: 's4-E3', tipo: 'enigma', posX: 42.8, posY: 43.2,
          nome: 'La Scheda Mancante',
          indizio: 'Tocca un frammento adiacente allo spazio vuoto per farlo scivolare: procedi un pezzo alla volta.',
          spiegazione: 'Conviene ricomporre dall’alto: prima si sistema la riga 1, poi la riga 2, e gli ultimi due frammenti si incastrano da soli. Chi tenta di piazzare per ultimo un pezzo della prima riga si accorge che per farlo deve disfare tutto il resto. Da questa disposizione bastano 11 mosse.',
          ricompensa: { nome: 'Scheda di Restauro', descrizione: 'Ricomposta un frammento alla volta. Una delle quattro che aprono il sigillo della cripta.', chiave: true },
          // Puzzle a scorrimento (8-puzzle, griglia 3x3): lo stato iniziale è
          // costruito a partire dal goal con una camminata casuale (principio
          // "genera al contrario"), quindi risolvibile per costruzione.
          // Confermato e non banale (11 mosse minime dimostrate) in
          // tools/verifiche/s4_e3_scorrimento.py (--test -> OK).
          puzzle: 'scorrimento',
          parametri: {
            domanda: 'Nove frammenti di una scheda di restauro strappata, mischiati sul tavolo. ' +
                     'Tocca un frammento adiacente allo spazio vuoto per farlo scivolare, finché ' +
                     'il disegno non torna intero.',
            righe: 3,
            colonne: 3,
            griglia: [4, 0, 3, 2, 1, 8, 7, 6, 5],
            // Le tessere mostrano i pezzi di questa immagine invece dei numeri.
            // Il file non è ancora in assets/img: finché manca, il puzzle
            // ripiega da solo sulle tessere numerate e lo dichiara.
            // `rapporto` è larghezza/altezza dell'immagine: va corretto se il
            // file non sarà quadrato, altrimenti il disegno esce stirato.
            immagine: 'assets/img/pz_scheda.png',
            rapporto: 1,
            numeri: false,
            anteprima: true,
            testoImmagineMancante: 'La scheda è troppo sbiadita per distinguerne il disegno: restano i numeri.',
            testoCorretto: 'I nove frammenti tornano a formare un unico foglio.'
          } },

        { id: 's4-F2', tipo: 'piuma', posX: 58.4, posY: 36.5,
          nome: 'Piuma d’Aiuto',
          descrizione: 'Una piuma dimenticata tra i solventi. Può essere spesa per un indizio.' }
      ]
    },

    sF: {
      tipo: 'finale',
      // niente `mappa`: qui il popup mostra gamemap2.png (lo spaccato con la
      // scala verso la cripta), non la pianta con le etichette delle stanze.
      immagine: 'assets/img/map/sF.png',
      pan: { rapporto: 1376/768 },    // sF.png è 1376x768
      uscite: [
        // TEMPORANEA: comoda per i test finché la sala del tesoro non avrà
        // la sua schermata di chiusura. Da togliere a gioco finito.
        { verso: 's2', tipo: 'torna', posX: 50, posY: 12, direzione: 'su' }
      ],
      hotspot: [
        { id: 'sF-E1', tipo: 'enigma', posX: 50.7, posY: 51,
          larghezza: 12.5, altezza: 33,
          nome: 'Il Sigillo del Tesoro',
          ricompensa: null,
          // Un gate d'inventario, non un enigma a risposta: le quattro chiavi
          // trovate nel museo (s1-E3, s2-E2, s4-E3, s3-I1 — vedi le rispettive
          // ricompense/oggetto) vanno trascinate nelle quattro caselle, in
          // qualunque ordine. Niente `indizio`: non c'è nulla da indovinare,
          // e senza indizio il motore nasconde da sé il pulsante AIUTO.
          // Nessuna verifica di unicità da scrivere in tools/verifiche/.
          puzzle: 'sigilloCripta',
          // Incastrate le chiavi la schermata si chiude e il sigillo si apre
          // sulla sala dell'altare: ci si entra qui, non da una freccia.
          vaiA: 'sF-Altar',
          parametri: {
            domanda: 'Il sigillo di pietra ha quattro incavi vuoti, sagomati per delle chiavi. ' +
                     'Incastra le quattro chiavi trovate nel museo, in qualunque ordine.',
            chiaviAttese: ['s1-E3-ricompensa', 's2-E2-ricompensa', 's4-E3-ricompensa', 's3-I1'],
            testoCorretto: 'Le quattro chiavi scattano in sede. Il sigillo cede e scopre un passaggio.'
          }
        }
      ]
    },

    // La sala oltre il sigillo. Ultima stanza del gioco: si entra e non si
    // esce più, quindi non ha uscite e non mostra i comandi (né mappa, né
    // bussola, né zaino: `senzaComandi`). Non dichiara nemmeno `pan`: la sua
    // immagine è verticale come lo schermo, sta tutta nella finestra e non
    // c'è nulla da trascinare.
    'sF-Altar': {
      tipo: 'finale',
      immagine: 'assets/img/map/sF-Altar.png',
      senzaComandi: true,
      uscite: [],
      hotspot: [
        { id: 'sF-E2', tipo: 'enigma', posX: 49.5, posY: 51,
          larghezza: 28, altezza: 13,
          nome: 'L’Occhio del Falco',
          // Il filmato fa da cerniera tra il meccanismo e l'enigma: toccato
          // lo sfondo, il video copre tutto e solo quando è completo — con
          // la dissolvenza in nero di 2 secondi — si apre la schermata.
          // Il motore legge questa voce (`video` sull'hotspot) e non ne sa
          // di più: è contenuto.
          video: 'assets/img/video/AltarE.mp4',
          indizio: 'Ogni anello gira in un solo verso: se sembra bloccarsi, il verso è quello sbagliato. E nessun anello si muove da solo — trascina sempre anche gli altri tre.',
          spiegazione: 'Ogni scatto di un anello, nel suo unico verso permesso, sposta anche gli altri tre di una quantità fissa: il sistema è lineare, e ammette un’unica combinazione che allinea tutti e quattro i varchi — 8 scatti sul primo anello, 7 sul secondo, 10 sul terzo, 8 sul quarto. La verifica esaustiva su tutte le combinazioni possibili conferma che non ce n’è un’altra.',
          ricompensa: null,
          // Serratura a 4 anelli concentrici (puzzles/puzzle_occhio_falco.js,
          // componente <falcon-lock>). Unicità della combinazione (8,7,10,8)
          // dimostrata su tutte le 12^4 combinazioni possibili da
          // tools/verifiche/sF_e2_occhio_falco.py (--test -> OK).
          puzzle: 'occhioFalco',
          parametri: {
            immagineSfera: 'assets/img/sphere.svg',
            testoCorretto: 'La sfera scivola fuori dal canale. Il sigillo è aperto.'
          }
        }
      ]
    },

    /* ---------------- DIRAMAZIONI ---------------- */

    d1: {
      tipo: 'decoy-vicolo-cieco',
      nomeMappa: 'Bagni',
      mappa: { x: 17, y: 56, larghezza: 15, altezza: 9 },
      immagine: 'assets/img/map/d1.png',
      pan: { rapporto: 1365/784 },    // d1.png è 1365x784
      principaleAssociata: 's2',
      uscite: [
        { verso: 's2', tipo: 'torna', posX: 91.8, posY: 59.1, direzione: 'destra' }
      ],
      hotspot: [
        { id: 'd1-T1', tipo: 'testo', posX: 57.7, posY: 57,
          testo: '' },

        { id: 'd1-E1', tipo: 'enigma', posX: 25.8, posY: 61.9,
          nome: 'I Due Secchi',
          indizio: 'Usa il secchio piccolo solo per togliere acqua da quello grande: ogni volta che lo svuoti nel lavandino, il grande perde esattamente cinque litri.',
          spiegazione: 'Ogni quantità raggiungibile è combinazione di cinque e nove litri: per fermarsi a sette serve riempire tre volte il secchio grande e togliere quattro secchiate piccole (9×3 − 5×4 = 7). Il ritmo è sempre lo stesso — riempi il grande, versa nel piccolo, svuota il piccolo, ripeti — e la ricerca esaustiva sullo spazio degli stati conferma che il traguardo non si raggiunge in meno di dodici mosse.',
          ricompensa: null,
          // Enigma leggero, coerente col ruolo di vicolo cieco. Puzzle
          // interattivo (travaso vero, non una cifra da indovinare): si
          // vince nell'istante in cui il secchio da 9 contiene 7 litri.
          // Raggiungibilità, minimo di 12 mosse e unicità dello stato-goal
          // ottimo dimostrate in tools/verifiche/d1_e1_travaso.py (--test -> OK).
          puzzle: 'travaso',
          parametri: {
            domanda: 'Due secchi vuoti accanto al lavandino: uno da 5 litri, uno da 9.<br><br>' +
                     'Riempi, svuota, versa cliccando su un secchio: lascia esattamente 7 litri nel secchio da 9.',
            capienze: { a: 5, b: 9 },
            bersaglio: { secchio: 'b', litri: 7 },
            etichette: { a: 'secchio da 5 litri', b: 'secchio da 9 litri' },
            testoCorretto: 'Il secchio da 9 pesa esattamente il giusto: sette litri, non uno di più.'
          } },

        { id: 'd1-T2', tipo: 'testo', posX: 30.5, posY: 48.2,
          testo: '' },

        { id: 'd1-F1', tipo: 'piuma', posX: 28.3, posY: 33.8,
          nome: 'Piuma d’Aiuto',
          descrizione: 'Una piuma bianca caduta dietro il lavandino. Può essere spesa per un indizio.' }
      ]
    },

    d2: {
      tipo: 'decoy-vicolo-cieco',
      nomeMappa: 'Ufficio',
      mappa: { x: 76, y: 21, larghezza: 15, altezza: 9 },
      immagine: 'assets/img/map/d2.png',
      pan: { rapporto: 1365/784 },    // d2.png è 1365x784
      principaleAssociata: 's3',
      uscite: [
        { verso: 's3', tipo: 'torna', posX: 60, posY: 87.3, direzione: 'giu' }
      ],
      hotspot: [
        { id: 'd2-T1', tipo: 'testo', posX: 47.6, posY: 62.2,
          testo: '' },

        { id: 'd2-E1', tipo: 'enigma', posX: 57.9, posY: 39.9,
          nome: 'L’Agenda del Direttore',
          indizio: 'Il terzo incontro non slitta: cade di martedì. Solo il quarto trova il weekend sulla sua strada.',
          spiegazione: 'Si conta sempre dall’incontro effettivo, non da quello previsto. Il primo cade il giorno 1, lunedì; il secondo il 5, venerdì; il terzo il 9, martedì. Quattro giorni dopo il 9 è il 13, un sabato: l’ufficio è chiuso e l’incontro slitta al lunedì successivo, il giorno 15.',
          ricompensa: null,
          // Simulazione deterministica in tools/verifiche/d2_e1_calendario.py
          // (--test -> OK). Enigma leggero, decoy.
          puzzle: 'tastierino',
          parametri: {
            domanda: 'L’agenda del direttore: il primo incontro con un fornitore è fissato il giorno 1 ' +
                     'del mese, un lunedì. Ogni incontro successivo è fissato esattamente 4 giorni dopo ' +
                     'l’incontro EFFETTIVO precedente. L’ufficio è chiuso sabato e domenica: un incontro ' +
                     'che ci cadrebbe slitta al lunedì successivo.<br><br>' +
                     'Il giorno del mese cade il quarto incontro?',
            codice: '15',
            lunghezza: 2,
            testoCorretto: 'La matita ha già segnato quel giorno con un cerchio.',
            testoErrato: 'Nessun cerchio su quel giorno. Il conto non torna.'
          } },

        { id: 'd2-F1', tipo: 'piuma', posX: 38.3, posY: 54.3,
          nome: 'Piuma d’Aiuto',
          descrizione: '' },

        { id: 'd2-T2', tipo: 'testo', posX: 30.5, posY: 46.6,
          testo: '' },

        { id: 'd2-I1', tipo: 'oggetto', posX: 33.1, posY: 69.8,
          nome: 'Penna nera',
          descrizione: 'Solo una penna nera.',
          utile: true },

        { id: 'd2-E2', tipo: 'enigma', posX: 20.3, posY: 45.1,
          nome: 'Il Numero di Protocollo',
          indizio: 'La cifra di controllo è il resto della somma delle prime cinque cifre, diviso 9.',
          spiegazione: 'Le cifre note sommano 4+0+7+1, cioè 12. Con la cifra mancante x la somma è 12+x, e il suo resto diviso 9 deve fare 5: serve quindi una somma di 14, perché 14 diviso 9 dà resto 5. Da 12+x=14 si ricava x=2. Nessun’altra cifra da 0 a 9 dà lo stesso resto.',
          ricompensa: null,
          // Unicità (nessuna collisione mod 9 per questo bersaglio) dimostrata
          // in tools/verifiche/d2_e2_checksum.py (--test -> OK). Decoy leggero.
          puzzle: 'tastierino',
          parametri: {
            domanda: 'Un documento timbrato porta un numero di protocollo a sei cifre: le prime cinque ' +
                     'sono la base, la sesta è una cifra di controllo — il resto della somma delle prime ' +
                     'cinque, diviso 9.<br><br>Sul foglio si legge: <strong>4, 0, ?, 7, 1</strong> — poi ' +
                     '<strong>5</strong> di controllo. La terza cifra è sbiadita.<br><br>' +
                     'Qual è la cifra mancante?',
            codice: '2',
            lunghezza: 1,
            testoCorretto: 'Il numero completo combacia con quello nel registro degli arrivi.',
            testoErrato: 'Il numero completo non è nel registro. Ricontrolla il resto della divisione.'
          } }
      ]
    }

  }
};

/* Esportazione esplicita. Serve davvero: `const` a livello globale crea un
   binding lessicale, NON una proprietà di window — senza questa riga il
   motore non troverebbe i dati. Stessa logica di window.Puzzles. */
window.GAME_DATA = GAME_DATA;
