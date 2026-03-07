import * as dataJSON from "../../data.json";
import { playBgm, playSfx } from "../../audio/index.ts";
import { renderRoomDesc } from "../../script/helper/roomDesc.ts";
import { startTimer, stopTimer, TimeIsUp } from "../../script/helper/utils.ts";
import { showMsg } from "../../script/helper/showMsg.ts";
import { setRoomResult, getRoomResults } from "../../script/helper/storage.ts";
import { room5waterFunc } from "../5water/room5water.ts";
import { showGameHeader } from "../../script/helper/gameHeader.ts";
import { goToSection } from "../../script/helper/transitions.ts";
import { updateProgressBar } from "../../script/helper/progressbar.ts";

//-------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------- Modul variabler -------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------
let listenersBound = false; // Säkerställer att keydown‑lyssnaren bara binds en gång
let timeUpIntervalId: number | null = null; // ID för timern som övervakar om rummets tid är slut. Behöver sparas mellan in/ut‑gångar.
let metalSectionRef: HTMLElement | null = null; // Referens till rumssektionen. Används för att blockera input när spelaren lämnar rummet.

// Spelstatus som måste ligga i modulens scope så keydown alltid använder senaste värdena.
let currentLevel = 0; // Håller nuvarande nivå: 0 = första nivån.
let playerSlots: (number | null)[] = Array(6).fill(null); // Array med spelarens valda färger, 6 platser, null = ej vald
let activeSlot = 0; // Index för vilken slot spelaren håller på att ändra just nu
let isPlayingSequence = true; // true = spelet spelar upp sekvensen, spelaren får inte styra ännu
let mistakes = 0; // Räknare för hur många misstag spelaren gjort

// Timers som måste nollställas varje gång spelaren går in i rummet igen.
let countdownIntervalId: number | null = null; // För startCountdown()
let sequenceIntervalId: number | null = null; // För playSequence()
let sequenceEndTimeoutId: number | null = null; // För "clearColor + unlock" timeout
//-------------------------------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------- Timer rensning -------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------
// Stoppar nedräkningstimern om den är aktiv
function clearCountdown(): void {
  if (countdownIntervalId !== null) {
    // Kolla om det finns en aktiv timer.
    window.clearInterval(countdownIntervalId); // Stoppa nedräkningstimern.
    countdownIntervalId = null; // Nollställ referensen så vi vet att den är stoppad.
  }
}
// Stoppar alla timers kopplade till sekvensuppspelningen.
function clearSequence(): void {
  if (sequenceIntervalId !== null) {
    // Om sekvensintervallen är aktiv
    window.clearInterval(sequenceIntervalId); // Stoppa intervallen som spelar upp sekvensen
    sequenceIntervalId = null; // Nollställ referensen
  }
  if (sequenceEndTimeoutId !== null) {
    // Om timeouten efter sekvensen är aktiv
    window.clearTimeout(sequenceEndTimeoutId); // Stoppa timeouten
    sequenceEndTimeoutId = null; // Nollställ referensen
  }
}

