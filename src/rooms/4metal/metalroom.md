# Metallrummet

Detta är ett sekvenspussel med blinkande färg som liknar leken Simons Says.

Användaren ska:
- Få tid att läsa beskrivningen, men under tidspress 10 sek
- En färgsignal kommer blinka en sekvens av färger inspirerat av metall.
- Användaren ska fylla i slotsen under med färger i den sekvens det spelades.
- Det är 3 nivåer med olika mönster som ska motsvara en svårighetsgrad.
- Det finns en progressbar som visar vilken sekvens/level man är på och hur många misstag man begått.
- Det är tangentbordsstyrning (vänster/höger för att byta slot, upp/ner för att byta färg, Enter för att validera).

## Psuedokod

När metallrummet startar:
- Timer börjar räkna ned
- Färgsignalen spelar upp sekvens 1 av 3

När den spelar upp sekvenserna (oavsett level):
- Ska användarens kontroller blockeras så man inte kan fylla i slotsen innan sekvensen är slut.
- Signal elementet visar en färg, paus och visar nästa

När sekvensen är klar:
- Användarens kontroller blir upplåsta
- Vänsterpil, flytta aktiv slot åt vänster
- Högerpil, flytta aktiv slot åt höger
- Uppil, byt färg i aktiv slot till nästa färg
- Nedpil, byt färg i aktiv slot till föregående färg
- Enter, validera spelaren val

När användaren klickat enter:
- Användarens valda färger valideras mot sekvensen för den aktuella leveln
Om det är fel:
- Ökar misstag med 1
- Den ger feedback via text som säger "Incorrect! Try again."
- Återställer slotsen och spelar upp samma sekvens igen
Om det är rätt:
- Visar den feedback "Correct" och går vidare till nästa level

När alla sista leveln spelas och den är rätt:
- Visas ett medelande "Metal chamber complete"

Finns lite kvar att kompletera 