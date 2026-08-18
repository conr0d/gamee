# 10 proposte di enigmi (medio-difficili) — agosto 2026

Candidati per sostituire enigmi esistenti, da valutare. Nessuno è cablato nel
gioco. Ognuno è stato generato **al contrario** (soluzione → fatti → indizi
minimizzati) e la sua risposta è dimostrata **unica** da
`tools/verifiche/proposte_10_enigmi.py` (`--test` → OK, 10 su 10).

Per ciascuno: famiglia, enunciato ambientato nel museo, formato risposta,
**un solo indizio** (regola del progetto), soluzione col ragionamento,
difficoltà stimata (picarat Layton), meccanica di gioco suggerita e quale
enigma esistente potrebbe rimpiazzare.

---

## P1 — I Tre Custodi
**Famiglia:** deduzione a griglia (3×3×3) · **Picarat:** ~45 · **Meccanica:** sceltaMultipla

> Nel registro dei turni, tre custodi — Adele, Bruno e Cesare — sorvegliano
> le tre sale del museo: Magazzino, Biblioteca e Sala Restauri. Ognuno una
> sala diversa, ognuno in un turno diverso: alba, pomeriggio, notte.
> Quattro annotazioni a margine:
>
> *«Bruno prende sempre il turno dell'alba.<br>
> Chi sorveglia il Magazzino è di turno al pomeriggio.<br>
> Cesare non mette piede in Biblioteca.<br>
> Nemmeno Bruno sorveglia la Biblioteca.»*
>
> Chi sorveglia la Biblioteca, e in quale turno?

**Formato risposta:** nome + turno (scelta multipla: 4 opzioni).
**Indizio:** Parti dal Magazzino: chi ci sta di pomeriggio non può essere chi fa l'alba.
**Soluzione:** *Adele, di notte.* Bruno fa l'alba, quindi non è al Magazzino
(che richiede il pomeriggio). Né Cesare né Bruno sono in Biblioteca → è Adele.
Il Magazzino allora è di Cesare (pomeriggio), a Bruno restano i Restauri, e ad
Adele il turno rimasto: la notte. Tutti e quattro gli indizi sono necessari
(dimostrato: togliendone uno qualsiasi la risposta non è più unica).

---

## P2 — Il Traghetto del Guardiano
**Famiglia:** traghettamento (spazio degli stati) · **Picarat:** ~40 · **Meccanica:** tastierino (1 cifra)

> Un affresco racconta la prova del guardiano: portare oltre il Nilo uno
> sciacallo, un gatto, un ibis e un sacco di granaglie. La barca regge lui e
> al massimo due carichi. Se restano senza sorveglianza, lo sciacallo azzanna
> il gatto, il gatto divora l'ibis, l'ibis becca le granaglie.
>
> Qual è il minor numero di traversate per portare tutto sull'altra riva?

**Formato risposta:** 1 cifra.
**Indizio:** Nel primo viaggio separa i due animali più pericolosi tra loro: porta con te una coppia che non litiga con chi resta.
**Soluzione:** *3.* Andata con gatto e granaglie (a riva restano sciacallo e
ibis, che si ignorano); ritorno a vuoto; andata con sciacallo e ibis.
La BFS sullo spazio degli stati dimostra che 3 è il minimo.

---

## P3 — Le Sessanta Lampade
**Famiglia:** invariante numerica (divisori) · **Picarat:** ~55 · **Meccanica:** tastierino (1 cifra)

> Nella cripta, sessanta lampade a olio in fila, tutte spente. Sessanta
> sacerdoti entrano uno dopo l'altro: il primo tocca (accende o spegne) tutte
> le lampade, il secondo una sì e una no (la 2, la 4, la 6…), il terzo una
> ogni tre (la 3, la 6, la 9…), e così via fino al sessantesimo, che tocca
> solo l'ultima.
>
> Quante lampade restano accese alla fine della processione?

**Formato risposta:** 1 cifra.
**Indizio:** Una lampada cambia stato una volta per ogni divisore del suo numero: chiediti quali numeri hanno un numero DISPARI di divisori.
**Soluzione:** *7.* La lampada n viene toccata una volta per ogni divisore di
n; resta accesa solo se i divisori sono dispari, cioè se n è un quadrato
perfetto. I quadrati fino a 60 sono 1, 4, 9, 16, 25, 36, 49: sette.

---

## P4 — Il Censimento dei Gatti
**Famiglia:** teoria dei numeri vincolata (stile Dudeney) · **Picarat:** ~45 · **Meccanica:** tastierino (2 cifre)

> Una stele celebra i gatti del tempio: «Ogni gatto uccise lo stesso numero
> di serpenti, e i serpenti furono 299 in tutto. I gatti erano più d'uno, e
> ciascuno uccise più serpenti di quanti gatti c'erano.»
>
> Quanti erano i gatti?

