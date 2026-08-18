/* =========================================================================
   MUSEO DEL FARAONE — MOTORE
   Scritto una volta, mai toccato dal contenuto.

   Non contiene testi narrativi, percorsi di immagini né soluzioni: tutto
   questo vive in game_data.js. Non contiene nemmeno la logica dei puzzle,
   che vive in /puzzles e si registra da sola in window.Puzzles.
   ========================================================================= */

/* =========================================================================
   STATO GLOBALE
   ========================================================================= */
const gameState = {
  stanzaCorrente: null,
  mainRoomCorrente: null,     // ultima stanza principale/finale in cui si è entrati (per accessibilità decoy)
  stanzeVisitate: [],
  inventario: [],             // OGGETTI: { id, nome, descrizione, origineStanza, origineHotspotId }
  piume: [],                  // piume d'aiuto: voce separata, NON occupano slot oggetti
  statoStanze: {},            // { [idStanza]: { enigmiCompletati:[], oggettiRaccolti:[], indiziRivelati:[] } }
  // tutorial d'ingresso: false finché non si raccoglie la prima piuma in
  // assoluto. Finché è false, apriHotspot ignora tutto ciò che non è piuma.
  tutorialSbloccato: false,
  // terzo passo del tutorial: si vede una volta sola in tutta la partita, al
  // primo hotspot di tipo enigma toccato, qualunque sia. Per questo è un flag
  // globale e non una voce di statoStanze.
  tutorial3Mostrato: false,
  // quarto passo: alla prima chiave del sigillo raccolta, una volta sola
  tutorial4Mostrato: false
};

let MAX_SLOT_INVENTARIO = 5;   // sovrascritto da GAME_DATA.configurazione
let MAX_PIUME = 5;             // idem: i punti sopra la catena sono cinque
let TESTI = {};                // testi del motore, presi da GAME_DATA.testi

/* =========================================================================
   ENGINE
   ========================================================================= */
