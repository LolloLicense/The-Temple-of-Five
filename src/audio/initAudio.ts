import { withBaseUrl } from "./assetUrl";
import { initAudioManager } from "./audioManager";
import type { SoundConfig } from "./types";

export function initAudio(): void {
  const configs: SoundConfig[] = [
    {
      id: "bgm_fire", // same id as in data.json **IMPORTANT**
      src: withBaseUrl("/audiofiles/bgm_fire.mp3"),
      kind: "bgm",
      volume: 0.05,
    },
    {
      id: "bgm_wood", // same id as in data.json **IMPORTANT**
      src: withBaseUrl("/audiofiles/bgm_wood.mp3"),
      kind: "bgm",
      volume: 0.2,
    },
    {
      id: "bgm_metal", // same id as in data.json
      src: withBaseUrl("/audiofiles/bgm_metal.mp3"),
      kind: "bgm",
      volume: 0.5,
    },
    {
      id: "bgm_water",
      src: withBaseUrl("/audiofiles/bgm_water.mp3"),
      kind: "bgm",
    },
    {
      id: "bgm_earth",
      src: withBaseUrl("/audiofiles/bgm_earth.mp3"),
      kind: "bgm",
      volume: 0.5,
    },
    {
      id: "sfx_click",
      src: withBaseUrl("/audiofiles/sfx_click.mp3"),
      kind: "sfx",
      volume: 0.4,
    },
    {
      id: "sfx_shortSlide",
      src: withBaseUrl("/audiofiles/sfx_shortSlide.mp3"),
      kind: "sfx",
      volume: 0.4,
    },
    {
      id: "sfx_midSlide",
      src: withBaseUrl("/audiofiles/sfx_midSlide.mp3"),
      kind: "sfx",
      volume: 0.4,
    },
    {
      id: "sfx_midSlide2",
      src: withBaseUrl("/audiofiles/sfx_midSlide2.mp3"),
      kind: "sfx",
      volume: 0.4,
    },
    {
      id: "sfx_longSlide",
      src: withBaseUrl("/audiofiles/sfx_longSlide.mp3"),
      kind: "sfx",
      volume: 0.4,
    },
    {
      id: "bgm_final", // same id as in data.json
      src: withBaseUrl("/audiofiles/bgm_final.mp3"),
      kind: "bgm",
      volume: 0.5,
    },
    {
      id: "sfx_transition",
      src: withBaseUrl("/audiofiles/sfx_transition.mp3"),
      kind: "sfx",
    },

    // Fill in your rooms below:
  ];

  initAudioManager(configs);
}
