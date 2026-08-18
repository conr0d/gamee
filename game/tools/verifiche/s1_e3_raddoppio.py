#!/usr/bin/env python3
"""
Verifica per S1-E3 — "Il Grano che Raddoppia" (sequenza numerica -> codice a 4 cifre).

Cinque casse in fila; le prime quattro portano i numeri 67, 134, 268, 536 (ogni
cassa il doppio della precedente, come dichiara la nota dello scriba). Il
timbro della quinta manca: il giocatore deve leggere il rapporto 1:2 già
visibile fra le quattro cifre date e proseguirlo. 536*2 = 1072, un codice a 4
cifre — che è anche l'unico intero che prolunga la progressione geometrica di
ragione 2 osservata nei dati (nessuna progressione aritmetica alternativa la
spiega: le differenze 67, 134, 268 non sono costanti).

Uso:
    python tools/verifiche/s1_e3_raddoppio.py            # autotest + demo
    python tools/verifiche/s1_e3_raddoppio.py --test     # solo autotest (esce 0)

Riusa senza modifiche il motore di tools/verifiche/tastierino.py (stesso
codice di puzzle-forge/scripts/verify.py, copiato lì una sola volta).
"""

import sys
from itertools import product

sys.path.insert(0, __file__.rsplit("\\", 1)[0] if "\\" in __file__ else __file__.rsplit("/", 1)[0])
from tastierino import unique_answer, sequenza  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):       # pragma: no cover
    pass


CIFRE = [str(d) for d in range(10)]
SEQUENZA_DATA = [67, 134, 268, 536]
CODICE = "1072"


def _numero(s):
    return int("".join(s))


def geometrica_ragione_2(s):
    """Vero se, incollando la sequenza data + il codice proposto, il rapporto
    fra termini consecutivi è sempre 2 (l'unica regola dichiarata nel testo)."""
    n = _numero(s)
    intera = SEQUENZA_DATA + [n]
    return all(intera[i + 1] == 2 * intera[i] for i in range(len(intera) - 1))


def nessuna_arithmetica_alternativa():
    """Controllo di non-ambiguità: la sequenza data NON è anche spiegabile da
    una progressione aritmetica (differenza costante), il che eliminerebbe
    ogni dubbio sul fatto che la regola di raddoppio sia l'unica in gioco."""
    diffs = [SEQUENZA_DATA[i + 1] - SEQUENZA_DATA[i] for i in range(len(SEQUENZA_DATA) - 1)]
    return len(set(diffs)) > 1   # differenze non costanti -> non è aritmetica


def verifica(verboso=True):
    esito = {"ok": False}
    dominio = list(product(CIFRE, repeat=4))

    if verboso:
        print("=== S1-E3: Il Grano che Raddoppia ===")
        print(f"casse note: {SEQUENZA_DATA}  (rapporto 2 fra consecutive)")
        print(f"spazio di ricerca del codice mancante: {len(dominio):,} combinazioni"
              .replace(",", "."))

    if not nessuna_arithmetica_alternativa():
        if verboso:
            print("  -> le differenze sono costanti: la sequenza sarebbe anche "
                  "aritmetica, ambigua. Cambia i numeri.")
        return esito

    ok, risposte = unique_answer(dominio, [geometrica_ragione_2], ask=_numero)
    esito["unico"] = ok
    esito["risposte"] = risposte
    if verboso:
        print(f"  combinazioni compatibili con 'ogni cassa è il doppio della "
              f"precedente': {len(risposte)}")

    if not ok:
        if verboso:
            print("  -> NON UNICO:", sorted(risposte)[:8])
        return esito

    trovato = next(iter(risposte))
    esito["numero_dedotto"] = trovato
    if trovato != int(CODICE):
        if verboso:
            print(f"  -> INCOERENTE: dedotto {trovato}, atteso {CODICE}")
        return esito

    if len(CODICE) != 4 or not (1000 <= trovato <= 9999):
        if verboso:
            print(f"  -> il risultato {trovato} non ha 4 cifre come richiesto dal tastierino")
        esito["ok"] = False
        return esito

    esito["ok"] = True
    if verboso:
        print(f"  -> unico, a 4 cifre, e coincide col codice dichiarato: {CODICE}")
    return esito


def _selftest():
    assert sequenza(CODICE) == ["1", "0", "7", "2"]
    r = verifica(verboso=False)
    assert r["ok"], r
    assert r["unico"] is True
    assert r["numero_dedotto"] == 1072, r
    assert nessuna_arithmetica_alternativa()

    # rompendo la regola (es. 536 -> 540, non più il doppio di 268) l'unicità sparisce
    global SEQUENZA_DATA
    originale = SEQUENZA_DATA
    SEQUENZA_DATA = [67, 134, 268, 540]
    r2 = verifica(verboso=False)
    assert not r2["ok"]
    SEQUENZA_DATA = originale

    print("autotest s1_e3_raddoppio.py: OK")


def _demo():
    verifica(verboso=True)


if __name__ == "__main__":
    _selftest()
    if "--test" not in sys.argv:
        print()
        _demo()
