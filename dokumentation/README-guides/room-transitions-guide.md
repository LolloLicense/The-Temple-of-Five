# Room transitions – gemensam standard (Earth → Metal → Water)

Syftet med detta dokument är att alla rum ska bete sig **likadant**:
- In via `getCurrentPage()` + `transitSections(...)` (eller `showSection(...)` vid första load)
- Ut via `transitSections(currentRoom, nextRoom, TRANSITION_MS)` + `setTimeout(nextRoomFunc, TRANSITION_MS)`
- Timer/watchers ska **inte** dubbla vid re-entry
- Event listeners ska **inte** dubbla vid re-entry

> **Kort regel:** Varje rum importerar **bara nästa rum** i kedjan.

---

## 0) Gemensamma konstanter (rekommenderat)

I varje rum (eller i en shared `constants.ts`):

```ts
const TRANSITION_MS = 1200;
```

---

## 1) ENTRY pattern (ska se likadan ut i alla rum)

**Mall:**

```ts
const section = document.querySelector<HTMLElement>("#roomX");
if (!section) return;

section.style.backgroundImage = `url("${dataJSON.roomX.backgroundImg}")`;
renderRoomDesc(section, dataJSON.roomX.desc);

const fromPage =
  getCurrentPage() ??
  document.querySelector<HTMLElement>("main > section.page.isVisible");

if (fromPage && fromPage !== section) {
  transitSections(fromPage, section, TRANSITION_MS);
} else {
  showSection(section);
}
```

✅ Viktigt:
- `showSection()` uppdaterar `currentPage` i transitions-helpern.
- `fromPage !== section` skyddar mot dubbel fade när man redan är där.

---

## 2) EXIT / “Go next room” pattern "sömlös fade"

**Mall-funktion (lägg i rummet som ska gå vidare):**

```ts
function goToNextRoom(nextSelector: string, nextRoomFunc: () => void): void {
  if (!currentSection) return;

  const nextSection = document.querySelector<HTMLElement>(nextSelector);
  if (!nextSection) return;

  transitSections(currentSection, nextSection, TRANSITION_MS);

  window.setTimeout(() => {
    nextRoomFunc();
  }, TRANSITION_MS);
}
```

✅ Viktigt:
- Använd samma `TRANSITION_MS` överallt.
- **Kalla inte** `nextRoomFunc()` både i `goToNextRoom(...)` och direkt efter.

---

## 3) Timers / watchers (undvik dubletter)

Om ni har en “time-up watcher” via `setInterval`, gör såhär:

```ts
let timeUpIntervalId: number | null = null;

function stopTimeUpWatcher(): void {
  if (timeUpIntervalId !== null) {
    window.clearInterval(timeUpIntervalId);
    timeUpIntervalId = null;
  }
}

// Vid entry:
stopTimeUpWatcher();
startTimer(ROOM_ID);

timeUpIntervalId = window.setInterval(() => {
  if (!TimeIsUp) return;
  ifRoomFailed();
}, 200);
```

✅ Viktigt:
- Calla `stopTimeUpWatcher()` innan du startar en ny.
- Stoppa även watchers vid complete/fail/exit.

---

## 4) Listeners (undvik dubletter)

**Gör “bind once”-flagga**:

```ts
let listenersBound = false;

function bindListenersOnce(): void {
  // addEventListener...
}

if (!listenersBound) {
  bindListenersOnce();
  listenersBound = true;
}
```

✅ Extra tips:
- Event delegation (1 click-listener på section) är enklare än loop + anonyma callbacks.

---

## EARTHROOM 
Den här guiden är **endast** för hur Earth-rummet ska använda era **globala helper-funktioner** (transitions, timer, storage-result, header, showMsg osv) – i samma “pattern” som Wood.

---

### 1) Imports 

**Behåll/justera dessa imports i Earth:**

