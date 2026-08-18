#!/usr/bin/env python3
"""
Verifica collettiva delle 10 PROPOSTE di enigmi (agosto 2026) — candidati
per sostituire enigmi esistenti. Nessuno di questi è ancora in game_data.js:
quando uno verrà promosso, avrà il suo script dedicato in tools/verifiche/
come da regola del progetto. Il documento di presentazione sta in
testi/proposte_enigmi.md.

Ogni proposta è stata generata AL CONTRARIO (soluzione fissata, fatti veri
derivati, indizi scelti) e qui se ne dimostra l'unicità della RISPOSTA ALLA
DOMANDA POSTA, non del solo stato — principio di puzzle-forge.

Uso:
    python tools/verifiche/proposte_10_enigmi.py            # autotest + demo
    python tools/verifiche/proposte_10_enigmi.py --test     # solo autotest (esce 0)
"""

import sys
from collections import deque
from itertools import permutations, combinations, product

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):       # pragma: no cover
    pass


# ---------------------------------------------------------------- P1
# I Tre Custodi — logica a griglia (3 custodi x 3 sale x 3 turni).
# Domanda: chi sorveglia la Biblioteca, e in quale turno?
# Risposta attesa: Adele, di notte.

def p1_verifica():
    custodi = ('Adele', 'Bruno', 'Cesare')
    sale = ('Magazzino', 'Biblioteca', 'Restauri')
    turni = ('alba', 'pomeriggio', 'notte')

    def vincoli(sala_di, turno_di, attivi):
        v = {
            1: turno_di['Bruno'] == 'alba',
            2: turno_di[[c for c in custodi if sala_di[c] == 'Magazzino'][0]] == 'pomeriggio',
            3: sala_di['Cesare'] != 'Biblioteca',
            4: sala_di['Bruno'] != 'Biblioteca',
        }
        return all(v[i] for i in attivi)

    def risposte(attivi):
        out = set()
        for ps in permutations(sale):
            for pt in permutations(turni):
                sala_di = dict(zip(custodi, ps))
                turno_di = dict(zip(custodi, pt))
                if vincoli(sala_di, turno_di, attivi):
                    chi = [c for c in custodi if sala_di[c] == 'Biblioteca'][0]
                    out.add((chi, turno_di[chi]))
        return out

    tutte = risposte({1, 2, 3, 4})
    ok = tutte == {('Adele', 'notte')}
    # minimizzazione: ogni indizio deve essere necessario
    necessari = all(len(risposte({1, 2, 3, 4} - {i})) > 1 for i in (1, 2, 3, 4))
    return ok and necessari, tutte


# ---------------------------------------------------------------- P2
# Il Traghetto del Guardiano — traghettamento, barca da 2 + guardiano.
# Coppie proibite da sole: sciacallo+gatto, gatto+ibis, ibis+granaglie.
# Domanda: minimo numero di traversate. Risposta attesa: 3.

def p2_verifica():
    items = frozenset(['sciacallo', 'gatto', 'ibis', 'granaglie'])
    proibite = [frozenset(p) for p in
                ({'sciacallo', 'gatto'}, {'gatto', 'ibis'}, {'ibis', 'granaglie'})]

    # stato: (insieme a sinistra, sponda della barca: 0 sx / 1 dx)
    start = (items, 0)

    def mosse(s):
        sx, barca = s
        qui = sorted(sx) if barca == 0 else sorted(items - sx)
        for k in range(0, 3):                      # 0, 1 o 2 oggetti in barca
            for carico in combinations(qui, k):
                nsx = (sx - set(carico)) if barca == 0 else (sx | set(carico))
                ns = (frozenset(nsx), 1 - barca)
                incustoditi = ns[0] if ns[1] == 1 else (items - ns[0])
                if any(p <= incustoditi for p in proibite):
                    continue
                yield ns, '+'.join(carico) or 'solo'

    dist = {start: 0}
    coda = deque([start])
    while coda:
        s = coda.popleft()
        for ns, _ in mosse(s):
            if ns not in dist:
                dist[ns] = dist[s] + 1
                coda.append(ns)
    goal = (frozenset(), 1)
    minimo = dist.get(goal)
    return minimo == 3, minimo


# ---------------------------------------------------------------- P3
# Le Sessanta Lampade — divisori e quadrati perfetti.
# 60 lampade spente; il sacerdote k-esimo (k=1..60) inverte le multiple di k.
# Domanda: quante restano accese. Risposta attesa: 7.

def p3_verifica():
    acceso = [False] * 61
    for k in range(1, 61):
        for m in range(k, 61, k):
            acceso[m] = not acceso[m]
    n = sum(acceso[1:])
    quadrati = len([x for x in range(1, 61) if int(x ** .5) ** 2 == x])
    return n == 7 and n == quadrati, n


# ---------------------------------------------------------------- P4
# Il Censimento dei Gatti — fattorizzazione vincolata (stile Dudeney).
# g gatti, ciascuno cattura m topi, g*m = 299, g > 1, m > g.
# Domanda: quanti gatti. Risposta attesa: 13.

