## 1  Importera rätt saker i din room-fil (t.ex. room2fire.ts)

`import { startTimer, stopTimer, TimeIsUp } from "../../script/helper/utils.ts";`
`import { setRoomResult } from "../../script/helper/storage.ts";`
`import { showMsg } from "../../script/helper/showMsg.ts";`
`import { transitSections, getCurrentPage, showSection } from "../../script/helper/transitions.ts";`

om rummet ska kunns skicka vidare till nästkommande rum ex: 
    `import { roomNextFunc } from "../NEXT_ROOM_PATH/roomNextFile.ts";`

## 2 I början av roomXFunc() → gör “entry transition” korrekt
 Detta ska ligga direkt efter att du hämtat din rum-section

A)    const roomSection = document.querySelector<HTMLElement>("#DIN_SECTION_ID");
    if (!roomSection) return;

    roomSection.style.backgroundImage = `url("${dataJSON.DITT_RUM.backgroundImg}")`;

B)  Transition in (eller fallback show) const TRASITIONTIME = 1300;
    
    const fromPage =
    getCurrentPage() ??
    document.querySelector<HTMLElement>("main > section.page.isVisible");

    if (fromPage && fromPage !== roomSection) {
    transitSections(fromPage, roomSection, TRANSITIONTIME);
    } else {
    showSection(roomSection);
    }

## 3 Lägg in “init guard” men utan att stoppa entry   

    const isFirstInit = roomSection.dataset.roomInit !== "true";
    if (isFirstInit) roomSection.dataset.roomInit = "true";


## 4 Timer + TimeIsUp watcher (minimalt & stabilt)

Detta ska ligga efter init guard, innan ni börjar med resten av UI.

     startTimer(ROOM_ID_NUMBER); Hittar ditt nr i jsonfilen

     let timeUpIntervalId: number | null = null;

B) Skapa watcher som triggar fail och undvik dubletter

    function stopTimeUpWatcher(): void {
    if (timeUpIntervalId !== null) {
        window.clearInterval(timeUpIntervalId);
        timeUpIntervalId = null;
    }
    }

    timeUpIntervalId = window.setInterval(() => {
    if (!TimeIsUp) return;
    ifRoomFailed();
    }, 200);


## 5 Skapa två funktioner: ifRoomCompleted() och ifRoomFailed()

A) 
       
     function ifRoomCompleted(): void {
    // blockera dubbel-trigger
    if (isTransitioning) return;
    isTransitioning = true;

    // uppdatera UI sista gången (om ni vill)
    updtUI?.();

    stopTimeUpWatcher();
    stopTimer(ROOM_ID_NUMBER);

    // spara att rummet är completed + rätt artefakt
    setRoomResult("ROOM_ID_STRING", { status: "completed", artifact: "true" });

    showMsg("Well done — next chamber awaits", TRANSITIONTIME);

    window.setTimeout(() => {
        // resetta rums-state (om ni vill kunna re-run utan reload)
        resetRoomState?.();

    // gör transition till nästa section
    const nextSection = document.querySelector<HTMLElement>("#NEXT_SECTION_ID");
    if (!nextSection) return;

    transitSections(roomSection, nextSection, TRANSITIONTIME);

    // starta nästa rum efter att fade är klar
    window.setTimeout(() => {
      roomNextFunc();
    }, TRANSITIONTIME);
    }, TRANSITIONTIME);
    }
    
B) FAIL (mall)  


    function ifRoomFailed(): void {
    if (isTransitioning) return;
    isTransitioning = true;

    updtUI?.();

    stopTimeUpWatcher();
    stopTimer(ROOM_ID_NUMBER);

    // spara failed + fel artefakt
    setRoomResult("ROOM_ID_STRING", { status: "failed", artifact: "false" });

    showMsg("Time's up — next chamber awaits", TRANSITIONTIME);

    window.setTimeout(() => {
        resetRoomState?.();

    const nextSection = document.querySelector<HTMLElement>("#NEXT_SECTION_ID");
    if (!nextSection) return;

    transitSections(roomSection, nextSection, TRANSITIONTIME);

    window.setTimeout(() => {
      roomNextFunc();
    }, TRANSITIONTIME);
    }, TRANSITIONTIME);
    }



Alltså detta var super krångligt... kolla om detta ens funkar..