**Formato risposta:** 2 cifre.
**Indizio:** 299 si spezza in due soli fattori non banali: trovali, poi decidi quale dei due è il numero dei gatti.
**Soluzione:** *13.* Serve g×m = 299 con g>1 e m>g. 299 = 13×23, e non ha
altre fattorizzazioni: i gatti sono 13 (il fattore minore), i serpenti a
testa 23. L'enumerazione conferma che è l'unica coppia ammessa.

---

## P5 — I Quattro Cartigli
**Famiglia:** autoreferenza · **Picarat:** ~50 · **Meccanica:** tastierino (1 cifra)

> Quattro cartigli incisi su una porta:
>
> *Cartiglio 1: «Esattamente uno di questi quattro cartigli dice il vero.»<br>
> Cartiglio 2: «Esattamente due di questi quattro cartigli dicono il vero.»<br>
> Cartiglio 3: «Esattamente tre di questi quattro cartigli dicono il vero.»<br>
> Cartiglio 4: «Tutti e quattro questi cartigli mentono.»*
>
> Quanti cartigli dicono il vero?

**Formato risposta:** 1 cifra.
**Indizio:** I primi tre si escludono a vicenda: al massimo uno di loro può dire il vero. E il quarto, se dicesse il vero, si smentirebbe da solo.
**Soluzione:** *1.* Il cartiglio 4 non può essere vero (si contraddirebbe).
I cartigli 1-3 sono mutuamente esclusivi, quindi al più uno è vero. Se
nessuno fosse vero, il 4 direbbe il vero: assurdo. Quindi esattamente uno è
vero, ed è il cartiglio 1, che dice proprio questo. L'enumerazione delle 16
combinazioni conferma: una sola è coerente.

---

## P6 — I Pesi del Mercante
**Famiglia:** rappresentazione ternaria (Bachet) · **Picarat:** ~60 · **Meccanica:** tastierino (2 cifre)

> Il corredo di un mercante: una bilancia a due piatti e quattro pesi di
> bronzo. Un'iscrizione vanta: «Con questi quattro pesi si pesa ogni carico
> da 1 a 40 misure, mettendo i pesi su uno o su entrambi i piatti.»
> I pesi sono consumati e i numeri illeggibili, tranne la certezza che sono
> quattro interi diversi.
>
> Quante misure pesa il più grande dei quattro?

**Formato risposta:** 2 cifre.
**Indizio:** Un peso sul piatto del carico SOTTRAE invece di aggiungere: ogni peso può valere +, − o zero. Tre stati, non due.
**Soluzione:** *27.* Con tre stati per peso servono le potenze di 3: {1, 3,
9, 27} copre esattamente 1..40 (infatti 1+3+9+27 = 40). L'enumerazione di
tutte le 91.390 quaterne possibili dimostra che è l'**unico** insieme di
quattro pesi che funziona.

---

## P7 — Il Torneo delle Quattro Barche
**Famiglia:** invariante di conteggio · **Picarat:** ~50 · **Meccanica:** tastierino (1 cifra)

> Un papiro riporta la regata sacra: quattro equipaggi, ognuno contro ognuno,
> sei sfide in tutto. Vittoria: 3 punti. Pareggio: 1 punto a testa.
> Sconfitta: nulla. La classifica finale incisa in fondo: 7, 5, 3, 1.
>
> Quante sfide finirono in pareggio?

**Formato risposta:** 1 cifra.
**Indizio:** Non ricostruire le partite: conta i punti totali distribuiti. Una vittoria ne distribuisce 3, un pareggio solo 2.
**Soluzione:** *2.* Sei sfide senza pareggi distribuirebbero 18 punti; ogni
pareggio ne toglie uno. La classifica somma 7+5+3+1 = 16, quindi i pareggi
sono 18−16 = 2. L'enumerazione dei 729 esiti possibili conferma che una
classifica 7-5-3-1 esiste davvero e ha sempre esattamente 2 pareggi.

---

## P8 — Il Numero dello Scriba
**Famiglia:** ricostruzione aritmetica · **Picarat:** ~40 · **Meccanica:** tastierino (2 cifre)

> Sull'ostrakon di un apprendista scriba, un esercizio quasi cancellato:
> «Un numero di due cifre, moltiplicato per la propria prima cifra, dà un
> numero di tre cifre tutte uguali.»
>
> Qual è il numero di due cifre?

**Formato risposta:** 2 cifre.
**Indizio:** Un numero di tre cifre uguali è sempre un multiplo di 111 — e 111 è 3 × 37.
**Soluzione:** *37.* 37 × 3 = 111. I numeri a tre cifre uguali sono i
multipli di 111 = 3×37: perché AB × A dia c×111, il fattore 37 deve stare in
AB. L'enumerazione dei 90 candidati conferma che 37 è l'unico.

---

## P9 — La Porta dei Giorni
**Famiglia:** verità e menzogna su calendario (stile Smullyan) · **Picarat:** ~55 · **Meccanica:** sceltaMultipla

