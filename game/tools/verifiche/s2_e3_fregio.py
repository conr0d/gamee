#!/usr/bin/env python3
"""
Verifica per S2-E3 — "Il Fregio Dipinto" (osservazione / conteggio).

Un fregio corre lungo la Sala Centrale: un motivo di 5 simboli — Occhio,
Piuma, Scarabeo, Piuma, Occhio — si ripete per tutta la fascia, che è lunga
47 simboli in totale (l'ultimo giro è troncato, non un motivo completo).
Il giocatore deve contare quante Piume compaiono in tutto il fregio.

47 simboli = 9 motivi interi (45 simboli) + 2 simboli avanzati (l'inizio di
un decimo motivo: Occhio, Piuma). Piume: 9*2 (nei motivi interi) + 1 (nel
resto) = 19.

Uso:
    python tools/verifiche/s2_e3_fregio.py            # autotest + demo
    python tools/verifiche/s2_e3_fregio.py --test     # solo autotest (esce 0)
"""

import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):       # pragma: no cover
    pass


MOTIVO = ['Occhio', 'Piuma', 'Scarabeo', 'Piuma', 'Occhio']
LUNGHEZZA_FREGIO = 47
SIMBOLO_BERSAGLIO = 'Piuma'

# Le 4 opzioni proposte al giocatore (sceltaMultipla). Ognuna delle tre
# sbagliate corrisponde a un errore di conteggio plausibile e diverso.
OPZIONI = [19, 18, 20, 17]   # indice 0 = corretta


def costruisci_fregio(motivo, lunghezza):
    """Il motivo si ripete e si tronca a `lunghezza` simboli totali."""
    fregio = []
    while len(fregio) < lunghezza:
        fregio.extend(motivo)
    return fregio[:lunghezza]


def conta(fregio, simbolo):
    return sum(1 for s in fregio if s == simbolo)


def verifica(verboso=True):
    esito = {"ok": False}
    fregio = costruisci_fregio(MOTIVO, LUNGHEZZA_FREGIO)
    conteggio = conta(fregio, SIMBOLO_BERSAGLIO)
    esito["conteggio"] = conteggio

    if verboso:
        print("=== S2-E3: Il Fregio Dipinto ===")
        print(f"motivo: {MOTIVO}  (si ripete su {LUNGHEZZA_FREGIO} simboli totali)")
        motivi_interi = LUNGHEZZA_FREGIO // len(MOTIVO)
        resto = LUNGHEZZA_FREGIO % len(MOTIVO)
        print(f"  = {motivi_interi} motivi interi + {resto} simboli avanzati")
        print(f"'{SIMBOLO_BERSAGLIO}' contate nel fregio completo: {conteggio}")

    if conteggio != OPZIONI[0]:
        if verboso:
            print(f"  -> INCOERENTE: conteggio reale {conteggio}, opzione corretta dichiarata {OPZIONI[0]}")
        return esito

    duplicati = len(OPZIONI) != len(set(OPZIONI))
    if duplicati:
        if verboso:
            print("  -> opzioni duplicate: ambiguo")
        return esito

    sbagliate_che_coincidono = [o for o in OPZIONI[1:] if o == conteggio]
    if sbagliate_che_coincidono:
        if verboso:
            print("  -> un'opzione sbagliata coincide col conteggio reale:", sbagliate_che_coincidono)
        return esito

    esito["ok"] = True
    if verboso:
        print(f"  -> unico: {conteggio} è l'unica opzione che coincide col conteggio reale.")
    return esito


def _selftest():
    r = verifica(verboso=False)
    assert r["ok"], r
    assert r["conteggio"] == 19, r

    # motivo diverso o lunghezza diversa devono dare conteggi diversi
    # (l'autotest non è vacuo: verifica che il calcolo sia sensibile ai dati)
    fregio_corto = costruisci_fregio(MOTIVO, 10)   # 2 motivi interi esatti
    assert conta(fregio_corto, 'Piuma') == 4

    fregio_altro_motivo = costruisci_fregio(['Occhio', 'Scarabeo'], 47)
    assert conta(fregio_altro_motivo, 'Piuma') == 0

    print("autotest s2_e3_fregio.py: OK")


def _demo():
    verifica(verboso=True)


if __name__ == "__main__":
    _selftest()
    if "--test" not in sys.argv:
        print()
        _demo()
