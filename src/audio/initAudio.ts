import { withBaseUrl } from "../script/utils";
import { initAudioManager } from "./audioManager";
import type { SoundConfig } from "./types";

export function initAudio(): void {
  const configs: SoundConfig[] = [
    {
      id: "bgm_fire", // same id as in data.json **IMPORTANT**
      src: withBaseUrl("/audiofiles/bgm_fire.mp3"),
      kind: "bgm",
    },
    // Fill in your rooms below:
  ];

  initAudioManager(configs);
}
