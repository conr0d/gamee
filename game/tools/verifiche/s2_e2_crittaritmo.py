#!/usr/bin/env python3
"""
Verifica per S2-E2 — "L'Equazione dello Scriba" (crittaritmo).

Su una tavoletta: RA + KA = SET, dove ogni lettera è una cifra diversa
(0-9), lettere uguali = stessa cifra, nessuna delle cifre iniziali (R, K, S)
è zero. Tre note dello scriba, incise a fianco, restringono le assegnazioni
possibili a una sola:

    1. A è dispari.
    2. E vale zero.
    3. K è il successore di R (K = R + 1).

Soluzione: R=4, A=9, K=5, S=1, E=0, T=8  ->  RA=49, KA=59, SET=108.
Il codice richiesto al tastierino è il valore di SET: 108.

Uso:
    python tools/verifiche/s2_e2_crittaritmo.py            # autotest + demo
    python tools/verifiche/s2_e2_crittaritmo.py --test     # solo autotest (esce 0)

Motori (`unique_answer`, ...) ricopiati da puzzle-forge/scripts/verify.py.
"""

import sys
from itertools import permutations

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):       # pragma: no cover
    pass


# ============================================================== motori
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


def answers(domain, constraints, ask):
    return {ask(s) for s in solutions(domain, constraints)}


def unique_answer(domain, constraints, ask):
    a = answers(domain, constraints, ask)
    return len(a) == 1, a


# ================================================= adattamento all'enigma

LETTERE = ['R', 'A', 'K', 'S', 'E', 'T']
LEADING = ['R', 'K', 'S']          # non possono valere 0

CODICE = '108'


def equazione(d):
    ra = 10 * d['R'] + d['A']
    ka = 10 * d['K'] + d['A']
    set_ = 100 * d['S'] + 10 * d['E'] + d['T']
    return ra + ka == set_


CLUE_BASE = ("RA + KA = SET, lettere uguali stessa cifra, cifre diverse per "
             "lettere diverse, nessuna delle cifre iniziali è zero", equazione)

CLUE_EXTRA = [
    ("A è dispari.", lambda d: d['A'] % 2 == 1),
    ("E vale zero.", lambda d: d['E'] == 0),
    ("K è il successore di R.", lambda d: d['K'] == d['R'] + 1),
]


def dominio():
    dom = []
    for perm in permutations(range(10), len(LETTERE)):
        d = dict(zip(LETTERE, perm))
        if any(d[l] == 0 for l in LEADING):
            continue
        dom.append(d)
    return dom


def set_di(d):
    return 100 * d['S'] + 10 * d['E'] + d['T']


def verifica(verboso=True):
    esito = {"ok": False}
    dom = dominio()
    preds_base = [equazione]
    preds_extra = [f for _, f in CLUE_EXTRA]

    n_solo_equazione = len(solutions(dom, preds_base))
    esito["soluzioni_solo_equazione"] = n_solo_equazione
    if verboso:
        print("=== S2-E2: L'Equazione dello Scriba ===")
        print(f"solo RA+KA=SET (senza le note): {n_solo_equazione} assegnazioni possibili")

    ok, risposte = unique_answer(dom, preds_base + preds_extra, set_di)
    esito["unico"] = ok
    esito["risposte"] = risposte
    if verboso:
        for t, _ in CLUE_EXTRA:
            print("  -", t)
        print(f"assegnazioni compatibili con equazione + 3 note: {len(risposte)}")

    if not ok:
        if verboso:
            print("  -> NON UNICO:", sorted(risposte)[:8])
        return esito

    trovato = next(iter(risposte))
    esito["set_dedotto"] = trovato
    if trovato != int(CODICE):
        if verboso:
            print(f"  -> INCOERENTE: dedotto {trovato}, atteso {CODICE}")
        return esito

    # ogni nota extra è necessaria: toglierne una qualsiasi rompe l'unicità
    superflue = []
    for i in range(len(preds_extra)):
        subset = preds_extra[:i] + preds_extra[i + 1:]
        _, risp = unique_answer(dom, preds_base + subset, set_di)
        if len(risp) == 1:
            superflue.append(CLUE_EXTRA[i][0])
    esito["superflue"] = superflue
    if verboso:
        if superflue:
            print("  note superflue (rimovibili singolarmente):", superflue)
        else:
            print("  nessuna nota superflua: tutte e tre sono necessarie")

    esito["ok"] = True
    if verboso:
        print(f"  -> unico, SET = {trovato}, coincide col codice dichiarato.")
    return esito


def _selftest():
    r = verifica(verboso=False)
    assert r["ok"], r
    assert r["unico"] is True
    assert r["set_dedotto"] == 108, r
    assert r["soluzioni_solo_equazione"] > 1, "l'equazione da sola dovrebbe essere ambigua"
    assert r["superflue"] == [], r["superflue"]

    print("autotest s2_e2_crittaritmo.py: OK")


def _demo():
    verifica(verboso=True)


if __name__ == "__main__":
    _selftest()
    if "--test" not in sys.argv:
        print()
        _demo()
