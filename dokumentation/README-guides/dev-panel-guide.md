## Pogo-Stick Cheat Corner 😶‍🌫️

Panelen är byggd för att hjälpa till med felsökning, testa och dema spelat. Jag ber om ursäkt för "looken".

Funktioner med dev-panel:

- Snabbt hoppa mellan rum
- Markera rum som klara
- Testa artefakt logiken
- Testa valideringsrummet (Rum 6)
- Testa transitions mellan rum
- Testa highscore logik utan att spela igenom hela spelet (Förhoppningsvis)
- Snabb på att reseta state (LocalStorage)
- Console loggar [DEV CHEATS]


## Steg för steg 

1. Vart som helst i spelet skriv <b>pogo</b> (caps ok) - men tänk på att skriva "hyffsat" snabbt annars funkar inte funktionen. (900ms per tangent.)
2. Du får sedan upp en alert "CHEATING TIME" - enter code phrase: <b>temple5</b>
3. Nu skall "POGO-STICK CHEAT CORNER" (dev-panel) dyka upp i högra hörnet.

## Översikt av panelen

- Room selector
- Knappar för att manipulera spelets state
- State ändringar samt Full Flow (Sistnämda simulerar flödet från rum till rum inkl transition)

## Knappar

1. Complete CURRENT (artifact TRUE) alt (artifact FALSE) <br>
Ger dig artifact=true eller artifact=false. Du måste vara i aktuellt rum för att denna funktion skall funka. (Console.log gärna, för att lättast se vad som händer)
Syns både i Local storage och i console.

2. Complete ALL (artifact TRUE) alt (artifact FALSE) <br>
Sätt true eller false state på alla artifact. Detta funkar vart som helst i spelet.

3. Reset CURRENT <br>
Återställer det aktuella rummet till standardläge. <br>

status = pending
artifact = null
mistakes = 0
score = 0
roomTimeSec = 0

4. Reset ALL <br>
Återställer hela spelets state till startläge.

5. Complete SELECTED (TRUE) alt (FALSE) <br>
Välj ett specifikt rum med hjälp av Room-dropdown. Complete true eller false. Detta går att göra överallt i spelet.

---

<b>HAVE A CHEATASTIC DAY!</b> ☠️
