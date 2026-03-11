import { room1woodFunc } from "../../rooms/1wood/room1wood.ts";
import { room2fireFunc } from "../../rooms/2fire/room2fire.ts";
import { room3earthFunc } from "../../rooms/3earth/room3earth.ts";
import { room4metalFunc } from "../../rooms/4metal/room4metal.ts";
import { room5waterFunc } from "../../rooms/5water/room5water.ts";
import { room6finalFunc } from "../../rooms/final/room6validate.ts";
import { highscoreRoomFunc } from "../../rooms/highscore/highscore.ts";
import {
  getRoomResults,
  hasActiveRun,
  resetRunKeepHighscores,
} from "../../script/helper/storage.ts";
import { goToSection } from "../../script/helper/transitions.ts";
import { getUserTotalTime, startTimer } from "../../script/helper/utils.ts";

// animation state
let welcomeBound = false;

export function welcomePageFunc(): void {
  console.log("Welcome page initialized");

  const ROOMS = ["wood", "fire", "earth", "metal", "water", "final"] as const;
  const state = getRoomResults();
  console.log("Current room states:", state);

  // Resume button
  const continueBtn: HTMLElement | null =
    document.querySelector("#continueBtn");
  if (continueBtn) {
    continueBtn.addEventListener("click", continueGame);
  }

  for (const roomId of ROOMS) {
    if (state[roomId].status === "completed") {
      console.log(`Room ${roomId} is completed. Enabling continue button.`);
      continueBtn?.removeAttribute("disabled");
    } // IF END
  } // LOOP END

  // animation
  initWelcomeParticles();

  // Prevent duplicate event listeners
  if (welcomeBound) return;
  welcomeBound = true;

  /* Event handlers */
  // Start game button
  const startGameBtn: HTMLElement | null =
    document.querySelector("#startGameBtn");
  if (startGameBtn) {
    startGameBtn.addEventListener("click", handleStartGame);
  }

  //HIGHSCORE button
  const highScoreBtn: HTMLElement | null =
    document.querySelector("#openHighScoreBtn");

  if (highScoreBtn) {
    highScoreBtn.addEventListener("click", () => {
      // 1. Build the highscore room first
      highscoreRoomFunc();

      // 2. Then show the section from the welcome/test menu
      const highscoreSection =
        document.querySelector<HTMLElement>("#highscoreRoom");
      if (!highscoreSection) return;

      goToSection(highscoreSection, 1200);
    });
  }
} // welcomePageFunc END

// When a new game is started, the timer should start and the first room should be built and shown
function handleStartGame(): void {
  resetRunKeepHighscores();
  startTimer(0);
  room1woodFunc();
}
// When continue game is clicked, the game should be continued from the last save point (functionality to be implemented)

function continueGame(): void {
  const ROOMS = ["wood", "fire", "earth", "metal", "water", "final"] as const;
  const state = getRoomResults();
  let continueRoom: string = "";

  for (const roomId of ROOMS) {
    if (state[roomId].status === "pending") {
      continueRoom = roomId;
      //console.log(`Room ID: ${roomId}, Status: ${state[roomId].status}`);
      break; // Exit the loop once the pending room is found
    } // IF END
  } // LOOP END

  switch (continueRoom) {
    case "wood":
      goToSection(document.querySelector<HTMLElement>("#room1Wood")!, 1200);
      getUserTotalTime();
      startTimer(0);
      room1woodFunc();
      break;
    case "fire":
      goToSection(document.querySelector<HTMLElement>("#room2Fire")!, 1200);
      getUserTotalTime();
      startTimer(0);
      room2fireFunc();
      break;
    case "earth":
      goToSection(document.querySelector<HTMLElement>("#room3Earth")!, 1200);
      getUserTotalTime();
      startTimer(0);
      room3earthFunc();
      break;
    case "metal":
      goToSection(document.querySelector<HTMLElement>("#room4Metal")!, 1200);
      getUserTotalTime();
      startTimer(0);
      room4metalFunc();
      break;
    case "water":
      goToSection(document.querySelector<HTMLElement>("#room5Water")!, 1200);
      getUserTotalTime();
      startTimer(0);
      room5waterFunc();
      break;
    case "final":
      goToSection(document.querySelector<HTMLElement>("#finalRoom")!, 1200);
      getUserTotalTime();
      room6finalFunc();
      break;
  } // switch END
} // continueGame END

function initWelcomeParticles(): void {
  const welcomeSection = document.querySelector<HTMLElement>("#welcomePage");
  if (!welcomeSection) return;

  const particlesWrap =
    welcomeSection.querySelector<HTMLDivElement>(".welcomeParticles");
  if (!particlesWrap) return;

  // Prevent duplicate particles if the page is initialized again
  if (particlesWrap.childElementCount > 0) return;

  for (let i = 0; i < 12; i++) {
    const particle = document.createElement("div");
    particle.className = "welcomeParticle";

    // Same feeling as the wood room, but with a cooler tone from the SCSS color
    const size = 2 + Math.random() * 6; // 2px–8px
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    // Start position slightly lower on the screen
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${60 + Math.random() * 40}%`;

    // Movement speed + flicker timing
    const floatSeconds = 14 + Math.random() * 12; // 6–16s
    const flickerSeconds = 3.5 + Math.random() * 2.5; // 1.5–4s

    particle.style.animationDuration = `${floatSeconds}s, ${flickerSeconds}s`;
    particle.style.animationDelay = `${Math.random() * 4}s, ${Math.random() * 2}s`;

    particlesWrap.appendChild(particle);
  }
}
