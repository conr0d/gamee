#!/usr/bin/env python3
"""
Verifica per S4-E3 — "La Scheda Mancante" (puzzle a scorrimento, 3x3).

Nove caselle, otto tessere numerate 1-8 e una vuota (0). Si tocca una
tessera adiacente al vuoto per farla scivolare. Obiettivo: tessere in
ordine crescente da sinistra a destra, riga per riga, vuoto per ultimo
(la griglia [1,2,3,4,5,6,7,8,0]).

Lo stato iniziale non è scelto a caso e poi sperato risolvibile: si
COSTRUISCE applicando N mosse casuali a partire dal goal (principio
"genera al contrario" di puzzle-forge/SKILL.md). Ogni mossa di questo
puzzle è la propria inversa (scambiare due caselle adiacenti si annulla
scambiandole di nuovo), quindi camminare in avanti dal goal per N mosse
GARANTISCE che lo stato risultante torni al goal in al più N mosse — non
serve dimostrarlo con una ricerca a parte, ma lo si fa comunque con una
BFS indipendente (stesso stile di tools/verifiche/d1_e1_travaso.py) per
avere la conferma e il numero minimo di mosse dimostrato.

In più: la classica regola di parità del 15-puzzle (qui 8-puzzle, griglia
dispari) dice che uno stato è risolvibile se e solo se il numero di
inversioni della sequenza (tessere, vuoto escluso) letta riga per riga è
PARI. Il test la usa come controllo incrociato indipendente dalla BFS, e
verifica che sappia anche riconoscere uno stato NON risolvibile (scambio
di due tessere qualunque, vuoto escluso, rende sempre lo stato opposto
in parità).

Uso:
    python tools/verifiche/s4_e3_scorrimento.py            # autotest + demo
    python tools/verifiche/s4_e3_scorrimento.py --test     # solo autotest (esce 0)
"""

import sys
import random
from collections import deque

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):       # pragma: no cover
    pass


RIGHE, COLONNE = 3, 3
GOAL = tuple(list(range(1, RIGHE * COLONNE)) + [0])
N_MOSSE_GENERAZIONE = 25
SEED = 3

# Stato iniziale usato in game_data.js (s4-E3.parametri.griglia).
GRIGLIA_INIZIALE = (4, 0, 3, 2, 1, 8, 7, 6, 5)


def vicini(stato):
    vuoto = stato.index(0)
    r, c = divmod(vuoto, COLONNE)
    for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        nr, nc = r + dr, c + dc
        if 0 <= nr < RIGHE and 0 <= nc < COLONNE:
            vicino = nr * COLONNE + nc
            nuovo = list(stato)
            nuovo[vuoto], nuovo[vicino] = nuovo[vicino], nuovo[vuoto]
            yield 'scambia %d<->%d' % (vuoto, vicino), tuple(nuovo)


def bfs(partenza, goal):
    dist = {partenza: 0}
    genitore = {partenza: None}
    coda = deque([partenza])
    while coda:
        s = coda.popleft()
        if s == goal:
            break
        for etichetta, n in vicini(s):
            if n not in dist:
                dist[n] = dist[s] + 1
                genitore[n] = (s, etichetta)
                coda.append(n)
    return dist, genitore


def genera(n_mosse, seed):
    """Cammina dal goal per n_mosse mosse casuali, senza disfare l'ultima."""
    rng = random.Random(seed)
    stato = GOAL
    precedente_label = None
    for _ in range(n_mosse):
        opzioni = list(vicini(stato))
        if precedente_label is not None:
            opzioni = [o for o in opzioni if o[0] != precedente_label] or opzioni
        etichetta, stato = rng.choice(opzioni)
        precedente_label = etichetta
    return stato


def inversioni(stato):
    """Numero di coppie fuori ordine nella sequenza (vuoto escluso)."""
    seq = [v for v in stato if v != 0]
    return sum(1 for i in range(len(seq)) for j in range(i + 1, len(seq)) if seq[i] > seq[j])


def risolvibile_per_parita(stato):
    # griglia con lato dispari (3x3): risolvibile <=> inversioni pari,
    # indipendentemente dalla riga del vuoto.
    return inversioni(stato) % 2 == 0


def verifica(verboso=True):
    esito = {"ok": False}

    generato = genera(N_MOSSE_GENERAZIONE, SEED)
    esito["generato"] = generato
    coerente = generato == GRIGLIA_INIZIALE

    dist, genitore = bfs(GRIGLIA_INIZIALE, GOAL)
    raggiungibile = GOAL in dist
    esito["raggiungibile"] = raggiungibile
    esito["mosse_minime"] = dist.get(GOAL)
    esito["parita_ok"] = risolvibile_per_parita(GRIGLIA_INIZIALE)

    if verboso:
        print("=== S4-E3: La Scheda Mancante (scorrimento 3x3) ===")
        print(f"goal: {GOAL}")
        print(f"generato dal goal in {N_MOSSE_GENERAZIONE} mosse casuali (seed={SEED}): {generato}")
        print(f"griglia dichiarata in game_data.js:                                  {GRIGLIA_INIZIALE}")
        print(f"coincidono: {coerente}")
        print(f"BFS: goal raggiungibile = {raggiungibile}, mosse minime dimostrate = {esito['mosse_minime']}")
        print(f"controllo incrociato di parità (inversioni pari => risolvibile): {esito['parita_ok']}")

    if not coerente:
        if verboso:
            print("  -> INCOERENTE: GRIGLIA_INIZIALE non è quella generata da genera()")
        return esito
    if not raggiungibile:
        if verboso:
            print("  -> IRRISOLVIBILE secondo la BFS")
        return esito
    if not esito["parita_ok"]:
        if verboso:
            print("  -> IRRISOLVIBILE secondo la parità (contraddice la BFS: bug nel modello)")
        return esito
    if GRIGLIA_INIZIALE == GOAL:
        if verboso:
            print("  -> BANALE: lo stato iniziale è già il goal")
        return esito

    esito["ok"] = True
    if verboso:
        print(f"  -> risolvibile per costruzione, confermato dalla BFS "
              f"({esito['mosse_minime']} mosse minime), non banale.")
    return esito


def _selftest():
    r = verifica(verboso=False)
    assert r["ok"], r
    assert r["raggiungibile"], r
    assert r["parita_ok"], r
    assert r["mosse_minime"] is not None and r["mosse_minime"] > 0, r

    # controllo incrociato: la BFS e la formula di parità devono concordare
    # su un piccolo campione di stati raggiunti durante la BFS stessa.
    dist, _ = bfs(GRIGLIA_INIZIALE, GOAL)
    for stato in list(dist.keys())[:200]:
        assert risolvibile_per_parita(stato) == risolvibile_per_parita(GOAL), stato

    # caso NEGATIVO: scambiare due tessere qualunque (vuoto escluso) nel goal
    # produce uno stato classicamente irrisolvibile. Il test deve fallire
    # per bene, altrimenti la formula di parità non starebbe verificando nulla.
    rotto = list(GOAL)
    i, j = 0, 1
    rotto[i], rotto[j] = rotto[j], rotto[i]
    rotto = tuple(rotto)
    assert not risolvibile_per_parita(rotto), rotto
    dist_rotto, _ = bfs(rotto, GOAL)
    assert GOAL not in dist_rotto, "uno stato con parità dispari non deve raggiungere il goal"

    print("autotest s4_e3_scorrimento.py: OK")


def _demo():
    verifica(verboso=True)


if __name__ == "__main__":
    _selftest()
    if "--test" not in sys.argv:
        print()
        _demo()
