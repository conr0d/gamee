#!/usr/bin/env python3
"""
Verifica per gli enigmi del tipo TASTIERINO / CODICE.

Prende lo stesso oggetto `parametri` che finisce in game_data.js e risponde
a tre domande, in quest'ordine:

  1. i parametri sono coerenti?  (il codice è lungo `lunghezza`, ogni suo
     simbolo sta fra i tasti disponibili, niente refusi)
  2. gli indizi dell'enigma individuano UNA SOLA combinazione, ed è proprio
     quella dichiarata in `codice`?
  3. quanto è grande lo spazio di ricerca?  Un codice di 4 cifre sono 10.000
     combinazioni: serve a decidere se l'enigma è forza-bruta-bile a mano.

Uso:
    python tools/verifiche/tastierino.py            # autotest + demo
    python tools/verifiche/tastierino.py --test     # solo autotest (esce 0)

I motori di verifica (`solutions`, `unique_answer`, `minimize_indices`, ...)
sono ricopiati TALI E QUALI da puzzle-forge/scripts/verify.py: quel file non
va modificato, e duplicarlo qui evita di dipendere da un percorso esterno.
"""

import sys
from itertools import product
import random

# La console di Windows parte in cp1252 e trasforma le accentate in "?".
# Senza questa riga l'output di uno script italiano è illeggibile lì.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):       # pragma: no cover
    pass


# ============================================================== motori
# (copia fedele da puzzle-forge/scripts/verify.py — non modificare)

def _materialize(domain):
    """Il dominio viene riletto molte volte: un generatore si esaurirebbe
    al primo passaggio e ogni verifica successiva direbbe 'zero soluzioni'
    senza segnalare nulla."""
    if isinstance(domain, (list, tuple)):
        return domain
    return list(domain)


def solutions(domain, constraints, cap=None):
    out = []
    for a in _materialize(domain):
        if all(c(a) for c in constraints):
            out.append(a)
            if cap is not None and len(out) >= cap:
                break
    return out


def count_solutions(domain, constraints, cap=None):
    return len(solutions(domain, constraints, cap=cap))


def is_unique(domain, constraints):
    return count_solutions(domain, constraints, cap=2) == 1


def answers(domain, constraints, ask):
    return {ask(s) for s in solutions(domain, constraints)}


def unique_answer(domain, constraints, ask):
    """Il gate vero: la domanda posta ammette una sola risposta?"""
    a = answers(domain, constraints, ask)
    return len(a) == 1, a


def minimize_indices(domain, constraints, keep=(), ask=None, rounds=1,
                     seed=None):
    """Indici dei vincoli da tenere perché la risposta resti unica."""
    domain = _materialize(domain)
    constraints = list(constraints)
    n = len(constraints)
    keep = {i % n for i in keep} if n else set()

    def still_ok(idxs):
        if not idxs:
            return False
        cs = [constraints[i] for i in idxs]
        if ask is None:
            return is_unique(domain, cs)
        return unique_answer(domain, cs, ask)[0]

    allidx = list(range(n))
    if not still_ok(allidx):
        raise ValueError(
            "minimize() richiede che i vincoli di partenza siano già "
            "sufficienti: qui la risposta non è unica. Aggiungi indizi prima."
        )

    rng = random.Random(seed)
    best = allidx
    for r in range(max(1, rounds)):
        order = list(allidx)
        if r:
            rng.shuffle(order)
        current = set(allidx)
        for i in order:
            if i in keep:
                continue
            trial = current - {i}
            if still_ok(sorted(trial)):
                current = trial
        if len(current) < len(best):
            best = sorted(current)
    return list(best)


def minimize(domain, constraints, keep=(), ask=None, rounds=1, seed=None):
    idx = minimize_indices(domain, constraints, keep=keep, ask=ask,
                           rounds=rounds, seed=seed)
    return [constraints[i] for i in idx]


# ================================================= adattamento al tastierino

CIFRE = [str(d) for d in range(10)]

# Oltre questa soglia l'enumerazione esaustiva diventa lenta: meglio saperlo
# prima di aspettare, e comunque un enigma così grande non si verifica a mano.
LIMITE_ENUMERAZIONE = 2_000_000


