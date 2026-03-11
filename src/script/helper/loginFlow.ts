import * as dataJSON from "../../data.json";
import { hideGameHeader } from "./gameHeader";
import {
  getUserName,
  isLoggedIn,
  logoutUser,
  resetSingleRoomResult,
  saveUserName,
  setHasActiveRun,
  setLoggedIn,
  setResumeRoom,
  type TRoomId,
} from "./storage";
import {
  getCurrentPage,
  goToSection,
  revealSplashHeading,
  showSection,
} from "./transitions";
import { clearRoomTimerOnLeave, stopTimer } from "./utils";
import { welcomePageFunc } from "../../rooms/welcome/welcomePage";

//-----------------------------------------------------------
//------------------------- STATES --------------------------
//-----------------------------------------------------------

// Timeout id for splash -> login flow
let splashToLoginTimeoutId: number | null = null;

// Timeout id for logout -> splash -> login flow
let logoutToLoginTimeoutId: number | null = null;

//-----------------------------------------------------------
//-------------- TRANSITION FLOW CLEANUP --------------------
//-----------------------------------------------------------

// Function that clears all running timeouts
function clearLoginFlowTimeouts(): void {
  // Clear splash -> login timeout if it exists
  if (splashToLoginTimeoutId !== null) {
    window.clearTimeout(splashToLoginTimeoutId);
    splashToLoginTimeoutId = null;
  }

  // Clear logout -> splash -> login timeout if it exists
  if (logoutToLoginTimeoutId !== null) {
    window.clearTimeout(logoutToLoginTimeoutId);
    logoutToLoginTimeoutId = null;
  }
}

//-----------------------------------------------------------
//------------------ LOGOUT HANDLER -------------------------
//-----------------------------------------------------------

// Runs when the "exit:logout" event is triggered
function handleLogout(): void {
  // Stop all old timeouts so no old flow keeps running
  clearLoginFlowTimeouts();

  // Clear logged-in state in localStorage
  logoutUser();

  // Empty the input field in the login form
  const input = document.querySelector<HTMLInputElement>("#userName");
  if (input) input.value = "";

  // Stop current room timer without saving fail/time-up state
  clearRoomTimerOnLeave();

  // Hide the game header
  hideGameHeader();

  // Get the sections
  const splashSection = document.querySelector<HTMLElement>("#splashPage")!;
  const loginSection = document.querySelector<HTMLElement>("#loginPage")!;
  const welcomeSection = document.querySelector<HTMLElement>("#welcomePage")!;

  // Find current page (fallback = welcome)
  const fromPage = getCurrentPage() ?? welcomeSection;

  // If we are not already on splash -> fade there
  if (fromPage !== splashSection) {
    goToSection(splashSection, 1200);
  } else {
    // Otherwise show splash directly
    showSection(splashSection);
  }

  // Show splash heading after 600ms
  revealSplashHeading(600);

  // After 4 sec -> go from splash to login
  logoutToLoginTimeoutId = window.setTimeout(() => {
    goToSection(loginSection, 2000);
  }, 4000);
}

//-----------------------------------------------------------
//------------------ LEAVE ROOM HANDLER ---------------------
//-----------------------------------------------------------

// Runs when the "exit:leaveRoom" event is triggered
function handleLeaveRoom(e: Event): void {
  const customEvent = e as CustomEvent<{ roomId: string | null }>;
  const roomId = customEvent.detail?.roomId;

  // Stop all timeouts
  clearLoginFlowTimeouts();

  // Pause and save total time for resume
  stopTimer(0);

  // Stop current room timer without triggering fail/time-up state
  clearRoomTimerOnLeave();

  // Hide the header
  hideGameHeader();

  // If we got a roomId, save it as resume room
  // and reset that room so it starts from the beginning next time
  if (roomId) {
    const typedRoomId = roomId as TRoomId;

    setHasActiveRun(true);
    setResumeRoom(typedRoomId);
    resetSingleRoomResult(typedRoomId);
  }

  // Get the welcome page
  const welcomeSection = document.querySelector<HTMLElement>("#welcomePage")!;

  // Find current page
  let fromPage = getCurrentPage();

  // If no page is found -> use first visible section
  if (!fromPage || fromPage === welcomeSection) {
    fromPage =
      document.querySelector<HTMLElement>("main > section:not(.hidden)") ??
      welcomeSection;
  }

  // If we are already on welcome -> do nothing
  if (fromPage === welcomeSection) {
    showSection(welcomeSection);
    return;
  }

  // Otherwise fade to welcome
  goToSection(welcomeSection, 1200);
  welcomePageFunc();
}

