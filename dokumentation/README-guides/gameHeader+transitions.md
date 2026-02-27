# How-to: få gameHeader & transitions att funka i ditt rum

## 1 Importera rätt saker i din room-fil (t.ex. room2fire.ts)

	`import { showGameHeader, hideGameHeader } from "../../script/helper/gameHeader.ts";`

	`import { transitSections, getCurrentPage, showSection } from "../../script/helper/transitions.ts";`


## 2 När rummet startar (inne i roomXFunc())
•	Starta headern:

	•	showGameHeader();

•	Hämta vilken sida du står på innan du visar rummet:

	•	const fromPage = getCurrentPage() ...

•	Byt sida med fade:

	•	transitSections(fromPage, roomSection, duration);

____	

	OBS!  Kalla inte showSection(roomSection) innan du räknat ut fromPage, annars blir fromPage rummet och då blir faden knas / uteblir. 

⸻

## 3  När du lämnar rummet (klar/fail/Exit → “Leave room”
•	Stäng headern:
•	hideGameHeader();
•	Byt tillbaka till welcomePage via fade:
•	transitSections(getCurrentPage(), welcomeSection, duration);

	Poängen: headern syns bara i rum, och getCurrentPage() gör att fade alltid går från rätt sida.

⸻

4) HTML(superviktigt)

Alla “pages” som ska kunna fade:a måste ha klassen "page"

	Exempel: <section id="room2Fire" class="room2Fire page hidden">

Annars kan ni få “svart sida” eller “klick funkar inte” pga pointer-events/opacity-reglerna i .page.