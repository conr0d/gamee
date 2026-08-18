#!/usr/bin/env python3
"""
Verifica per S1-E2 — "Il Baule del Magazziniere" (meta-enigma).

Non ha indizi interni da enumerare: il codice è quello trovato risolvendo
S1-E3 (il grano che raddoppia). Il testo non nomina "E3" — allude solo al
tema comune (raddoppio del grano) perché il giocatore intuisca da sé dove
guardare. In gioco è un lucchetto a rotelle vero (puzzles/puzzle_lucchetto_
rotelle.js): la UI è cambiata, ma la logica verificata qui è la stessa —
un codice a 4 cifre, coerenza dei parametri e allineamento con S1-E3 non
dipendono da come il giocatore lo digita. Qui si verifica che:

  1. i parametri siano coerenti (via `coerenza` di tastierino.py: stesso
     controllo generico — codice/simboli/lunghezza/testi — che vale per
     qualunque puzzle a codice, tastiera o rotelle che sia);
  2. il codice del baule sia IDENTICO a quello dedotto in s1_e3_raddoppio.py
     (un meta-enigma disallineato dal suo enigma sorgente è un enigma rotto,
     anche se internamente "coerente");
  3. il testo del baule non contenga riferimenti espliciti ("E3", "altro
     enigma", "cassa numero...") che rivelerebbero il collegamento invece di
     lasciarlo intuire.

Uso:
    python tools/verifiche/s1_e2_lucchetto.py            # autotest + demo
    python tools/verifiche/s1_e2_lucchetto.py --test     # solo autotest (esce 0)
"""

import sys
import re

sys.path.insert(0, __file__.rsplit("\\", 1)[0] if "\\" in __file__ else __file__.rsplit("/", 1)[0])
from tastierino import coerenza, spazio_di_ricerca  # noqa: E402
import s1_e3_raddoppio as e3  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):       # pragma: no cover
    pass


PARAMETRI = {
    "domanda": (
        "Un baule tarlato, chiuso da quattro rotelle di ottone annerito. "
        "Sul coperchio, un'iscrizione quasi cancellata: "
        "<em>«Chi sa raddoppiare il grano, apre senza chiave.»</em>"
    ),
    "codice": "1072",
    "simboli": ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
    "lunghezza": 4,
    "testoCorretto": "Le rotelle scattano in fila. Il coperchio si solleva con un cigolio.",
    "testoErrato": "Le rotelle girano a vuoto. L'iscrizione resta un enigma.",
}

# Frasi che, se comparissero nel testo, rivelerebbero il collegamento invece
# di lasciarlo intuire (viola la richiesta: nessun riferimento esplicito a E3).
FRASI_VIETATE = [
    "e3", "enigma e", "altro enigma", "l'altro enigma", "vai a risolvere",
    "cassa numero", "come nell'enigma", "risolvi prima",
]


def verifica(verboso=True):
    esito = {"ok": False}

    problemi = coerenza(PARAMETRI)
    esito["problemi_parametri"] = problemi
    if verboso:
        print("=== S1-E2: Il Baule del Magazziniere (meta) ===")
        print(f"spazio di ricerca: {spazio_di_ricerca(PARAMETRI):,} combinazioni"
              .replace(",", "."))
    if problemi:
        if verboso:
            for p in problemi:
                print("  PARAMETRI:", p)
        return esito

    atteso = str(e3.verifica(verboso=False).get("numero_dedotto"))
    esito["codice_atteso_da_e3"] = atteso
    if PARAMETRI["codice"] != atteso:
        if verboso:
            print(f"  -> DISALLINEATO: baule='{PARAMETRI['codice']}' ma "
                  f"S1-E3 produce '{atteso}'")
        return esito

    testo = PARAMETRI["domanda"].lower()
    trovate = [f for f in FRASI_VIETATE if f in testo]
    esito["riferimenti_espliciti_trovati"] = trovate
    if trovate:
        if verboso:
            print("  -> il testo rivela il collegamento esplicitamente:", trovate)
        return esito

    # deve comunque contenere l'allusione tematica (raddoppio/grano), altrimenti
    # il collegamento non è nemmeno intuibile
    if not re.search(r"raddoppi|doppio", testo):
        if verboso:
            print("  -> manca l'allusione tematica al raddoppio: il collegamento "
                  "non è intuibile da nessun indizio")
        return esito

    esito["ok"] = True
    if verboso:
        print(f"  -> codice allineato a S1-E3 ({atteso}), nessun riferimento "
              "esplicito, allusione tematica presente.")
    return esito


def _selftest():
    global PARAMETRI
    r = verifica(verboso=False)
    assert r["ok"], r
    assert r["codice_atteso_da_e3"] == "1072", r
    assert r["riferimenti_espliciti_trovati"] == [], r

    # un codice disallineato deve essere rifiutato
    rotto = dict(PARAMETRI, codice="1073")
    problemi = coerenza(rotto)
    assert not problemi
    assert rotto["codice"] != str(e3.verifica(verboso=False)["numero_dedotto"])

    # un testo che nomina esplicitamente il collegamento deve essere rifiutato
    originale = PARAMETRI
    PARAMETRI = dict(originale, domanda=originale["domanda"] + " (vedi enigma E3)")
    r2 = verifica(verboso=False)
    assert not r2["ok"] and "e3" in r2["riferimenti_espliciti_trovati"], r2
    PARAMETRI = originale

    print("autotest s1_e2_lucchetto.py: OK")


def _demo():
    verifica(verboso=True)


if __name__ == "__main__":
    _selftest()
    if "--test" not in sys.argv:
        print()
        _demo()
