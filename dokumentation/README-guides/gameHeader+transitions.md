# How-to: få gameHeader att funka i ditt rum
1.	I din room-fil (t.ex. room2fire.ts) importerar du:

	•	transitSections + getCurrentPage från `import { showGameHeader } from "../../script/helper/gameHeader.ts"`
		
	•	showGameHeader + hideGameHeader från ./script/helper/gameHeader.ts (rätt relativ sökväg)
	

2.	När rummet startar (inne i roomXFunc()):

	•	kör showGameHeader();
	•	byt sida med transitSections
	
		OBS! denna fungerar inte perfekt ännu :) 
	(getCurrentPage(), roomSection, duration) 

3.	När du lämnar rummet (klar/fail/Leave room):

	•	kör hideGameHeader()
	•	byt tillbaka med transitSections(getCurrentPage(), welcomeSection, duration)

Det är hela grejen: header syns bara i rum, och getCurrentPage() gör att fade alltid går från rätt sida.