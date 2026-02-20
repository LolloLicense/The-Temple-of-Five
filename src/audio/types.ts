/**
 * Handle background music (BGM)
 * Handle sound effects (SFX)
 * Fade out / fade in between rooms
 * soundToggle (muted by default)
 */

export type SoundConfig = {
  // for JSON
  id: string; // id ex ("bgm_fire")
  src: string; // src is the file path to the sound file
  kind: "bgm" | "sfx"; // kind is either "bgm" for background music or "sfx" for sound effects
  loop?: boolean; // loop is optional
  volume?: number; // volume is a number between 0 and 1, where 0 is muted and 1 is full volume
};