> Due statue parlanti custodiscono una porta: il Leone mente lunedì, martedì
> e mercoledì; l'Ibis mente giovedì, venerdì e sabato. Negli altri giorni
> dicono il vero. Oggi entrambe le statue dichiarano: «Ieri io mentivo.»
>
> Che giorno è oggi?

**Formato risposta:** giorno della settimana (scelta multipla: 4 opzioni).
**Indizio:** Quella frase è dicibile solo nei giorni di CONFINE: quando chi la pronuncia ha appena cambiato regime tra ieri e oggi.
**Soluzione:** *Giovedì.* La frase «ieri mentivo» è coerente solo se il
regime di oggi è diverso da quello di ieri (sincero che dice di aver mentito,
o bugiardo che nega di aver detto il vero). Per il Leone i giorni possibili
sono lunedì e giovedì; per l'Ibis, giovedì e domenica. L'unico giorno in
comune è giovedì. Enumerazione dei 7 giorni: uno solo coerente per entrambi.

---

## P10 — Il Sentiero delle Offerte
**Famiglia:** percorso su griglia con vincolo di somma · **Picarat:** ~45 · **Meccanica:** sceltaMultipla (o, in futuro, una meccanica a tocco sulla griglia)

> Sul pavimento della sala, nove piastrelle numerate in un quadrato 3×3:
>
> ```
> 3  1  4
> 1  5  9
> 2  6  5
> ```
>
> Si parte dalla piastrella in alto a sinistra e si arriva a quella in basso
> a destra, muovendosi solo verso Destra o verso il Basso. Le offerte vanno
> deposte lungo un cammino le cui piastrelle sommino esattamente 22.
>
> Qual è la sequenza dei quattro passi? (D = destra, B = basso)

**Formato risposta:** sequenza di 4 passi (scelta multipla: 4 opzioni, tutte
cammini reali della griglia — sommano 22, 23, 20 e 17).
**Indizio:** I cammini possibili sono solo sei: invece di provarli tutti, nota che per raggiungere 22 devi passare dal 9 ma evitare il 5 centrale.
**Soluzione:** *DDBB.* Il cammino alto (3+1+4, poi giù per 9 e 5) somma 22.
Gli altri cinque cammini sommano 17, 20, 20, 23, 23: nessun altro raggiunge
22, quindi la risposta è unica (enumerazione completa dei sei cammini).

---

## Riepilogo per la valutazione

| # | Nome | Famiglia | Picarat | Risposta | Meccanica |
|---|------|----------|---------|----------|-----------|
| P1 | I Tre Custodi | griglia logica | 45 | Adele, di notte | sceltaMultipla |
| P2 | Il Traghetto del Guardiano | traghettamento | 40 | 3 | tastierino |
| P3 | Le Sessanta Lampade | divisori | 55 | 7 | tastierino |
| P4 | Il Censimento dei Gatti | fattorizzazione | 45 | 13 | tastierino |
| P5 | I Quattro Cartigli | autoreferenza | 50 | 1 | tastierino |
| P6 | I Pesi del Mercante | ternario | 60 | 27 | tastierino |
| P7 | Il Torneo delle Quattro Barche | invariante | 50 | 2 | tastierino |
| P8 | Il Numero dello Scriba | aritmetica | 40 | 37 | tastierino |
| P9 | La Porta dei Giorni | menzogna/calendario | 55 | giovedì | sceltaMultipla |
| P10 | Il Sentiero delle Offerte | percorso su griglia | 45 | DDBB | sceltaMultipla |

Possibili abbinamenti con gli enigmi attuali (stessa famiglia o stessa sala,
per non ripetere due volte lo stesso tipo di ragionamento):

- **P1** può sostituire **s1-E1** (I Quattro Coperchi — stessa famiglia
  d'ordine/griglia, ma più ricco: due attributi invece di uno).
- **P9** può sostituire **s4-E2** (Chi Ha Rotto il Vaso — stessa famiglia
  verità/menzogna, ma con la dimensione temporale in più).
- **P5** può sostituire **s2-E1** (Il Reperto Falso — la classificazione
  diventa autoreferenza, un salto di livello).
- **P3, P4, P6, P7, P8** sono candidati per **s2-E3, s3-E1, s4-E1, d2-E1,
  d2-E2** (tutti a risposta numerica su tastierino, famiglie oggi assenti).
- **P2** è un buon rimpiazzo per **d1-E1** (I Due Secchi — resta "a mosse"
  ma cambia famiglia: traghettamento invece di travaso).
- **P10** si presta anche a una meccanica visiva nuova (tocco sulle
  piastrelle di una griglia), se si vorrà un secondo puzzle interattivo
  oltre allo scorrimento.

Attenzione ai doppioni interni alla rosa: P3/P4/P8 sono tutti aritmetici —
sceglierne al massimo due. P5 e P9 sono entrambi "logica del vero/falso" —
idem.