```ts
import { getCurrentPage, showSection, transitSections } from "../../script/helper/transitions.ts";
import { setRoomResult, getRoomResults } from "../../script/helper/storage.ts";
import { showMsg } from "../../script/helper/showMsg.ts"; // om ni använder den i Earth

import { room4metalFunc } from "../4metal/room4metal.ts";
```

 Poängen:  
- Earth ska **spara resultat** via `setRoomResult("earth", ...)` (inte egen localStorage-key).  
- Earth ska **gå vidare** via `transitSections(...)` + `setTimeout(room4metalFunc, TRANSITION_MS)`.

---

### 2) Konstant

```ts
const TRANSITION_MS = 1200;
```
---

### 3) ENTRY pattern

I början av `room3earthFunc()`:

```ts
const earthSection = document.querySelector<HTMLElement>("#room3Earth");
if (!earthSection) return;

earthSection.style.backgroundImage = `url("${dataJSON.room3earth.backgroundImg}")`;
renderRoomDesc(earthSection, dataJSON.room3earth.desc);

const fromPage =
  getCurrentPage() ??
  document.querySelector<HTMLElement>("main > section.page.isVisible");

if (fromPage && fromPage !== earthSection) {
  transitSections(fromPage, earthSection, TRANSITION_MS);
} else {
  showSection(earthSection);
}

showGameHeader();
startTimer(3);
```

 Viktigt:
- `fromPage !== earthSection` hindrar “fade till samma sida”.
- `showSection(...)` är fallback första gången.

---

### 4) TIME-UP watcher (så den inte dubblar vid re-entry)

Lägg modul-variabler högst upp i filen:

```ts
let timeUpIntervalId: number | null = null;

function stopTimeUpWatcher(): void {
  if (timeUpIntervalId !== null) {
    window.clearInterval(timeUpIntervalId);
    timeUpIntervalId = null;
  }
}
```

Vid entry (i `room3earthFunc()`), gör såhär:

```ts
stopTimeUpWatcher();

timeUpIntervalId = window.setInterval(() => {
  if (!TimeIsUp) return;
  ifRoomFailed();
}, 200);
```

Och vid win/fail/exit:
```ts
stopTimeUpWatcher();
stopTimer(3);
```

---

### 5) EXIT pattern (Earth → Metal)

Skapa en helper:

```ts
function goToNextRoom(nextSelector: string, nextRoomFunc: () => void): void {
  const earthSection = document.querySelector<HTMLElement>("#room3Earth");
  if (!earthSection) return;

  const nextSection = document.querySelector<HTMLElement>(nextSelector);
  if (!nextSection) return;

  transitSections(earthSection, nextSection, TRANSITION_MS);
  window.setTimeout(() => nextRoomFunc(), TRANSITION_MS);
}
```

---

### 6) Resultat-sparande 

#### WIN (i `winner()`)

Byt/behåll såhär (ordningen spelar roll):

```ts
function ifRoomCompleted(): void {
  stopTimeUpWatcher();
  stopTimer(3);

  setRoomResult("earth", {
    status: "completed",
    artifact: "true",
    mistakes,
    score: 0,
    roomTimeSec: 0,
  });

  showMsg("Well done — next chamber awaits", TRANSITION_MS * 2);

  window.setTimeout(() => {
    goToNextRoom("#room4Metal", room4metalFunc);
  }, TRANSITION_MS);
}
```

### FAIL (i `looser()` / `ifRoomFailed()`)

Här är den stora buggen i din kod just nu:
- `looser()` sparar `status: "completed"` fast det är fail.

Det ska vara:

```ts
function ifRoomFailed(): void {
  stopTimeUpWatcher();
  stopTimer(3);

  setRoomResult("earth", {
    status: "failed",
    artifact: "false",
    mistakes,
    score: 0,
    roomTimeSec: 0,
  });

  showMsg("Time's up — next chamber awaits", TRANSITION_MS * 2);

  window.setTimeout(() => {
    goToNextRoom("#room4Metal", room4metalFunc);
  }, TRANSITION_MS);
}
```
---
### 7) Rensa era egna “custom timers” också

Du har även:

```ts
timerCheckInterval = setInterval(timerCheck, 1000);
```

