#!/usr/bin/env python3
"""
Verifica per D2-E1 — "L'Agenda del Direttore" (deduzione calendario, decoy leggero).

Il primo incontro con un fornitore cade il giorno 1 del mese (lunedì).
Ogni incontro successivo è fissato esattamente 4 giorni dopo l'incontro
EFFETTIVO precedente (quello già eventualmente spostato) — la regola è
dichiarata così nel testo apposta per non lasciare ambiguità su "4 giorni
da cosa". L'ufficio è chiuso sabato e domenica: un incontro che cadrebbe in
un giorno chiuso slitta al lunedì successivo.

Simulazione passo-passo (non enumerazione: qui non c'è nulla da cercare, la
regola è deterministica) fino al quarto incontro.

Uso:
    python tools/verifiche/d2_e1_calendario.py            # autotest + demo
    python tools/verifiche/d2_e1_calendario.py --test     # solo autotest (esce 0)
"""

import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):       # pragma: no cover
    pass


GIORNO_INIZIALE = 1        # 1 = lunedì di quel mese
INTERVALLO = 4
NUMERO_INCONTRI = 4
CODICE = "15"

GIORNI = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica']


def giorno_settimana(n):
    """n=1 è lunedì (dichiarato); il ciclo si ripete ogni 7."""
    return GIORNI[(n - 1) % 7]


def e_chiuso(n):
    return giorno_settimana(n) in ('sabato', 'domenica')


def simula(numero_incontri, verboso=False):
    date = []
    corrente = GIORNO_INIZIALE
    for i in range(numero_incontri):
        if i == 0:
            data = corrente
        else:
            data = date[-1] + INTERVALLO
            while e_chiuso(data):
                data += 1
        date.append(data)
        if verboso:
            print(f"  incontro {i+1}: giorno {data} ({giorno_settimana(data)})")
    return date


def verifica(verboso=True):
    esito = {"ok": False}

    if verboso:
        print("=== D2-E1: L'Agenda del Direttore ===")
        print(f"primo incontro: giorno {GIORNO_INIZIALE} ({giorno_settimana(GIORNO_INIZIALE)}), "
              f"intervallo {INTERVALLO} giorni, ufficio chiuso sab/dom")

    date = simula(NUMERO_INCONTRI, verboso=verboso)
    esito["date"] = date

    ultimo = date[-1]
    esito["quarto_incontro"] = ultimo
    if e_chiuso(ultimo):
        if verboso:
            print(f"  -> BUG: il quarto incontro cade in un giorno chiuso ({giorno_settimana(ultimo)})")
        return esito

    codice_dedotto = f"{ultimo:02d}"
    esito["codice_dedotto"] = codice_dedotto
    if codice_dedotto != CODICE:
        if verboso:
            print(f"  -> INCOERENTE: dedotto {codice_dedotto}, atteso {CODICE}")
        return esito

    esito["ok"] = True
    if verboso:
        print(f"  -> il quarto incontro cade il giorno {ultimo} "
              f"({giorno_settimana(ultimo)}), mai in un giorno chiuso.")
    return esito


def _selftest():
    r = verifica(verboso=False)
    assert r["ok"], r
    assert r["date"] == [1, 5, 9, 15], r
    assert r["quarto_incontro"] == 15, r

    # il terzo incontro (giorno 9) NON slitta: e' un martedì, controllo
    # che la simulazione non sposti date che non cadono in giorni chiusi
    assert giorno_settimana(9) == 'martedì'
    # il quarto, naive (13), cadrebbe di sabato: qui la regola slitta a 15
    assert giorno_settimana(13) == 'sabato'
    assert giorno_settimana(15) == 'lunedì'

    print("autotest d2_e1_calendario.py: OK")


def _demo():
    verifica(verboso=True)


if __name__ == "__main__":
    _selftest()
    if "--test" not in sys.argv:
        print()
        _demo()
