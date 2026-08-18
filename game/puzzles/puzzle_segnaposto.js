/* =========================================================================
   PUZZLE — Segnaposto
   Meccanica finta, per gli enigmi non ancora progettati: rende l'interazione
   completa e provabile (teaser, schermata, indizio, ricompensa) mentre il
   puzzle vero viene costruito e verificato in isolamento.

   parametri: { testo?: 'riga mostrata al posto dell'enigma' }
   ========================================================================= */
window.Puzzles = window.Puzzles || {};

Puzzles.segnaposto = {
  // Parametri d'esempio per tools/sandbox.html — non li usa il motore.
  esempio: { testo: 'Enigma da costruire.' },

  render(container, parametri, api) {
    container.innerHTML = '';

    const riga = document.createElement('p');
    riga.className = 'pz-segnaposto-testo';
    riga.textContent = parametri.testo || 'Enigma da costruire.';
    container.appendChild(riga);

    const btn = document.createElement('button');
    btn.className = 'pz-segnaposto-btn';
    btn.textContent = 'Risolvi (segnaposto)';
    container.appendChild(btn);

    api.registraListener(btn, 'click', () => api.risolto());
  }
};
