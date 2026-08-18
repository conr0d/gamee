#!/usr/bin/env python3
"""
Verifica per S2-E1 — "Il Reperto Falso" (classificazione / intruso).

Sostituisce l'enigma precedente (s2_e1_teche.py, rimosso: era la stessa
famiglia — ordine per 3 indizi — già usata in S1-E1, ripetitivo).

Una teca, cinque reperti, ciascuno con o senza due proprietà (oro,
iscrizione). Una placca dichiara la regola dell'autenticità:

    «Ogni reperto autentico è d'oro, oppure porta un'iscrizione (o entrambe
    le cose). Il falso non ha né l'una né l'altra.»

È una regola OR, non AND: la profondità dell'enigma sta nel non confondere
le due (regola di De Morgan in miniatura).

I reperti NON sono più descritti a parole nel gioco: si guardano, disegnati
in assets/img/reperti/r1..r5.svg. Per questo lo script verifica anche la
coerenza fra il materiale disegnato e la proprietà "oro" dichiarata: senza
questo controllo si potrebbe colorare d'argento un reperto dichiarato d'oro
e l'enigma diventerebbe irrisolvibile guardandolo, senza che nulla protesti.

La verifica dimostra che:

  1. con la regola OR corretta, esattamente UN reperto la viola (il falso);
  2. con una lettura sbagliata (AND al posto di OR), il risultato cambia
     completamente — la connessione logica non è un dettaglio superfluo;
  3. "oro" è vero esattamente per i reperti il cui materiale è l'oro;
  4. le opzioni mostrate sono cinque, una per reperto, e l'indice dichiarato
     in game_data.js punta davvero al falso.

Uso:
    python tools/verifiche/s2_e1_classificazione.py            # autotest + demo
    python tools/verifiche/s2_e1_classificazione.py --test     # solo autotest (esce 0)
"""

import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):       # pragma: no cover
    pass


# Materiale e proprietà di ciascun reperto, nell'ordine in cui compaiono
# nella teca (che è anche l'ordine delle opzioni in game_data.js).
# `oro` non è un dato indipendente dal materiale: il controllo 3 lo impone.
REPERTI = [
    {'nome': 'Reperto 1', 'oggetto': 'statuetta', 'materiale': 'oro',
     'oro': True,  'iscrizione': False},
    {'nome': 'Reperto 2', 'oggetto': 'amuleto',   'materiale': 'argento',
     'oro': False, 'iscrizione': True},
    {'nome': 'Reperto 3', 'oggetto': 'anello',    'materiale': 'oro',
     'oro': True,  'iscrizione': True},
    {'nome': 'Reperto 4', 'oggetto': 'specchio',  'materiale': 'bronzo',
     'oro': False, 'iscrizione': False},
    {'nome': 'Reperto 5', 'oggetto': 'pettine',   'materiale': 'avorio',
     'oro': False, 'iscrizione': True},
]

FALSO_ATTESO = 'Reperto 4'
INDICE_CORRETTO_ATTESO = 3          # game_data.js: parametri.indiceCorretto
N_OPZIONI_ATTESE = 5


def regola_or(r):
    """La regola vera, dichiarata sulla placca: oro OR iscrizione."""
    return r['oro'] or r['iscrizione']


def regola_and(r):
    """Lettura sbagliata (oro AND iscrizione), usata solo per dimostrare
    che la connessione logica conta davvero."""
    return r['oro'] and r['iscrizione']


