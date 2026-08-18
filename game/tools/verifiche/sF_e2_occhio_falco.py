#!/usr/bin/env python3
"""
Verifica per sF-E2 — "L'Occhio del Falco" (serratura a 4 anelli concentrici,
stanza dell'altare, finale del gioco).

Il meccanismo (puzzles/puzzle_occhio_falco.js, assorbito da un componente
esterno `<falcon-lock>`): 4 anelli concentrici di 12 settori ciascuno, un
solo varco per anello. Ogni anello gira in UN SOLO verso (l'altro verso
"incastra" e non muove nulla); ruotare l'anello i di uno scatto nel suo
verso sposta anche gli altri anelli secondo la riga i di una matrice fissa
M. Si vince quando tutti e quattro i varchi sono allineati (offset 0).

Poiché ogni scatto applica sempre lo STESSO incremento (dipende solo da
quale anello si gira, non da quando), lo stato finale dopo n_i scatti
sull'anello i, per i=0..3, è semplicemente:

    off_finale[j] = (START[j] + Σ_i n_i · DIR[i] · M[i][j]) mod 12

una somma — quindi l'ORDINE degli scatti non conta, solo il CONTEGGIO per
anello. Il problema si riduce a trovare (n0,n1,n2,n3) ∈ [0,12)^4 che azzera
tutti e quattro gli offset: uno spazio di appena 12⁴ = 20736 combinazioni,
enumerabile per intero (a differenza di una BFS, qui non serve nemmeno:
basta il prodotto cartesiano, perché la struttura è lineare, non a grafo).

I parametri (START, M, DIR) sono ricopiati TALI E QUALI da
puzzles/puzzle_occhio_falco.js — se quel file cambia, questo script smette
di essere la controprova e va riallineato a mano.

Uso:
    python tools/verifiche/sF_e2_occhio_falco.py            # autotest + demo
    python tools/verifiche/sF_e2_occhio_falco.py --test     # solo autotest (esce 0)
"""

import sys
from itertools import product

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):       # pragma: no cover
    pass


S = 12
START = (4, 11, 7, 4)
# M[anello mosso][anello che ne risente] — riga i = effetto di uno scatto
# sull'anello i (dir=+1) su ciascuno dei quattro offset.
M = [[1, -2, 0, 0], [0, 1, -1, 0], [0, 0, 1, -2], [3, 0, 0, 1]]
DIR = [1, -1, 1, -1]           # verso consentito per ciascun anello

SOLUZIONE_ATTESA = (8, 7, 10, 8)


def stato_finale(n):
    off = list(START)
    for i in range(4):
        for j in range(4):
            off[j] = (off[j] + n[i] * DIR[i] * M[i][j]) % S
    return tuple(off)


def verifica(verboso=True):
    esito = {"ok": False}

    soluzioni = [n for n in product(range(S), repeat=4) if stato_finale(n) == (0, 0, 0, 0)]
    esito["soluzioni"] = soluzioni

    if verboso:
        print("=== sF-E2: L'Occhio del Falco ===")
        print(f"stato di partenza: {START}")
        print(f"spazio esplorato: {S}^4 = {S**4} combinazioni di scatti")
        print(f"soluzioni trovate: {soluzioni}")

    if not soluzioni:
        if verboso:
            print("  -> IRRISOLVIBILE: nessuna combinazione di scatti allinea i quattro varchi")
        return esito

    if len(soluzioni) != 1:
        if verboso:
            print("  -> AMBIGUO: più combinazioni diverse risolvono la serratura")
        return esito

    trovata = soluzioni[0]
    esito["scatti"] = trovata
    if trovata != SOLUZIONE_ATTESA:
        if verboso:
            print(f"  -> INCOERENTE: trovata {trovata}, dichiarata {SOLUZIONE_ATTESA}")
        return esito

    esito["ok"] = True
    if verboso:
        print(f"  -> unica: {trovata[0]} scatti sul primo anello, {trovata[1]} sul secondo, "
              f"{trovata[2]} sul terzo, {trovata[3]} sul quarto. Nessun'altra combinazione allinea i varchi.")
    return esito


def _selftest():
    r = verifica(verboso=False)
    assert r["ok"], r
    assert r["scatti"] == (8, 7, 10, 8), r
    assert len(r["soluzioni"]) == 1, r

    # Il sistema è lineare (M fissa, DIR fisso): per QUALSIASI stato di
    # partenza esiste esattamente una combinazione di scatti che allinea i
    # varchi, perché la trasformazione n -> n·R è biunivoca su Z12^4 con
    # questa M. Non è quindi un caso su cui costruire una prova negativa
    # cambiando START: la prova negativa vera è mostrare che con una M
    # DEGENERE (righe linearmente dipendenti, qui la riga 3 duplica la riga
    # 0) il conteggio delle soluzioni smette di essere 1 — a dimostrazione
    # che verifica() sta davvero misurando qualcosa, non restituendo un
    # esito fisso.
    global M
    originale = M
    M = [[1, -2, 0, 0], [0, 1, -1, 0], [0, 0, 1, -2], [1, -2, 0, 0]]
    degenere = verifica(verboso=False)
    assert not degenere["ok"] and len(degenere["soluzioni"]) != 1, degenere
    M = originale

    print("autotest sF_e2_occhio_falco.py: OK")


def _demo():
    verifica(verboso=True)


if __name__ == "__main__":
    _selftest()
    if "--test" not in sys.argv:
        print()
        _demo()
