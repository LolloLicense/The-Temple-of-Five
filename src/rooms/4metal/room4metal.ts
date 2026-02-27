import * as dataJSON from "../../data.json";
import { playBgm } from "../../audio/index.ts";
import { renderRoomDesc } from "../../script/helper/roomDesc.ts";
//import { startTimer, stopTimer } from "./script/utils.ts";
import { startTimer } from "../../script/helper/utils.ts";
import { showGameHeader } from "../../script/helper/gameHeader.ts";

export function room4metalFunc() {
  showGameHeader(); // Visa headern med timer
  startTimer(4); // Starta timer for room 4

  /* Gömmer välkomst sidan, kan tas bort senare*/
  const welcomePage: HTMLElement | null =
    document.querySelector("#welcomePage");
  if (welcomePage) {
    welcomePage.classList.add("hidden");
  }

  //-------------------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------- Ljud ---------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  // Spela bakgrundsmusiken för metallrummet
  const bgmId = dataJSON.room4metal.bgmId;
  if (bgmId) {
    void playBgm(bgmId, 650); // Spela bakgrundsmusiken för metallrummet med fade in på 650ms
  }
  //-------------------------------------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------- Dom struktur ------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  const metalSection: HTMLElement | null = document.querySelector("#room4Metal"); // Hämtar sektionen för metallrummet
  if (!metalSection) { // Om den inte finns, avbryt funktionen för att undvika fel
   return;
  }

  metalSection.style.backgroundImage = `url("${dataJSON.room4metal.backgroundImg}")`; // Sätter bakgrundsbilden för metallrummet från JSON-data
  metalSection.classList.remove("hidden"); // Visar rummet, tar bort .hidden klassen

  renderRoomDesc(metalSection, dataJSON.room4metal.desc);  // Renderar rummets beskrivning från JSON -> <div id="roomdesc">

  console.log("Hello from the metal room"); // Loggar ett meddelande i konsolen för att bekräfta att funktionen körs

  //-------------------------------------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------- Array färgsekvens ------------------------------------------------------------
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
  let activeSlot = 0; // Vilken slot som är aktiv för närvarande, börjar på 0 (första sloten)
  let isPlayingSequence = false; // Variabel för att hålla reda på om spelet just nu spelar upp en sekvens, så att vi kan blockera användarens input under tiden

  //-------------------------------------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------- Hämta DOM element ------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------

  const signal = metalSection.querySelector("#colorSignal")!; // Hämtar elementet som visar spelets färgsignal. Använder ! som en null check (värdet ska inte vara null)
  const feedback = metalSection.querySelector("#feedback")!; // Hämtar elementet som visar feedback til spelare ex rätt/fel
  //const levelText = metalSection.querySelector("#levelText"); // Hämtar elementet som visar vilken level spelaren är på ex 1/3
  //const mistakesText = metalSection.querySelector("#mistakesText"); // Hämtar elementet som visar hur många misstag spelaren har gjort
  const slots = Array.from(metalSection.querySelectorAll(".colorSlot > div")); // Selektorn ".colorSlots > div" betyder "ta alla <div> som ligger direkt inuti containern .colorSlots". Det gör att vi får exakt de 6 slotsen (colorSlot1–6) i rätt ordning.

  //-------------------------------------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------- Rendera slots ------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  /**
   * Behöver kunna nollställa slotarnas
   * Lägga till rätt färg (om användaren valt något)
   * Lägga på highlights om den är aktiv
   */

  function renderSlots() {
    slots.forEach((slot, index) => {
      slot.className = `colorSlot${index + 1}`; // Återställer slotens klasser till sin grundklass (colorSlot1, colorSlot2 etc)
      const colorIndex = playerSlots[index]; // Hämtar spelarens val för denna slot ex 2 = gold
      if (colorIndex !== null) {
        slot.classList.add(colorsMetal[colorIndex]); // Om spelaren valt en färg lägg till rätt klass från colorMetal
      }

      if (index === activeSlot) {
        slot.classList.add("is-active"); // Om detta är den aktiva sloten, lägg till klassen "is-active" för att highlighta den. Gör att spelaren ser vilken slot den väljer färg för.
      } 
    }); 
  }

  
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
  //---------------------------------------------------------- Spel logik -------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------


  renderSlots(); // Rendera slotsen för första gången när rummet laddas
  startCountdown(playSequence); // Starta coundown och sedan starta playsequence
 
}

//Anropa isplayingsequence i valideringen av rätt och fel