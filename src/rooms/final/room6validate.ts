import * as dataJSON from "../../data.json";
import { playBgm } from "../../audio/index.ts";
import { renderRoomDesc } from "../../script/helper/roomDesc.ts";
import { startTimer } from "../../script/helper/utils.ts";
import { showGameHeader } from "../../script/helper/gameHeader.ts";
import { getRoomResults } from "../../script/helper/storage.ts";
import { getArtifactIcon } from "../../script/helper/artifacts.ts";

// Typ som bara innehåller de fem elementrummen (inte "final")
type TElementRoomId = "wood" | "fire" | "earth" | "metal" | "water";

export function room6finalFunc(): void {
  //-------------------------------------------------------------------------------------------------------------------------------------
  //----------------------------------------------------------- Initiera rummet ---------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  const finalSection = document.querySelector<HTMLElement>("#finalRoom"); // Hämta finalrummet
  if (!finalSection) return;

  const welcomePage = document.querySelector<HTMLElement>("#welcomePage"); // Dölj welcomePage om den syns
  if (welcomePage) welcomePage.classList.add("hidden");

  finalSection.style.backgroundImage = `url("${dataJSON.room6validate.backgroundImg}")`; // Sätt bakgrundsbild

  startTimer(6); // Starta timer för rum 6
  showGameHeader(); // Visa UI-header
  renderRoomDesc(finalSection, dataJSON.room6validate.desc); // Visa rumsbeskrivning

  const bgmId = dataJSON.room6validate.bgmId; // Spela bakgrundsmusik
  if (bgmId) void playBgm(bgmId, 650);

  // Gör sektionen fokuserbar så tangentbordet fungerar
  finalSection.tabIndex = -1;
  finalSection.focus();
  //-------------------------------------------------------------------------------------------------------------------------------------
  //----------------------------------------------------------- Hämta artifacts ---------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  const state = getRoomResults(); // Hämta spelstatet från storage
  const rooms: TElementRoomId[] = ["wood", "fire", "earth", "metal", "water"]; // Rummen i korrekt ordning

  // Bygg artifactPool = lista med { roomId, kind, icon }
  const artifactPool = rooms.map(roomId => {
    const kind = state[roomId].artifact; // "true" | "false" | null
    const icon = getArtifactIcon(roomId, kind); // Hämta ikon
    return { roomId, kind, icon };
  });
  //-------------------------------------------------------------------------------------------------------------------------------------
  //----------------------------------------------------------- Slots & State -----------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  const slots = Array.from(
    finalSection.querySelectorAll(".finalSlots .slot")
  ) as HTMLElement[]; // Hämta alla slot-element

  let slotSelections: (number | null)[] = [null, null, null, null, null]; // Vilken artifact ligger i vilken slot
  let activeSlotIndex = 0; // Vilken slot är aktiv (highlightad)

  const validateBtn = finalSection.querySelector("#validateBtn") as HTMLButtonElement; // Validateknappen
  const feedbackEl = finalSection.querySelector("#finalFeedback") as HTMLElement; // Feedbacktext
  //-------------------------------------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------- Render ---------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  function renderSlots() {
    slots.forEach((slotElement, slotIndex) => { // Gå igenom varje slot

      slotElement.classList.remove("is-active"); // Ta bort highlight
      slotElement.innerHTML = ""; // Töm sloten

      const selectedArtifactIndex = slotSelections[slotIndex]; // Artifact-index i denna slot

      if (selectedArtifactIndex !== null) {
        const artifact = artifactPool[selectedArtifactIndex]; // Hämta artifact-objektet
        slotElement.innerHTML = `<img src="${artifact.icon}" alt="${artifact.roomId}" />`; // Visa ikon
      }

      if (slotIndex === activeSlotIndex) {
        slotElement.classList.add("is-active"); // Highlighta aktiv slot
      }
    });
  }
  //-------------------------------------------------------------------------------------------------------------------------------------
  //----------------------------------------------------------- Validate-knapp ----------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  function updateValidate() {
    const allSlotsAreFilled = slotSelections.every(selection => selection !== null); // Är alla slots fyllda?
    validateBtn.disabled = !allSlotsAreFilled; // Aktivera/inaktivera knappen
  }
  //-------------------------------------------------------------------------------------------------------------------------------------
  //------------------------------------------------------- Byt artifact i slot ---------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  // Skapa en Set (samling utan dubbletter) med alla artifacts som redan används i någon slot
  function cycleArtifact(direction: number) {  
    const usedArtifactIndexes = new Set(
      slotSelections.filter(selection => selection !== null) // Ta bort tomma slots (null)
    );

    // Skapa en lista med alla artifacts som är tillgängliga att välja i den aktiva sloten
    const availableArtifactIndexes = artifactPool
    .map((_, artifactIndex) => artifactIndex) // Gör en lista [0,1,2,3,4] baserat på artifactPool
    .filter(artifactIndex =>
      !usedArtifactIndexes.has(artifactIndex) || // Artifacten är inte upptagen av en annan slot
      slotSelections[activeSlotIndex] === artifactIndex // Eller så är det samma artifact som redan ligger i denna slot
    );

    // Om det inte finns några artifacts att välja → avbryt funktionen
    if (availableArtifactIndexes.length === 0) return;

    // Hämta artifact-index som ligger i den aktiva sloten just nu (kan vara null)
    const currentArtifactIndex = slotSelections[activeSlotIndex];

    // Hitta positionen i listan över tillgängliga artifacts
    // Om sloten är tom → börja på -1 (innan första artifacten)
    // Annars → hitta indexet i availableArtifactIndexes
    let newIndexInAvailableList =
    currentArtifactIndex === null ? -1 : availableArtifactIndexes.indexOf(currentArtifactIndex);

    // Flytta upp eller ner i listan beroende på direction (+1 eller -1)
    newIndexInAvailableList += direction;

    // Wrap-around: om vi går förbi sista artifacten → hoppa till första
    if (newIndexInAvailableList >= availableArtifactIndexes.length) newIndexInAvailableList = 0;

    // Wrap-around: om vi går före första artifacten → hoppa till sista
    if (newIndexInAvailableList < 0) newIndexInAvailableList = availableArtifactIndexes.length - 1;

    // Sätt den nya artifacten i den aktiva sloten
    slotSelections[activeSlotIndex] = availableArtifactIndexes[newIndexInAvailableList];

    renderSlots();// Rita om slotarna så spelaren ser ändringen
    updateValidate(); // Uppdatera Validate-knappen (kan bli aktiv om alla slots är fyllda)
  }
  //-------------------------------------------------------------------------------------------------------------------------------------
  //----------------------------------------------------------- Tangentbord -------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  document.addEventListener("keydown", event => {
    if (!finalSection.classList.contains("isVisible")) return;  // Tangentbordet ska bara fungera när finalrummet är synligt

    if (event.key === "ArrowLeft") { // Om spelaren trycker vänsterpil
      activeSlotIndex = Math.max(0, activeSlotIndex - 1); // Flytta highlight åt vänster, men aldrig under 0
      renderSlots(); // Rita om så highlight syns
    }

    if (event.key === "ArrowRight") { // Om spelaren trycker högerpil
      activeSlotIndex = Math.min(4, activeSlotIndex + 1); // Flytta highlight åt höger, men aldrig över 4
      renderSlots(); // Rita om så highlight syns
    }

    if (event.key === "ArrowUp") cycleArtifact(-1); // Om spelaren trycker uppåt → byt artifact uppåt i listan

    if (event.key === "ArrowDown") cycleArtifact(1); // Om spelaren trycker nedåt → byt artifact nedåt i listan
  });
  //-------------------------------------------------------------------------------------------------------------------------------------
  //------------------------------------------------------------- Validate --------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  validateBtn.addEventListener("click", () => {
    const correctOrder: TElementRoomId[] = ["wood", "fire", "earth", "metal", "water"]; // Den korrekta ordningen av artifacts baserat på rummen
    
    const selectedArtifacts = slotSelections.map( // Hämta artifacts i den ordning spelaren har placerat dem i slotsen
      artifactIndex => artifactPool[artifactIndex!] // artifactIndex! = vi lovar att det inte är null
    );

    const orderIsCorrect = selectedArtifacts.every(  //Kontrollera ordningen
     (artifact, slotIndex) => artifact.roomId === correctOrder[slotIndex] // Jämför varje artifact med rätt position
    );

    if (!orderIsCorrect) { // Om ordningen är fel
      feedbackEl.textContent = "Wrong order. Try again."; // Visa feedback
      slotSelections = [null, null, null, null, null]; // Töm alla slots
      activeSlotIndex = 0; // Flytta highlight till första sloten

      renderSlots(); // Rita om
      updateValidate(); // Inaktivera Validate-knappen
      return; // Avsluta funktionen här
    }

    const allArtifactsAreTrue = selectedArtifacts.every( // Kontrollera om artifacts är "true"
      artifact => artifact.kind === "true" // Alla artifacts måste vara "true"
    );
 
    if (allArtifactsAreTrue) {  // Om spelaren vann
      feedbackEl.textContent = "You win!";
      // TODO: gå till gameWin
    } 
  
    else { // Om spelaren hade rätt ordning men fel artifacts
      feedbackEl.textContent = "Incorrect artifacts. Game Over.";
      // TODO: gå till gameOver
    }
  });
  //-------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------------------------- Init ----------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  renderSlots(); // Rita första gången
  updateValidate(); // Inaktivera Validate från start
}