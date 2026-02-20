import * as dataJSON from "../data.json";

export function room3earthFunc() {
  /* Hide the welcome page (menu)
   This can be removed when we remove the menu */
  const welcomePage: HTMLElement | null =
    document.querySelector("#welcomePage");
  if (welcomePage) {
    welcomePage.classList.add("hidden");
  }

  /* Sets the background for the room and shows room section */
  const earthSection: HTMLElement | null =
    document.querySelector("#room3Earth");
  if (earthSection) {
    earthSection.style.backgroundImage = `url("${dataJSON.room3earth.backgroundImg}")`;
    earthSection.classList.remove("hidden");
  }

  console.log("Hello from the earth room");

  type Cell = number | string | null;
  type Grid = Cell[][];

  const createGrid = (size: number = 4): Grid => {
    return Array.from({ length: size }, () => Array(size).fill("slate"));
  };

  const gameBoard = createGrid(4);
  console.log(gameBoard);

  const gameDiv: HTMLElement | null = document.querySelector("#gameDiv");
  if (gameDiv) {
    /*
for (let i=0; i < gameBoard.length; i++) {
for (let x=0; x < gameBoard[i].length; x++) {

gameDiv.innerHTML = `<div class="gameSlate"></div>`;

   console.log(gameBoard[i][x]);
} // x loop END
} // i loop END
gameDiv.innerHTML = gameDiv.innerHTML + `</div>`;
*/
  } // IF gameDiv

  const generateVisualGrid = (containerId: string, size: number = 4): void => {
    const container = document.getElementById(containerId);

    if (!container) return;
    for (let i = 0; i < size * size; i++) {
      const cell = document.createElement("div");
      cell.style.border = "1px solid #ccc";
      cell.style.display = "flex";
      cell.style.alignItems = "center";
      cell.style.justifyContent = "center";

      // Optional: Add coordinates or IDs
      cell.textContent = `${Math.floor(i / size)},${i % size}`;

      container.appendChild(cell);
    }
  };

  generateVisualGrid("gameDiv");
} // room3earthFunc END
