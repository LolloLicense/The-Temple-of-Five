import * as dataJSON from "../../data.json";
import { playBgm, playSfx } from "../../audio/index.ts";
import { renderRoomDesc } from "../../script/helper/roomDesc.ts";
//import { startTimer, stopTimer } from "./script/utils.ts";
import { startTimer } from "../../script/helper/utils.ts";
import { showGameHeader } from "../../script/helper/gameHeader.ts";
import { transitSections, getCurrentPage, showSection } from "../../script/helper/transitions.ts";
import { resetSingleRoomResult } from "../../script/helper/storage.ts";

export function room4metalFunc() {
  resetSingleRoomResult("metal");
  //-------------------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------- Ljud ---------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  
  const bgmId = dataJSON.room4metal.bgmId; // Spela bakgrundsmusiken för metallrummet
  if (bgmId) {
    void playBgm(bgmId, 650); // Spela bakgrundsmusiken för metallrummet med fade in på 650ms
  }
  const sfxId = dataJSON.room4metal.sfxId; // Spela ljud vid växling av slotfärg
  //-------------------------------------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------- Struktur ------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  const metalSection: HTMLElement | null = document.querySelector("#room4Metal"); // Hämtar sektionen för metallrummet
  if (!metalSection) { // Om den inte finns, avbryt funktionen för att undvika fel
   return;
  }

  metalSection.style.backgroundImage = `url("${dataJSON.room4metal.backgroundImg}")`; // Sätter bakgrundsbilden för metallrummet från JSON-data

  const fromPage =
    getCurrentPage() ??
    document.querySelector("main > section.page.isVisible");
  if (fromPage && fromPage !== metalSection) {
    // Fade from current page -> metal room
    transitSections(fromPage, metalSection, 1200);
  } else { // Fallback (first load): just show the room
    showSection(metalSection);
  }

  startTimer(1); // Start timer for room 1
  showGameHeader(); // Visar globala headern i rummet

  renderRoomDesc(metalSection, dataJSON.room4metal.desc);  // Renderar rummets beskrivning från JSON -> <div id="roomdesc">
  //-------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------------- Sekvenser, färger, states -------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  const colorsMetal = ["iron", "copper", "gold", "silver", "steel"]; // Lista med namn på färgerna från sass klasserna.
  const levelsMetal = [ // Lista med sekvenser, varje inre array är en level. Ex colorsMetal[0] är "iron", colorsMetal[1] är "copper" osv.
    [0, 1, 2, 1, 3, 4], //Level 1 enkel sekvens
    [4, 2, 4, 1, 3, 1], //Level 2 lite svårare med upprepningar
    [4, 1, 3, 1, 4, 2] // Level 3 lite svårare sekvens
  ];

  let currentLevel = 0; // Variabel för att hålla reda på vilken level spelaren är på 0 = level 1, 1 = level 2, 2 = level 3
  //let mistakes = 0; // Ska räkna antalet misstag spelaren gör
  let playerSlots: (number | null)[] = Array(6).fill(null); // Array med spelarens val, antingen är en slot ett nummer som motsvarar en färg i colorsMetal eller null om spelaren inte valt något för den sloten än.
  let activeSlot = 0; // Vilken slot som är aktiv för närvarande, börjar på 0 (första sloten).
  let isPlayingSequence = true; // När användaren kommer in i rummet blockeras man från att börja spela (byta slots) innan sekvensen börjat.
  let mistakes = 0; // räkna hur många misstag användaren har gjort
  //-------------------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------- DOM element --------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------

  const signal = metalSection.querySelector("#colorSignal")!; // Hämtar elementet som visar spelets färgsignal. Använder ! som en null check (värdet ska inte vara null)
  const feedback = metalSection.querySelector("#feedback")!; // Hämtar elementet som visar feedback til spelare ex rätt/fel
  const levelText = metalSection.querySelector("#levelText1")!; // Hämtar elementet som visar vilken level spelaren är på ex 1/3
  const mistakesText = metalSection.querySelector("#mistakesText1")!; // Hämtar elementet som visar hur många misstag spelaren har gjort
  const slots = Array.from(metalSection.querySelectorAll(".colorSlots > div")); // Selektorn ".colorSlots > div" betyder "ta alla <div> som ligger direkt inuti containern .colorSlots". Det gör att vi får exakt de 6 slotsen (colorSlot1–6) i rätt ordning.

  //-------------------------------------------------------------------------------------------------------------------------------------
  //----------------------------------------------------- Rendering av slots ------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  /**
   * Behöver kunna nollställa slotarnas
   * Lägga till rätt färg (om användaren valt något)
   * Lägga på highlights om den är aktiv
   */
  function renderSlots() {
    slots.forEach((slots, index) => {
      slots.className = `colorSlot${index + 1}`; // Återställer slotens klasser till sin grundklass (colorSlot1, colorSlot2 etc)
      const colorIndex = playerSlots[index]; // Hämtar spelarens val för denna slot ex 2 = gold
      if (colorIndex !== null) {
        slots.classList.add(colorsMetal[colorIndex]); // Om spelaren valt en färg lägg till rätt klass från colorMetal
      }

      if (index === activeSlot) {
        slots.classList.add("is-active"); // Om detta är den aktiva sloten, lägg till klassen "is-active" för att highlighta den. Gör att spelaren ser vilken slot den väljer färg för.
      } 
    }); 
  }
  //-------------------------------------------------------------------------------------------------------------------------------------
  //------------------------------------------------------ Ändra färg på slots ----------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  // Ändra färg i den aktiva sloten
  function changeSlotColor(direction: number) {
    if (isPlayingSequence) return; // Blockera färgbyte om sekvens spelas upp
    
    let current = playerSlots[activeSlot]; // Hämta nyvarande färgindex i den aktiva sloten (kan vara null om ingen färg är vald)
    if (current === null) current = 0; // Om sloten är tom, börja med första färgen (index 0)

    if (direction === 1) {
      current = current + 1; // Gå till nästa färg i listan
    } else {
      current = current - 1; // Gå till föregående färg i listan
    }

    if (current >= colorsMetal.length) { // Om man går förbi sista färgen, hoppa tillbaka till första
      current = 0;
    }

    if (current < 0) { // Om man går före första färgen, hoppa till sista
      current = colorsMetal.length - 1; 
    }

    playerSlots[activeSlot] = current; // Sparar färgindexet i användarens val array
    renderSlots(); // Uppdatera så färg ändringen syns
    
  }
  //-------------------------------------------------------------------------------------------------------------------------------------
  //------------------------------------------------------ Tangentbords tryck -----------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  /**
   * Lyssnar på tangentbordet och låter spelaren:  
   * flytta mellan slots (vänster/höger)
   * byta färg i en slot (upp/ned)
   * Blockerar input när sekvensen spelas upp.
   */
  document.addEventListener("keydown", (event) => {
    if (isPlayingSequence) return; // Användaren ska inte kunna styra under sekvensens gång

    if (event.key === "ArrowRight") { // Om man användaren trycker högerpilen
      activeSlot = Math.min(activeSlot + 1, playerSlots.length - 1); // Flytta markeringen till nästa slot (men inte utanför sista)
      renderSlots(); // Uppdatera så highlight flyttar sig till den aktiva sloten
    }
    
    if (event.key === "ArrowLeft") { // Om man användaren trycker vänsterpilen
      activeSlot = Math.max(activeSlot - 1, 0); // Flytta markeringen till föregående slot (men inte utanför första)
      renderSlots(); // Uppdatera så highlight flyttar sig till den aktiva sloten
    }

    if (event.key === "ArrowUp") { // Om man användaren trycker uppåtpilen
      changeSlotColor(1); // Går till nästa färg i listan
      if (sfxId) playSfx(sfxId);
    }
    
    if (event.key === "ArrowDown") { // Om man användaren trycker nedåtpilen
      changeSlotColor(-1); // Går till föregående färg i listan
      if (sfxId) playSfx(sfxId);
    }

    if (event.key === "Enter") { // Om man trycker på enter
      if (!isPlayingSequence && allSlotsFilled()) { // Kontrollera att sekvensen inte spelas (dumt att validera mitt i sekvensen) och att alla slots är ifyllda (måste vara färdigt)
        validate(); // Kör validering av användarens val
      }
    }
  });
  //--------------------------------------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------- Countdown -------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------
  /**
   * Visar meddelande och räknar ned från 10 till 0
   * När den är klar startas playSequence
   */
  function startCountdown(next: () => void) {
    let count = 10; // Start värde för nedräkningen 10 sek (Får prova oss fram)
    feedback.textContent = `Booting sequence in ${count}...`; // Visar första nedräkningsmeddelandet innan timern startat
    const timer = setInterval(() => { // Timer som körs varje sekund
      count--; // Minskar nedräkningen med 1
      
      if (count > 0) { // Så länge nedräkning pågår uppdatera texten 
        feedback.textContent = `Booting sequence in ${count}...`; 
      } else { // När nedräkningen når 0 
        clearInterval(timer); // Stoppas timern 
        feedback.textContent = ""; // Texten rensas från skärmen 
        next(); // kör playSequence
      }
    }, 1000); 
  }
  //--------------------------------------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------- Visa färg/ rensa färg -------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------
  // Används för att visa och rensa färg i signal elementet
  function showColor(color: string) { // Visa en färg i singal elementet
    signal.className = "colorSignal " + color; 
  }

  function clearColor() { // Rensa färgen från signal elementet
    signal.className = "colorSignal";
  }
  //--------------------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------- Spela sekvens/level -------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------
  /**
   * Spela upp färgsekvensen för nuvarande level i signal elementet.
   * Blockera input för användaren under tiden.
   * Visar en färg åt gången med paus emellan.
  */ 
  function playSequence() {
    isPlayingSequence = true; // Blockerar användarens input under sekvensen
    const sequence = levelsMetal[currentLevel]; // Hämtar rätt färgsekvens för leveln
    let index = 0; // Startar första färgen i sekvensen

    const interval = setInterval(() => { // Timer som visar en färg var 1000ms
      showColor(colorsMetal[sequence[index]]); // Visar färg som motsvarar nuvarande index
      index++; // Gå till nästa färg i sekvensen

      if (index >= sequence.length) { // Om vi har visat alla färger 
        clearInterval(interval); // Stoppa timern

        setTimeout(() => { // Vänta lite innan vi rensar signalen
          clearColor();
          isPlayingSequence = false; // Sekvensen är klar, låt användaren börja välja färger i slotsen
        }, 600); // Vänta 600 ms så sista färgen syns tydligt
      };
    }, 1000); 
  }

  //--------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------- Slotsfyllda, Level och misstagbaren ----------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------
  function allSlotsFilled() { // Kolla så alla slots fått en färg (inte null som är utgångsläget)
    return playerSlots.every(slot => slot !== null); // Returnerar true om ingen slot är null, annars false
  }
  
  function updateLevelProgress(level: number) { // Uppdaterar texten som visar vilken level användaren är på
    levelText.textContent = `${level + 1}/3`; // (0 = level 1) därför + 1 i utskriften
  } 
  
  function updateMistakeProgress(mistakeCount: number) { // Uppdaterar texten som visar hur många misstag som användaren gjort
    mistakesText.textContent = String(mistakeCount); // Tar emot antalet misstag och skriver ut det som text
  }

  //--------------------------------------------------------------------------------------------------------------------------------------
  //----------------------------------------------------------- Validering ---------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------
  /** 
   * Validera spelarens val:
   * Kolla att imput blockeras under valideringen
   * Jämför spelarens val (playerslots) med rätt sekvens för aktuell level.
   * Om det är rätt:
   * Uppdaterar level, nollställer slots, startar nedräkning och spelar nästa sekvens(level 2)
   * Om fel:
   * Öka misstagsräknaren, nollställer slots, spelar om samma level efter en kort paus
  */
  function validate() {
    isPlayingSequence = true; // Blockera all input under valideringen

    const correct = levelsMetal[currentLevel]; // Rätt sekvens för nuvarande level
    const chosenSequence = playerSlots; // Spelarens valda sekvens
    const isCorrect = chosenSequence.every((value, index) => value === correct[index]); // Jämför varje position, det är bara true om alla värden matchar

    if (isCorrect) { // Om det är rätt svar
      feedback.textContent = "Correct!"; 
      
      if (currentLevel < levelsMetal.length - 1) { // Kolla om det finns fler levels kvar efter denna
        currentLevel++; // Gå vidare till nästa level
        updateLevelProgress(currentLevel); // Uppdatera level indikatorn
        
        setTimeout(() => { // Nollställ spelarens val inför nästa sekvens
          playerSlots = Array(6).fill(null); // Nollställer alla 6 slots (tomma igen)
          activeSlot = 0; // Flytta markeringen tillbaka till första sloten (startpositionen)

          startCountdown(playSequence);
          renderSlots();
        }, 1000);
      } else { // Sista leveln klar, rummet är avklarat
        feedback.textContent = "Metal chamber complete"; 
      }

    } else { // Om det är felsvar
      feedback.textContent = "Incorrect! Try again.";  
      
      mistakes++; // Öka misstagsräknaren
      updateMistakeProgress(mistakes); // Uppdatera misstags indikatorn

      setTimeout(() => { // Nollställ spelarens val, men stanna på samma level
        playerSlots = Array(6).fill(null); // Nollställer alla 6 slots (tomma igen)
        activeSlot = 0; // Flytta markeringen tillbaka till första sloten (startpositionen)

        renderSlots();
        startCountdown(playSequence);
      }, 2000);
    } 
  }

  renderSlots(); // Rendera slotsen för första gången när rummet laddas
  startCountdown(playSequence); // Starta coundown och sedan starta playsequence
}
// ATT GÖRA KVAR I FRAMTIDEN
// Koppla ihop rummet till dem andra
// Spara misstagen till localstorage
// Ta fram artifakterna för rummet kommer vara 2 stycken