/* =========================================================================
   PUZZLE — Occhio del Falco (serratura a 4 anelli concentrici)
   Assorbe un componente esterno, <falcon-lock>, fornito già scritto e
   verificato: il codice del custom element sta SOTTO, invariato, fino alla
   riga `customElements.define(...)`. Da lì in poi comincia l'adattatore al
   contratto dei puzzle del progetto — quella parte sì è codice nostro.

   <falcon-lock> — L'Occhio del Falco
   Serratura a 4 anelli concentrici, 12 settori. Ogni anello ha un solo varco
   e gira in UN SOLO verso; ruotandone uno se ne trascina un altro (matrice M).
   Allineati tutti i varchi verso il basso, la sfera esce dal canale.

   Uso del custom element, da solo:
     <script src="puzzle_occhio_falco.js"></script>
     <falcon-lock></falcon-lock>
     el.addEventListener('aligned', ...)   // varchi allineati
     el.addEventListener('solved',  ...)   // sfera uscita (dopo il click)
     el.reset()

   Codice soluzione (scatti nel verso consentito, anelli I·II·III·IV): 8·7·10·8
   — dimostrato unico su tutte le 12^4 combinazioni possibili da
   tools/verifiche/sF_e2_occhio_falco.py (--test -> OK). Se START, M o DIR
   qui sotto cambiano, quello script va riallineato a mano: non li legge da
   qui, li ricopia (stesso principio delle verifiche in tools/verifiche/,
   che copiano i "motori" invece di importarli).
   ========================================================================= */
