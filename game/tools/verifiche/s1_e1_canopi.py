#!/usr/bin/env python3
"""
Verifica per S1-E1 — "I Quattro Coperchi" (enigma di logica, tema egizio).

Quattro vasi allineati su una mensola, posizioni 1..4 da sinistra. Ogni vaso
ha un coperchio a forma diversa: Falco, Sciacallo, Babbuino, Uomo. Tre indizi
nel testo determinano l'ordine completo.

Puzzle a disposizione (arrange, puzzles/puzzle_disposizione.js): il giocatore
tocca due vasi per scambiarli di posto, senza bottone di conferma — l'ordine
si controlla da solo dopo ogni scambio. Qui non c'è una lista di opzioni da
scartare: la verifica dimostra che l'ordine dedotto dagli indizi è unico
(come prima) e che lo stato di partenza dichiarato in game_data.js
(`ordineIniziale`) è una permutazione valida dei quattro vasi diversa dalla
soluzione — un enigma che nasce già risolto non sarebbe un enigma.

Uso:
    python tools/verifiche/s1_e1_canopi.py            # autotest + demo
    python tools/verifiche/s1_e1_canopi.py --test     # solo autotest (esce 0)

I motori (`solutions`, `unique_answer`, `minimize_indices`, ...) sono ricopiati
TALI E QUALI da puzzle-forge/scripts/verify.py: non modificarli qui.
"""

import sys
from itertools import permutations

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):       # pragma: no cover
    pass


# ============================================================== motori
# (copia fedele da puzzle-forge/scripts/verify.py — non modificare)

def _materialize(domain):
    if isinstance(domain, (list, tuple)):
        return domain
    return list(domain)


def solutions(domain, constraints, cap=None):
    out = []
    for a in _materialize(domain):
        if all(c(a) for c in constraints):
            out.append(a)
            if cap is not None and len(out) >= cap:
                break
    return out


def count_solutions(domain, constraints, cap=None):
    return len(solutions(domain, constraints, cap=cap))


def is_unique(domain, constraints):
    return count_solutions(domain, constraints, cap=2) == 1


def answers(domain, constraints, ask):
    return {ask(s) for s in solutions(domain, constraints)}


def unique_answer(domain, constraints, ask):
    a = answers(domain, constraints, ask)
    return len(a) == 1, a


def minimize_indices(domain, constraints, keep=(), ask=None, rounds=1, seed=None):
    domain = _materialize(domain)
    constraints = list(constraints)
    n = len(constraints)
    keep = {i % n for i in keep} if n else set()

    def still_ok(idxs):
        if not idxs:
            return False
        cs = [constraints[i] for i in idxs]
        if ask is None:
            return is_unique(domain, cs)
        return unique_answer(domain, cs, ask)[0]

    allidx = list(range(n))
    if not still_ok(allidx):
        raise ValueError(
            "minimize() richiede che i vincoli di partenza siano già "
            "sufficienti: qui la risposta non è unica. Aggiungi indizi prima."
        )

    import random
    rng = random.Random(seed)
    best = allidx
    for r in range(max(1, rounds)):
        order = list(allidx)
        if r:
            rng.shuffle(order)
        current = set(allidx)
        for i in order:
            if i in keep:
                continue
            trial = current - {i}
            if still_ok(sorted(trial)):
                current = trial
        if len(current) < len(best):
            best = sorted(current)
    return list(best)


def minimize(domain, constraints, keep=(), ask=None, rounds=1, seed=None):
    idx = minimize_indices(domain, constraints, keep=keep, ask=ask, rounds=rounds, seed=seed)
    return [constraints[i] for i in idx]


# ================================================= adattamento all'enigma

ITEMS = ['F', 'S', 'B', 'U']          # Falco, Sciacallo, Babbuino, Uomo
NOMI = {'F': 'Falco', 'S': 'Sciacallo', 'B': 'Babbuino', 'U': 'Uomo'}
POSIZIONI = [1, 2, 3, 4]

TARGET = {'F': 1, 'S': 2, 'U': 3, 'B': 4}     # Falco, Sciacallo, Uomo, Babbuino

INDIZI = [
    ("Lo sciacallo è subito a sinistra dell'uomo.",
     lambda p: p['S'] + 1 == p['U']),
    ("Il falco e il babbuino occupano i due estremi della mensola.",
     lambda p: abs(p['F'] - p['B']) == 3),
    ("Il falco e lo sciacallo sono affiancati, senza nulla tra loro.",
     lambda p: abs(p['F'] - p['S']) == 1),
]

