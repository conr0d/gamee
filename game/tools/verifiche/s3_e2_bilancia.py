#!/usr/bin/env python3
"""
Verifica per S3-E2 — "Il Manoscritto Falso" (sostituisce l'Indovinello della
Sfinge, segnalato nel codice come "troppo noto").

Sette manoscritti (A..G): uno è un falso più pesante degli altri sei
(tutti gli originali pesano uguale). Il testo NON chiede al giocatore di
progettare una strategia di pesata (quello sì sarebbe il notissimo enigma
delle monete) — gliene racconta già DUE, con l'esito, e chiede di dedurre
quale manoscritto è il falso. È quindi un enigma di deduzione da prove date,
non di ricerca di algoritmo.

    Pesata 1: {A,B,C} contro {D,E,F}  (G resta fuori)  -> il piatto destro scende
    Pesata 2: {A,D} contro {B,E}                       -> il piatto destro scende

La verifica enumera, per ciascuno dei 7 manoscritti candidato falso, quale
sarebbe l'esito delle due pesate se fosse lui il più pesante: dimostra che le
7 coppie di esiti sono tutte diverse (nessuna collisione) e che la coppia
osservata (destra, destra) indica un solo manoscritto: E.

Uso:
    python tools/verifiche/s3_e2_bilancia.py            # autotest + demo
    python tools/verifiche/s3_e2_bilancia.py --test     # solo autotest (esce 0)
"""

import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):       # pragma: no cover
    pass


MANOSCRITTI = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

PESATA_1 = (['A', 'B', 'C'], ['D', 'E', 'F'])
PESATA_2 = (['A', 'D'], ['B', 'E'])

ESITO_OSSERVATO = ('dx', 'dx')     # entrambe le volte il piatto destro scende
FALSO_ATTESO = 'E'


def esito_pesata(gruppoA, gruppoB, falso):
    """Il falso pesa più degli altri: il piatto che lo contiene scende."""
    pesoA = gruppoA.count(falso)
    pesoB = gruppoB.count(falso)
    if pesoA > pesoB:
        return 'sx'
    if pesoB > pesoA:
        return 'dx'
    return 'eq'


def tabella_esiti():
    tab = {}
    for candidato in MANOSCRITTI:
        e1 = esito_pesata(PESATA_1[0], PESATA_1[1], candidato)
        e2 = esito_pesata(PESATA_2[0], PESATA_2[1], candidato)
        tab[candidato] = (e1, e2)
    return tab


def verifica(verboso=True):
    esito = {"ok": False}
    tab = tabella_esiti()
    esito["tabella"] = tab

    if verboso:
        print("=== S3-E2: Il Manoscritto Falso ===")
        print(f"pesata 1: {PESATA_1[0]} contro {PESATA_1[1]} (G fuori)")
        print(f"pesata 2: {PESATA_2[0]} contro {PESATA_2[1]}")
        for c, e in tab.items():
            print(f"  se il falso fosse {c}: pesata1={e[0]}  pesata2={e[1]}")

    valori = list(tab.values())
    collisioni = len(valori) != len(set(valori))
    esito["collisioni"] = collisioni
    if collisioni:
        if verboso:
            print("  -> COLLISIONE: due candidati diversi produrrebbero gli stessi esiti")
        return esito

    candidati_coerenti = [c for c, e in tab.items() if e == ESITO_OSSERVATO]
    esito["candidati_coerenti"] = candidati_coerenti
    if verboso:
        print(f"esito osservato: {ESITO_OSSERVATO}  "
              f"-> candidati coerenti: {candidati_coerenti}")

    if len(candidati_coerenti) != 1:
        if verboso:
            print("  -> NON UNICO")
        return esito

    if candidati_coerenti[0] != FALSO_ATTESO:
        if verboso:
            print(f"  -> INCOERENTE: dedotto {candidati_coerenti[0]}, atteso {FALSO_ATTESO}")
        return esito

    # entrambe le pesate sono necessarie: con una sola, più candidati
    # resterebbero coerenti con l'esito parziale osservato.
    solo_p1 = [c for c, e in tab.items() if e[0] == ESITO_OSSERVATO[0]]
    solo_p2 = [c for c, e in tab.items() if e[1] == ESITO_OSSERVATO[1]]
    esito["ambigue_con_una_sola_pesata"] = {
        "solo_pesata_1": solo_p1, "solo_pesata_2": solo_p2
    }
    if verboso:
        print(f"  con la sola pesata 1: {solo_p1}  (ambiguo se >1)")
        print(f"  con la sola pesata 2: {solo_p2}  (ambiguo se >1)")

    if len(solo_p1) <= 1 or len(solo_p2) <= 1:
        if verboso:
            print("  -> una delle due pesate basterebbe da sola: l'altra è superflua")
        return esito

    esito["ok"] = True
    if verboso:
        print(f"  -> unico ({FALSO_ATTESO}), nessuna collisione, entrambe le pesate necessarie.")
    return esito


def _selftest():
    r = verifica(verboso=False)
    assert r["ok"], r
    assert r["candidati_coerenti"] == ['E'], r
    assert not r["collisioni"]
    assert len(r["ambigue_con_una_sola_pesata"]["solo_pesata_1"]) > 1
    assert len(r["ambigue_con_una_sola_pesata"]["solo_pesata_2"]) > 1

    print("autotest s3_e2_bilancia.py: OK")


def _demo():
    verifica(verboso=True)


if __name__ == "__main__":
    _selftest()
    if "--test" not in sys.argv:
        print()
        _demo()
