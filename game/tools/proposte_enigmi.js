/* =========================================================================
   PROPOSTE DI ENIGMI — solo per tools/sandbox.html, MAI caricato dal gioco.

   Le 10 proposte di testi/proposte_enigmi.md in forma già giocabile con le
   meccaniche esistenti (tastierino, sceltaMultipla), per poterle provare
   nella sandbox e decidere quali promuovere. Quando una proposta entra in
   game_data.js, va tolta da qui e le va dedicato il suo script di verifica
   in tools/verifiche/ (per ora fanno fede le dimostrazioni collettive in
   tools/verifiche/proposte_10_enigmi.py).

   Script classico, niente fetch: stessa regola di tutto il progetto.
   ========================================================================= */
window.PROPOSTE_ENIGMI = [

  { id: 'P1', nome: 'I Tre Custodi',
    indizio: 'Parti dal Magazzino: chi ci sta di pomeriggio non può essere chi fa l’alba.',
    spiegazione: 'Bruno fa l’alba, quindi non è al Magazzino, che richiede il pomeriggio. Né Cesare né Bruno stanno in Biblioteca: è di Adele. Il Magazzino tocca allora a Cesare, di pomeriggio, e a Bruno restano i Restauri. Ad Adele resta l’ultimo turno libero: la notte.',
    puzzle: 'sceltaMultipla',
    parametri: {
      domanda: 'Nel registro dei turni, tre custodi — Adele, Bruno e Cesare — sorvegliano ' +
               'le tre sale del museo: Magazzino, Biblioteca e Sala Restauri. Ognuno una sala ' +
               'diversa, ognuno in un turno diverso: alba, pomeriggio, notte. Quattro annotazioni:<br><br>' +
               '<em>«Bruno prende sempre il turno dell’alba.<br>' +
               'Chi sorveglia il Magazzino è di turno al pomeriggio.<br>' +
               'Cesare non mette piede in Biblioteca.<br>' +
               'Nemmeno Bruno sorveglia la Biblioteca.»</em><br><br>' +
               'Chi sorveglia la Biblioteca, e in quale turno?',
      opzioni: ['Cesare, al pomeriggio', 'Adele, all’alba', 'Adele, di notte', 'Bruno, di notte'],
      indiceCorretto: 2,
      testoCorretto: 'Il registro combacia: Adele, di notte, in Biblioteca.',
      testoErrato: 'Le annotazioni non tornano con questo nome.'
    } },

  { id: 'P2', nome: 'Il Traghetto del Guardiano',
    indizio: 'Nel primo viaggio porta con te una coppia che non litiga con chi resta a riva.',
    spiegazione: 'La barca porta due carichi per volta, quindi bastano tre traversate. Prima andata con gatto e granaglie: a riva restano sciacallo e ibis, che si ignorano. Ritorno a vuoto. Seconda andata con sciacallo e ibis: sull’altra sponda ci sei tu a sorvegliare. La ricerca esaustiva conferma che meno di tre traversate non bastano.',
    puzzle: 'tastierino',
    parametri: {
      domanda: 'Un affresco racconta la prova del guardiano: portare oltre il Nilo uno sciacallo, ' +
               'un gatto, un ibis e un sacco di granaglie. La barca regge lui e al massimo due carichi. ' +
               'Se restano senza sorveglianza, lo sciacallo azzanna il gatto, il gatto divora l’ibis, ' +
               'l’ibis becca le granaglie.<br><br>' +
               'Qual è il minor numero di traversate per portare tutto sull’altra riva?',
      codice: '3',
      simboli: ['0','1','2','3','4','5','6','7','8','9'],
      lunghezza: 1,
      testoCorretto: 'L’affresco si illumina: tre traversate, nessuna zuffa.',
      testoErrato: 'Sull’affresco qualcosa viene divorato. Non è il numero giusto.'
    } },

  { id: 'P3', nome: 'Le Sessanta Lampade',
    indizio: 'Una lampada cambia stato una volta per ogni divisore del suo numero: chiediti quali numeri hanno un numero DISPARI di divisori.',
    spiegazione: 'La lampada numero n viene toccata dal sacerdote k solo se k divide n: in tutto una volta per ogni divisore di n. Partendo da spenta, resta accesa solo se i divisori sono in numero dispari. I divisori si accoppiano sempre (se k divide n, anche n/k lo divide), tranne quando i due coincidono: succede solo per i quadrati perfetti. Fino a 60 sono 1, 4, 9, 16, 25, 36 e 49: sette lampade.',
    puzzle: 'tastierino',
    parametri: {
      domanda: 'Nella cripta, sessanta lampade a olio in fila, tutte spente. Sessanta sacerdoti ' +
               'entrano uno dopo l’altro: il primo tocca (accende o spegne) tutte le lampade, ' +
               'il secondo una sì e una no (la 2, la 4, la 6…), il terzo una ogni tre (la 3, la 6, ' +
               'la 9…), e così via fino al sessantesimo, che tocca solo l’ultima.<br><br>' +
               'Quante lampade restano accese alla fine della processione?',
      codice: '7',
      simboli: ['0','1','2','3','4','5','6','7','8','9'],
      lunghezza: 1,
      testoCorretto: 'Sette fiamme restano accese, ai posti dei quadrati perfetti.',
      testoErrato: 'Il conto delle fiamme non torna.'
    } },

  { id: 'P4', nome: 'Il Censimento dei Gatti',
    indizio: '299 si spezza in due soli fattori non banali: trovali, poi decidi quale dei due è il numero dei gatti.',
    spiegazione: 'Il numero dei gatti moltiplicato per i serpenti di ciascuno fa 299. Poiché 299 = 13 × 23 e non ammette altre fattorizzazioni, e i gatti sono più d’uno, le sole possibilità sono 13 gatti con 23 serpenti a testa oppure 23 gatti con 13 a testa. L’ultima condizione — ciascuno ne uccise più di quanti gatti c’erano — sceglie la prima: 13 gatti.',
    puzzle: 'tastierino',
    parametri: {
      domanda: 'Una stele celebra i gatti del tempio: <em>«Ogni gatto uccise lo stesso numero di ' +
               'serpenti, e i serpenti furono 299 in tutto. I gatti erano più d’uno, e ciascuno ' +
               'uccise più serpenti di quanti gatti c’erano.»</em><br><br>' +
               'Quanti erano i gatti?',
      codice: '13',
      simboli: ['0','1','2','3','4','5','6','7','8','9'],
      lunghezza: 2,
      testoCorretto: 'Tredici gatti, ventitré serpenti a testa: la stele approva.',
      testoErrato: 'La stele resta muta: i conti non tornano.'
    } },

  { id: 'P5', nome: 'I Quattro Cartigli',
    indizio: 'I primi tre si escludono a vicenda: al massimo uno di loro può dire il vero. E il quarto, se dicesse il vero, si smentirebbe da solo.',
    spiegazione: 'Il quarto cartiglio non può dire il vero: se lo dicesse, mentirebbe anche lui, contraddicendosi. I primi tre annunciano conteggi diversi e si escludono a vicenda, quindi al massimo uno di loro è veritiero. Se nessuno lo fosse, allora tutti e quattro mentirebbero e il quarto avrebbe ragione: assurdo. Dunque i cartigli veri sono esattamente uno — ed è il primo, che afferma proprio questo.',
    puzzle: 'tastierino',
    parametri: {
      domanda: 'Quattro cartigli incisi su una porta:<br><br>' +
               '<em>Cartiglio 1: «Esattamente uno di questi quattro cartigli dice il vero.»<br>' +
               'Cartiglio 2: «Esattamente due di questi quattro cartigli dicono il vero.»<br>' +
               'Cartiglio 3: «Esattamente tre di questi quattro cartigli dicono il vero.»<br>' +
               'Cartiglio 4: «Tutti e quattro questi cartigli mentono.»</em><br><br>' +
               'Quanti cartigli dicono il vero?',
      codice: '1',
      simboli: ['0','1','2','3','4','5','6','7','8','9'],
      lunghezza: 1,
      testoCorretto: 'Uno solo: il primo. La porta lo sapeva.',
      testoErrato: 'I cartigli si contraddicono con questo numero.'
    } },

  { id: 'P6', nome: 'I Pesi del Mercante',
    indizio: 'Un peso sul piatto del carico SOTTRAE invece di aggiungere: ogni peso può valere più, meno o zero. Tre stati, non due.',
    spiegazione: 'Potendo mettere un peso anche accanto al carico, ogni peso vale più, meno o zero: tre stati, non due. Con quattro pesi si ottengono così 81 combinazioni, abbastanza per coprire da 1 a 40. Servono allora le potenze di 3: 1, 3, 9 e 27, che sommano esattamente 40. Per esempio 5 si pesa come 9 − 3 − 1, e 11 come 9 + 3 − 1. È l’unico insieme di quattro pesi che funziona: il maggiore è 27.',
    puzzle: 'tastierino',
    parametri: {
      domanda: 'Il corredo di un mercante: una bilancia a due piatti e quattro pesi di bronzo. ' +
               'Un’iscrizione vanta: <em>«Con questi quattro pesi si pesa ogni carico da 1 a 40 ' +
               'misure, mettendo i pesi su uno o su entrambi i piatti.»</em> I numeri sono ' +
               'illeggibili, ma i pesi sono quattro interi diversi.<br><br>' +
               'Quante misure pesa il più grande dei quattro?',
      codice: '27',
      simboli: ['0','1','2','3','4','5','6','7','8','9'],
      lunghezza: 2,
      testoCorretto: 'Uno, tre, nove, ventisette: la bilancia è in equilibrio.',
      testoErrato: 'Con quel peso qualche carico resta impesabile.'
    } },

  { id: 'P7', nome: 'Il Torneo delle Quattro Barche',
    indizio: 'Non ricostruire le partite: conta i punti totali distribuiti. Una vittoria ne distribuisce 3, un pareggio solo 2.',
    spiegazione: 'Non serve ricostruire le sfide. Ogni partita distribuisce 3 punti se finisce con una vittoria, ma solo 2 se finisce in pareggio. Sei partite tutte decise darebbero 18 punti; la classifica ne somma 7+5+3+1 = 16. Mancano 2 punti, e ogni pareggio ne toglie esattamente uno: i pareggi sono 2.',
    puzzle: 'tastierino',
    parametri: {
      domanda: 'Un papiro riporta la regata sacra: quattro equipaggi, ognuno contro ognuno, ' +
               'sei sfide in tutto. Vittoria: 3 punti. Pareggio: 1 punto a testa. Sconfitta: nulla. ' +
               'La classifica finale incisa in fondo: <strong>7, 5, 3, 1</strong>.<br><br>' +
               'Quante sfide finirono in pareggio?',
      codice: '2',
      simboli: ['0','1','2','3','4','5','6','7','8','9'],
      lunghezza: 1,
      testoCorretto: 'Due pareggi: i sedici punti della classifica lo pretendono.',
      testoErrato: 'Con quel numero di pareggi i punti totali non fanno sedici.'
    } },

  { id: 'P8', nome: 'Il Numero dello Scriba',
    indizio: 'Un numero di tre cifre uguali è sempre un multiplo di 111 — e 111 è 3 per 37.',
    spiegazione: 'Un numero di tre cifre tutte uguali vale la cifra ripetuta moltiplicata per 111, e 111 è 3 × 37. Perché il prodotto contenga il fattore 37, che è primo, deve contenerlo il numero di due cifre: l’unico è 37 stesso. La sua prima cifra è 3, e infatti 37 × 3 = 111.',
    puzzle: 'tastierino',
    parametri: {
      domanda: 'Sull’ostrakon di un apprendista scriba, un esercizio quasi cancellato: ' +
               '<em>«Un numero di due cifre, moltiplicato per la propria prima cifra, dà un ' +
               'numero di tre cifre tutte uguali.»</em><br><br>' +
               'Qual è il numero di due cifre?',
      codice: '37',
      simboli: ['0','1','2','3','4','5','6','7','8','9'],
      lunghezza: 2,
      testoCorretto: 'Trentasette per tre: centoundici. L’apprendista sorride.',
      testoErrato: 'Il prodotto non ha tre cifre uguali.'
    } },

  { id: 'P9', nome: 'La Porta dei Giorni',
    indizio: 'Quella frase è dicibile solo nei giorni di CONFINE: quando chi la pronuncia ha appena cambiato regime tra ieri e oggi.',
    spiegazione: '«Ieri mentivo» è dicibile solo se oggi e ieri appartengono a regimi diversi: chi oggi è sincero dice il vero ammettendo la menzogna di ieri, chi oggi mente lo fa negando la sincerità di ieri. Per il Leone, che mente da lunedì a mercoledì, i giorni di confine sono lunedì e giovedì; per l’Ibis, che mente da giovedì a sabato, sono giovedì e domenica. L’unico giorno in cui entrambi possono pronunciarla è giovedì.',
    puzzle: 'sceltaMultipla',
    parametri: {
      domanda: 'Due statue parlanti custodiscono una porta: il Leone mente lunedì, martedì e ' +
               'mercoledì; l’Ibis mente giovedì, venerdì e sabato. Negli altri giorni dicono ' +
               'il vero. Oggi entrambe le statue dichiarano: <em>«Ieri io mentivo.»</em><br><br>' +
               'Che giorno è oggi?',
      opzioni: ['Lunedì', 'Giovedì', 'Domenica', 'Sabato'],
      indiceCorretto: 1,
      testoCorretto: 'Giovedì: il Leone è appena tornato sincero, l’Ibis ha appena iniziato a mentire.',
      testoErrato: 'In quel giorno almeno una delle due statue non direbbe quella frase.'
    } },

  { id: 'P10', nome: 'Il Sentiero delle Offerte',
    indizio: 'I cammini possibili sono solo sei: invece di provarli tutti, nota che per raggiungere 22 devi passare dal 9 ma evitare il 5 centrale.',
    spiegazione: 'Ogni cammino tocca cinque piastrelle e i cammini possibili sono sei in tutto. Il 9 vale da solo più di ogni altra casella e serve per arrivare a 22, ma passare anche dal 5 centrale porterebbe a 23. L’unico modo di prendere il 9 evitando il 5 è costeggiare la riga in alto: 3+1+4, poi giù per 9 e 5, cioè 22. Gli altri cinque cammini danno 23, 23, 20, 20 e 17.',
    // scelta multipla e non tastierino: il tastierino confronta carattere per
    // carattere, quindi una "d" minuscola verrebbe scartata in silenzio.
    // I tre distrattori sono cammini VERI della griglia (sommano 23, 20 e 17).
    puzzle: 'sceltaMultipla',
    parametri: {
      domanda: 'Sul pavimento della sala, nove piastrelle numerate in un quadrato:<br><br>' +
               '<strong>3&nbsp;&nbsp;1&nbsp;&nbsp;4<br>1&nbsp;&nbsp;5&nbsp;&nbsp;9<br>2&nbsp;&nbsp;6&nbsp;&nbsp;5</strong><br><br>' +
               'Si parte dalla piastrella in alto a sinistra e si arriva a quella in basso a ' +
               'destra, muovendosi solo verso Destra o verso il Basso. Le offerte vanno deposte ' +
               'lungo un cammino le cui piastrelle sommino esattamente <strong>22</strong>.<br><br>' +
               'Qual è la sequenza dei quattro passi? (D = destra, B = basso)',
      opzioni: ['D, D, B, B', 'D, B, D, B', 'D, B, B, D', 'B, B, D, D'],
      indiceCorretto: 0,
      testoCorretto: 'Le offerte si posano una a una: la somma fa ventidue.',
      testoErrato: 'Lungo quel cammino la somma non fa ventidue.'
    } }
];
