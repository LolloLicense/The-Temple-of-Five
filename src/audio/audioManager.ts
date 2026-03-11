import { isMuted } from "./soundToggle";
import type { SoundConfig } from "./types";

const sounds = new Map<string, HTMLAudioElement>(); // sounds is a Map that will store the audio elements, with the id as the key and the HTMLAudioElement as the value
const targetVolumes = new Map<string, number>(); // Saving the volume seperately to be able to fade in and out without losing the original volume level

const soundConfigs = new Map<string, SoundConfig>(); // Meta for lazy load

let desiredBgmId: string | null = null;
let playingBgmId: string | null = null; // currentBGMid is a string that holds the id of the currently playing background music, or null if no background music is playing

let fadeToken = 0; // if user is changing the room quickly, fade will abort

/*--------------------------------------------------------
INIT
--------------------------------------------------------*/

/**
 * function initAudioManager
 * Initiating once in main
 * Loads all sound files to its memory
 */

export function initAudioManager(configs: SoundConfig[]): void {
  // initializes the audio manager by loading all the sound files specified in the soundsConfig array

  sounds.clear(); // Clear any existing sounds in the Map
  targetVolumes.clear(); // Clear any existing target volumes in the Map
  soundConfigs.clear(); // LAZY LOAD

  desiredBgmId = null; // Reset the desired background music ID
  playingBgmId = null; // Reset the current background music ID

  for (const cfg of configs) {
    // create new audio-element
    soundConfigs.set(cfg.id, cfg); // create a new HTMLAudioElement with the source specified in the config

    const defaultVolume = cfg.kind === "bgm" ? 0.2 : 0.35; // set default volume based on kind, 0.2 for bgm and 0.35 for sfx
    const vol = clamp01(cfg.volume ?? defaultVolume); // if we decide to have a controllable volume in the future, we can set it in the config, otherwise it will use the default volume
    targetVolumes.set(cfg.id, vol);

    console.log("[audioManager] Registered config:", cfg.id);
  }
  console.log(
    "[audioManager] INIT complete. Registered configs =",
    configs.length,
  );
}

/*--------------------------------------------------------
MUTE SYNC (soundToggle -> audioManager)
--------------------------------------------------------*/

/**
 * syncMutedFromToggle is called upon when soundToggle mute or unmute
 *
 * Update: audio.muted for all sounds
 * if unmuted - start BGM for the current room
 */

export async function syncMutedFromToggle(): Promise<void> {
  // promise because playBgm is async, and we want to await it if we are unmuting to ensure the bgm starts playing before the function finishes
  const muted = isMuted(); // get the current muted state from soundToggle

  for (const audio of sounds.values()) {
    audio.muted = muted; // set the muted property of each audio element to match the muted state from soundToggle
  }

  if (!muted) {
    // if we are unmuting and there is a desired background music ID, start playing the background music for the current room
    await ensureCurrentRoomBgmIsPlaying(650); // fading in the bgm over 650ms when unmuting
  }

  console.log("syncMutedFromToggle running");
}

/*--------------------------------------------------------
SFX
--------------------------------------------------------*/

/**
 * Respecting mute
 * Reset currentTime to 0 so it can be triggered multiple times in a row
 */

export async function playSfx(id: string): Promise<void> {
  if (isMuted()) return; // if muted, do not play sound effects

  const audio = getOrCreateAudio(id); // get the audio element for the specified id from the sounds Map
  if (!audio) {
    console.warn(`[audioManager] Missing SFX id: ${id}`); // if there is no audio element for the specified id, log a warning and return
    return;
  }

  try {
    audio.muted = isMuted(); // ensure the muted state is respected, in case it was changed since initialization
    audio.currentTime = 0; // reset the currentTime to 0 so that the sound effect can be played multiple times in a row without waiting for it to finish

    await audio.play(); // play the sound effect, awaiting it in case the browser requires it (e.g. if the user has not interacted with the page yet)
  } catch (err) {
    console.warn(`[audioManager] Failed to play SFX id: ${id}`, err); // if there is an error playing the sound effect, log a warning with the error
  }
}

/*--------------------------------------------------------
BGM
--------------------------------------------------------*/

/**
 * playBgm is used when entering a new room / rendering
 * Will always play desiredBgmId (even if muted) but in the background
 * If muted - no audio will be heard, but when unmuting, the correct BGM for the current room will start playing (if any)
 * If not muted - fading out the previous BGM and fading in the new BGM
 */

export async function playBgm(id: string, fadeMs: number = 650): Promise<void> {
  desiredBgmId = id; // set the desired background music ID to the specified id

  if (isMuted()) return; // if muted, do not play background music, but we have set the desiredBgmId so that the correct BGM will start playing when unmuting

  if (playingBgmId === id) return; // if the desired background music is already playing, do not do anything

  if (playingBgmId) {
    await fadeOut(playingBgmId, fadeMs); // if there is a currently playing background music, fade it out before starting the new one
    stop(playingBgmId); // stop the currently playing background music after fading out
  }

  playingBgmId = id; // set the currently playing background music ID to the desired ID

  await fadeIn(id, fadeMs); // fade in the new background music
}

/*--------------------------------------------------------
STOP FUNCTIONS FOR BGM AND SFX and UnloadBGM for releasing cashe (also used for quick room changes, quit to main menu, game over, etc)
--------------------------------------------------------*/

/**
 * function stop is used to immediately stop the currently playing background music without fading, for example when the player is quickly changing rooms
 * If the stopped background music is the currently playing one, reset the playingBgmId to null
 */