Vid win/fail ska du stoppa den också:

```ts
clearInterval(timerCheckInterval);
```


## METALROOM

## Rekommenderade imports i Metal
```ts
import { startTimer, stopTimer, TimeIsUp } from "../../script/helper/utils.ts";
import { showMsg } from "../../script/helper/showMsg.ts";
import { setRoomResult, getRoomResult } from "../../script/helper/storage.ts";
import { room5waterFunc } from "../5water/room5water.ts";
```

  let timeUpIntervalId: number | null = null;

  function stopTimeUpWatcher(): void {
    if (timeUpIntervalId !== null) {
      window.clearInterval(timeUpIntervalId);
      timeUpIntervalId = null;
    }
  }

  function goToNextRoom(nextSelector: string, nextRoomFunc: () => void): void {
  const nextSection = document.querySelector<HTMLElement>(nextSelector);
  if (!nextSection) return;

  transitSections(roomSection, nextSection, 1200);

  window.setTimeout(() => {
    nextRoomFunc();
  }, 1200);
}

## Timer-id i Metal
Byt:
```ts
startTimer(1);
```
till:
```ts
startTimer(4);
```

## När Metal är klar (i validate() när sista leveln är klar)
Skapa:

```ts
function ifRoomCompleted(): void {
  stopTimeUpWatcher();
  stopTimer(4);

  setRoomResult("metal", { status: "completed", artifact: "true" });

  showMsg("Well done — next chamber awaits", 1200);

  window.setTimeout(() => {
    goToNextRoom("#room5Water", room5waterFunc); // exempel
  }, 1200);
}
```

### När tiden tar slut (i `timerCheck()`)
```ts
function ifRoomFailed(): void {
  stopTimeUpWatcher();
  stopTimer(4);

  setRoomResult("metal", { status: "failed", artifact: "false" });

  showMsg("Time's up — next chamber awaits", 1200);

  window.setTimeout(() => {
    goToNextRoom("#room5Water", room5waterFunc); // exempel
  }, 1200);
}
```


---

# WATER ROOM – guide

Det här dokumentet handlar **bara** om era gemensamma “globala” funktioner/helpers:
- `transitions.ts` (entry/exit + current page)
- `utils.ts` (timer + `TimeIsUp`)
- `storage.ts` (room results via `setRoomResult/getRoomResults/resetSingleRoomResult`)
- `showMsg.ts` (toast/meddelande)
- `gameHeader.ts` + `roomDesc.ts` (header + room-beskrivning)

Syftet: Water ska bete sig som Wood/Fire/Metal i **flöde, timers och resultat** – oavsett puzzle-koden.

---

## 1) Entry via transitions 

**Mål:** alltid gå in med `getCurrentPage()` + `transitSections(...)`, annars `showSection(...)`.

```ts
const section = document.querySelector<HTMLElement>("#room5Water");
if (!section) return;

section.style.backgroundImage = `url("${dataJSON.room5water.backgroundImg}")`;

showGameHeader();
renderRoomDesc(section, dataJSON.room5water.desc);

const fromPage =
  getCurrentPage() ??
  document.querySelector<HTMLElement>("main > section.page.isVisible");

if (fromPage && fromPage !== section) {
  transitSections(fromPage, section, TRANSITION_MS);
} else {
  showSection(section);
}
```

**Varför?**
- `getCurrentPage()` ger “sanningen” om vad som är aktivt just nu.
- `fromPage !== section` skyddar mot “fade till samma sida”.

---

## 2) Exit via transitions 

**Mål:** `transitSections(current, next, TRANSITION_MS)` + `setTimeout(nextRoomFunc, TRANSITION_MS)`

```ts
function goToNextRoom(nextSelector: string, nextRoomFunc: () => void): void {
  const current = document.querySelector<HTMLElement>("#room5Water");
  if (!current) return;

  const next = document.querySelector<HTMLElement>(nextSelector);
  if (!next) return;

  transitSections(current, next, TRANSITION_MS);
  window.setTimeout(() => nextRoomFunc(), TRANSITION_MS);
}
```

