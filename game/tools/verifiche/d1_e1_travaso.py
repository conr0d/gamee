#!/usr/bin/env python3
"""
Verifica per D1-E1 — "I Due Secchi" (travaso interattivo, decoy nel Bagno).

Due secchi vuoti accanto al lavandino: capienza 5 e 9 litri. Il giocatore
riempie, svuota e versa DAVVERO (puzzles/puzzle_travaso.js, motore
interattivo: nessuna risposta da digitare, si vince raggiungendo lo stato).
Obiettivo: lasciare esattamente 7 litri nel secchio da 9.

A differenza di un enigma a risposta secca, qui non c'è un "codice" da
dimostrare unico — il traguardo è uno stato del mondo (b == 7), sempre
inequivocabile. Quello che va dimostrato col codice, non a occhio:

  1. lo stato è RAGGIUNGIBILE (gcd(5,9)=1 lo garantisce in teoria, ma si
     verifica lo stesso, per lo stesso principio delle altre verifiche);
  2. il numero minimo di mosse dichiarato nella spiegazione (12) è quello
     vero, dimostrato da una BFS esaustiva sullo spazio degli stati;
  3. lo stato-obiettivo raggiunto al minimo è unico: (5, 7), non (0, 7)
     (che esiste ma costa una mossa in più) — altrimenti "12 mosse" non
     indicherebbe un percorso preciso.

Uso:
    python tools/verifiche/d1_e1_travaso.py            # autotest + demo
    python tools/verifiche/d1_e1_travaso.py --test     # solo autotest (esce 0)

Motore BFS nello stile di puzzle-forge/scripts/statespace.py (bfs, check_canon).
"""

import sys
from collections import deque

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):       # pragma: no cover
    pass


CAP_A = 5
CAP_B = 9
TARGET_B = 7
MOSSE_MINIME_ATTESE = 12
STATO_GOAL_ATTESO = (5, 7)


def vicini(stato):
    a, b = stato
    yield 'riempi A', (CAP_A, b)
    yield 'riempi B', (a, CAP_B)
    yield 'svuota A', (0, b)
    yield 'svuota B', (a, 0)
    m = min(a, CAP_B - b)
    yield 'versa A->B', (a - m, b + m)
    m2 = min(b, CAP_A - a)
    yield 'versa B->A', (a + m2, b - m2)


def bfs():
    partenza = (0, 0)
    dist = {partenza: 0}
    genitore = {partenza: None}
    coda = deque([partenza])
    while coda:
        s = coda.popleft()
        for etichetta, n in vicini(s):
            if n not in dist:
                dist[n] = dist[s] + 1
                genitore[n] = (s, etichetta)
                coda.append(n)
    return dist, genitore


def ricostruisci(genitore, stato):
    cammino = []
    s = stato
    while genitore[s] is not None:
        prec, etichetta = genitore[s]
        cammino.append((etichetta, s))
        s = prec
    cammino.reverse()
    return cammino


def verifica(verboso=True):
    esito = {"ok": False}
    dist, genitore = bfs()

    goal = [s for s in dist if s[1] == TARGET_B]
    esito["stati_goal"] = goal
    if not goal:
        if verboso:
            print(f"  -> IRRAGGIUNGIBILE: nessuno stato ha il secchio B a {TARGET_B}L")
        return esito

    minimo = min(dist[s] for s in goal)
    goal_al_minimo = [s for s in goal if dist[s] == minimo]
    esito["mosse_minime"] = minimo
    esito["goal_al_minimo"] = goal_al_minimo

    if verboso:
        print("=== D1-E1: I Due Secchi (travaso interattivo) ===")
        print(f"capienze: A={CAP_A}L, B={CAP_B}L. obiettivo: {TARGET_B}L nel secchio B.")
        print(f"stati totali raggiungibili: {len(dist)}")
        print(f"stati con B={TARGET_B}L: {goal}  (distanze: {[dist[s] for s in goal]})")
        print(f"minimo di mosse per arrivare a B={TARGET_B}L: {minimo}")
        print(f"stati-goal raggiungibili in {minimo} mosse: {goal_al_minimo}")
        cammino = ricostruisci(genitore, goal_al_minimo[0])
        for etichetta, s in cammino:
            print(f"    {etichetta} -> {s}")

    if len(goal_al_minimo) != 1:
        if verboso:
            print("  -> AMBIGUO: più stati-goal diversi raggiungono il minimo")
        return esito

    if minimo != MOSSE_MINIME_ATTESE:
        if verboso:
            print(f"  -> INCOERENTE: minimo calcolato {minimo}, atteso {MOSSE_MINIME_ATTESE}")
        return esito

    if goal_al_minimo[0] != STATO_GOAL_ATTESO:
        if verboso:
            print(f"  -> INCOERENTE: stato-goal {goal_al_minimo[0]}, atteso {STATO_GOAL_ATTESO}")
        return esito

    esito["ok"] = True
    if verboso:
        print(f"  -> unico: {minimo} mosse, un solo stato-goal ottimo {STATO_GOAL_ATTESO}, "
              "coerente con la spiegazione dichiarata.")
    return esito


def _selftest():
    r = verifica(verboso=False)
    assert r["ok"], r
    assert r["mosse_minime"] == 12, r
    assert r["goal_al_minimo"] == [(5, 7)], r

    # prova negativa: un bersaglio irraggiungibile con queste capienze deve
    # essere rilevato, non passare per sbaglio (il test non è vacuo)
    global TARGET_B
    originale = TARGET_B
    TARGET_B = 11               # più della capienza massima (9): irraggiungibile
    r2 = verifica(verboso=False)
    assert not r2["ok"] and r2["stati_goal"] == [], r2
    TARGET_B = originale

    print("autotest d1_e1_travaso.py: OK")


def _demo():
    verifica(verboso=True)


if __name__ == "__main__":
    _selftest()
    if "--test" not in sys.argv:
        print()
        _demo()