def sequenza(valore):
    """Normalizza `codice` come fa il modulo JS: array così com'è, stringa
    spezzata sui separatori se ce ne sono, altrimenti carattere per carattere."""
    if isinstance(valore, (list, tuple)):
        return [str(v) for v in valore]
    s = "" if valore is None else str(valore)
    if not s:
        return []
    for sep in (" ", ",", "|", "-"):
        if sep in s:
            return [p for p in s.replace(",", " ").replace("|", " ")
                    .replace("-", " ").split() if p]
    return list(s)


def simboli_di(parametri):
    s = parametri.get("simboli")
    return [str(x) for x in s] if s else list(CIFRE)


def lunghezza_di(parametri):
    return int(parametri.get("lunghezza") or len(sequenza(parametri.get("codice"))))


def spazio_di_ricerca(parametri):
    """Quante combinazioni può comporre il giocatore: |simboli| ** lunghezza."""
    return len(simboli_di(parametri)) ** lunghezza_di(parametri)


def giudizio_forza_bruta(n, tentativi_max=0):
    """Traduce la dimensione dello spazio in una frase utile al progettista."""
    if tentativi_max:
        return (f"con al massimo {tentativi_max} tentativi la probabilità di "
                f"indovinare a caso è {tentativi_max}/{n} "
                f"= {100.0 * tentativi_max / n:.4f}%")
    if n <= 100:
        return "spazio minuscolo: a tentativi si apre in pochi minuti, l'indizio è decorativo"
    if n <= 1000:
        return "spazio piccolo: un giocatore ostinato può forzarlo, valuta un limite di tentativi"
    if n <= 100_000:
        return "spazio adeguato: forzarlo a mano non è pratico, l'indizio serve davvero"
    return "spazio molto ampio: la forza bruta è esclusa"


def coerenza(parametri):
    """Controlli sui parametri, prima ancora di parlare di unicità.
    Restituisce una lista di problemi (vuota = tutto a posto)."""
    problemi = []
    simboli = simboli_di(parametri)
    codice = sequenza(parametri.get("codice"))
    lung = lunghezza_di(parametri)

    if not codice:
        problemi.append("`codice` mancante o vuoto")
    if not simboli:
        problemi.append("`simboli` vuoto")
    if len(set(simboli)) != len(simboli):
        problemi.append("`simboli` contiene doppioni: due tasti identici")
    if codice and len(codice) != lung:
        problemi.append(
            f"`codice` ha {len(codice)} simboli ma `lunghezza` dice {lung}")
    fuori = [s for s in codice if s not in simboli]
    if fuori:
        problemi.append(
            f"il codice usa simboli che non hanno un tasto: {fuori}")
    for chiave in ("domanda", "testoCorretto", "testoErrato"):
        if not parametri.get(chiave):
            problemi.append(f"manca `{chiave}` (il modulo userebbe il fallback)")
    if parametri.get("tentativiMax") and not parametri.get("testoEsauriti"):
        problemi.append("`tentativiMax` senza `testoEsauriti`: il blocco resta muto")
    return problemi


