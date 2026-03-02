# Audioguide:

- Alla ljudfiler ska ligga i public/audiofiles/

- Alla paths ska byggas via withBaseUrl() <br>
exempel: src: withBaseUrl("/audiofiles/bgm_fire.mp3"), <- från initAudio.ts

- Rummen får endast använda playBgm() och playSfx()

- Endast main.ts får anropa initAudio() <- denna är redan klar

---


1. Lägg in era ljud i initAudio.ts
Exempel från fire room: 

  
    {
      id: "bgm_fire", // same id as in data.json **IMPORTANT**
      src: withBaseUrl("/audiofiles/bgm_fire.mp3"),
      kind: "bgm",
      volume: 0,2,
    },
    {
    id: "sfx_click",
    src: withBaseUrl("/audiofiles/....mp3"),
    kind: "sfx",
    volume: 0.4,
  },


  2. Koppla BGM i data.json
  
  Exempel:

  "room2fire": {
  "bgmId": "bgm_fire",
  "sfxId": "sfx_fire_click",
  }

3. Importera funktionen till era rum.

import { playBgm, playSfx } from "../audio";

  const bgmId = dataJSON.room2fire.bgmId;
  if (bgmId) {
    void playBgm(bgmId, 650); // play the background music for the fire room, with a fade-in duration of 650ms
  }

  PS. console.log gärna.

  exempel: console.log("Calling playBgm with:", bgmId);


DONE :D - Njut av bakgrundsmusik (BGM) och specialeffekter (SFX)