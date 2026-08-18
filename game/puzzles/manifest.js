/* =========================================================================
   MANIFEST DEI PUZZLE — unica lista da toccare quando se ne aggiunge uno.

   Sia index.html sia tools/sandbox.html caricano questo file (script
   classico, zero fetch, funziona anche con doppio clic su file://) e da
   qui si costruiscono da soli i tag <link>/<script> per ogni voce elencata
   sotto. Aggiungere un puzzle nuovo, in pratica:

     1. scrivi puzzles/puzzle_NOME.js (con window.Puzzles.NOME = {...})
        e puzzles/puzzle_NOME.css (classi prefissate .pz-)
     2. aggiungi 'puzzle_NOME' all'array qui sotto
     3. compare da solo sia nel gioco sia nel menu "Enigma" della sandbox —
        non serve più toccare index.html né sandbox.html.

   Il file NON conosce i singoli enigmi (quelli stanno in game_data.js):
   elenca solo i MOTORI di puzzle disponibili.
   ========================================================================= */
window.PUZZLE_MANIFEST = [
  'puzzle_disposizione',
  'puzzle_lucchetto_rotelle',
  'puzzle_occhio_falco',
  'puzzle_scelta_multipla',
  'puzzle_scorrimento',
  'puzzle_segnaposto',
  'puzzle_sigillo_cripta',
  'puzzle_tastierino',
  'puzzle_travaso'
];