def verifica(parametri, indizi=(), titolo="enigma", verboso=True):
    """Verifica completa di un enigma a tastierino.

    indizi: lista di (testo, predicato). Il predicato riceve la combinazione
            come tupla di simboli (es. ('4','3','9','2')) e torna True/False.
            Se la lista è vuota si verifica solo la coerenza dei parametri e
            si riporta lo spazio di ricerca: un codice trovato altrove (su un
            reperto, in un'altra stanza) non ha indizi da enumerare.

    Restituisce un dizionario con l'esito, così l'autotest può leggerlo.
    """
    esito = {"titolo": titolo, "ok": False}
    simboli = simboli_di(parametri)
    lung = lunghezza_di(parametri)
    codice = tuple(sequenza(parametri.get("codice")))
    n = spazio_di_ricerca(parametri)
    esito["spazio"] = n

    if verboso:
        print(f"=== {titolo} ===")
        print(f"tasti: {len(simboli)} ({' '.join(simboli)})   posizioni: {lung}")
        print(f"spazio di ricerca: {len(simboli)}^{lung} = {n:,} combinazioni"
              .replace(",", "."))
        print("  ->", giudizio_forza_bruta(n, parametri.get("tentativiMax") or 0))

    problemi = coerenza(parametri)
    esito["problemi"] = problemi
    if problemi:
        if verboso:
            for p in problemi:
                print("  PARAMETRI:", p)
        return esito

    if not indizi:
        if verboso:
            print("  nessun indizio dichiarato: il codice va trovato altrove "
                  "nel gioco, qui non c'è unicità da dimostrare.")
        esito["ok"] = True
        esito["unico"] = None
        return esito

    if n > LIMITE_ENUMERAZIONE:
        if verboso:
            print(f"  spazio oltre {LIMITE_ENUMERAZIONE:,} combinazioni: "
                  "enumerazione saltata".replace(",", "."))
        esito["ok"] = False
        esito["unico"] = None
        return esito

    dominio = list(product(simboli, repeat=lung))
    testi = [t for t, _ in indizi]
    preds = [p for _, p in indizi]

    # Il gate è unique_answer, non is_unique: qui la "risposta" È la
    # combinazione, quindi le due coincidono, ma restare su unique_answer
    # tiene il codice pronto per enigmi in cui non coincidono.
    ask = lambda s: "".join(s)
    ok, risposte = unique_answer(dominio, preds, ask)
    esito["unico"] = ok
    esito["risposte"] = sorted(risposte)

    if verboso:
        print(f"indizi dichiarati: {len(indizi)}")
        for t in testi:
            print("  -", t)
        print(f"combinazioni che li soddisfano tutti: {len(risposte)}")

    if not ok:
        if verboso:
            campione = sorted(risposte)[:8]
            print("  -> NON UNICO: un giocatore che ragiona bene può arrivare a",
                  campione, "..." if len(risposte) > 8 else "")
            print("     aggiungi un indizio o riformulane uno.")
        return esito

    trovato = next(iter(risposte))
    esito["codice_dedotto"] = trovato
    if trovato != "".join(codice):
        if verboso:
            print(f"  -> INCOERENTE: gli indizi portano a '{trovato}' ma "
                  f"`codice` dice '{''.join(codice)}'")
        return esito

    if verboso:
        print(f"  -> unico, e coincide con `codice`: {trovato}")

    # Indizi ridondanti: se se ne possono togliere, l'enigma è più elegante
    # (o quell'indizio è lì solo per rassicurare, ed è una scelta, non un bug).
    tenuti = minimize_indices(dominio, preds, ask=ask, rounds=6, seed=0)
    superflui = [testi[i] for i in range(len(preds)) if i not in tenuti]
    esito["superflui"] = superflui
    if verboso:
        if superflui:
            print(f"  indizi rimovibili INSIEME senza perdere l'unicità "
                  f"({len(superflui)} su {len(preds)}):")
            for t in superflui:
                print("    ~", t)
        else:
            print("  nessun indizio ridondante: l'enigma è già minimale")
        print()

    esito["ok"] = True
    return esito


# ============================================== caso d'esempio con indizi veri
# "Il sigillo di Ramesse": codice a 4 cifre ricavabile solo dagli indizi
# incisi attorno al quadrante. È lo stesso caso caricato nella sandbox.

ESEMPIO_SIGILLO = {
    "domanda": (
        "Sul quadrante di bronzo, quattro incavi. Attorno, incise nella pietra:"
        "<br><br><em>«La prima cifra è il doppio dell’ultima.<br>"
        "La somma delle quattro fa diciotto.<br>"
        "La terza è un quadrato perfetto, e non è l’unità.<br>"
        "La seconda è dispari, e minore della terza.»</em>"
    ),
    "codice": "4392",
    "simboli": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    "lunghezza": 4,
    "testoCorretto": "I quattro incavi si allineano. Il quadrante ruota.",
    "testoErrato": "Il bronzo resta immobile. Qualcosa non torna.",
}


def _c(s, i):
    """Cifra in posizione i (0 = la prima) come intero."""
    return int(s[i])


INDIZI_SIGILLO = [
    ("La prima cifra è il doppio dell'ultima.",
     lambda s: _c(s, 0) == 2 * _c(s, 3)),
    ("La somma delle quattro fa diciotto.",
     lambda s: sum(int(x) for x in s) == 18),
    ("La terza è un quadrato perfetto, e non è l'unità.",
     lambda s: _c(s, 2) in (4, 9)),
    ("La seconda è dispari, e minore della terza.",
     lambda s: _c(s, 1) % 2 == 1 and _c(s, 1) < _c(s, 2)),
    ("Nessuna cifra si ripete.",
     lambda s: len(set(s)) == 4),
]

