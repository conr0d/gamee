#!/usr/bin/env python3
"""
Verifica per S3-E1 — "Il Valore delle Lettere" (cifrario / gematria).

Un cartiglio in biblioteca mostra l'alfabeto italiano di 21 lettere (niente
J, K, W, X, Y), ciascuna con il suo posto in ordine: A=1, B=2, ... Z=21. Un
esempio già tradotto dimostra il metodo — NILO = 12+9+10+13 = 44 — così il
giocatore non deve indovinare la regola, solo applicarla. Il codice richiesto
è il valore di PAPIRO con lo stesso metodo.

La verifica controlla anche che una lettura alternativa plausibile (alfabeto
INTERO da 26 lettere, A=1..Z=26, senza saltare J/K/W/X/Y) dia un valore
DIVERSO per PAPIRO: se coincidesse per caso, un giocatore che sbaglia regola
arriverebbe comunque al codice giusto, e l'enigma non insegnerebbe nulla.

Uso:
    python tools/verifiche/s3_e1_cifrario.py            # autotest + demo
    python tools/verifiche/s3_e1_cifrario.py --test     # solo autotest (esce 0)
"""

import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):       # pragma: no cover
    pass


ALFABETO_21 = "ABCDEFGHILMNOPQRSTUVZ"     # niente J, K, W, X, Y
ALFABETO_26 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

ESEMPIO_PAROLA = "NILO"
ESEMPIO_VALORE = 44

PAROLA = "PAPIRO"
CODICE = "67"


def valore(parola, alfabeto):
    posizione = {lettera: i + 1 for i, lettera in enumerate(alfabeto)}
    mancanti = [c for c in parola if c not in posizione]
    if mancanti:
        raise ValueError(f"lettere fuori dall'alfabeto usato: {mancanti}")
    return sum(posizione[c] for c in parola)


def verifica(verboso=True):
    esito = {"ok": False}

    v_esempio = valore(ESEMPIO_PAROLA, ALFABETO_21)
    esito["esempio_calcolato"] = v_esempio
    if verboso:
        print("=== S3-E1: Il Valore delle Lettere ===")
        print(f"alfabeto (21 lettere): {ALFABETO_21}")
        print(f"esempio già tradotto: {ESEMPIO_PAROLA} = {v_esempio} "
              f"(dichiarato: {ESEMPIO_VALORE})")

    if v_esempio != ESEMPIO_VALORE:
        if verboso:
            print("  -> l'esempio nel testo non corrisponde al calcolo reale")
        return esito

    v_target = valore(PAROLA, ALFABETO_21)
    esito["valore_target"] = v_target
    if verboso:
        print(f"{PAROLA} = {v_target}  (codice dichiarato: {CODICE})")

    if str(v_target) != CODICE:
        if verboso:
            print(f"  -> INCOERENTE: calcolato {v_target}, atteso {CODICE}")
        return esito

    v_alt = valore(PAROLA, ALFABETO_26)
    esito["valore_alfabeto_26"] = v_alt
    if verboso:
        print(f"lettura alternativa (alfabeto intero, 26 lettere): {PAROLA} = {v_alt}")

    if v_alt == v_target:
        if verboso:
            print("  -> AMBIGUO: la regola sbagliata darebbe comunque lo stesso codice")
        return esito

    esito["ok"] = True
    if verboso:
        print("  -> esempio coerente, codice corretto, nessuna collisione con la "
              "regola sbagliata.")
    return esito


def _selftest():
    r = verifica(verboso=False)
    assert r["ok"], r
    assert r["esempio_calcolato"] == 44, r
    assert r["valore_target"] == 67, r
    assert r["valore_alfabeto_26"] != 67, r

    # una parola con lettere fuori dall'alfabeto usato deve sollevare errore
    try:
        valore("JOLLY", ALFABETO_21)
        assert False, "doveva sollevare ValueError per lettere non incluse"
    except ValueError:
        pass

    print("autotest s3_e1_cifrario.py: OK")


def _demo():
    verifica(verboso=True)


if __name__ == "__main__":
    _selftest()
    if "--test" not in sys.argv:
        print()
        _demo()
