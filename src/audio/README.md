Audioguide:

- Alla ljudfiler ska ligga i public/audiofiles/

- Alla paths ska byggas via withBaseUrl() exempel: src: withBaseUrl("/audiofiles/bgm_fire.mp3"), <- från initAudio.ts

- Rummen får endast använda playBgm() och playSfx() exempel från fire room nedan:

  /* Play the background music for the fire room */
  const bgmId = dataJSON.room2fire.bgmId;
  if (bgmId) {
    void playBgm(bgmId, 650); // play the background music for the fire room, with a fade-in duration of 650ms
  }

- Endast main.ts får anropa initAudio() <- denna är redan klar


1. Lägg in era ljud i initAudio.ts
Exempel från fire room: 

    {
      id: "bgm_fire", // same id as in data.json **IMPORTANT**
      src: withBaseUrl("/audiofiles/bgm_fire.mp3"),
      kind: "bgm",
      volume: 0,2,
    },
    {
    id: "sfx_fire_click",
    src: withBaseUrl("/audiofiles/sfx_fire_click.mp3"),
    kind: "sfx",
    volume: 0.4,
  },