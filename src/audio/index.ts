/* -------------------------------
   Init (kallas centralt i main.ts)
---------------------------------- */

export { initAudioManager } from "./audioManager";
export { initSoundToggle } from "./soundToggle";

/* -------------------------------
   Används i rum.ts
---------------------------------- */

export { playBgm, playSfx } from "./audioManager";

/* --------------------------------
   Används centralt (game over etc)
----------------------------------- */

export { stopAll } from "./audioManager";

/* --------------------------------
   Används globalt vid mute
----------------------------------- */

export { isMuted } from "./soundToggle";

/* ------------------------------------------
import { playBgm, playSfx } from "../audio"; <------- OBS! importera från index.ts, inte direkt från audioManager eller soundToggle. precis så som det står här.
-------------------------------------------- */