---

## 3) Timer + watcher (undvik dubletter)

### 3.1 Start/stop room-id = 5 för Water

**Mål:** stoppa gammalt, starta nytt, och ha EN watcher.

```ts
let timeUpIntervalId: number | null = null;

function stopTimeUpWatcher(): void {
  if (timeUpIntervalId !== null) {
    window.clearInterval(timeUpIntervalId);
    timeUpIntervalId = null;
  }
}
```

**På entry:**
```ts
stopTimeUpWatcher();
stopTimer(5);      // om något ligger kvar
startTimer(5);     // starta rummet

timeUpIntervalId = window.setInterval(() => {
  if (!TimeIsUp) return;
  ifRoomFailed();
}, 200);
```

**Vid win/fail (alltid):**
```ts
stopTimeUpWatcher();
stopTimer(5);
```

> Om Water även har en intern timer (t.ex. `secondsElapsed`) är det okej – men den globala timern (`startTimer(5)`) är den som driver `TimeIsUp` och headern.

---

## 4) Room results via storage.ts - inte custom localStorage keys

Ni ska **inte** göra:
```ts
localStorage.setItem("room_water", JSON.stringify(...));
```

Ni ska göra exakt som Wood:

### 4.1 Entry reset
```ts
resetSingleRoomResult("water"); // => status pending, artifact null, etc.
```

### 4.2 Win
```ts
setRoomResult("water", {
  status: "completed",
  artifact: "true",     // eller "false" beroende på ert rule
  mistakes: 0,          // valfritt om ni räknar
  score: 0,             
  roomTimeSec: 0,       
});

console.log("Water result:", getRoomResults().water);
```

### 4.3 Fail
```ts
setRoomResult("water", {
  status: "failed",
  artifact: "false",
  mistakes: 0,
  score: 0,
  roomTimeSec: 0,
});

console.log("Water fail result:", getRoomResults().water);
```

**Praktisk konsekvens i Water-koden:**
- Ta bort `interface IRoomResult` (den behövs inte när ni använder `setRoomResult`)
- Byt ut allt som sparar “room_water” till `setRoomResult("water", ...)`

---

## 5) showMsg (samma i alla rum)

Efter `setRoomResult(...)` i win/fail:

```ts
showMsg("Well done — next chamber awaits", TRANSITION_MS * 2);
// eller
showMsg("Time's up — next chamber awaits", TRANSITION_MS * 2);
```

Sen går ni vidare:

```ts
window.setTimeout(() => {
  goToNextRoom("#finalRoom", room6finalFunc);
}, TRANSITION_MS);
```

---

## 6) Bind listeners EN gång (undvik dubbel-submit)

Välj ett av två mönster:

### A) “bind once”-flagga 
```ts
let listenersBound = false;

if (!listenersBound) {
  document.getElementById("w-check-btn")?.addEventListener("click", handleCheck);
  document.getElementById("w-reset-btn")?.addEventListener("click", resetPuzzle);
  setupKeyboard();
  listenersBound = true;
}
```

### B) isFirstInit via dataset 
```ts
const isFirstInit = section.dataset.waterInit !== "true";
if (isFirstInit) section.dataset.waterInit = "true";

if (isFirstInit) {
  // bind listeners
}
```
---

## 7) Minimal “global helpers” checklista för Water

- [ ] `resetSingleRoomResult("water")` på entry
- [ ] Entry transition: `getCurrentPage()` → `transitSections` / `showSection`
- [ ] Global timer: `startTimer(5)` + `TimeIsUp` watcher
- [ ] `stopTimer(5)` + stop watcher på win/fail
- [ ] Spara resultat med `setRoomResult("water", ...)` (inte `localStorage.setItem("room_water"...`)
- [ ] `showMsg(...)` vid win/fail
- [ ] Exit: `goToNextRoom("#finalRoom", room6finalFunc)` med transit + setTimeout
- [ ] Listeners binds bara en gång