function stopTimeUpWatcher(): void {
  // Hjälpfunktion för att stoppa timeUp‑watchern
  if (timeUpIntervalId !== null) {
    // Om intervallen är aktiv
    window.clearInterval(timeUpIntervalId); // Stoppa intervallen.
    timeUpIntervalId = null; // Nollställ referensen
  }
}
//-------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------- Städar rummet -------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------
/// Rensar allt som kan ligga kvar när spelaren lämnar metallrummet.
function cleanupMetalRuntime(): void {
  // Stoppar timers som kan fortsätta även när man lämnat rummet
  clearCountdown();
  clearSequence();

  if (timeUpIntervalId !== null) {
    // Om timeUp‑watchern är aktiv
    window.clearInterval(timeUpIntervalId); // Stoppa intervallen som kollar om tiden är slut
    timeUpIntervalId = null; // Nollställ referensen
  }

  isPlayingSequence = true; // Blockerar användarens input tills rummet startas om korrekt

  // Återställ visuella element om rummet fortfarande finns i DOM
  if (metalSectionRef) {
    // Om vi fortfarande har en referens till rummet i DOM
    const signal = metalSectionRef.querySelector<HTMLElement>("#colorSignal"); // Hämta elementet som visar färgsignal
    const feedback = metalSectionRef.querySelector<HTMLElement>("#feedback"); // Hämta elementet som visar feedback‑text
    if (signal) signal.className = "colorSignal"; // Återställ signalens klass till standard
    if (feedback) feedback.textContent = ""; // Töm feedback‑texten
  }

  stopTimer(4); // Stoppar rummets huvudtimer
  metalSectionRef = null; // Ta bort referensen så inget mer kan påverka rummet efter exit
}
//-------------------------------------------------------------------------------------------------------------------------------------
//---------------------------------------------------- Huvudfunktion startar ----------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------
export function room4metalFunc() {
  const metalSection: HTMLElement | null =
    document.querySelector("#room4Metal"); // Hämtar sektionen för metallrummet
  if (!metalSection) {
    // Om den inte finns, avbryt funktionen för att undvika fel
    return;
  }

  cleanupMetalRuntime(); // Rensar innan rummet startar nytt

  metalSectionRef = metalSection; // uppdaterar referens varje gång vi går in i rummet
  currentLevel = 0; // Variabel för att hålla reda på vilken level spelaren är på 0 = level 1, 1 = level 2, 2 = level 3
  playerSlots = Array(6).fill(null); // Array med spelarens val, antingen är en slot ett nummer som motsvarar en färg i colorsMetal eller null om spelaren inte valt något för den sloten än.
  activeSlot = 0; // Vilken slot som är aktiv för närvarande, börjar på 0 (första sloten).
  isPlayingSequence = true; // När användaren kommer in i rummet blockeras man från att börja spela (byta slots) innan sekvensen börjat.
  mistakes = 0; // räkna hur många misstag användaren har gjort
  //-------------------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------- Ljud ---------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  const bgmId = dataJSON.room4metal.bgmId; // Spela bakgrundsmusiken för metallrummet
  if (bgmId) {
    void playBgm(bgmId, 650); // Spela bakgrundsmusiken för metallrummet med fade in på 650ms
  }
  const sfxId = dataJSON.room4metal.sfxId; // Spela ljud vid växling av slotfärg
  //-------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------------- Struktur och gå till nästa rum --------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  const TRANSITION_MS = 1200; // Standard tid för rumsövergångar

  function goToNextRoom(nextSelector: string, nextRoomFunc: () => void): void {
    const nextSection = document.querySelector<HTMLElement>(nextSelector);
    if (!nextSection) return;

    // Build the next room first
    nextRoomFunc();

    // Then let Metal own the transition to the next room
    goToSection(nextSection, TRANSITION_MS);
  }

  metalSection.style.backgroundImage = `url("${dataJSON.room4metal.backgroundImg}")`; // Sätter bakgrundsbilden för metallrummet från JSON-data

  stopTimeUpWatcher(); // Säkerställ att ingen gammal timeUp‑watcher ligger kvar.
  startTimer(4); // Starta timer rum 4 metall

  timeUpIntervalId = window.setInterval(() => {
    // Starta en intervall som kollar om tiden är slut
    if (!TimeIsUp) return; // Om tiden inte är slut ännu, gör inget
    ifRoomFailed(); // Om tiden är slut: kör logik för att spelaren misslyckats i rummet
  }, 200); // Kolla var 200 ms

  metalSection.dataset.timeUpWatcherId = String(timeUpIntervalId);

  showGameHeader(); // Visar globala headern i rummet

  renderRoomDesc(metalSection, dataJSON.room4metal.desc); // Renderar rummets beskrivning från JSON -> <div id="roomdesc">
  //-------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------------- Sekvenser, färger, states -------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  const colorsMetal = ["iron", "copper", "gold", "emerald", "steel"]; // Lista med namn på färgerna från sass klasserna.
  const levelsMetal = [
    // Lista med sekvenser, varje inre array är en level. Ex colorsMetal[0] är "iron", colorsMetal[1] är "copper" osv.
    [0, 1, 2, 1, 3, 4], //Level 1 enkel sekvens
    [4, 2, 4, 1, 3, 1], //Level 2 lite svårare med upprepningar
    [4, 1, 3, 1, 4, 2], // Level 3 lite svårare sekvens
  ];
  //-------------------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------- DOM element --------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  const signal = metalSection.querySelector("#colorSignal")!; // Hämtar elementet som visar spelets färgsignal. Använder ! som en null check (värdet ska inte vara null)
  const feedback = metalSection.querySelector("#feedback")!; // Hämtar elementet som visar feedback til spelare ex rätt/fel
  const levelText = metalSection.querySelector("#levelText1")!; // Hämtar elementet som visar vilken level spelaren är på ex 1/3
  const mistakesText = metalSection.querySelector("#mistakesText1")!; // Hämtar elementet som visar hur många misstag spelaren har gjort
  const slots = Array.from(metalSection.querySelectorAll(".colorSlots > div")); // Selektorn ".colorSlots > div" betyder "ta alla <div> som ligger direkt inuti containern .colorSlots". Det gör att vi får exakt de 6 slotsen (colorSlot1–6) i rätt ordning.

  //  Reset HUD every time we enter the room
  levelText.textContent = "1/3";
  mistakesText.textContent = "0";
  feedback.textContent = "";
  signal.className = "colorSignal";
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

    if (current >= colorsMetal.length) {
      // Om man går förbi sista färgen, hoppa tillbaka till första
      current = 0;
    }

    if (current < 0) {
      // Om man går före första färgen, hoppa till sista
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

  if (!listenersBound) {
    // Bind keydown‑lyssnaren endast en gång
    document.addEventListener("keydown", (event) => {
      if (!metalSectionRef || !metalSectionRef.classList.contains("isVisible"))
        // Om rummet inte är aktivt
        return; // ignorera input helt
      if (isPlayingSequence) return; // Blockera input medan sekvensen spelas upp

      if (event.key === "ArrowRight") {
        // Om man användaren trycker högerpilen

        activeSlot = Math.min(activeSlot + 1, playerSlots.length - 1); // Flytta markeringen till nästa slot (men inte utanför sista)
        renderSlots(); // Uppdatera så highlight flyttar sig till den aktiva sloten
      }

      if (event.key === "ArrowLeft") {
        // Om man användaren trycker vänsterpilen
        activeSlot = Math.max(activeSlot - 1, 0); // Flytta markeringen till föregående slot (men inte utanför första)
        renderSlots(); // Uppdatera så highlight flyttar sig till den aktiva sloten
      }

      if (event.key === "ArrowUp") {
        // Om man användaren trycker uppåtpilen
        changeSlotColor(1); // Går till nästa färg i listan
        if (sfxId) playSfx(sfxId);
      }

      if (event.key === "ArrowDown") {
        // Om man användaren trycker nedåtpilen
        changeSlotColor(-1); // Går till föregående färg i listan
        if (sfxId) playSfx(sfxId);
      }

      if (event.key === "Enter") {
        // Om man trycker på enter
        if (!isPlayingSequence && allSlotsFilled()) {
          // Kontrollera att sekvensen inte spelas (dumt att validera mitt i sekvensen) och att alla slots är ifyllda (måste vara färdigt)
          validate(); // Kör validering av användarens val
        }
      }
    });
    listenersBound = true; // Markera att lyssnaren nu är bunden
  }
  //--------------------------------------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------- Countdown -------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------
  /**
   * Visar meddelande och räknar ned från 10 till 0
   * När den är klar startas playSequence
   */
  function startCountdown(next: () => void) {
    clearCountdown(); // Säkerställ att ingen gammal nedräkning körs

    isPlayingSequence = true; // Blockera input under nedräkningen
    let count = 10; // Start värde för nedräkningen 10 sek (Får prova oss fram)
    feedback.textContent = `Booting sequence in ${count}...`; // Visar första nedräkningsmeddelandet innan timern startat

    countdownIntervalId = window.setInterval(() => {
      count--; // Minska nedräkningen med 1 varje sekund

      if (count > 0) {
        // Så länge nedräkning pågår uppdatera texten
        feedback.textContent = `Booting sequence in ${count}...`;
        return;
      }
      // När nedräkningen når 0
      clearCountdown(); // Stoppas timern
      feedback.textContent = ""; // Texten rensas från skärmen
      next(); // kör playSequence
    }, 1000);
  }
  //--------------------------------------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------- Visa färg/ rensa färg -------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------
  // Används för att visa och rensa färg i signal elementet
  function showColor(color: string) {
    // Visa en färg i singal elementet
    signal.className = `colorSignal ${color}`.trim();
  }

  function clearColor() {
    // Rensa färgen från signal elementet
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
    // NEW clear befor play
    clearSequence();
    isPlayingSequence = true; // Blockerar användarens input under sekvensen
    const sequence = levelsMetal[currentLevel]; // Hämtar rätt färgsekvens för leveln
    let index = 0; // Startar första färgen i sekvensen

    sequenceIntervalId = window.setInterval(() => {
      // Timer som visar en färg var 1000ms
      showColor(colorsMetal[sequence[index]]); // Visar färg som motsvarar nuvarande index
      index++; // Gå till nästa färg i sekvensen

      if (index >= sequence.length) {
        // Om vi har visat alla färger
        clearSequence(); // Stoppa timern

        sequenceEndTimeoutId = window.setTimeout(() => {
          // Vänta lite innan vi rensar signalen
          clearColor();
          isPlayingSequence = false; // Sekvensen är klar, låt användaren börja välja färger i slotsen
        }, 600); // Vänta 600 ms så sista färgen syns tydligt
      }
    }, 1000);
  }
  //--------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------- Slotsfyllda, Level och misstagbaren ----------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------
  function allSlotsFilled() {
    // Kolla så alla slots fått en färg (inte null som är utgångsläget)
    return playerSlots.every((slot) => slot !== null); // Returnerar true om ingen slot är null, annars false
  }

  function updateLevelProgress(level: number) {
    // Uppdaterar texten som visar vilken level användaren är på
    levelText.textContent = `${level + 1}/3`; // (0 = level 1) därför + 1 i utskriften
  }

  function updateMistakeProgress(mistakeCount: number) {
    // Uppdaterar texten som visar hur många misstag som användaren gjort
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
    const isCorrect = chosenSequence.every(
      (value, index) => value === correct[index],
    ); // Jämför varje position, det är bara true om alla värden matchar

    if (isCorrect) {
      // Om det är rätt svar
      feedback.textContent = "Correct!";

      if (currentLevel < levelsMetal.length - 1) {
        // Kolla om det finns fler levels kvar efter denna
        currentLevel++; // Gå vidare till nästa level
        updateLevelProgress(currentLevel); // Uppdatera level indikatorn

        setTimeout(() => {
          // Nollställ spelarens val inför nästa sekvens
          playerSlots = Array(6).fill(null); // Nollställer alla 6 slots (tomma igen)
          activeSlot = 0; // Flytta markeringen tillbaka till första sloten (startpositionen)

          startCountdown(playSequence);
          renderSlots();
        }, 1000);
      } else {
        // Sista leveln klar, rummet är avklarat
        ifRoomCompleted();
        return;
      }
    } else {
      // Om det är felsvar
      feedback.textContent = "Incorrect! Try again.";

      mistakes++; // Öka misstagsräknaren
      updateMistakeProgress(mistakes); // Uppdatera misstags indikatorn

      setTimeout(() => {
        // Nollställ spelarens val, men stanna på samma level
        playerSlots = Array(6).fill(null); // Nollställer alla 6 slots (tomma igen)
        activeSlot = 0; // Flytta markeringen tillbaka till första sloten (startpositionen)

        renderSlots();
        startCountdown(playSequence);
      }, 2000);
    }
  }
  //--------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------------------- Vid klarat rum -------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------
  // Förklara dessa ingående imorgon, från guiden också
  function ifRoomCompleted(): void {
    cleanupMetalRuntime(); // Rensar alla timers, event‑handlers och visuella element innan rummet lämnas
    stopTimeUpWatcher(); // Stoppar intervallen som övervakar om tiden är slut

    setRoomResult("metal", {
      // Sparar resultatet för metallrummet i spelets globala resultatlista
      status: "completed",
      artifact: "true", // Användaren får rätt artifakt
      mistakes: mistakes,
      score: 0, // Poäng (används ej här men krävs av strukturen)
      roomTimeSec: 0, // Tid (används ej här men krävs av strukturen)
    });

    stopTimer(4); // Stoppar rummets huvudtimer (rum 4) (Behöver vara efter results så att dom inte skrivs över)
    updateProgressBar();
    showMsg("Well done — next chamber awaits", TRANSITION_MS * 2); // Visa meddelande om att rummet är klart
    console.log("Metal result:", getRoomResults().metal); // Logga resultatet i konsolen för felsökning

    setTimeout(() => {
      // Vänta en stund innan nästa rum startas
      goToNextRoom("#room5Water", room5waterFunc); // Gå vidare till vattenrummet
    }, TRANSITION_MS);
  }
  //--------------------------------------------------------------------------------------------------------------------------------------
  //----------------------------------------------------- Vid rummet misslyckas ----------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------
  function ifRoomFailed(): void {
    stopTimeUpWatcher(); // Stoppar intervallen som övervakar om tiden är slut

    setRoomResult("metal", {
      // Sparar resultatet för metallrummet
      status: "failed",
      artifact: "false", // Användaren får fel artifakt
      mistakes: mistakes,
      score: 0, // Poäng (används ej här men krävs av strukturen)
      roomTimeSec: 0, // Tid (används ej här men krävs av strukturen)
    });

    stopTimer(4); // Stoppar rummets huvudtimer (rum 4) (Behöver vara efter results så att dom inte skrivs över)
    updateProgressBar();
    showMsg("Time's up — next chamber awaits", TRANSITION_MS * 2); // Visa meddelande om att tiden är slut

    setTimeout(() => {
      // Vänta en stund innan nästa rum startas
      goToNextRoom("#room5Water", room5waterFunc); // Gå vidare till vattenrummet
    }, TRANSITION_MS);
  }

  renderSlots(); // Rendera slotsen för första gången när rummet laddas
  startCountdown(playSequence); // Starta coundown och sedan starta playsequence
}
