import { withBaseUrl } from "../script/utils";
import { initAudioManager } from "./audioManager";
import type { SoundConfig } from "./types";

export function initAudio(): void {
  const configs: SoundConfig[] = [
    {
      id: "bgm_fire", // same id as in data.json **IMPORTANT**
      src: withBaseUrl("/audiofiles/bgm_fire.mp3"),
      kind: "bgm",
      volume: 0.2,
    },
    {
      id: "bgm_wood", // same id as in data.json **IMPORTANT**
      src: withBaseUrl("/audiofiles/bgm_wood.mp3"),
      kind: "bgm",
      volume: 0.2,
    },
    {
      id: "bgm_metal",
      src: withBaseUrl("/audiofiles/bgm_metal.mp3"),
      kind: "bgm",
      volume: 0.2,
    },
    {
      id: "bgm_water",
      src: withBaseUrl("/audiofiles/bgm_water.mp3"),
      kind: "bgm",
    },

    // Fill in your rooms below:
  ];

  initAudioManager(configs);
}