const Engine = {
  // Questi due li detta GAME_DATA.configurazione: i valori qui sotto valgono
  // solo se il dato manca. In partita sono entrambi false.
  // Con true tutte le uscite sono percorribili ignorando gli enigmi.
  spostamentiSempreAttivi: false,
  // Con false le zone restano cliccabili ma non si vedono: le quattro
  // interazioni (enigma, piuma, oggetto, testo) si scoprono toccando la scena.
  hotspotVisibili: false,
  // Collaudo: niente tutorial, zaino piume sempre pieno, spostamenti liberi.
  // Impostato da GAME_DATA.configurazione.testMode.
  testMode: false,

  stanze: {},          // registro stanze per id
  _listeners: [],      // registro centralizzato listener attivi (enigma corrente)
  _dropzones: [],      // dropzone attive
  _enigmaCorrente: null,
  _enigmaStanza: null,       // stanza da cui è stato aperto l'enigma corrente
  _toastAllaChiusura: null,  // seguito del toast aperto, se ne ha uno
  _lucchettoInCorso: false,  // un lucchetto sta già per aprire una schermata
  _dragMosso: false,

  // pan della scena: fattori della stanza corrente, offset applicato, e la
  // spia che dice «questo gesto è stato un trascinamento, non un tocco»
  panDefault: { x: 1, y: 1 },
  _panFx: 1, _panFy: 1,
  _panX: 0, _panY: 0,
  // l'inquadratura tenuta anche in frazione (0 = tutto a sinistra/in alto,
  // .5 = centro, 1 = tutto a destra/in basso): i pixel valgono solo per la
  // misura corrente della finestra, la frazione sopravvive a un ricalcolo
  _panFraz: { x: .5, y: .5 },
  _panMosso: false,

  // Un testo dei dati, con i segnaposto riempiti: T('ariaOggetto', {nome})
  // → «Raccogli: Papiro». Se la chiave manca torna stringa vuota, mai il
  // nome della chiave: un buco nei dati non si legge in faccia al giocatore.
  _testo(chiave, valori) {
    let s = TESTI[chiave] || '';
    if (valori) Object.keys(valori).forEach(k => { s = s.split('{' + k + '}').join(valori[k]); });
    return s;
  },

  // chi ha ridotto le animazioni di sistema non vede né voli né vibrazioni:
  // una sola domanda al browser, riusata da tutte le animazioni
  _animazioniRidotte() {
    if (!this._mqRidotto) this._mqRidotto = window.matchMedia('(prefers-reduced-motion: reduce)');
    return this._mqRidotto.matches;
  },

  /* ---------------- icone (SVG, mai emoji) ---------------- */

  _svgPiuma(){
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M4.5 20c-.4-6 2.6-12.2 8.6-14.4 3-1.1 5.6-.9 6.6.2 1 1.1.4 4.2-1.4 7.2C16 16.7 12 19.2 7.6 19.6z"/>
      <path d="M4.5 20 14.6 9.4"/>
      <path d="M9.4 15.6h4.1M11.6 12.6h3.7"/>
    </svg>`;
  },

  // Lucchetto chiuso: compare sul punto toccato e vibra un attimo, come una
  // serratura che non cede. Stessa mano della piuma — contorno, tratto 1.7,
  // nessun colore cablato: lo decide il CSS con `color`.
  _svgLucchetto(){
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.4"/>
      <path d="M7.8 10.5V7.6a4.2 4.2 0 0 1 8.4 0v2.9"/>
      <path d="M10.3 14a1.85 1.85 0 0 1 3.6.6c0 1.25-1.8 1.35-1.8 2.5"/>
      <path d="M12 19.3v.01"/>
    </svg>`;
  },

  // Chiave del sigillo: gira su se stessa e vola nello zaino quando la si
  // trova. Stessa mano della piuma e del lucchetto — contorno, tratto 1.7.
  _svgChiave(){
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="7.6" cy="8.4" r="4.1"/>
      <circle cx="7.6" cy="8.4" r="1.1" fill="currentColor" stroke="none"/>
      <path d="M10.5 11.3 19.5 20.3"/>
      <path d="M17.2 18 15 20.2"/>
      <path d="M14.6 15.4 12.6 17.4"/>
    </svg>`;
  },

  // un'icona per ciascun tipo di interazione, riusata su scena, inventario e ghost
  _icona(tipo){
    const apri = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">`;
    if (tipo === 'piuma') return this._svgPiuma();
    if (tipo === 'oggetto') return apri +
      `<path d="M7.6 8h8.8l1.9 11.1A1.7 1.7 0 0 1 16.6 21H7.4a1.7 1.7 0 0 1-1.7-1.9z"/>
       <path d="M9.5 8V6.3A2.5 2.5 0 0 1 12 3.8a2.5 2.5 0 0 1 2.5 2.5V8"/></svg>`;
    if (tipo === 'enigma') return apri +
      `<circle cx="12" cy="12" r="9"/>
       <path d="M9.4 9.3a2.7 2.7 0 0 1 5.2.9c0 1.8-2.6 2-2.6 3.6"/>
       <path d="M12 17.2v.01"/></svg>`;
    // 'testo' e qualsiasi altro caso: fumetto
    return apri +
      `<path d="M20 12.2a6.8 6.8 0 0 1-6.8 6.8H9.6L5.4 21.6V17.6A6.8 6.8 0 0 1 8.6 5.4h4.6a6.8 6.8 0 0 1 6.8 6.8z"/>
       <path d="M9.4 11.3h6M9.4 14.2h3.6"/></svg>`;
  },

  /* ---------------- registrazione / navigazione ---------------- */

  registraStanza(stanza) {
    if (!stanza || !stanza.id) throw new Error('Engine.registraStanza: stanza priva di id');
    this.stanze[stanza.id] = stanza;
    if (!gameState.statoStanze[stanza.id]) {
      gameState.statoStanze[stanza.id] = {
        enigmiCompletati: [], oggettiRaccolti: [], indiziRivelati: [],
        progressiEnigmi: {}      // { [idEnigma]: dati salvati dal puzzle }
      };
    }
  },

  vaiAStanza(id) {
    const stanza = this.stanze[id];
    if (!stanza) { console.warn('Stanza non registrata:', id); return; }

    this._pulisciListeners();
    this._chiudiPopup();
    this._chiudiToast(false);   // un seguito pendente riguarda la stanza che si lascia
    this._chiudiMappa();
    this._lucchettoInCorso = false;   // un'animazione a metà non deve bloccare la stanza nuova
    // l'inventario NON si chiude: resta aperto finché non lo chiude il
    // giocatore, anche cambiando stanza
    this._navOff();

    if (!gameState.stanzeVisitate.includes(id)) gameState.stanzeVisitate.push(id);
    gameState.stanzaCorrente = id;
    if (stanza.tipo === 'principale' || stanza.tipo === 'finale') {
      gameState.mainRoomCorrente = id;
    }

    this.renderStanza(id);

    // Una stanza può aprire con un filmato (`videoApertura` nei dati): il
    // video copre tutto, e solo a lei finita — con la dissolvenza in nero
    // gestita da _riproduciVideo — si apre da solo l'enigma indicato in
    // `apreEnigma`. Il motore non conosce né il file né l'enigma: li prende
    // dai dati.
    const apertura = stanza.videoApertura;
    if (apertura && apertura.src) {
      const daAprire = (stanza.hotspot || []).find(h => h.id === apertura.apreEnigma);
      this._riproduciVideo(apertura.src, () => {
        if (daAprire) this._apriEnigma(daAprire, null);
      });
    }
  },

  // una stanza è "ancora raggiungibile" nella sessione corrente:
  // principale/finale solo se è quella attiva ora; decoy solo se la sua
  // stanza principale associata è ancora quella attiva ora.
  stanzaAccessibile(id) {
    const stanza = this.stanze[id];
    if (!stanza) return false;
    if (stanza.tipo === 'principale' || stanza.tipo === 'finale') {
      return id === gameState.mainRoomCorrente;
    }
    return stanza.principaleAssociata === gameState.mainRoomCorrente;
  },

  /* ---------------- rendering ---------------- */

  // Alcune stanze cambiano immagine (e rapporto) quando si è già passati da
  // un'altra stanza (`immagineVariante` nei dati). Non muta `stanza`: calcola
  // solo cosa disegnare, così i dati restano quelli dichiarati.
  _visualeStanza(stanza) {
    const v = stanza.immagineVariante;
    if (v && gameState.stanzeVisitate.includes(v.seVisitata)) {
      return { immagine: v.immagine, pan: v.pan || stanza.pan };
    }
    return { immagine: stanza.immagine, pan: stanza.pan };
  },

  renderStanza(id) {
    const stanza = this.stanze[id];
    if (!stanza) return;
    const stato = gameState.statoStanze[id];
    const visuale = this._visualeStanza(stanza);

    const sfondoEl = document.getElementById('mappa-sfondo');
    sfondoEl.style.background = visuale.immagine
      ? `url("${visuale.immagine}") center / cover no-repeat`
      : stanza.coloreSfondo;
    // breve dissolvenza sul cambio scena (riavvio forzato dell'animazione)
    sfondoEl.style.animation = 'none';
    void sfondoEl.offsetWidth;
    sfondoEl.style.animation = 'sfondo-entra .18s ease-out';

    // gli hotspot vivono DENTRO la scena, non nella finestra: si spostano
    // insieme allo sfondo quando ci si guarda intorno
    const scena = document.getElementById('mappa-scena');
    // rimuovendo i nodi spariscono anche i loro listener: per questo gli
    // hotspot NON passano dal registro centralizzato (che viene svuotato
    // alla chiusura di un enigma e li lascerebbe muti).
    scena.querySelectorAll('.hotspot, .freccia-uscita').forEach(el => el.remove());

    // Una stanza può chiedere la scena e basta: niente mappa, bussola, zaino.
    // Lo dicono i dati (`senzaComandi: true`), il resto lo fa il CSS.
    document.getElementById('app').classList.toggle('senza-comandi', !!stanza.senzaComandi);

    this._panStanza(stanza, visuale.pan);

    (stanza.hotspot || []).forEach(hs => {
      // oggetti e piume spariscono dalla scena una volta raccolti
      if ((hs.tipo === 'oggetto' || hs.tipo === 'piuma') && stato.oggettiRaccolti.includes(hs.id)) return;
      const completato = hs.tipo === 'enigma' && stato.enigmiCompletati.includes(hs.id);

      const el = document.createElement('button');
      el.className = `hotspot tipo-${hs.tipo}`
        + (completato ? ' completato' : '')
        + (this.hotspotVisibili ? '' : ' invisibile');
      el.style.left = hs.posX + '%';
      el.style.top = hs.posY + '%';
      // una zona può coprire un'area della scena invece del cerchio da 44px
      if (hs.larghezza) el.style.width = hs.larghezza + '%';
      if (hs.altezza) el.style.height = hs.altezza + '%';
      // con le zone invisibili l'icona non si vedrebbe comunque: non si disegna
      if (this.hotspotVisibili) el.innerHTML = this._icona(hs.tipo);
      el.setAttribute('aria-label', this._etichettaHotspot(hs, completato));
      el.addEventListener('click', () => this.apriHotspot(hs, el));
      // col tab si può arrivare a una zona fuori campo: la scena la insegue
      el.addEventListener('focus', () => this._panVerso(el));
      scena.appendChild(el);
    });

    this._renderUscite(stanza);
  },

  _etichettaHotspot(hs, completato){
    const nome = hs.nome || this._testo('oggettoSenzaNome');
    if (hs.tipo === 'piuma') return this._testo('ariaPiuma');
    if (hs.tipo === 'oggetto') return this._testo('ariaOggetto', { nome });
    if (hs.tipo === 'enigma') return this._testo(completato ? 'ariaEnigmaRisolto' : 'ariaEnigma', { nome });
    return this._testo('ariaTesto');
  },

  /* ---------------- uscite: frecce sulla scena ---------------- */

  // Le uscite possono essere dichiarate esplicitamente in stanza.uscite
  // (con posizione in % accanto alla porta); in mancanza, il motore le
  // deduce da procedeVerso / tornaA e le mette ai lati dello schermo.
  _usciteDi(stanza) {
    if (stanza.uscite) return stanza.uscite.filter(u => this._usciteVisibile(u));
    const uscite = [];
    if (stanza.procedeVerso) uscite.push({ verso: stanza.procedeVerso, tipo: 'procedi', posX: 90, posY: 50 });
    if (stanza.tornaA) uscite.push({ verso: stanza.tornaA, tipo: 'torna', posX: 10, posY: 50 });
    return uscite;
  },

  // Un'uscita può chiedere una variante d'immagine già vista (`seVisitata`)
  // e/o restare confinata al collaudo (`soloTest`) — stesso significato di
  // immagineVariante.seVisitata, riletto qui perché le uscite non passano
  // dalla stessa funzione.
  _usciteVisibile(u) {
    if (u.soloTest && !this.testMode) return false;
    if (u.seVisitata && !gameState.stanzeVisitate.includes(u.seVisitata)) return false;
    return true;
  },

  // Cosa serve per uscire dal percorso principale: TUTTI gli enigmi della
  // stanza. La lista non si scrive nei dati (sarebbe una copia degli hotspot
  // che invecchia da sola): si legge dagli hotspot stessi. Se una stanza
  // dichiara comunque `requisitiPerProcedere`, quegli id si aggiungono —
  // così si può pretendere anche un enigma di un'altra stanza.
  _enigmiRichiesti(stanza) {
    const daHotspot = (stanza.hotspot || [])
      .filter(h => h.tipo === 'enigma')
      .map(h => h.id);
    const dichiarati = stanza.requisitiPerProcedere || [];
    return daHotspot.concat(dichiarati.filter(id => !daHotspot.includes(id)));
  },

  // il triangolo è disegnato rivolto verso l'ALTO; la direzione lo ruota
  _rotazioneFreccia(uscita) {
    if (uscita.direzione === 'su') return 0;
    if (uscita.direzione === 'destra') return 90;
    if (uscita.direzione === 'giu') return 180;
    if (uscita.direzione === 'sinistra') return 270;
    return uscita.posX >= 50 ? 90 : 270;    // default: dedotta dalla posizione
  },

  // triangolo rosso con doppio contorno: il tracciato è ridisegnato tre volte,
  // dal bordo più largo (marrone) al riempimento, così i contorni si annidano
  _svgFreccia() {
    const punti = '50,26 91,74 9,74';   // isoscele schiacciato: base larga, altezza contenuta
    const strati = [['#5a2f1a', 18], ['#ffffff', 10], ['#d8342a', 2]]
      .map(([c, w]) => `<polygon points="${punti}" fill="${c}" stroke="${c}" stroke-width="${w}" stroke-linejoin="round"/>`)
      .join('');
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${strati}</svg>`;
  },

  _renderUscite(stanza) {
    const scena = document.getElementById('mappa-scena');
    const stato = gameState.statoStanze[stanza.id];

    // il gate vale per la stanza, non per la singola porta: finché resta un
    // enigma da risolvere qui dentro non si esce da nessuna parte, nemmeno
    // tornando indietro o infilando una diramazione.
    const req = this._enigmiRichiesti(stanza);
    const fatti = req.filter(id => stato.enigmiCompletati.includes(id)).length;
    // spostamentiSempreAttivi: in fase di sviluppo nessuna uscita è bloccata
    const bloccata = !this.spostamentiSempreAttivi && fatti < req.length;

    this._usciteDi(stanza).forEach(uscita => {

      const el = document.createElement('div');
      el.className = 'freccia-uscita' + (bloccata ? ' bloccata' : '');
      el.style.left = uscita.posX + '%';
      el.style.top = uscita.posY + '%';

      el.innerHTML = this._svgFreccia();
      const rot = this._rotazioneFreccia(uscita);
      el.style.setProperty('--rot', rot + 'deg');
      el.querySelector('svg').style.transform = 'rotate(' + rot + 'deg)';

      el.addEventListener('click', () => {
        if (bloccata) {
          this.mostraToast({
            testo: uscita.testoBloccato
              || this._testo('viaSbarrata', { fatti, totale: req.length })
          });
          return;
        }
        this._navOff();
        this.vaiAStanza(uscita.verso);
      });

      scena.appendChild(el);
    });
  },

  /* ---------------- modalità navigazione (bussola) ---------------- */

  _navToggle() {
    // l'inventario resta com'è: la catena sta in basso, le frecce sulla scena
    document.getElementById('app').classList.toggle('nav-attiva');
  },
  _navOff() { document.getElementById('app').classList.remove('nav-attiva'); },

  /* ---------------- pan della scena ----------------
     La stanza può essere più grande della finestra: la si trascina col dito
     per guardarsi intorno, senza mai uscire dai bordi dell'immagine.
     Quanto è grande lo dicono i dati (`pan: {x, y}` per stanza, con un
     default in configurazione.pan): il motore non decide nulla da sé. */

  // Limiti dello spostamento. Con fattore 1 l'intervallo collassa a zero e
  // l'asse resta bloccato da solo, senza casi speciali altrove.
  _panLimiti() {
    const finestra = document.getElementById('mappa');
    return {
      minX: -(this._panFx - 1) * finestra.clientWidth,
      minY: -(this._panFy - 1) * finestra.clientHeight
    };
  },

  // Unico punto in cui l'offset viene scritto: qui passa sempre dal clamp.
  _panApplica(x, y, morbido) {
    const scena = document.getElementById('mappa-scena');
    if (!scena) return;
    const lim = this._panLimiti();
    this._panX = Math.min(0, Math.max(lim.minX, x));
    this._panY = Math.min(0, Math.max(lim.minY, y));

    scena.classList.toggle('pan-morbido', !!morbido);
    scena.style.transform = 'translate3d(' + this._panX + 'px,' + this._panY + 'px,0)';

    // si tiene aggiornata la frazione: se un asse è bloccato (limite zero)
    // quella vecchia resta buona, perché non c'è nulla da cui ricavarla
    if (lim.minX) this._panFraz.x = this._panX / lim.minX;
    if (lim.minY) this._panFraz.y = this._panY / lim.minY;

    // i bordi sfumati si spengono dal lato in cui la stanza è finita
    const finestra = document.getElementById('mappa');
    finestra.classList.toggle('pan-ovest', this._panX < -.5);
    finestra.classList.toggle('pan-est', this._panX > lim.minX + .5);
  },

  // Entrando in una stanza: si dimensiona il livello e ci si mette al centro,
  // così ci si può guardare da entrambi i lati. renderStanza però viene
  // richiamata anche dopo aver raccolto un oggetto: in quel caso la stanza è
  // la stessa e l'inquadratura NON si tocca, o si tornerebbe al centro di
  // colpo mentre il giocatore stava guardando altrove.
  _panStanza(stanza, panOverride) {
    const scena = document.getElementById('mappa-scena');
    if (!scena) return;
    const finestra = document.getElementById('mappa');
    const p = panOverride || stanza.pan || this.panDefault;

    if (p.rapporto) {
      // La stanza è un'immagine con questo rapporto larghezza/altezza e la si
      // vuole vedere INTERA, senza ritagli: il lato che avanza diventa quello
      // da trascinare. Il fattore dipende dallo schermo, quindi si ricalcola
      // qui e a ogni resize invece di stare scritto nei dati.
      const r = parseFloat(p.rapporto);
      const w = finestra.clientWidth, h = finestra.clientHeight;
      if (h * r >= w) { this._panFx = (h * r) / w; this._panFy = 1; }
      else            { this._panFx = 1; this._panFy = (w / r) / h; }
    } else {
      this._panFx = Math.max(1, parseFloat(p.x) || 1);
      this._panFy = Math.max(1, parseFloat(p.y) || 1);
    }

    scena.style.width = (this._panFx * 100) + '%';
    scena.style.height = (this._panFy * 100) + '%';

    // stanza nuova: si riparte dal centro, così ci si può guardare da
    // entrambi i lati. Stessa stanza: si riapplica la frazione già in uso,
    // che a parità di misure è esattamente l'inquadratura di prima.
    if (this._panStanzaId !== stanza.id) {
      this._panStanzaId = stanza.id;
      this._panFraz = { x: .5, y: .5 };
    }
    const lim = this._panLimiti();
    this._panApplica(lim.minX * this._panFraz.x, lim.minY * this._panFraz.y, false);

    // Al primo disegno la finestra può non essere ancora impaginata: i limiti
    // verrebbero nulli e la stanza resterebbe incollata a sinistra per tutta
    // la partita. Si ripassa al frame dopo, una volta sola.
    if (!finestra.clientWidth && !this._panRiprova) {
      this._panRiprova = true;
      requestAnimationFrame(() => { this._panRiprova = false; this._panStanza(stanza, panOverride); });
    }
  },

  // Un hotspot fuori campo è raggiungibile col tab ma invisibile: quando
  // prende il fuoco la scena si sposta quel tanto che basta a mostrarlo.
  _panVerso(el) {
    const finestra = document.getElementById('mappa');
    const r = el.getBoundingClientRect();
    const f = finestra.getBoundingClientRect();
    const margine = 12;
    let dx = 0, dy = 0;
    if (r.left < f.left + margine) dx = f.left + margine - r.left;
    else if (r.right > f.right - margine) dx = f.right - margine - r.right;
    if (r.top < f.top + margine) dy = f.top + margine - r.top;
    else if (r.bottom > f.bottom - margine) dy = f.bottom - margine - r.bottom;
    if (dx || dy) this._panApplica(this._panX + dx, this._panY + dy, true);
  },

  // Il gesto. Sotto la soglia resta un tocco e tutto si comporta come prima;
  // sopra la soglia diventa un trascinamento e il click che ne consegue viene
  // soffocato, così una trascinata che finisce su un hotspot non apre nulla.
  _panGesto() {
    const finestra = document.getElementById('mappa');
    const SOGLIA = 8;
    let attivo = false, x0 = 0, y0 = 0, px = 0, py = 0;

    finestra.addEventListener('pointerdown', (e) => {
      attivo = true;
      this._panMosso = false;
      x0 = e.clientX; y0 = e.clientY;
      px = this._panX; py = this._panY;
    });

    finestra.addEventListener('pointermove', (e) => {
      if (!attivo) return;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      if (!this._panMosso) {
        if (Math.abs(dx) < SOGLIA && Math.abs(dy) < SOGLIA) return;
        this._panMosso = true;
        // da qui in poi il dito comanda la scena: si evita che il gesto
        // venga interpretato anche come selezione di testo o scorrimento
        if (finestra.setPointerCapture) {
          try { finestra.setPointerCapture(e.pointerId); } catch (_) {}
        }
      }
      this._panApplica(px + dx, py + dy, false);
    });

    const fine = () => { attivo = false; };
    finestra.addEventListener('pointerup', fine);
    finestra.addEventListener('pointercancel', () => { attivo = false; this._panMosso = false; });

    // in cattura: il click non arriva mai all'hotspot sotto il dito.
    // Stesso schema di _dragMosso per i cerchi dell'inventario.
    finestra.addEventListener('click', (e) => {
      if (!this._panMosso) return;
      e.stopPropagation();
      e.preventDefault();
      this._panMosso = false;
    }, true);

    // Rotazione dello schermo, finestra ridimensionata — ma soprattutto il
    // primo assestamento del layout: `height:100dvh` non è ancora risolta
    // quando parte la prima renderStanza, e con `rapporto` i fattori si
    // calcolano su una finestra più bassa di quella vera. Un listener su
    // `resize` non basta, perché quell'assestamento non emette resize.
    // ResizeObserver guarda #mappa e scatta a ogni sua variazione, quale che
    // ne sia la causa; il conto si rifà e l'offset si ri-clampa (l'inquadratura
    // non si perde: la stanza è la stessa).
    const ricalcolaPan = () => {
      const stanza = this.stanze[gameState.stanzaCorrente];
      if (stanza) this._panStanza(stanza, this._visualeStanza(stanza).pan);
    };
    new ResizeObserver(ricalcolaPan).observe(finestra);
  },

  /* ---------------- hotspot ---------------- */

  apriHotspot(hotspot, el) {
    // un lucchetto già in scena sta per aprire una schermata: un secondo tocco
    // affrettato non ne apre una seconda
    if (this._lucchettoInCorso) return;

    // tutorial d'ingresso: finché non si è trovata la prima piuma in assoluto,
    // solo le piume rispondono al tocco. Silenzioso: l'hotspot è già
    // invisibile (hotspotVisibili:false), quindi un tocco a vuoto non si
    // distingue da "qui non c'è niente".
    if (hotspot.tipo !== 'piuma' && !gameState.tutorialSbloccato) return;

    const stato = gameState.statoStanze[gameState.stanzaCorrente];

    if (hotspot.tipo === 'testo') {
      const bottoni = [];
      if (hotspot.vaiA) {
        bottoni.push({
          label: hotspot.labelVaiA || this._testo('btnEntra'),
          onClick: () => { this._chiudiToast(); this.vaiAStanza(hotspot.vaiA); }
        });
      }
      this.mostraToast({ testo: hotspot.testo, bottoni });
      return;
    }

    // piuma d'aiuto: nessun toast, vola nello zaino e sparisce dalla scena.
    // Non passa dagli slot oggetti, quindi non può mai riempire l'inventario.
    if (hotspot.tipo === 'piuma') {
      // zaino piume pieno: la piuma NON si raccoglie e NON entra fra gli
      // oggettiRaccolti, quindi l'hotspot resta nella stanza e la si può
      // riprendere dopo aver speso un indizio.
      if (gameState.piume.length >= MAX_PIUME) {
        // il toast aspetta che la piuma sia ricaduta: comparire subito, a
        // metà animazione, sembrava un errore del gioco
        this._piumaCade(el, () => this.mostraToast({ testo: this._testo('piumePiene') }));
        return;
      }
      // lo stato si aggiorna subito (la piuma non si perde mai);
      // il contatore sale quando l'animazione arriva allo zaino.
      gameState.piume.push({
        id: hotspot.id,
        nome: hotspot.nome || this._testo('piumaNome'),
        descrizione: hotspot.descrizione || this._testo('piumaDescrizione'),
        origineStanza: gameState.stanzaCorrente
      });
      stato.oggettiRaccolti.push(hotspot.id);

      // sblocco del tutorial: scatta alla primissima piuma raccolta in
      // assoluto. Può alzarsi subito, prima ancora di mostrare tutorial2:
      // finché il toast resta aperto #mappa ha pointer-events:none, quindi
      // nessun click su un altro hotspot può passare nel frattempo.
      const primaVolta = !gameState.tutorialSbloccato;
      gameState.tutorialSbloccato = true;

      // tutorial2 aspetta la fine dell'animazione: allaFine scatta quando la
      // piuma arriva allo zaino (o subito, con le animazioni ridotte).
      this._volaPiuma(el, () => {
        this._renderInventario();
        if (primaVolta) this.mostraToast({ testo: TESTI.tutorial2 });
      });
      this.renderStanza(gameState.stanzaCorrente);
      return;
    }

    if (hotspot.tipo === 'oggetto') {
      this.mostraToast({
        titolo: hotspot.nome,
        testo: hotspot.descrizione,
        bottoni: [
          { label: this._testo('btnPrendi'), onClick: () => {
              const ok = this.aggiungiInventario({
                id: hotspot.id, nome: hotspot.nome, descrizione: hotspot.descrizione,
                origineStanza: gameState.stanzaCorrente, origineHotspotId: hotspot.id
              });
              if (ok) {
                stato.oggettiRaccolti.push(hotspot.id);
                this._chiudiToast();
                this.renderStanza(gameState.stanzaCorrente);
                // anche una chiave raccolta a mano gira e vola nello zaino
                if (hotspot.chiave) this._chiaveVola(); else this._pulsaZaino();
              }
            } },
          { label: this._testo('btnLascia'), onClick: () => this._chiudiToast(), secondario: true }
        ]
      });
      return;
    }

    if (hotspot.tipo === 'enigma') {
      if (stato.enigmiCompletati.includes(hotspot.id)) {
        this.mostraToast({ titolo: hotspot.nome, testo: this._testo('enigmaGiaRisolto') });
        return;
      }
      const blocco = hotspot.bloccatoDa;
      if (blocco) {
        const soddisfatto = blocco.tipo === 'oggetto'
          ? gameState.inventario.some(o => o.id === blocco.id)
          : stato.enigmiCompletati.includes(blocco.id);
        if (!soddisfatto) {
          this.mostraToast({
            titolo: hotspot.nome,
            testo: hotspot.testoBloccato || this._testo('enigmaBloccato')
          });
          return;
        }
      }
      // niente anticamera: sul punto toccato compare un lucchetto che vibra
      // («qui c'è una serratura») e subito dopo si apre la schermata.
      this._lucchettoInCorso = true;
      const stanzaOrigine = gameState.stanzaCorrente;
      this._lucchettoVibra(el, () => {
        this._lucchettoInCorso = false;
        // se nel frattempo si è cambiata stanza, questo enigma non è più
        // sotto gli occhi del giocatore: l'animazione finisce e basta
        if (gameState.stanzaCorrente !== stanzaOrigine) return;
        // tutorial3: la regola della stanza, una volta sola in tutta la
        // partita. Viene DOPO il lucchetto — prima si vede la serratura, poi
        // si legge perché conta — e la schermata aspetta che il toast si
        // chiuda.
        if (!gameState.tutorial3Mostrato && TESTI.tutorial3) {
          gameState.tutorial3Mostrato = true;
          this.mostraToast({
            testo: TESTI.tutorial3,
            allaChiusura: () => this._apriEnigma(hotspot, el)
          });
          return;
        }
        this._apriEnigma(hotspot, el);
      });
      return;
    }
  },

  completaEnigma(idEnigma) {
    // la stanza è quella da cui l'enigma è stato aperto, non quella corrente:
    // fra l'apertura e la soluzione il giocatore potrebbe essere altrove.
    const idStanza = this._enigmaStanza || gameState.stanzaCorrente;
    const stanza = this.stanze[idStanza];
    const stato = gameState.statoStanze[idStanza];
    if (stato.enigmiCompletati.includes(idEnigma)) return;
    stato.enigmiCompletati.push(idEnigma);

    const hotspot = (stanza.hotspot || []).find(h => h.id === idEnigma);
    const premio = hotspot && hotspot.ricompensa;
    if (premio) {
      this.aggiungiInventario({
        id: idEnigma + '-ricompensa',
        nome: premio.nome,
        descrizione: premio.descrizione,
        origineStanza: idStanza,
        origineHotspotId: null
      });
      // una chiave se la prende l'animazione, che pulsa lo zaino al suo arrivo
      if (!premio.chiave) this._pulsaZaino();
    }

    this._chiudiPopup();
    // Un enigma può aprire una stanza: risolverlo ci porta dentro, senza
    // passare da una freccia. Altrimenti si ridisegna la scena — se nel
    // frattempo si è cambiata stanza, quella che si sta guardando.
    if (hotspot && hotspot.vaiA) this.vaiAStanza(hotspot.vaiA);
    else this.renderStanza(gameState.stanzaCorrente);

    // la chiave vola nello zaino a schermata chiusa; se c'è una spiegazione
    // si legge prima, e la chiave parte quando quel toast si chiude
    const volo = premio && premio.chiave ? () => this._chiaveVola() : null;

    // La spiegazione arriva DOPO la soluzione, mai prima: chiude il ragionamento
    // e non lo anticipa. È contenuto, quindi sta nei dati (hotspot.spiegazione):
    // un enigma che non la dichiara semplicemente non la mostra.
    if (hotspot && hotspot.spiegazione) {
      this.mostraToast({ titolo: hotspot.nome, testo: hotspot.spiegazione, allaChiusura: volo });
    } else if (volo) {
      volo();
    }
  },

  // La chiave trovata gira su se stessa e finisce nello zaino. Parte dal
  // centro della scena: quando scatta la schermata dell'enigma è già chiusa,
  // quindi non c'è un punto preciso da cui farla uscire.
  _chiaveVola() {
    this._iconaVolante({
      daEl: document.getElementById('mappa'),
      versoEl: document.getElementById('btn-inventario'),
      classe: 'chiave-volante', svg: this._svgChiave(), ms: 1500,
      allaFine: () => {
        this._pulsaZaino();
        // tutorial4: solo alla prima chiave in assoluto
        if (!gameState.tutorial4Mostrato && TESTI.tutorial4) {
          gameState.tutorial4Mostrato = true;
          this.mostraToast({ testo: TESTI.tutorial4 });
        }
      }
    });
  },

  /* ---------------- inventario ---------------- */

  aggiungiInventario(oggetto) {
    if (gameState.inventario.length >= MAX_SLOT_INVENTARIO) {
      this.mostraToast({
        titolo: this._testo('inventarioPienoTitolo'),
        testo: this._testo('inventarioPieno')
      });
      return false;
    }
    gameState.inventario.push(oggetto);
    this._renderInventario();
    return true;
  },

  /* --- piume d'aiuto: voce separata dagli oggetti, capienza propria --- */
  spendiPiuma() {
    // test mode: le piume non si consumano mai, sempre 5 disponibili
    if (this.testMode) return true;
    if (!gameState.piume.length) return false;
    gameState.piume.pop();
    this._renderInventario();
    return true;
  },

  consumaOggetto(id) {
    gameState.inventario = gameState.inventario.filter(o => o.id !== id);
    this._renderInventario();
  },

  scartaOggetto(id) {
    const oggetto = gameState.inventario.find(o => o.id === id);
    if (!oggetto) return;
    gameState.inventario = gameState.inventario.filter(o => o.id !== id);

    if (oggetto.origineHotspotId && oggetto.origineStanza && this.stanzaAccessibile(oggetto.origineStanza)) {
      const stato = gameState.statoStanze[oggetto.origineStanza];
      stato.oggettiRaccolti = stato.oggettiRaccolti.filter(hid => hid !== oggetto.origineHotspotId);
      if (oggetto.origineStanza === gameState.stanzaCorrente) this.renderStanza(gameState.stanzaCorrente);
    }
    this._renderInventario();
  },

  /* ---------------- drag & drop generico ---------------- */

  abilitaDropZone(elemento, idOggettoAtteso, onSuccess) {
    const def = { elemento, idOggettoAtteso, onSuccess };
    this._dropzones.push(def);
    elemento.classList.add('dropzone-attiva');
    return def;
  },

  /* ---------------- listener centralizzati ---------------- */

  registraListener(target, evento, fn, opts) {
    target.addEventListener(evento, fn, opts);
    this._listeners.push({ target, evento, fn, opts });
  },

  _pulisciListeners() {
    this._listeners.forEach(l => l.target.removeEventListener(l.evento, l.fn, l.opts));
    this._listeners = [];
    this._dropzones.forEach(d => d.elemento.classList.remove('dropzone-attiva', 'dropzone-hover'));
    this._dropzones = [];
  },

  /* ---------------- TOAST ---------------- */

  // Unico riquadro di messaggio del gioco: click su cose ininfluenti,
  // indicazioni al giocatore, conferme, raccolta oggetti.
  // Si chiude con un click da qualunque parte (i suoi pulsanti no: quelli
  // eseguono la loro azione e decidono da soli se chiudere).
  // `allaChiusura` è un seguito facoltativo: scatta quando il riquadro si
  // chiude ed è libero di aprire dell'altro — è così che il toast del tutorial
  // lascia il posto alla schermata dell'enigma.
  mostraToast({ titolo, testo, bottoni, allaChiusura } = {}) {
    const barra = document.getElementById('toast');
    const tit = document.getElementById('toast-titolo');
    tit.textContent = titolo || '';
    tit.style.display = titolo ? 'block' : 'none';
    document.getElementById('toast-testo').textContent = testo || '';

    const cont = document.getElementById('toast-bottoni');
    cont.innerHTML = '';
    (bottoni || []).forEach(b => {
      const btn = document.createElement('button');
      btn.textContent = b.label;
      if (b.secondario) btn.className = 'secondario';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();      // il click sul pulsante non chiude il toast da sé
        b.onClick(e);
      });
      cont.appendChild(btn);
    });
    // un toast non eredita mai il seguito di quello precedente
    this._toastAllaChiusura = allaChiusura || null;

    barra.classList.add('aperta');
    this._navOff();
    document.getElementById('app').classList.add('dim', 'stato-toast');
    this._scenaInerte();
    // col fuoco dentro il riquadro il tab non scende più sugli hotspot sotto
    (cont.querySelector('button') || barra).focus();
  },

  // `eseguiSeguito: false` chiude e BUTTA il seguito: serve a chi chiude il
  // toast per forza maggiore (cambio stanza), dove riaprire l'enigma della
  // stanza appena lasciata sarebbe un errore.
  _chiudiToast(eseguiSeguito = true) {
    // il seguito si preleva e si azzera PRIMA di eseguirlo: se riapre un toast,
    // quello nuovo detta il proprio (o nessuno) senza che questo lo ricalpesti.
    const seguito = eseguiSeguito ? this._toastAllaChiusura : null;
    this._toastAllaChiusura = null;

    document.getElementById('toast').classList.remove('aperta');
    const app = document.getElementById('app');
    app.classList.remove('stato-toast');
    // l'oscuramento resta se sotto c'è ancora un enigma
    if (!app.classList.contains('stato-enigma')) app.classList.remove('dim');
    this._scenaInerte();

    // per ultimo: così un seguito che riapre il riquadro rimette le classi
    // sopra una chiusura già completata, non sotto.
    if (seguito) seguito();
  },

  // Con un pannello aperto la scena esce dal giro: niente tab sugli hotspot
  // sotto (sono <button> resi invisibili dall'opacità, non dal DOM) e quindi
  // niente scena che scorre da sola dietro un riquadro.
  _scenaInerte() {
    const app = document.getElementById('app');
    const coperta = app.classList.contains('stato-toast')
      || app.classList.contains('stato-enigma')
      || app.classList.contains('stato-mappa');
    document.getElementById('mappa').inert = coperta;
  },

  /* ---------------- MAPPA in sovraimpressione ---------------- */

  // Nebbia sulle stanze non ancora visitate (copre il nome già disegnato
  // sulla pianta) e segnalino sulla stanza corrente, entrambi posizionati in
  // percentuale sopra gamemap1.png con le coordinate di `stanza.mappa`.
  // Solo scatto statico: il popup blocca la scena finché resta aperto.
  _costruisciOverlayMappa() {
    let html = '';
    Object.keys(this.stanze).forEach(id => {
      const m = this.stanze[id].mappa;
      if (!m || gameState.stanzeVisitate.includes(id)) return;
      html += `<div class="mappa-nebbia" style="left:${m.x}%;top:${m.y}%;`
        + `width:${m.larghezza}%;height:${m.altezza}%"></div>`;
    });
    const qui = this.stanze[gameState.stanzaCorrente];
    if (qui && qui.mappa) {
      html += `<span class="mappa-segnaposto-giocatore" `
        + `style="left:${qui.mappa.x}%;top:${qui.mappa.y}%">${this._svgPiuma()}</span>`;
    }
    return html;
  },

  _apriMappa() {
    this._chiudiInventario();
    this._navOff();
    // in cripta (sF) si vede lo spaccato con la scala, senza nebbia né
    // segnalino: non è una pianta con stanze etichettate come gamemap1
    const inCripta = gameState.mainRoomCorrente === 'sF';
    document.getElementById('mappa-img').src = 'assets/img/map/gamemap' + (inCripta ? '2' : '1') + '.png';
    document.getElementById('mappa-overlay').innerHTML = inCripta ? '' : this._costruisciOverlayMappa();
    document.getElementById('pannello-mappa').classList.add('aperto');
    document.getElementById('app').classList.add('dim-leggero', 'stato-mappa');
    this._scenaInerte();
  },

  _chiudiMappa() {
    document.getElementById('pannello-mappa').classList.remove('aperto');
    document.getElementById('app').classList.remove('dim-leggero', 'stato-mappa');
    this._scenaInerte();
  },

  /* ---------------- SCHERMATA ENIGMA ---------------- */

  // La sola superficie che un modulo di /puzzles può usare. Identica a quella
  // che gli passa tools/sandbox.html, così lo stesso file gira in entrambi.
  _apiPuzzle(hotspot) {
    return {
      risolto: () => this.completaEnigma(hotspot.id),
      registraListener: (t, ev, fn, opts) => this.registraListener(t, ev, fn, opts),
      abilitaDropZone: (el, idAtteso, onOk) => this.abilitaDropZone(el, idAtteso, onOk),
      inventario: () => gameState.inventario.slice(),
      consumaOggetto: (id) => this.consumaOggetto(id),
      progresso: () => this.progressoEnigma(hotspot.id),
      salvaProgresso: (dati) => this.salvaProgressoEnigma(hotspot.id, dati)
    };
  },

  /* --- progresso a metà di un enigma ---
     Un enigma può chiedere più passi (le quattro chiavi del sigillo, per
     dire) e il giocatore può uscire dalla schermata nel mezzo: quello che
     ha già fatto non deve perdersi. Il motore non sa cosa contenga `dati`,
     lo tiene e basta; a interpretarlo è il puzzle che l'ha scritto.
     Vive in gameState come tutto il resto: ricaricare la pagina azzera. */
  progressoEnigma(idEnigma) {
    const stato = gameState.statoStanze[this._enigmaStanza || gameState.stanzaCorrente];
    return (stato && stato.progressiEnigmi && stato.progressiEnigmi[idEnigma]) || null;
  },

  salvaProgressoEnigma(idEnigma, dati) {
    const stato = gameState.statoStanze[this._enigmaStanza || gameState.stanzaCorrente];
    if (!stato) return;
    if (!stato.progressiEnigmi) stato.progressiEnigmi = {};
    stato.progressiEnigmi[idEnigma] = dati;
  },

  // Un enigma può avere un filmato d'apertura (`video` nei dati): parte
  // subito, a tutto schermo, e la schermata dell'enigma lo aspetta. Senza
  // video si apre e basta, com'è sempre stato.
  _apriEnigma(hotspot, daEl) {
    if (!hotspot.video) return this._apriPopupEnigma(hotspot, daEl);
    this._riproduciVideo(hotspot.video, () => this._apriPopupEnigma(hotspot, daEl));
  },

  // Il filmato copre tutto e si toglie da solo alla fine; un tocco lo salta.
  // Il percorso arriva dai dati: il motore non sa cosa ci sia dentro.
  // Se il file manca, o il browser rifiuta di partire, si prosegue subito:
  // un video che non c'è non deve mai bloccare il gioco.
  _riproduciVideo(src, allaFine) {
    const app = document.getElementById('app');
    const video = document.createElement('video');
    video.id = 'video-scena';
    video.src = src;
    video.playsInline = true;
    video.setAttribute('playsinline', '');   // iOS: senza, apre il player a tutto schermo
    video.setAttribute('aria-label', 'Filmato');

    // il seguito parte una volta sola, comunque il filmato finisca
    let seguito = allaFine;
    const prosegui = () => { const f = seguito; seguito = null; if (f) f(); };
    const chiudi = () => {
      if (!video.isConnected) return;
      video.remove();
      app.classList.remove('stato-video');
      prosegui();
    };

    // Finale in due tempi, il nero fa da cerniera: prima il quadro sfuma nel
    // nero, poi la schermata dell'enigma si apre DIETRO quel nero, che a sua
    // volta si scioglie sopra di lei. Le durate sono le stesse del CSS
    // (transition di .buio e .via): un timer, non `transitionend`, perché
    // `filter` non sempre lo emette in modo affidabile e un evento perso
    // lascerebbe il nero bloccato per sempre.
    video.addEventListener('ended', () => {
      if (this._animazioniRidotte()) { chiudi(); return; }
      video.classList.add('buio');
      setTimeout(() => {
        prosegui();
        video.classList.add('via');
        setTimeout(chiudi, 1200);
      }, 2000);
    });
    // Nessuna scorciatoia: il filmato non si salta con un tocco, si guarda.
    // L'unica uscita anticipata è un file che proprio non parte, muto compreso:
    // lì si prosegue subito, perché un video che non c'è non deve bloccare il
    // gioco. Un primo errore (spesso la sola traccia audio, che qui non è mai
    // decodificabile) non basta ad arrendersi: si ritenta muto una volta sola.
    let riprovatoMuto = false;
    video.addEventListener('error', () => {
      if (riprovatoMuto) { chiudi(); return; }
      riprovatoMuto = true;
      video.muted = true;
      video.load();
      const r = video.play();
      if (r && r.catch) r.catch(chiudi);
    });

    app.appendChild(video);
    app.classList.add('stato-video');

    // l'audio è ammesso perché si arriva qui da un tocco; se il browser lo
    // nega comunque, si ritenta muto invece di rinunciare al filmato
    const partita = video.play();
    if (partita && partita.catch) {
      partita.catch(() => { riprovatoMuto = true; video.muted = true; const r = video.play(); if (r && r.catch) r.catch(chiudi); });
    }
  },

  _apriPopupEnigma(hotspot, daEl) {
    const wrap = document.getElementById('popup-enigma-wrap');
    this._enigmaOrigineEl = daEl || null;   // a chi restituire il fuoco alla chiusura
    document.getElementById('popup-enigma-titolo').textContent = hotspot.nome || '';
    const body = document.getElementById('popup-enigma-body');
    body.innerHTML = '';
    this._enigmaCorrente = hotspot;
    this._enigmaStanza = gameState.stanzaCorrente;
    wrap.classList.add('aperto');
    document.getElementById('app').classList.add('dim', 'stato-enigma');
    this._scenaInerte();

    const modulo = window.Puzzles && window.Puzzles[hotspot.puzzle];
    if (!modulo) {
      console.warn('Puzzle non registrato:', hotspot.puzzle, '— hotspot', hotspot.id);
      body.innerHTML = '<p class="enigma-domanda">' + this._testo('puzzleMancante') + '</p>';
    } else {
      modulo.render(body, hotspot.parametri || {}, this._apiPuzzle(hotspot));
    }

    this._aggiornaAiuto();
    // il primo controllo dell'enigma prende il fuoco (tastiera / lettori di schermo)
    const primo = body.querySelector('button:not(:disabled)');
    (primo || document.getElementById('btn-enigma-close')).focus();
  },

  _chiudiPopup() {
    document.getElementById('popup-enigma-wrap').classList.remove('aperto');
    const app = document.getElementById('app');
    app.classList.remove('stato-enigma');
    if (!app.classList.contains('stato-toast')) app.classList.remove('dim');
    document.getElementById('popup-enigma-body').innerHTML = '';
    this._enigmaCorrente = null;
    this._enigmaStanza = null;
    this._pulisciListeners();
    this._scenaInerte();
    // il fuoco torna da dove è partito, se quell'hotspot è ancora sulla scena
    const origine = this._enigmaOrigineEl;
    this._enigmaOrigineEl = null;
    if (origine && origine.isConnected) origine.focus();
  },

  // Un solo indizio per enigma, dichiarato dai dati come `indizio: '...'`.
  // La barra la costruisce il motore, quindi vale per QUALSIASI puzzle.
  _aggiornaAiuto() {
    const btn = document.getElementById('btn-enigma-aiuto');
    const box = document.getElementById('enigma-indizio');
    const h = this._enigmaCorrente;

    if (!h || !h.indizio) {
      btn.style.display = 'none';
      box.classList.remove('visibile');
      box.textContent = '';
      return;
    }
    btn.style.display = 'flex';
    document.getElementById('aiuto-conteggio').textContent = gameState.piume.length;

    const stato = gameState.statoStanze[gameState.stanzaCorrente];
    if (stato.indiziRivelati.includes(h.id)) {
      box.textContent = h.indizio;
      box.classList.add('visibile');
      btn.disabled = true;
    } else {
      box.textContent = '';
      box.classList.remove('visibile');
      btn.disabled = false;
    }
  },

  _chiediAiuto() {
    const h = this._enigmaCorrente;
    if (!h || !h.indizio) return;
    const stato = gameState.statoStanze[gameState.stanzaCorrente];
    if (stato.indiziRivelati.includes(h.id)) return;

    if (!gameState.piume.length) {
      this.mostraToast({
        titolo: this._testo('nessunaPiumaTitolo'),
        testo: this._testo('nessunaPiuma')
      });
      return;
    }
    this.spendiPiuma();
    stato.indiziRivelati.push(h.id);
    this._aggiornaAiuto();
  },

  /* ---------------- inventario UI + drag ---------------- */

  // Una catena di cerchi per gli oggetti, una fila di punti per le piume.
  // NESSUNA scritta: il nome e la descrizione stanno nel toast che si apre
  // toccando un cerchio pieno. I punti e i cerchi si riempiono da sinistra.
  // Il punto è il posto vuoto: appena la piuma è raccolta, al suo posto
  // compare la piuma vera in miniatura.
  _renderInventario() {
    const pannello = document.getElementById('pannello-inventario');
    pannello.innerHTML = '';

    /* --- fila superiore: i punti delle piume --- */
    const punti = document.createElement('div');
    punti.className = 'inv-punti';
    const nPiume = gameState.piume.length;
    for (let i = 0; i < MAX_PIUME; i++) {
      const p = document.createElement('div');
      const raccolta = i < nPiume;
      p.className = 'inv-punto' + (raccolta ? ' pieno' : '');
      if (raccolta) p.innerHTML = this._svgPiuma();   // stessa icona della scena
      punti.appendChild(p);
    }
    punti.setAttribute('aria-label', this._testo('ariaPiume', { n: nPiume, max: MAX_PIUME }));
    pannello.appendChild(punti);

    /* --- fila inferiore: i cerchi degli oggetti --- */
    const catena = document.createElement('div');
    catena.className = 'inv-catena';
    for (let i = 0; i < MAX_SLOT_INVENTARIO; i++) {
      const oggetto = gameState.inventario[i];
      const slot = document.createElement('div');
      slot.className = 'slot-inventario' + (oggetto ? ' pieno' : '');
      // la catena si srotola da destra: l'ultimo cerchio parte per primo
      slot.style.setProperty('--ritardo', (MAX_SLOT_INVENTARIO - 1 - i) * 30 + 'ms');
      if (oggetto) {
        slot.tabIndex = 0;
        slot.setAttribute('role', 'button');
        slot.setAttribute('aria-label', oggetto.nome || this._testo('oggettoSenzaNome'));
        const icona = document.createElement('div');
        icona.className = 'slot-icona';
        icona.innerHTML = this._icona('oggetto');
        slot.appendChild(icona);
        // tocco = scheda dell'oggetto (con lo scarto); trascinamento = uso
        slot.addEventListener('click', () => {
          if (this._dragMosso) { this._dragMosso = false; return; }
          this.mostraToast({
            titolo: oggetto.nome,
            testo: oggetto.descrizione,
            bottoni: [{ label: this._testo('btnScarta'), onClick: () => this._chiediScarto(oggetto), secondario: true }]
          });
        });
        this._abilitaDragOggetto(slot, oggetto);
      }
      catena.appendChild(slot);
    }
    pannello.appendChild(catena);

    // il conteggio del pulsante aiuto segue le piume
    const cont = document.getElementById('aiuto-conteggio');
    if (cont) cont.textContent = nPiume;
  },

  _chiediScarto(oggetto) {
    this.mostraToast({
      titolo: this._testo('scartoDomanda', { nome: oggetto.nome || this._testo('oggettoSenzaNome') }),
      testo: this._testo('scartoAvviso'),
      bottoni: [
        { label: this._testo('btnScarta'), onClick: () => { this._chiudiToast(); this.scartaOggetto(oggetto.id); } },
        { label: this._testo('btnAnnulla'), onClick: () => this._chiudiToast(), secondario: true }
      ]
    });
  },

  _abilitaDragOggetto(slotEl, oggetto) {
    slotEl.style.touchAction = 'none';
    slotEl.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      const partenza = { x: ev.clientX, y: ev.clientY };
      this._dragMosso = false;

      const ghost = document.createElement('div');
      ghost.className = 'oggetto-drag-ghost';
      ghost.innerHTML = this._icona('oggetto');
      document.body.appendChild(ghost);
      const muovi = (x, y) => { ghost.style.left = x + 'px'; ghost.style.top = y + 'px'; };
      muovi(ev.clientX, ev.clientY);

      const onMove = (e) => {
        if (Math.abs(e.clientX - partenza.x) > 6 || Math.abs(e.clientY - partenza.y) > 6) {
          this._dragMosso = true;   // è un trascinamento, non un tocco: niente scheda
        }
        muovi(e.clientX, e.clientY);
        this._dropzones.forEach(dz => {
          const r = dz.elemento.getBoundingClientRect();
          const dentro = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
          dz.elemento.classList.toggle('dropzone-hover', dentro);
        });
      };
      const onUp = (e) => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        ghost.remove();
        let colpito = null;
        for (const dz of this._dropzones) {
          const r = dz.elemento.getBoundingClientRect();
          const dentro = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
          dz.elemento.classList.remove('dropzone-hover');
          if (dentro && (!dz.idOggettoAtteso || dz.idOggettoAtteso === oggetto.id)) { colpito = dz; break; }
        }
        if (colpito) colpito.onSuccess(oggetto.id);
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    });
  },

  // lo zaino "si apre": la falda ruota e il pannello scivola dentro
  _apriInventario() {
    document.getElementById('pannello-inventario').classList.add('aperto');
    document.getElementById('btn-inventario').classList.add('aperto');
    // con la catena aperta la mappa sparisce: è il suo stesso spazio
    document.getElementById('app').classList.add('stato-inventario');
  },
  _chiudiInventario() {
    document.getElementById('pannello-inventario').classList.remove('aperto');
    document.getElementById('btn-inventario').classList.remove('aperto');
    document.getElementById('app').classList.remove('stato-inventario');
  },

  _pulsaZaino() {
    const b = document.getElementById('btn-inventario');
    b.classList.remove('pulsa');
    void b.offsetWidth;
    b.classList.add('pulsa');
    setTimeout(() => b.classList.remove('pulsa'), 500);
  },

  // Un'icona che compare sopra la scena, si anima e sparisce. La usano tutte
  // e tre le animazioni volanti del gioco: cambiano solo classe, disegno,
  // durata della rete di sicurezza e l'eventuale bersaglio del volo.
  // `allaFine` scatta comunque, anche con le animazioni ridotte (dove non si
  // disegna nulla): chi la usa per proseguire non resta mai appeso.
  _iconaVolante({ daEl, classe, svg, ms, versoEl, allaFine }) {
    const seguito = allaFine || function () {};
    if (!daEl || this._animazioniRidotte()) { seguito(); return; }

    const r = daEl.getBoundingClientRect();
    const x0 = r.left + r.width / 2, y0 = r.top + r.height / 2;

    const nodo = document.createElement('div');
    nodo.className = 'icona-volante ' + classe;
    nodo.innerHTML = svg;
    nodo.style.left = x0 + 'px';
    nodo.style.top = y0 + 'px';
    if (versoEl) {
      const b = versoEl.getBoundingClientRect();
      nodo.style.setProperty('--dx', (b.left + b.width / 2 - x0) + 'px');
      nodo.style.setProperty('--dy', (b.top + b.height / 2 - y0) + 'px');
    }
    document.body.appendChild(nodo);

    let concluso = false;
    const fine = () => { if (concluso) return; concluso = true; nodo.remove(); seguito(); };
    nodo.addEventListener('animationend', fine);
    setTimeout(fine, ms);   // rete di sicurezza se l'animazione non parte
  },

  // la piuma si stacca dalla scena, ondeggia verso l'alto e vola nello zaino
  _volaPiuma(daEl, allaFine) {
    const zaino = document.getElementById('btn-inventario');
    this._iconaVolante({
      daEl, versoEl: zaino, classe: 'piuma-volante', svg: this._svgPiuma(), ms: 1000,
      allaFine: () => { allaFine(); this._pulsaZaino(); }
    });
  },

  // zaino piume pieno: saltello e ricaduta, la piuma resta dov'era.
  // `ms` è la rete di sicurezza di _iconaVolante, non la durata vera: deve
  // restare più lunga dell'animazione CSS (piuma-cade, 1.6s), altrimenti
  // scatterebbe lei per prima e taglierebbe corta la caduta.
  _piumaCade(daEl, allaFine) {
    this._iconaVolante({ daEl, classe: 'piuma-caduta', svg: this._svgPiuma(), ms: 1700, allaFine });
  },

  // il lucchetto che annuncia un enigma: compare sul punto toccato, vibra un
  // attimo — «è chiuso» — e alla fine apre la schermata
  _lucchettoVibra(daEl, allaFine) {
    this._iconaVolante({
      daEl, classe: 'lucchetto-chiuso', svg: this._svgLucchetto(), ms: 1100, allaFine
    });
  },

  /* ---------------- lente di tocco ---------------- */

  // Un solo nodo, riusato: il tocco si ripete di continuo e non deve
  // produrre spazzatura. L'animazione si riavvia col trucco già usato
  // per la dissolvenza dello sfondo.
  _lente(x, y) {
    if (this._animazioniRidotte()) return;
    let el = this._lenteEl;
    if (!el) {
      el = document.createElement('div');
      el.id = 'lente-tocco';
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"' +
        ' stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/>' +
        '<path d="M15.4 15.4 21 21"/><path d="M8 8.6a3.4 3.4 0 0 1 2.2-1.3" opacity=".65"/></svg>';
      document.body.appendChild(el);
      this._lenteEl = el;
    }
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.animation = 'none';
    void el.offsetWidth;                 // forza il riavvio dell'animazione
    el.style.animation = 'lente-tocco .38s ease-out';
  },

  /* ---------------- avvio ---------------- */

  // Riceve l'intero contenuto del gioco: il motore non sa nulla in anticipo.
  avvia(dati) {
    if (!dati || !dati.stanze) { console.error('Engine.avvia: GAME_DATA mancante o senza stanze'); return; }

    const cfg = dati.configurazione || {};
    if (cfg.maxSlotInventario) MAX_SLOT_INVENTARIO = cfg.maxSlotInventario;
    if (cfg.maxPiume) MAX_PIUME = cfg.maxPiume;
    if (cfg.pan) this.panDefault = cfg.pan;   // quanto è grande una stanza «normale»
    TESTI = dati.testi || {};
    this.spostamentiSempreAttivi = cfg.spostamentiSempreAttivi !== false;
    this.hotspotVisibili = cfg.hotspotVisibili !== false;
    // test mode: niente tutorial, zaino piume sempre pieno, spostamenti mai
    // bloccati — per collaudare le stanze senza rifare da capo ogni volta.
    // Da tenere `false` in partita: sblocca solo con GAME_DATA.configurazione.
    this.testMode = !!cfg.testMode;
    if (this.testMode) {
      this.spostamentiSempreAttivi = true;
      gameState.tutorialSbloccato = true;
      gameState.tutorial3Mostrato = true;
      gameState.tutorial4Mostrato = true;
      for (let i = 0; i < MAX_PIUME; i++) {
        gameState.piume.push({ id: 'test-piuma-' + i, nome: this._testo('piumaNome'), descrizione: this._testo('piumaDescrizione') });
      }
      // le quattro chiavi del sigillo della cripta (sF-E1), per collaudare
      // la stanza finale senza ripassare da tutti gli enigmi del museo
      const chiaviTest = [
        { id: 's1-E3-ricompensa', nome: 'Chiave di Granito', descrizione: 'Trovata sul fondo della quinta cassa. Una delle quattro che aprono il sigillo della cripta.' },
        { id: 's2-E2-ricompensa', nome: 'Sigillo dello Scriba', descrizione: 'Incastonato nella tavoletta spaccata. Una delle quattro che aprono il sigillo della cripta.' },
        { id: 's4-E3-ricompensa', nome: 'Scheda di Restauro', descrizione: 'Ricomposta un frammento alla volta. Una delle quattro che aprono il sigillo della cripta.' },
        { id: 's3-I1', nome: 'Chiave di Biblioteca', descrizione: 'Caduta dietro uno scaffale, coperta di polvere. Una delle quattro che aprono il sigillo della cripta.' }
      ];
      chiaviTest.forEach(k => gameState.inventario.push(k));
    }

    Object.keys(dati.stanze).forEach(id => {
      const stanza = dati.stanze[id];
      if (!stanza.id) stanza.id = id;      // l'id può stare solo nella chiave
      this.registraStanza(stanza);
    });

    // test mode: le quattro chiavi del sigillo (sF-E1) risultano già
    // incastrate, così aprendo la schermata si parte direttamente dal
    // tastierino senza rifare il trascinamento.
    if (this.testMode && gameState.statoStanze['sF']) {
      gameState.statoStanze['sF'].progressiEnigmi['sF-E1'] =
        ['s1-E3-ricompensa', 's2-E2-ricompensa', 's4-E3-ricompensa', 's3-I1'];
    }

    this._renderInventario();
    // le due piume disegnate una volta sola all'avvio: quella in fondo al
    // toast e quella dentro il pulsante AIUTO della schermata enigma
    document.getElementById('toast-piuma').innerHTML = this._svgPiuma();
    document.getElementById('aiuto-piuma').innerHTML = this._svgPiuma();
    this.vaiAStanza(dati.avvio);

    // tutorial d'ingresso: primo toast automatico, prima di ogni interazione
    if (TESTI.tutorial1 && !this.testMode) this.mostraToast({ testo: TESTI.tutorial1 });

    const app = document.getElementById('app');

    document.getElementById('btn-inventario').addEventListener('click', () => {
      const p = document.getElementById('pannello-inventario');
      p.classList.contains('aperto') ? this._chiudiInventario() : this._apriInventario();
    });
    document.getElementById('btn-nav').addEventListener('click', () => this._navToggle());

    document.getElementById('btn-mappa').addEventListener('click', () => this._apriMappa());
    document.getElementById('pannello-mappa').addEventListener('click', (e) => {
      if (e.target.id === 'pannello-mappa') this._chiudiMappa();   // click fuori dal riquadro
    });

    // ENIGMA — × a sinistra, aiuto a destra (lo zaino resta al suo posto)
    document.getElementById('btn-enigma-close').addEventListener('click', () => this._chiudiPopup());
    document.getElementById('btn-enigma-aiuto').addEventListener('click', () => this._chiediAiuto());

    // TOAST — si chiude con un click da qualunque parte
    document.getElementById('toast').addEventListener('click', () => this._chiudiToast());

    // Un tocco sulla scena spegne la modalità spostamento: le frecce sono
    // un'inquadratura momentanea, non uno stato in cui si resta. Il tocco
    // sulla freccia arriva prima (è il bersaglio) e porta comunque via; una
    // trascinata del pan non conta come tocco.
    // In cattura e prima di _panGesto: quello soffoca il click di fine
    // trascinata e azzera _panMosso, quindi va ascoltato prima di lui,
    // finché la spia del trascinamento è ancora attendibile.
    document.getElementById('mappa').addEventListener('click', () => {
      if (this._panMosso) return;
      if (app.classList.contains('nav-attiva')) this._navOff();
    }, true);

    // PAN — la scena si trascina col dito. Va agganciato prima della lente:
    // è lui a stabilire se il gesto è stato un tocco o un trascinamento.
    this._panGesto();

    // LENTE — in cattura sulla scena, così scatta sia sul vuoto sia sugli
    // hotspot. Non compare sui comandi né sopra toast, enigma o mappa:
    // lì non stai investigando la scena. Scatta al RILASCIO e non alla
    // pressione, perché durante una trascinata lampeggerebbe a vuoto.
    document.getElementById('mappa').addEventListener('pointerup', (e) => {
      if (this._panMosso) return;
      if (app.classList.contains('stato-toast') ||
          app.classList.contains('stato-enigma') ||
          app.classList.contains('stato-mappa')) return;
      this._lente(e.clientX, e.clientY);
    }, true);

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (app.classList.contains('stato-toast')) { this._chiudiToast(); return; }
      if (app.classList.contains('stato-mappa')) { this._chiudiMappa(); return; }
      if (app.classList.contains('stato-enigma')) { this._chiudiPopup(); return; }
      if (app.classList.contains('nav-attiva')) this._navOff();
    });
  }
};

/* =========================================================================
   BOOTSTRAP — funziona sia con gli script in fondo al body sia nel <head>
   ========================================================================= */
function avviaGioco() { Engine.avvia(window.GAME_DATA); }
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', avviaGioco);
} else {
  avviaGioco();
}
