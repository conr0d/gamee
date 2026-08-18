#!/usr/bin/env python3
"""
Verifica per D2-E2 — "Il Numero di Protocollo" (somma di controllo, decoy leggero).

Un protocollo a 6 cifre: le prime 5 sono la base, la sesta è la cifra di
controllo = resto della somma delle prime 5, diviso 9. Sul documento, la
terza cifra della base è sbiadita; le altre 4 e la cifra di controllo si
leggono. Il giocatore deve ricavare la cifra mancante.

La verifica prova tutti i 10 valori possibili (0-9) per la cifra mancante e
dimostra che uno solo riproduce la cifra di controllo dichiarata — non è
garantito in generale (resto mod 9 collide fra cifra 0 e cifra 9), va
controllato caso per caso.

Uso:
    python tools/verifiche/d2_e2_checksum.py            # autotest + demo
    python tools/verifiche/d2_e2_checksum.py --test     # solo autotest (esce 0)
"""

import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):       # pragma: no cover
    pass


# posizione 2 (terza cifra, 0-indicizzata) è quella sbiadita
BASE_NOTA = {0: 4, 1: 0, 3: 7, 4: 1}
POSIZIONE_MANCANTE = 2
CONTROLLO_NOTO = 5
CODICE = "2"        # la cifra mancante, quella che il giocatore inserisce


def controllo(base):
    return sum(base[i] for i in range(5)) % 9


def candidati():
    trovati = []
    for x in range(10):
        base = dict(BASE_NOTA)
        base[POSIZIONE_MANCANTE] = x
        if controllo(base) == CONTROLLO_NOTO:
            trovati.append(x)
    return trovati


def verifica(verboso=True):
    esito = {"ok": False}

    if verboso:
        print("=== D2-E2: Il Numero di Protocollo ===")
        print(f"cifre note: {BASE_NOTA}  (manca la posizione {POSIZIONE_MANCANTE})")
        print(f"cifra di controllo dichiarata: {CONTROLLO_NOTO}")
        for x in range(10):
            base = dict(BASE_NOTA)
            base[POSIZIONE_MANCANTE] = x
            print(f"  x={x}: somma={sum(base[i] for i in range(5))}  "
                  f"controllo={controllo(base)}")

    trovati = candidati()
    esito["candidati"] = trovati
    if len(trovati) != 1:
        if verboso:
            print(f"  -> {'NON UNICO' if trovati else 'NESSUN CANDIDATO'}: {trovati}")
        return esito

    if str(trovati[0]) != CODICE:
        if verboso:
            print(f"  -> INCOERENTE: dedotto {trovati[0]}, atteso {CODICE}")
        return esito

    esito["ok"] = True
    if verboso:
        print(f"  -> unico: la cifra mancante è {trovati[0]}.")
    return esito


def _selftest():
    r = verifica(verboso=False)
    assert r["ok"], r
    assert r["candidati"] == [2], r

    # dimostra il rischio reale: le cifre note sommano 12 (4+0+7+1), quindi
    # con controllo dichiarato 3 — (12+0)%9 == (12+9)%9 == 3 — sia x=0 sia
    # x=9 lo soddisferebbero (collisione mod 9). Con 5 (il caso vero) non
    # succede: è quello il controllo da fare, non un valore a caso.
    global CONTROLLO_NOTO
    originale = CONTROLLO_NOTO
    CONTROLLO_NOTO = 3
    trovati_a_rischio = candidati()
    assert trovati_a_rischio == [0, 9], trovati_a_rischio
    CONTROLLO_NOTO = originale

    print("autotest d2_e2_checksum.py: OK")


def _demo():
    verifica(verboso=True)


if __name__ == "__main__":
    _selftest()
    if "--test" not in sys.argv:
        print()
        _demo()
