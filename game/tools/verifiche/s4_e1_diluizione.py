#!/usr/bin/env python3
"""
Verifica per S4-E1 — "La Miscela Corretta" (rapporti / diluizione).

Due solventi (10% e 40% di concentrazione) vanno miscelati per ottenere 60ml
di soluzione al 20%. Il codice richiesto è la concatenazione "ml di solvente
al 10%" + "ml di solvente al 40%", due cifre ciascuno (es. "4020" = 40ml al
10% + 20ml al 40%).

Sistema lineare a 2 equazioni, 2 incognite (volume totale, bilancio di
concentrazione): soluzione unica per costruzione algebrica, qui dimostrata
anche per enumerazione su tutti i volumi interi possibili (0..60, passo 1),
cifra per cifra come lo leggerebbe un giocatore.

Uso:
    python tools/verifiche/s4_e1_diluizione.py            # autotest + demo
    python tools/verifiche/s4_e1_diluizione.py --test     # solo autotest (esce 0)
"""

import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):       # pragma: no cover
    pass


CONC_A = 10     # percento
CONC_B = 40
VOLUME_TOTALE = 60
CONC_TARGET = 20

CODICE = "4020"     # v_a=40 (2 cifre) + v_b=20 (2 cifre)


def soluzioni_intere():
    """Ogni combinazione intera (v_a, v_b) con v_a+v_b=VOLUME_TOTALE che
    rispetta il bilancio di concentrazione: v_a*CONC_A + v_b*CONC_B ==
    VOLUME_TOTALE*CONC_TARGET."""
    trovate = []
    for v_a in range(0, VOLUME_TOTALE + 1):
        v_b = VOLUME_TOTALE - v_a
        if v_a * CONC_A + v_b * CONC_B == VOLUME_TOTALE * CONC_TARGET:
            trovate.append((v_a, v_b))
    return trovate


def verifica(verboso=True):
    esito = {"ok": False}

    if verboso:
        print("=== S4-E1: La Miscela Corretta ===")
        print(f"solvente A: {CONC_A}%   solvente B: {CONC_B}%   "
              f"target: {VOLUME_TOTALE}ml al {CONC_TARGET}%")

    trovate = soluzioni_intere()
    esito["soluzioni"] = trovate
    if verboso:
        print(f"combinazioni intere (v_a, v_b) con v_a+v_b={VOLUME_TOTALE} "
              f"che rispettano il bilancio: {trovate}")

    if len(trovate) != 1:
        if verboso:
            print("  -> NON UNICO" if trovate else "  -> IRRISOLVIBILE")
        return esito

    v_a, v_b = trovate[0]
    codice_dedotto = f"{v_a:02d}{v_b:02d}"
    esito["codice_dedotto"] = codice_dedotto
    if codice_dedotto != CODICE:
        if verboso:
            print(f"  -> INCOERENTE: dedotto {codice_dedotto}, atteso {CODICE}")
        return esito

    # entrambe le concentrazioni sono necessarie a distinguere: se fossero
    # uguali, ogni combinazione andrebbe bene (infinite soluzioni) — controllo
    # di non-degenerazione, non solo di unicità numerica
    if CONC_A == CONC_B:
        if verboso:
            print("  -> DEGENERE: le due concentrazioni coincidono")
        return esito

    esito["ok"] = True
    if verboso:
        print(f"  -> unico: {v_a}ml al {CONC_A}% + {v_b}ml al {CONC_B}% = "
              f"codice {codice_dedotto}")
    return esito


def _selftest():
    r = verifica(verboso=False)
    assert r["ok"], r
    assert r["soluzioni"] == [(40, 20)], r
    assert r["codice_dedotto"] == "4020", r

    print("autotest s4_e1_diluizione.py: OK")


def _demo():
    verifica(verboso=True)


if __name__ == "__main__":
    _selftest()
    if "--test" not in sys.argv:
        print()
        _demo()
