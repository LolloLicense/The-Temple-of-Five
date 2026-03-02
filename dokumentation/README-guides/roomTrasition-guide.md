## 1  Importera rätt saker i din room-fil (t.ex. room2fire.ts)

`import { startTimer, stopTimer, TimeIsUp } from "../../script/helper/utils";`
`import { setRoomResult } from "../../script/helper/storage";`
`import { showMsg } from "../../script/helper/showMsg";`

om rummet ska kunns skicka vidare till nästkommande rum ex: 
    `import { room3earthFunc } from "../3earth/room3earth";`

## 2 få in timerfunktionerna 

startTimer(1); denna låg i början innan ta bort och lägg in detta under play bg music:

    // Prevent adding event listeners twice if player re-enters the room
    if (woodSection.dataset.woodInit === "true") return;
    woodSection.dataset.woodInit = "true";
    // Start timer for room 1
    startTimer(1); 
    // --- TIMEOUT WATCHER (room timer) -------------------------
    // Poll TimeIsUp every 200ms. When it's true, we fail this room once.
    let timeUpIntervalId: number | null = null;

    function stopTimeUpWatcher(): void {
        if (timeUpIntervalId !== null) {
        window.clearInterval(timeUpIntervalId);
        timeUpIntervalId = null;
        }
    }

    timeUpIntervalId = window.setInterval(() => {
        if (!TimeIsUp) return;
        ifRoomFailed();

        // TODO: save "failed" artifact result here
        // setRoomResult("wood", { status: "failed", artifact: "false" });

        // TODO: show message + move player
        // showMsg("Time is up — the next chamber awaits...", 1200);
        // transitSections(getCurrentPage() ?? woodSection, nextSection, 1200);
    }, 200);

## 3 Lägg till en const för din section i DOM sektionen (om du har en)   

    Ex: const woodEl = woodSection;


## 4 function ifRoomCompleted():

lägg till dina timeranrop samt show msg likt min :

     // WORK IN PROGRESS

    function ifRoomCompleted(): void {
        // Block input while we show the final state + delay

        isTransitioning = true;

    // 1) Render the very last digit + final UI state
    
    updtUI();

    if (mistakes === 0) {
      balanceFill.style.width = "100%";
    }

    // 2) Delay so the player can SEE the final digit (before alert blocks the browser)

    window.setTimeout(() => {
      // 3) Wait 2 animation frames to guarantee the UI is painted before alert
     
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          stopTimeUpWatcher();
          stopTimer(1);

          // Save room result (used by progressbar + backpack later)

          setRoomResult("wood", { status: "completed", artifact: "true" });
          // show msg to player

          showMsg("Well done — next chamber awaits", 1200);
          window.setTimeout(() => {
            // 4) Reset wood state

            currentLevelIndex = 0;
            mistakes = 0;
            resetLevelInput();

            // Allow input again wood is about to be hidden anyway
            
            isTransitioning = false;
            updtUI();

            window.setTimeout(() => {
              room2fireFunc();
            }, 1250);
          });
        });
      });
    }, 1200);
  }

    // Called when the room timer hits 0 (fail case)

    function ifRoomFailed(): void {
        stopTimeUpWatcher();
        stopTimer(1);
        // Block input so player can't keep interacting

        isTransitioning = true;

    // Update UI one last time (optional but nice)

    updtUI();

    // Save room result (used by progressbar + backpack later)

    setRoomResult("wood", { status: "failed", artifact: "false" });

    // Show fail message

    showMsg("Time's up — next chamber awaits", 1200);

    // Reset AFTER message is shown
    
    window.setTimeout(() => {
      currentLevelIndex = 0;
      mistakes = 0;
      resetLevelInput();

      isTransitioning = false;
      updtUI();

      // TODO: transition to next page-> fire room
      const fireSection = document.querySelector<HTMLElement>("#room2Fire");
    if (!fireSection) return;

    transitSections(woodSection, fireSection, 1200);

    window.setTimeout(() => {
        room2fireFunc();
        }, 1250);
            }, 1200);
    }



