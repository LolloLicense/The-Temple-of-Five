/* -------------------------------
   Init (called centrally in main.ts)
---------------------------------- */

export { initAudioManager } from "./audioManager";
export { initSoundToggle } from "./soundToggle";

/* -------------------------------
   Used in rum.ts
---------------------------------- */

export { playBgm, playSfx } from "./audioManager";

/* --------------------------------
   Used centrally (game over, etc.).
----------------------------------- */

export { stopAll } from "./audioManager";

/* --------------------------------
   Used globally for mute.
----------------------------------- */

export { isMuted } from "./soundToggle";

/* ------------------------------------------
import { playBgm, playSfx } from "../audio"; <------- NOTE! Import from index.ts, not directly from audioManager or soundToggle. Exactly as written here.
-------------------------------------------- */
