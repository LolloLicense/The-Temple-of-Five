import * as dataJSON from "../data.json";

export function room4metalFunc() {
  /* Hide the welcome page (menu)
   This can be removed when we remove the menu */
  const welcomePage: HTMLElement | null =
    document.querySelector("#welcomePage");
  if (welcomePage) {
    welcomePage.classList.add("hidden");
  }

  /* Sets the background for the room and shows room section */
  const metalSection: HTMLElement | null =
    document.querySelector("#room4Metal");
  if (metalSection) {
    metalSection.style.backgroundImage = `url("${dataJSON.room4metal.backgroundImg}")`;
    metalSection.classList.remove("hidden");
  }

  console.log("Hello from the metal room");
}