def p4_verifica():
    soluzioni = [g for g in range(2, 299)
                 if 299 % g == 0 and 299 // g > g]
    return soluzioni == [13], soluzioni


# ---------------------------------------------------------------- P5
# I Quattro Cartigli — autoreferenza.
# Cartiglio k (k=1..3): "esattamente k di questi quattro dicono il vero."
# Cartiglio 4: "tutti e quattro mentono."
# Domanda: quanti cartigli dicono il vero. Risposta attesa: 1 (il primo).

def p5_verifica():
    coerenti = []
    for veri in product((False, True), repeat=4):
        n = sum(veri)
        attesi = (n == 1, n == 2, n == 3, n == 0)
        if all(v == a for v, a in zip(veri, attesi)):
            coerenti.append(veri)
    ok = coerenti == [(True, False, False, False)]
    return ok, coerenti


# ---------------------------------------------------------------- P6
# I Pesi del Mercante — sistema ternario di Bachet.
# Quattro pesi interi, pesi ammessi su entrambi i piatti, ogni carico 1..40.
# Domanda: il peso maggiore. Risposta attesa: 27 (set unico {1,3,9,27}).

def p6_verifica():
    validi = []
    for pesi in combinations(range(1, 41), 4):
        raggiunti = set()
        for segni in product((-1, 0, 1), repeat=4):
            raggiunti.add(abs(sum(s * p for s, p in zip(segni, pesi))))
        if all(x in raggiunti for x in range(1, 41)):
            validi.append(pesi)
    return validi == [(1, 3, 9, 27)], validi


# ---------------------------------------------------------------- P7
# Il Torneo delle Quattro Barche — invariante dei punti.
# Girone all'italiana (6 partite), vittoria 3, pareggio 1, sconfitta 0.
# Classifica finale: 7, 5, 3, 1. Domanda: quanti pareggi. Risposta: 2.

def p7_verifica():
    partite = list(combinations(range(4), 2))
    esiti_trovati = set()
    esiste = False
    for esiti in product((0, 1, 2), repeat=6):     # 0 vince a, 1 pareggio, 2 vince b
        punti = [0, 0, 0, 0]
        pareggi = 0
        for (a, b), e in zip(partite, esiti):
            if e == 0:
                punti[a] += 3
            elif e == 2:
                punti[b] += 3
            else:
                punti[a] += 1
                punti[b] += 1
                pareggi += 1
        if sorted(punti, reverse=True) == [7, 5, 3, 1]:
            esiste = True
            esiti_trovati.add(pareggi)
    # l'invariante: 6 partite senza pareggi = 18 punti, ogni pareggio ne toglie 1
    return esiste and esiti_trovati == {2}, esiti_trovati


# ---------------------------------------------------------------- P8
# Il Numero dello Scriba — ricostruzione aritmetica.
# Un numero di due cifre, moltiplicato per la propria prima cifra, dà un
# numero di tre cifre tutte uguali. Domanda: quale numero. Risposta: 37.

def p8_verifica():
    soluzioni = []
    for n in range(10, 100):
        p = n * (n // 10)
        if 100 <= p <= 999:
            s = str(p)
            if s[0] == s[1] == s[2]:
                soluzioni.append(n)
    return soluzioni == [37], soluzioni


# ---------------------------------------------------------------- P9
# La Porta dei Giorni — verità a giorni alterni (stile Smullyan).
# Leone mente lun/mar/mer, Unicorno mente gio/ven/sab; la domenica entrambi
# dicono il vero. Entrambi dichiarano: "Ieri mentivo."
# Domanda: che giorno è. Risposta attesa: giovedì.

def p9_verifica():
    giorni = ('lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica')
    leone = {0, 1, 2}
    unicorno = {3, 4, 5}

    def coerente(d, bugiardo_in):
        dice_il_falso_oggi = d in bugiardo_in
        ieri_mentiva = (d - 1) % 7 in bugiardo_in
        # se oggi è sincero la frase deve essere vera; se mente, falsa
        return dice_il_falso_oggi != ieri_mentiva

    possibili = [giorni[d] for d in range(7)
                 if coerente(d, leone) and coerente(d, unicorno)]
    return possibili == ['giovedì'], possibili


# ---------------------------------------------------------------- P10
# Il Sentiero delle Offerte — percorso su griglia con somma obbligata.
# Griglia 3x3, solo passi a destra (D) o in basso (B), da alto-sinistra a
# basso-destra, somma delle caselle toccate = 22.
# Domanda: la sequenza dei quattro passi. Risposta attesa: DDBB (unica).

def p10_verifica():
    griglia = ((3, 1, 4), (1, 5, 9), (2, 6, 5))
    TARGET = 22

    percorsi = []
    for passi in set(permutations('DDBB')):
        r = c = 0
        somma = griglia[0][0]
        valido = True
        for p in passi:
            if p == 'D':
                c += 1
            else:
                r += 1
            if r > 2 or c > 2:
                valido = False
                break
            somma += griglia[r][c]
        if valido and (r, c) == (2, 2) and somma == TARGET:
            percorsi.append(''.join(passi))
    return percorsi == ['DDBB'], percorsi


# ---------------------------------------------------------------- autotest

PROPOSTE = [
    ('P1  I Tre Custodi',            p1_verifica),
    ('P2  Il Traghetto del Guardiano', p2_verifica),
    ('P3  Le Sessanta Lampade',      p3_verifica),
    ('P4  Il Censimento dei Gatti',  p4_verifica),
    ('P5  I Quattro Cartigli',       p5_verifica),
    ('P6  I Pesi del Mercante',      p6_verifica),
    ('P7  Il Torneo delle Quattro Barche', p7_verifica),
    ('P8  Il Numero dello Scriba',   p8_verifica),
    ('P9  La Porta dei Giorni',      p9_verifica),
    ('P10 Il Sentiero delle Offerte', p10_verifica),
]


def _selftest():
    for nome, fn in PROPOSTE:
        ok, dettaglio = fn()
        assert ok, (nome, dettaglio)
    print("autotest proposte_10_enigmi.py: OK (10 su 10 a risposta unica)")


def _demo():
    for nome, fn in PROPOSTE:
        ok, dettaglio = fn()
        print(f"{nome:36s} -> {'UNICO' if ok else 'ROTTO'}  {dettaglio}")


if __name__ == "__main__":
    _selftest()
    if "--test" not in sys.argv:
        print()
        _demo()