export function stop(id: string): void {
  // stop the currently playing background music immediately without fading
  const audio = sounds.get(id); // get the audio element for the specified id from the sounds Map
  if (!audio) return; // if there is no audio element for the specified id, return

  audio.pause(); // pause the audio element to stop it from playing
  audio.currentTime = 0; // reset the currentTime to 0 so that it will start from the beginning the next time it is played

  if (playingBgmId === id) {
    // if the stopped background music is the currently playing one, reset the playingBgmId to null
    playingBgmId = null;
  }
}

/**
 * stopAll()
 * If reset
 * Quiting to main menu / game over / game won, etc
 */

export function stopAll(): void {
  for (const id of sounds.keys()) {
    stop(id);
  }
  playingBgmId = null;
  desiredBgmId = null;
}

/**
 * unload
 * - Remove audi from cashe
 * - try to release src / buffer (browser is in control of cashe)
 */
export function unload(id: string): void {
  disposeAudio(id);

  if (playingBgmId === id) playingBgmId = null;
  if (desiredBgmId === id) desiredBgmId = null;
}

/**
 * unloadAllBgm
 * - "Hard reset" (for example quit to menu / restart run)
 * - Leave SFX since it's so small
 */

export function unloadAllBgm(): void {
  for (const [id, cfg] of soundConfigs.entries()) {
    if (cfg.kind === "bgm") {
      unload(id);
    }
  }
}

/*--------------------------------------------------------
Helper, internal functions - when unmmute
--------------------------------------------------------*/

/**
 * If BGM is playing, dont do anything
 * If BGM is not playing - fade in the desiredBgmId if there is one
 */

async function ensureCurrentRoomBgmIsPlaying(fadeMs: number): Promise<void> {
  if (!desiredBgmId) return;

  const audio = getOrCreateAudio(desiredBgmId);
  if (!audio) return;

  if (playingBgmId === desiredBgmId && !audio.paused) {
    return;
  }

  await playBgm(desiredBgmId, fadeMs);
}

/*--------------------------------------------------------
BGM (FADE IN / OUT)
--------------------------------------------------------*/

/**
 * Fade out to 0 volume
 */

async function fadeOut(id: string, ms: number): Promise<void> {
  const audio = sounds.get(id);
  if (!audio) return;

  const token = ++fadeToken;
  const startVol = audio.volume;
  const steps = 20; // number of steps in the fade out
  const stepMs = Math.max(16, Math.floor(ms / steps)); // smooth fade out, at least 16ms per step to avoid too many updates

  for (let i = 0; i < steps; i++) {
    // loop 20, check volume, check if fade aborted, await stepMs
    if (token !== fadeToken) return;

    const t = (i + 1) / steps;
    audio.volume = startVol * (1 - t);

    await sleep(stepMs);
  }

  audio.volume = 0;
}

async function fadeIn(id: string, ms: number): Promise<void> {
  const audio = getOrCreateAudio(id);
  if (!audio) return;

  audio.muted = isMuted(); // ensure the muted state is respected, in case it was changed since initialization
  if (isMuted()) return; // if muted, first start playing the audio so that it will be heard when unmuting

  const token = ++fadeToken;

  const targetVol = targetVolumes.get(id) ?? 0.2;
  audio.volume = 0;

  try {
    await audio.play();
  } catch (err) {
    console.warn(`[audioManager] Failed to play BGM id: ${id}`, err);
    return;
  }

  const steps = 20; // number of steps in the fade in
  const stepMs = Math.max(16, Math.floor(ms / steps)); // smooth fade in, at least 16ms per step to avoid too many updates

  for (let i = 0; i < steps; i++) {
    // loop 20, check if fade aborted, await stepMs
    if (token !== fadeToken) return;

    const t = (i + 1) / steps; // t goes from 0.05 to 1 over the course of the loop, creating a smooth fade in effect
    audio.volume = targetVol * t; // set the volume of the audio element to the target volume multiplied by t, creating a fade in effect

    await sleep(stepMs);
  }

  audio.volume = targetVol; // ensure the volume is set to the target volume at the end of the fade in
}

/*--------------------------------------------------------
LAZY LOAD (Because we dont want all the audio to load at once)
--------------------------------------------------------*/

/**
 * getOrCreateAudio
 * - Retrieves Audio from cache if it exists
 * - Otherwise creates it from soundConfigs (lazy)
 */

function getOrCreateAudio(id: string): HTMLAudioElement | null {
  const existing = sounds.get(id);
  if (existing) return existing;

  const cfg = soundConfigs.get(id);
  if (!cfg) return null;

  const audio = new Audio(cfg.src);

  // Default loop: true for BGM, otherwise false
  audio.loop = cfg.loop ?? cfg.kind === "bgm";

  // Volume from targetVolumes (registered in init)
  audio.volume = targetVolumes.get(id) ?? (cfg.kind === "bgm" ? 0.2 : 0.35);

  audio.muted = isMuted();

  sounds.set(id, audio);

  console.log("[audioManager] Lazy-created audio:", id);
  return audio;
}

/**
 * disposeAudio
 * - Stop and try to dispose the audio-files
 * - Broswer can still keep the audio-files in memory
 */

function disposeAudio(id: string): void {
  const audio = sounds.get(id);
  if (!audio) return;

  audio.pause();

  // Try to remove src
  audio.removeAttribute("src");
  audio.load();

  sounds.delete(id);
}

/*--------------------------------------------------------
UTILS
--------------------------------------------------------*/

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