(() => {
  const S = 12, STEP = 30, C = 310, VB_H = 620;
  const START = [4, 11, 7, 4];
  const RADII = [102, 162, 222, 280];
  const WIDTHS = [46, 46, 46, 40];
  const STROKES = ['#6b512c', '#7c5e32', '#8d6c39', '#a37f44'];
  const GLYPH = ['#3b2c17', '#41311a', '#4b391e', '#57401f'];
  // M[anello trascinato][anello mosso] — l'ultimo torna sul primo
  const M = [[1, -2, 0, 0], [0, 1, -1, 0], [0, 0, 1, -2], [3, 0, 0, 1]];
  const DIR = [1, -1, 1, -1]; // verso consentito per ciascun anello

  const SVG = 'http://www.w3.org/2000/svg';
  const f = n => n.toFixed(1);
  const rnd = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
  const el = (tag, attrs) => { const n = document.createElementNS(SVG, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };

  // ---- glifi incisi: disegnati in cima all'anello (y = C - r), "su" = verso l'esterno
  function glyph(i, r) {
    const y = C - r, x = C;
    if (i === 0) return [ // scarabeo
      `M${f(x)} ${f(y - 11)}A8 12 0 0 1 ${f(x)} ${f(y + 13)}A8 12 0 0 1 ${f(x)} ${f(y - 11)}Z`,
      `M${f(x - 6)} ${f(y - 11)}L${f(x - 4)} ${f(y - 17)}L${f(x + 4)} ${f(y - 17)}L${f(x + 6)} ${f(y - 11)}`,
      `M${f(x)} ${f(y - 5)}L${f(x)} ${f(y + 12)}`,
      `M${f(x - 7)} ${f(y - 6)}l-7 -5M${f(x - 8)} ${f(y + 1)}l-8 1M${f(x - 7)} ${f(y + 6)}l-6 6`,
      `M${f(x + 7)} ${f(y - 6)}l7 -5M${f(x + 8)} ${f(y + 1)}l8 1M${f(x + 7)} ${f(y + 6)}l6 6`
    ];
    if (i === 1) return [ // occhio di Horus
      `M${f(x - 14)} ${f(y - 10)}Q${f(x - 2)} ${f(y - 17)} ${f(x + 11)} ${f(y - 9)}`,
      `M${f(x - 13)} ${f(y - 3)}Q${f(x - 3)} ${f(y - 12)} ${f(x + 10)} ${f(y - 2)}Q${f(x - 2)} ${f(y + 5)} ${f(x - 13)} ${f(y - 3)}z`,
      `M${f(x - 3)} ${f(y - 4)}A3 3.4 0 0 1 ${f(x + 3)} ${f(y - 4)}A3 3.4 0 0 1 ${f(x - 3)} ${f(y - 4)}Z`,
      `M${f(x + 10)} ${f(y - 2)}l7 7q1.5 4 -3.5 4.5`,
      `M${f(x - 2)} ${f(y + 3)}l-3 10q4 2.5 6 -2`
    ];
    if (i === 2) return [ // ankh
      `M${f(x)} ${f(y - 13)}A6.5 7.5 0 0 1 ${f(x)} ${f(y + 2)}A6.5 7.5 0 0 1 ${f(x)} ${f(y - 13)}Z`,
      `M${f(x)} ${f(y + 1)}L${f(x)} ${f(y + 16)}`,
      `M${f(x - 11)} ${f(y + 4)}L${f(x + 11)} ${f(y + 4)}`,
      `M${f(x - 11)} ${f(y + 4)}l-1 2M${f(x + 11)} ${f(y + 4)}l1 2`
    ];
    const barbs = [-11, -5, 1, 7].map(dy => `M${f(x)} ${f(y + dy)}q-5 2 -9 7M${f(x)} ${f(y + dy)}q5 2 9 7`).join('');
    return [ // piuma di Maat
      `M${f(x)} ${f(y - 15)}L${f(x)} ${f(y + 15)}`,
      barbs,
      `M${f(x - 3)} ${f(y - 15)}q3 -4 6 0`
    ];
  }

  // piccolo segno di riempimento fra i glifi
  function filler(i, r) {
    const y = C - r, x = C;
    if (i === 0) return `M${f(x - 5)} ${f(y)}l0.4 0M${f(x)} ${f(y - 4)}l0.4 0M${f(x + 5)} ${f(y)}l0.4 0`;
    if (i === 1) return `M${f(x - 6)} ${f(y + 4)}l6 -8l6 8M${f(x - 6)} ${f(y + 10)}l6 -8l6 8`;
    if (i === 2) return `M${f(x - 4)} ${f(y - 7)}l0 14M${f(x + 4)} ${f(y - 7)}l0 14`;
    return `M${f(x - 6)} ${f(y - 6)}h12M${f(x - 6)} ${f(y)}h12M${f(x - 6)} ${f(y + 6)}h12`;
  }

  class FalconLock extends HTMLElement {
    connectedCallback() {
      if (this.built) return;
      this.built = true;
      this.off = [...START];
      this.taken = false;
      this.drag = null;
      this.build();
      this.paint();
    }

    build() {
      this.sferaImg = this.getAttribute('sfera') || '';
      this.rs = parseFloat(this.getAttribute('raggio-sfera')) || 38;
      const root = this.attachShadow ? (this.shadowRoot || this.attachShadow({ mode: 'open' })) : this;
      const style = document.createElement('style');
      style.textContent = `
        :host { display:block; }
        svg { display:block; width:100%; height:auto; overflow:visible; touch-action:none; user-select:none; }
        @keyframes pzf-pulsa { 0%,100% { transform:scale(1); opacity:1 } 50% { transform:scale(1.14); opacity:.9 } }
        @keyframes pzf-caduta {
          0%   { transform: translateY(0) scale(1); opacity: 1; }
          60%  { transform: translateY(180px) scale(1.18); opacity: 1; }
          80%  { transform: translateY(252px) scale(1.15); opacity: 1; }
          100% { transform: translateY(275px) scale(.2); opacity: 0; }
        }`;
      root.appendChild(style);

      const svg = el('svg', { viewBox: `0 0 620 ${VB_H}` });
      svg.innerHTML = `<defs>
        <linearGradient id="shaft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffd88a" stop-opacity="0.42"/>
          <stop offset="70%" stop-color="#ffd88a" stop-opacity="0.16"/>
          <stop offset="100%" stop-color="#ffd88a" stop-opacity="0"/>
        </linearGradient>
        <radialGradient id="obsidian" cx="36%" cy="30%" r="72%">
          <stop offset="0%" stop-color="#4a4550"/><stop offset="42%" stop-color="#1a1620"/><stop offset="100%" stop-color="#08070a"/>
        </radialGradient>
      </defs>`;

      this.shaft = el('rect', { x: 284, y: 300, width: 52, height: 320, fill: 'url(#shaft)', opacity: 0, 'pointer-events': 'none', style: 'transition:opacity .9s ease' });
      svg.append(
        this.shaft,
        el('circle', { cx: C, cy: C, r: 306, fill: '#1d1509', stroke: '#3f2f1b', 'stroke-width': 2 }),
        el('circle', { cx: C, cy: C, r: 296, fill: 'none', stroke: '#2a1f11', 'stroke-width': 1, 'stroke-dasharray': '2 9', opacity: 0.8 })
      );

      // fasce degli anelli
      this.bands = RADII.map((r, i) => {
        const w = WIDTHS[i], rIn = r - w / 2, rOut = r + w / 2;
        const dash = rad => { const c = 2 * Math.PI * rad, g = c / S; return `${(c - g).toFixed(2)} ${g.toFixed(2)}`; };
        const g = el('g', { style: 'transition:transform .18s ease-out' });
        const band = el('circle', { cx: C, cy: C, r, fill: 'none', stroke: STROKES[i], 'stroke-width': w, 'stroke-dasharray': dash(r), 'pointer-events': 'none', style: 'transition:stroke .25s ease' });
        g.append(
          band,
          el('circle', { cx: C, cy: C, r: rIn, fill: 'none', stroke: '#160f06', 'stroke-width': 1.6, 'stroke-dasharray': dash(rIn), opacity: 0.8, 'pointer-events': 'none' }),
          el('circle', { cx: C, cy: C, r: rOut, fill: 'none', stroke: '#160f06', 'stroke-width': 1.6, 'stroke-dasharray': dash(rOut), opacity: 0.8, 'pointer-events': 'none' })
        );
        svg.appendChild(g);
        return { g, band };
      });

      // glifi + segni di riempimento (ruotano con il proprio anello)
      this.marks = [];
      RADII.forEach((r, i) => {
        const parts = glyph(i, r), fill = filler(i, r);
        for (let k = 0; k < S; k++) {
          if (k === 6) continue; // settore del varco
          const wear = rnd(i, k);
          const push = (d, w, o) => {
            const p = el('path', { d, fill: 'none', stroke: GLYPH[i], 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: o, 'pointer-events': 'none', style: 'transition:transform .18s ease-out' });
            svg.appendChild(p);
            this.marks.push({ node: p, ring: i, k });
          };
          if (k % 2 === 1) { push(fill, (1.4 + wear * 0.7).toFixed(2), (0.4 + wear * 0.3).toFixed(2)); continue; }
          parts.forEach((d, p) => {
            const e = rnd(i * 13 + k, p);
            push(d, (1.7 + e * 0.6).toFixed(2), (0.5 + wear * 0.32).toFixed(2));
          });
        }
        // graffi di usura, fermi sul bronzo
        for (let k = 0; k < 3; k++) {
          const t = rnd(i + 7, k);
          svg.appendChild(el('path', {
            d: `M${f(C - 16 - t * 10)} ${f(C - r - WIDTHS[i] / 2 + 5 + t * 10)}q${f(14)} ${f(6 + t * 12)} ${f(30 + t * 14)} 2`,
            fill: 'none', stroke: '#120c05', 'stroke-width': (1 + t * 1.5).toFixed(2), 'stroke-linecap': 'round',
            opacity: (0.3 + t * 0.3).toFixed(2), transform: `rotate(${360 * rnd(i, k + 21)} ${C} ${C})`, 'pointer-events': 'none'
          }));
        }
      });

      // zone di presa (trascinamento)
      RADII.forEach((r, i) => {
        const hit = el('circle', { cx: C, cy: C, r, fill: 'none', stroke: 'transparent', 'stroke-width': WIDTHS[i] - 4, 'pointer-events': 'stroke', cursor: 'grab' });
        hit.addEventListener('pointerdown', e => this.grab(i, e));
        svg.appendChild(hit);
      });

      // la sfera
      this.marble = el('g');
      this.marble.style.transformOrigin = f(C) + 'px ' + f(C) + 'px';
      this.palla = el('circle', { cx: C, cy: C, r: 38, fill: 'url(#obsidian)', stroke: '#3b2d1c', 'stroke-width': 2, style: 'transition:stroke .5s ease' });
      this.marble.appendChild(this.palla);
      if (this.sferaImg) this.marble.appendChild(el('image', {
        x: C - this.rs, y: C - this.rs, width: 2 * this.rs, height: 2 * this.rs,
        href: this.sferaImg, 'xlink:href': this.sferaImg, preserveAspectRatio: 'xMidYMid meet', 'pointer-events': 'none'
      }));
      this.glint = el('ellipse', { cx: 292, cy: 290, rx: 7, ry: 5, fill: '#8f8aa0', opacity: 0.55, transform: 'rotate(-28 292 290)', 'pointer-events': 'none', style: 'transition:fill .5s ease' });
      this.marble.appendChild(this.glint);
      this.marble.addEventListener('pointerdown', () => this.take());
      svg.append(this.marble);

      svg.addEventListener('pointermove', e => this.move(e));
      svg.addEventListener('pointerup', () => { this.drag = null; });
      svg.addEventListener('pointerleave', () => { this.drag = null; });

      root.appendChild(svg);
      this.svg = svg;
    }

    // ---- meccanica
    get aligned() { return this.off.every(v => v === 0); }

    step(i, dir) {
      if (dir !== DIR[i]) { this.jam(i); return; }              // verso bloccato
      this.off = this.off.map((v, j) => ((v + dir * M[i][j]) % S + S) % S);
      this.paint();
      this.dispatchEvent(new CustomEvent('rotate', { detail: { ring: i, gaps: [...this.off] } }));
      if (this.aligned) this.dispatchEvent(new CustomEvent('aligned'));
    }

    jam(i) {
      const b = this.bands[i].band;
      b.setAttribute('stroke', '#4a3418');
      clearTimeout(this._jamT);
      this._jamT = setTimeout(() => b.setAttribute('stroke', STROKES[i]), 320);
    }

    angleAt(e) {
      const b = this.svg.getBoundingClientRect();
      return Math.atan2(e.clientY - (b.top + b.height * (C / VB_H)), e.clientX - (b.left + b.width / 2)) * 180 / Math.PI;
    }

    grab(i, e) {
      if (this.taken) return;
      e.preventDefault();
      this.drag = { ring: i, last: this.angleAt(e), acc: 0 };
      if (e.target.setPointerCapture) e.target.setPointerCapture(e.pointerId);
    }

    move(e) {
      if (!this.drag) return;
      const a = this.angleAt(e);
      let d = a - this.drag.last;
      while (d > 180) d -= 360;
      while (d < -180) d += 360;
      this.drag.last = a;
      this.drag.acc += d;
      while (this.drag.acc >= STEP) { this.drag.acc -= STEP; this.step(this.drag.ring, 1); }
      while (this.drag.acc <= -STEP) { this.drag.acc += STEP; this.step(this.drag.ring, -1); }
    }

    take() {
      if (!this.aligned || this.taken) return;
      this.taken = true;
      this.marble.style.animation = 'pzf-caduta 1.5s cubic-bezier(.45,0,1,1) forwards';
      this.marble.style.filter = '';
      this.dispatchEvent(new CustomEvent('solved'));
    }

    paint() {
      const on = this.aligned;
      this.bands.forEach((b, i) => b.g.setAttribute('transform', `rotate(${-255 + STEP * this.off[i]} ${C} ${C})`));
      this.marks.forEach(m => m.node.setAttribute('transform', `rotate(${STEP * (this.off[m.ring] + m.k)} ${C} ${C})`));
      this.shaft.setAttribute('opacity', on ? 1 : 0);
      this.palla.setAttribute('stroke', on && !this.taken ? '#f0cf94' : '#3b2d1c');
      this.marble.setAttribute('cursor', on && !this.taken ? 'pointer' : 'default');
      this.marble.style.transition = 'transform 1.25s cubic-bezier(.4,0,.8,.4), opacity .5s ease .9s';
      this.marble.style.animation = on && !this.taken ? 'pzf-pulsa 1.4s ease-in-out infinite' : '';
      this.marble.style.filter = on && !this.taken ? 'drop-shadow(0 0 16px rgba(240,207,148,.75))' : '';
      this.glint.setAttribute('fill', on ? '#e6cf9e' : '#8f8aa0');
    }

    reset() {
      this.off = [...START];
      this.taken = false;
      this.drag = null;
      this.marble.style.animation = '';
      this.marble.style.transform = '';
      this.marble.setAttribute('opacity', 1);
      this.glint.setAttribute('cy', 290);
      this.glint.setAttribute('opacity', 0.55);
      this.paint();
    }
  }

  customElements.define('falcon-lock', FalconLock);
})();

/* =========================================================================
   Adattatore al contratto del progetto: Puzzles.occhioFalco
   Non conosce il motore: riceve container, parametri e api. Lo stesso file
   gira dentro il gioco e dentro tools/sandbox.html.

   <falcon-lock> si usa solo con il trascinamento: gli anelli si muovono
   esclusivamente trascinandoli (le zone di presa attorno a ogni anello), e
   la sfera si prende toccandola quando i quattro varchi sono allineati. Qui
   sotto non resta che il pulsante Reset, centrato sotto il meccanismo: riporta
   anelli e sfera alla posizione di partenza (`reset`).

   Nessun contenuto narrativo sta qui dentro: arriva tutto da `parametri`.
   Nessuna verifica di unicità da scrivere per il TESTO — quella (sulla
   meccanica dei quattro anelli) sta già in
   tools/verifiche/sF_e2_occhio_falco.py.

   parametri: {
     immagineSfera: 'assets/img/sphere.svg — il disegno della sfera centrale',
     raggioSfera: 'numerico, opzionale: mezzo-lato dell’immagine sfera (default 38)',
     testoCorretto: 'messaggio quando la sfera esce dal canale'
   }

   api: { risolto(), registraListener(t,ev,fn,opts), abilitaDropZone(...), inventario() }
   ========================================================================= */
window.Puzzles = window.Puzzles || {};

Puzzles.occhioFalco = {
  // Parametri d'esempio per tools/sandbox.html — non li usa il motore.
  esempio: {
    immagineSfera: '../assets/img/sphere.svg',
    testoCorretto: 'La sfera scivola fuori dal canale. Il sigillo è aperto.'
  },

  render(container, parametri, api) {
    const p = parametri || {};

    container.innerHTML = '';

    /* ---------- la serratura ---------- */

    const serratura = document.createElement('falcon-lock');
    if (p.immagineSfera) {
      serratura.setAttribute('sfera', p.immagineSfera);
      if (p.raggioSfera) serratura.setAttribute('raggio-sfera', p.raggioSfera);
    }

    /* ---------- stato dei varchi: 4 pallini sopra il meccanismo ---------- */

    const varchi = document.createElement('div');
    varchi.className = 'pz-falco-varchi';
    varchi.setAttribute('role', 'status');
    varchi.setAttribute('aria-live', 'polite');
    container.appendChild(varchi);

    const sronly = document.createElement('span');
    sronly.className = 'pz-falco-sronly';
    varchi.appendChild(sronly);

    const pallini = [0, 1, 2, 3].map(() => {
      const dot = document.createElement('span');
      dot.className = 'pz-falco-pallino';
      dot.setAttribute('aria-hidden', 'true');
      varchi.appendChild(dot);
      return dot;
    });

    function aggiornaVarchi(gaps) {
      const allineati = gaps.filter(v => v === 0).length;
      pallini.forEach((dot, i) => dot.classList.toggle('acceso', gaps[i] === 0));
      sronly.textContent = allineati + ' di 4 varchi allineati.';
    }

    container.appendChild(serratura);
    aggiornaVarchi(serratura.off);

    /* ---------- pulsante Reset, centrato sotto il meccanismo ---------- */

    const rigaAzioni = document.createElement('div');
    rigaAzioni.className = 'pz-falco-controlli';
    rigaAzioni.setAttribute('role', 'group');
    rigaAzioni.setAttribute('aria-label', 'Comandi della serratura');
    container.appendChild(rigaAzioni);

    const btnReset = document.createElement('button');
    btnReset.type = 'button';
    btnReset.className = 'pz-falco-bottone pz-falco-secondario';
    btnReset.textContent = 'Reset';
    api.registraListener(btnReset, 'click', () => {
      serratura.reset();
      aggiornaVarchi(serratura.off);
    });
    rigaAzioni.appendChild(btnReset);

    /* ---------- esito ---------- */

    const esito = document.createElement('div');
    esito.className = 'enigma-esito';            // mattone condiviso
    esito.setAttribute('role', 'status');        // annunciato dai lettori di schermo
    container.appendChild(esito);

    /* ---------- eventi del componente ---------- */

    api.registraListener(serratura, 'rotate', (ev) => aggiornaVarchi(ev.detail.gaps));
    api.registraListener(serratura, 'solved', () => {
      btnReset.disabled = true;
      esito.className = 'enigma-esito ok';
      esito.textContent = p.testoCorretto || 'La sfera esce dal canale.';
      // la sfera impiega circa 1.5s a cadere fuori (animazione interna al
      // componente): si aspetta che il giocatore la veda, non si chiude
      // la schermata a metà animazione
      setTimeout(() => api.risolto(), 1600);
    });
  }
};
