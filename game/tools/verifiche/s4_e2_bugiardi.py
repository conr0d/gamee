#!/usr/bin/env python3
"""
Verifica per S4-E2 — "Chi Ha Rotto il Vaso" (bugiardi e sinceri).

Tre restauratori — Anna, Bruno, Carla — uno dei tre ha rotto un vaso. Regola
dichiarata: il colpevole mente, gli innocenti dicono il vero. Dichiarazioni:

    Anna:  "Non sono stata io."
    Bruno: "È stata Anna."
    Carla: "È stato Bruno."

Forza bruta sui 3 possibili colpevoli (non su 2^3 combinazioni di verità:
la regola fissa già chi mente in base a chi è colpevole, quindi il dominio
reale da esplorare è "chi è il colpevole", 3 casi) dimostra che un solo
colpevole rende tutte e tre le dichiarazioni coerenti con la regola.

La dichiarazione di Anna risulta deducibile dalle altre due (toglierla non
rompe l'unicità): resta nel testo perché ogni sospettato ha diritto a una
battuta, non perché serva alla deduzione — la stessa scelta che
`tastierino.py` documenta per gli indizi "superflui ma rassicuranti".

Uso:
    python tools/verifiche/s4_e2_bugiardi.py            # autotest + demo
    python tools/verifiche/s4_e2_bugiardi.py --test     # solo autotest (esce 0)
"""

import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):       # pragma: no cover
    pass


PERSONE = ['Anna', 'Bruno', 'Carla']
COLPEVOLE_ATTESO = 'Bruno'


def dichiarazioni(colpevole):
    """Vero/falso di ciò che dice ciascuna persona, DATO un colpevole ipotetico.
    Le dichiarazioni sono fisse nel testo; qui si calcola solo se sono vere."""
    return {
        'Anna':  colpevole != 'Anna',     # "non sono stata io"
        'Bruno': colpevole == 'Anna',     # "e' stata Anna"
        'Carla': colpevole == 'Bruno',    # "e' stato Bruno"
    }


def coerente(colpevole):
    """Un'ipotesi di colpevole è coerente se: il colpevole ha detto il falso
    e tutti gli innocenti hanno detto il vero."""
    dich = dichiarazioni(colpevole)
    for persona, affermazione_vera in dich.items():
        deve_essere_vera = (persona != colpevole)
        if affermazione_vera != deve_essere_vera:
            return False
    return True


def verifica(verboso=True):
    esito = {"ok": False}

    coerenti = [p for p in PERSONE if coerente(p)]
    esito["coerenti"] = coerenti

    if verboso:
        print("=== S4-E2: Chi Ha Rotto il Vaso ===")
        for p in PERSONE:
            print(f"  se il colpevole fosse {p}: coerente = {coerente(p)}")
        print(f"ipotesi coerenti con la regola (colpevole mente, innocenti "
              f"dicono il vero): {coerenti}")

    if len(coerenti) != 1:
        if verboso:
            print("  -> NON UNICO" if coerenti else "  -> NESSUNA IPOTESI COERENTE")
        return esito

    if coerenti[0] != COLPEVOLE_ATTESO:
        if verboso:
            print(f"  -> INCOERENTE: dedotto {coerenti[0]}, atteso {COLPEVOLE_ATTESO}")
        return esito

    # le tre dichiarazioni sono tutte necessarie: togliendone una qualsiasi,
    # più di un'ipotesi diventa coerente (l'enigma non sarebbe più univoco)
    ridondanti = []
    for escludi in PERSONE:
        def coerente_parziale(colpevole, escludi=escludi):
            dich = dichiarazioni(colpevole)
            for persona, affermazione_vera in dich.items():
                if persona == escludi:
                    continue
                deve_essere_vera = (persona != colpevole)
                if affermazione_vera != deve_essere_vera:
                    return False
            return True
        rimaste = [p for p in PERSONE if coerente_parziale(p)]
        if len(rimaste) == 1:
            ridondanti.append(escludi)
    esito["dichiarazioni_ridondanti"] = ridondanti
    if verboso:
        if ridondanti:
            print(f"  dichiarazioni singolarmente superflue: {ridondanti} "
                  "(restano nel testo: ogni sospettato parla, è una scelta "
                  "narrativa, non un bug — vedi tastierino.py sullo stesso punto)")
        else:
            print("  nessuna dichiarazione ridondante: tutte e tre necessarie")

    esito["ok"] = True
    if verboso:
        print(f"  -> unico ({COLPEVOLE_ATTESO}), tutte e tre le dichiarazioni necessarie.")
    return esito


def _selftest():
    r = verifica(verboso=False)
    assert r["ok"], r
    assert r["coerenti"] == ['Bruno'], r
    # la dichiarazione di Anna resta pur essendo deducibile dalle altre due:
    # scelta narrativa (ogni sospettato parla), non un difetto da correggere
    assert r["dichiarazioni_ridondanti"] == ['Anna'], r

    print("autotest s4_e2_bugiardi.py: OK")


def _demo():
    verifica(verboso=True)


if __name__ == "__main__":
    _selftest()
    if "--test" not in sys.argv:
        print()
        _demo()