# Variante con lucchetto a tentativi limitati: il codice non si deduce,
# si trova altrove. Serve a mostrare il ramo "nessun indizio".
ESEMPIO_LUCCHETTO = {
    "domanda": "Il lucchetto del sarcofago porta tre cifre soltanto.",
    "codice": "731",
    "lunghezza": 3,
    "tentativiMax": 3,
    "testoTentativi": "Prove rimaste: {n}",
    "testoCorretto": "Il perno cede con uno schiocco secco.",
    "testoErrato": "Il perno non si muove.",
    "testoEsauriti": "Il lucchetto si arrossa e si blocca per sempre.",
}


# ================================================================= autotest

def _selftest():
    """Invarianti che devono valere sempre. Se una salta, lo script mente."""

    # 1. i motori copiati funzionano come nell'originale
    dom = list(product("01", repeat=2))
    assert count_solutions(dom, [lambda s: s[0] == "1"]) == 2
    ok, ans = unique_answer(dom, [lambda s: s[0] == "1"], ask=lambda s: s[0])
    assert ok and ans == {"1"}, (ok, ans)
    ok, ans = unique_answer(dom, [lambda s: s[0] == "1"], ask=lambda s: s[1])
    assert not ok and ans == {"0", "1"}, (ok, ans)

    # 2. lettura dei parametri: stringa, array, separatori
    assert sequenza("4392") == ["4", "3", "9", "2"]
    assert sequenza(["𓅃", "𓈖"]) == ["𓅃", "𓈖"]
    assert sequenza("𓅃 𓈖 𓁹") == ["𓅃", "𓈖", "𓁹"]

    # 3. lo spazio di ricerca è quello atteso: 4 cifre = 10.000
    assert spazio_di_ricerca(ESEMPIO_SIGILLO) == 10000
    assert spazio_di_ricerca(ESEMPIO_LUCCHETTO) == 1000
    assert spazio_di_ricerca({"codice": ["a", "b"], "simboli": ["a", "b", "c"]}) == 9

    # 4. il caso d'esempio è unico e coincide con il codice dichiarato
    r = verifica(ESEMPIO_SIGILLO, INDIZI_SIGILLO, verboso=False)
    assert r["ok"], r
    assert r["unico"] is True
    assert r["codice_dedotto"] == "4392", r
    # "nessuna cifra si ripete" è implicato dagli altri: deve risultare superfluo
    assert any("ripete" in t for t in r["superflui"]), r["superflui"]

    # 5. togliere un indizio portante rompe l'unicità (il test non è vacuo)
    r2 = verifica(ESEMPIO_SIGILLO, INDIZI_SIGILLO[1:3], verboso=False)
    assert r2["unico"] is False and len(r2["risposte"]) > 1, r2

    # 6. un codice incoerente con gli indizi viene bocciato
    bugiardo = dict(ESEMPIO_SIGILLO, codice="1234")
    r3 = verifica(bugiardo, INDIZI_SIGILLO, verboso=False)
    assert not r3["ok"] and r3["codice_dedotto"] == "4392", r3

    # 7. i controlli di coerenza pescano i refusi tipici
    assert coerenza(ESEMPIO_SIGILLO) == []
    assert coerenza(dict(ESEMPIO_SIGILLO, codice="439")), "lunghezza sbagliata non vista"
    assert coerenza(dict(ESEMPIO_SIGILLO, codice="43X")), "simbolo senza tasto non visto"
    assert coerenza(dict(ESEMPIO_SIGILLO, simboli=["1", "1", "2"])), "doppioni non visti"

    # 8. senza indizi la verifica passa ma non dichiara unicità
    r4 = verifica(ESEMPIO_LUCCHETTO, verboso=False)
    assert r4["ok"] and r4["unico"] is None, r4

    print("autotest tastierino.py: OK")


# ===================================================================== demo

def _demo():
    verifica(ESEMPIO_SIGILLO, INDIZI_SIGILLO, titolo="Il sigillo di Ramesse")
    verifica(ESEMPIO_LUCCHETTO, titolo="Il lucchetto del sarcofago (senza indizi)")
    print()
    print("Come leggere il numero dello spazio di ricerca:")
    print("  10.000 combinazioni = a un tentativo ogni 3 secondi servono ~8 ore.")
    print("  Nessuno lo fa: l'indizio è l'unica strada, ed è quello che vogliamo.")
    print("  Sotto le ~1.000 combinazioni, invece, metti un `tentativiMax`")
    print("  oppure allunga il codice.")


if __name__ == "__main__":
    _selftest()
    if "--test" not in sys.argv:
        print()
        _demo()