//-----------------------------------------------------------
//------------------ LOGIN SUBMIT HANDLER -------------------
//-----------------------------------------------------------

// Runs when the user submits the login form
function onLoginSubmit(e: SubmitEvent): void {
  // Stop default form reload
  e.preventDefault();

  // Get the form
  const form = e.currentTarget as HTMLFormElement;

  // Get the input field
  const input = form.querySelector<HTMLInputElement>("#userName");
  if (!input) return;

  // Trim the name
  const name = input.value.trim();
  if (!name) return;

  // Save user name in localStorage
  saveUserName(name);

  // Mark user as logged in
  setLoggedIn(true);

  // Get the welcome page
  const welcomeSection = document.querySelector<HTMLElement>("#welcomePage")!;
  // const loginSection = document.querySelector<HTMLElement>("#loginPage")!;

  // Put user name into the welcome page
  const welcomeNameEl =
    welcomeSection.querySelector<HTMLElement>(".userNameValue");
  if (welcomeNameEl) welcomeNameEl.textContent = name;

  // Stop old timeouts
  clearLoginFlowTimeouts();

  // Fade from login -> welcome
  goToSection(welcomeSection, 1200);
}

//-----------------------------------------------------------
//------------------ BIND LISTENERS (ONCE) ------------------
//-----------------------------------------------------------

// Bind logout event one time
document.addEventListener("exit:logout", handleLogout);

// Bind leaveRoom event one time
document.addEventListener("exit:leaveRoom", handleLeaveRoom);

// Bind login submit one time
const loginForm = document.querySelector<HTMLFormElement>("#loginForm");
if (loginForm) loginForm.addEventListener("submit", onLoginSubmit);

//-----------------------------------------------------------
//------------------ INIT LOGIN FLOW ------------------------
//-----------------------------------------------------------

// Runs when login flow should start (for example on page load)
export function initLoginFlow(): void {
  // Stop old timeouts
  clearLoginFlowTimeouts();

  // Get the sections
  const splashSection = document.querySelector<HTMLElement>("#splashPage")!;
  const loginSection = document.querySelector<HTMLElement>("#loginPage")!;
  const welcomeSection = document.querySelector<HTMLElement>("#welcomePage")!;

  // Hide the header
  hideGameHeader();

  // Set background images from JSON
  splashSection.style.backgroundImage = `url("${dataJSON.splash.backgroundImg}")`;
  loginSection.style.backgroundImage = `url("${dataJSON.login.backgroundImg}")`;
  welcomeSection.style.backgroundImage = `url("${dataJSON.welcome.backgroundImg}")`;

  // Hide all pages and reset state
  [splashSection, loginSection, welcomeSection].forEach((p) => {
    p.classList.add("hidden");
    p.classList.remove("isVisible");
  });

  // Get saved user if there is one
  const savedUser = getUserName();

  // If user is already logged in -> go straight to welcome
  if (isLoggedIn() && savedUser) {
    const welcomeNameEl =
      welcomeSection.querySelector<HTMLElement>(".userNameValue");
    if (welcomeNameEl) welcomeNameEl.textContent = savedUser;

    showSection(welcomeSection);
    return;
  }

  // Show splash page
  showSection(splashSection);

  // Fade in splash heading
  revealSplashHeading(600);

  // After 4 sec -> go to login (if we are still on splash)
  splashToLoginTimeoutId = window.setTimeout(() => {
    if (getCurrentPage() !== splashSection) return;
    if (isLoggedIn() && getUserName()) return;

    goToSection(loginSection, 1200);
  }, 4000);
}
