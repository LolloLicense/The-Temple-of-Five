import { playBgm } from "../audio";
import * as dataJSON from "../data.json";
import { renderRoomDesc } from "./roomDesc";

export function room2fireFunc(): void {
  /* Hide the welcome page (menu)
      This can be removed when we remove the menu */
  const welcomePage: HTMLElement | null =
    document.querySelector("#welcomePage");
  if (welcomePage) {
    welcomePage.classList.add("hidden");
  }

  /* Sets the background for the room and shows room section */
  const fireSection: HTMLElement | null = document.querySelector("#room2Fire");
  if (!fireSection) return;
    fireSection.style.backgroundImage = `url("${dataJSON.room2fire.backgroundImg}")`;
    fireSection.classList.remove("hidden");
    renderRoomDesc(fireSection, dataJSON.room2fire.desc);

  /* Play the background music for the fire room */
  const bgmId = dataJSON.room2fire.bgmId;
  if (bgmId) {
    void playBgm(bgmId, 650); // play the background music for the fire room, with a fade-in duration of 650ms
  }

  console.log("Hello from the fire room");
  console.log("Calling playBgm with:", bgmId);
}