# Stato di partenza dichiarato in game_data.js (parametri.ordineIniziale),
# qui in lettere: deve essere una permutazione dei quattro vasi, diversa
# dalla soluzione. L'ordine delle POSIZIONI, non delle lettere: ORDINE_INIZIALE[0]
# è il vaso più a sinistra all'apertura dell'enigma.
ORDINE_INIZIALE = ['B', 'F', 'U', 'S']   # babbuino, falco, uomo, sciacallo


def dominio():
    return [dict(zip(ITEMS, perm)) for perm in permutations(POSIZIONI)]


def ordine_di(p):
    """La sequenza sinistra->destra come tupla di lettere, per confrontarla
    con le opzioni a scelta multipla."""
    return tuple(sorted(p, key=lambda k: p[k]))


def verifica(verboso=True):
    esito = {"ok": False}
    dom = dominio()
    preds = [pred for _, pred in INDIZI]

    ok, risposte = unique_answer(dom, preds, ordine_di)
    esito["unico"] = ok
    esito["risposte"] = risposte

    if verboso:
        print("=== S1-E1: I Quattro Coperchi ===")
        print(f"dominio: {len(dom)} disposizioni possibili (4!)")
        for t, _ in INDIZI:
            print("  -", t)
        print(f"disposizioni compatibili con tutti gli indizi: {len(risposte)}")

    if not ok:
        if verboso:
            print("  -> NON UNICO:", risposte)
        return esito

    trovata = next(iter(risposte))
    esito["ordine_dedotto"] = trovata
    attesa = ordine_di(TARGET)
    if trovata != attesa:
        if verboso:
            print(f"  -> INCOERENTE: dedotto {trovata}, atteso {attesa}")
        return esito

    # Ogni indizio è necessario: toglierne uno qualsiasi rompe l'unicità.
    tenuti = minimize_indices(dom, preds, ask=ordine_di, rounds=6, seed=0)
    superflui = [INDIZI[i][0] for i in range(len(preds)) if i not in tenuti]
    esito["superflui"] = superflui
    if verboso:
        if superflui:
            print("  indizi rimovibili:", superflui)
        else:
            print("  nessun indizio ridondante: i tre sono tutti necessari")

    # Lo stato di partenza del puzzle a disposizione: permutazione valida,
    # diversa dalla soluzione (altrimenti l'enigma nascerebbe già risolto).
    esito["permutazione_valida"] = sorted(ORDINE_INIZIALE) == sorted(ITEMS)
    esito["gia_risolto"] = tuple(ORDINE_INIZIALE) == attesa
    if verboso:
        iniziale_nomi = " ".join(NOMI[l] for l in ORDINE_INIZIALE)
        corretto_nomi = " ".join(NOMI[l] for l in attesa)
        print(f"  ordine di partenza: {iniziale_nomi}")
        print(f"  ordine corretto:    {corretto_nomi}")

    if not esito["permutazione_valida"]:
        if verboso:
            print("  -> ORDINE_INIZIALE non contiene esattamente i quattro vasi una volta ciascuno")
        return esito
    if esito["gia_risolto"]:
        if verboso:
            print("  -> l'enigma nasce già risolto: ordineIniziale coincide con la soluzione")
        return esito

    esito["ok"] = True
    if verboso:
        print("  -> unico, coincide con l'ordine dichiarato, e lo stato di partenza "
              "è una permutazione valida diversa dalla soluzione.")
    return esito


def _selftest():
    r = verifica(verboso=False)
    assert r["ok"], r
    assert r["unico"] is True
    assert r["ordine_dedotto"] == ('F', 'S', 'U', 'B'), r
    assert r["permutazione_valida"] is True, r
    assert r["gia_risolto"] is False, r

    # togliere un indizio qualsiasi rompe l'unicità (il test non è vacuo)
    dom = dominio()
    preds = [pred for _, pred in INDIZI]
    for i in range(len(preds)):
        subset = preds[:i] + preds[i + 1:]
        assert not is_unique(dom, subset), f"indizio {i} risulta superfluo"

    # prova negativa: un ordineIniziale con un vaso ripetuto DEVE far fallire
    # il controllo di permutazione, altrimenti quel controllo non starebbe
    # verificando nulla.
    global ORDINE_INIZIALE
    originale = ORDINE_INIZIALE
    ORDINE_INIZIALE = ['F', 'F', 'U', 'S']
    rotto = verifica(verboso=False)
    assert not rotto["ok"] and not rotto["permutazione_valida"], rotto
    ORDINE_INIZIALE = ['F', 'S', 'U', 'B']       # coincide con la soluzione
    gia_risolto = verifica(verboso=False)
    assert not gia_risolto["ok"] and gia_risolto["gia_risolto"], gia_risolto
    ORDINE_INIZIALE = originale

    print("autotest s1_e1_canopi.py: OK")


def _demo():
    verifica(verboso=True)


if __name__ == "__main__":
    _selftest()
    if "--test" not in sys.argv:
        print()
        _demo()
