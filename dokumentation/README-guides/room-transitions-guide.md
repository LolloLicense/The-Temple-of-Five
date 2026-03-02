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

# Earth → Metal (konkret för era filer)

## Earth: vad som behövs för att gå vidare till Metal

I `room3earthFunc()` saknas idag:
- stop/clear av timer/watchers vid win/fail
- `setRoomResult(...)`
- `showMsg(...)`
- `goToNextRoom("#room4Metal", room4metalFunc)`

### Rekommenderade imports i Earth
```ts
import { startTimer, stopTimer, TimeIsUp } from "../../script/helper/utils.ts";
import { showMsg } from "../../script/helper/showMsg.ts";
import { setRoomResult } from "../../script/helper/storage.ts";
import { room4metalFunc } from "../4metal/room4metal.ts";
```

### Lägg till helper i Earth (under dina state-variabler)
```ts
const TRANSITION_MS = 1200;

function goToNextRoom(nextSelector: string, nextRoomFunc: () => void): void {
  const earthSection = document.querySelector<HTMLElement>("#room3Earth");
  if (!earthSection) return;

  const nextSection = document.querySelector<HTMLElement>(nextSelector);
  if (!nextSection) return;

  transitSections(earthSection, nextSection, TRANSITION_MS);
  window.setTimeout(() => nextRoomFunc(), TRANSITION_MS);
}
```

### När Earth “vinner”
Efter att ni konstaterat vinst (t.ex. `correctSlatesArr.length === 15`):

```ts
function ifRoomCompleted(): void {
  clearInterval(timerCheckInterval);
  stopTimer(3);

  setRoomResult("earth", { status: "completed", artifact: "true" });
  showMsg("Well done — next chamber awaits", TRANSITION_MS * 2);

  window.setTimeout(() => {
    goToNextRoom("#room4Metal", room4metalFunc);
  }, TRANSITION_MS);
}
```

### När tiden tar slut (i `timerCheck()`)
```ts
function ifRoomFailed(): void {
  clearInterval(timerCheckInterval);
  stopTimer(3);

  setRoomResult("earth", { status: "failed", artifact: "false" });
  showMsg("Time's up — next chamber awaits", TRANSITION_MS * 2);

  window.setTimeout(() => {
    goToNextRoom("#room4Metal", room4metalFunc);
  }, TRANSITION_MS);
}
```

---

# Metal → Water (konkret)

I Metal saknas idag:
- `TimeIsUp` watcher / fail
- `setRoomResult(...)`, `showMsg(...)`
- `goToNextRoom("#room5Water", room5waterFunc)`
- Timer-id ska vara korrekt (ni kör `startTimer(1)` i Metal men rummet är 4)

## Rekommenderade imports i Metal
```ts
import { startTimer, stopTimer, TimeIsUp } from "../../script/helper/utils.ts";
import { showMsg } from "../../script/helper/showMsg.ts";
import { setRoomResult } from "../../script/helper/storage.ts";
import { room5waterFunc } from "../5water/room5water.ts";
```

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
  stopTimer(4);

  setRoomResult("metal", { status: "completed", artifact: "true" });
  showMsg("Well done — next chamber awaits", TRANSITION_MS * 2);

  window.setTimeout(() => {
    goToNextRoom("#room5Water", room5waterFunc);
  }, TRANSITION_MS);
}
```

### När tiden tar slut (i `timerCheck()`)
```ts
  function ifRoomFailed(): void {
    clearInterval(timerCheckInterval);
    stopTimer(3);

    setRoomResult("earth", { status: "failed", artifact: "false" });
    showMsg("Time's up — next chamber awaits", TRANSITION_MS * 2);

    window.setTimeout(() => {
      goToNextRoom("#room4Metal", room4metalFunc);
    }, TRANSITION_MS);
  }
```


---

# Water (notis)

Water-rummet gör idag “visa section” manuellt och injicerar HTML + listeners.

För att matcha standarden behöver Water också:
- entry via `getCurrentPage()` + `transitSections(...)` / `showSection(...)`
- en “bind once”/cleanup så att `click`/`keydown` inte binds flera gånger vid re-entry.

---

## Snabb checklista (printbar)

- [ ] Entry: `getCurrentPage()` → `transitSections` / `showSection`
- [ ] Exit: `transitSections(current, next, TRANSITION_MS)` + `setTimeout(nextRoomFunc, TRANSITION_MS)`
- [ ] Timer: stoppa watchers och `stopTimer(roomId)` i complete/fail/exit
- [ ] Listeners: bind bara en gång eller använd delegation
- [ ] Varje rum importerar bara **nästa rum**