def verifica(verboso=True):
    esito = {"ok": False}

    if verboso:
        print("=== S2-E1: Il Reperto Falso ===")
        for r in REPERTI:
            print(f"  {r['nome']}: {r['oggetto']:9s} {r['materiale']:8s} "
                  f"oro={r['oro']}  iscrizione={r['iscrizione']}")

    # --- 1. un solo reperto viola la regola OR ---
    violano_or = [r['nome'] for r in REPERTI if not regola_or(r)]
    esito["violano_or"] = violano_or
    if verboso:
        print(f"regola OR (oro oppure iscrizione) — chi la viola: {violano_or}")

    if len(violano_or) != 1:
        if verboso:
            print("  -> NON UNICO: più di un reperto (o nessuno) viola la regola")
        return esito

    if violano_or[0] != FALSO_ATTESO:
        if verboso:
            print(f"  -> INCOERENTE: dedotto {violano_or[0]}, atteso {FALSO_ATTESO}")
        return esito

    # --- 2. la connessione logica non è intercambiabile ---
    soddisfano_and = [r['nome'] for r in REPERTI if regola_and(r)]
    esito["soddisfano_and"] = soddisfano_and
    if verboso:
        print(f"lettura sbagliata AND (oro e iscrizione insieme) — chi la soddisfa: "
              f"{soddisfano_and}")

    if {r['nome'] for r in REPERTI} - set(soddisfano_and) == {FALSO_ATTESO}:
        # se anche la lettura sbagliata isolasse lo stesso identico reperto
        # come "diverso dagli altri quattro", la connessione logica non
        # starebbe facendo alcun lavoro reale nell'enigma.
        if verboso:
            print("  -> la connessione logica (OR vs AND) non cambia la risposta: "
                  "l'enigma non testa la distinzione che dichiara di testare")
        return esito

    # --- 3. il disegno dice la verità: oro <=> materiale d'oro ---
    incoerenti = [r['nome'] for r in REPERTI if r['oro'] != (r['materiale'] == 'oro')]
    esito["materiali_incoerenti"] = incoerenti
    if verboso:
        d_oro = [r['nome'] for r in REPERTI if r['materiale'] == 'oro']
        print(f"materiale d'oro: {d_oro} — coincide con la proprietà 'oro': "
              f"{not incoerenti}")
    if incoerenti:
        if verboso:
            print(f"  -> DISEGNO BUGIARDO: {incoerenti} dichiara 'oro' diverso dal "
                  "proprio materiale; guardando la teca l'enigma non tornerebbe")
        return esito

    # --- 4. le opzioni coprono tutti i reperti e l'indice punta al falso ---
    esito["n_opzioni"] = len(REPERTI)
    if len(REPERTI) != N_OPZIONI_ATTESE:
        if verboso:
            print(f"  -> le opzioni sono {len(REPERTI)}, attese {N_OPZIONI_ATTESE}")
        return esito

    indice_falso = next(i for i, r in enumerate(REPERTI) if r['nome'] == FALSO_ATTESO)
    esito["indice_falso"] = indice_falso
    if verboso:
        print(f"indice del falso fra le opzioni: {indice_falso} "
              f"(game_data.js dichiara {INDICE_CORRETTO_ATTESO})")
    if indice_falso != INDICE_CORRETTO_ATTESO:
        if verboso:
            print("  -> INCOERENTE: indiceCorretto in game_data.js non punta al falso")
        return esito

    esito["ok"] = True
    if verboso:
        print(f"  -> unico ({FALSO_ATTESO}), regola OR non intercambiabile con AND, "
              "materiali coerenti col disegno, indice allineato.")
    return esito


def _selftest():
    r = verifica(verboso=False)
    assert r["ok"], r
    assert r["violano_or"] == ['Reperto 4'], r
    assert r["soddisfano_and"] == ['Reperto 3'], r
    assert r["materiali_incoerenti"] == [], r
    assert r["n_opzioni"] == 5, r
    assert r["indice_falso"] == INDICE_CORRETTO_ATTESO, r

    # il controllo 3 non è decorativo: se un reperto dichiarasse 'oro' senza
    # esserlo, la verifica DEVE fallire. Senza questa prova negativa il
    # controllo potrebbe passare sempre e non accorgersene nessuno.
    originale = REPERTI[1]['oro']
    REPERTI[1]['oro'] = True          # amuleto d'argento spacciato per oro
    rotto = verifica(verboso=False)
    assert not rotto["ok"], rotto
    assert rotto["materiali_incoerenti"] == ['Reperto 2'], rotto
    REPERTI[1]['oro'] = originale

    print("autotest s2_e1_classificazione.py: OK")


def _demo():
    verifica(verboso=True)


if __name__ == "__main__":
    _selftest()
    if "--test" not in sys.argv:
        print()
        _demo()
