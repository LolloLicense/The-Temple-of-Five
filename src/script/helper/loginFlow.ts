import * as dataJSON from "../../data.json";
import { hideGameHeader } from "./gameHeader";
import {
  getUserName,
  isLoggedIn,
  logoutUser,
  saveUserName,
  setLoggedIn,
} from "./storage";
import {
  getCurrentPage,
  revealSplashHeading,
  showSection,
  transitSections,
} from "./transitions";

//-----------------------------------------------------------
//------------------------- STATES --------------------------
//-----------------------------------------------------------

// Timeout-ID för splash → login-flödet
let splashToLoginTimeoutId: number | null = null;

// Timeout-ID för logout → splash → login-flödet
let logoutToLoginTimeoutId: number | null = null;

//-----------------------------------------------------------
//-------------- Transitions "loop" CLEANUP------------------
//-----------------------------------------------------------

// Funktion som avbryter alla pågående timeouts
function clearLoginFlowTimeouts(): void {
  // Avbryt splash→login timeout om den finns
  if (splashToLoginTimeoutId !== null) {
    window.clearTimeout(splashToLoginTimeoutId);
    splashToLoginTimeoutId = null;
  }

  // Avbryt logout→splash→login timeout om den finns
  if (logoutToLoginTimeoutId !== null) {
    window.clearTimeout(logoutToLoginTimeoutId);
    logoutToLoginTimeoutId = null;
  }
}

//-----------------------------------------------------------
//------------------ LOGOUT HANDLER -------------------------
//-----------------------------------------------------------

// Körs när eventet "exit:logout" triggas
function handleLogout(): void {
  // Stoppa alla timeouts så inget gammalt flöde körs
  clearLoginFlowTimeouts();

  // Rensa login-state i localStorage
  logoutUser();

  // Töm inputfältet i login-formuläret
  const input = document.querySelector<HTMLInputElement>("#userName");
  if (input) input.value = "";

  // Dölj headern
  hideGameHeader();

  // Hämta sektionerna
  const splashSection = document.querySelector<HTMLElement>("#splashPage")!;
  const loginSection = document.querySelector<HTMLElement>("#loginPage")!;
  const welcomeSection = document.querySelector<HTMLElement>("#welcomePage")!;

  // Hitta aktuell sida (fallback = welcome)
  const fromPage = getCurrentPage() ?? welcomeSection;

  // Om vi inte redan är på splash → fade dit
  if (fromPage !== splashSection) {
    transitSections(fromPage, splashSection, 1200);
  } else {
    // Annars visa splash direkt
    showSection(splashSection);
  }

  // Visa splash-titeln efter 600ms
  revealSplashHeading(600);

  // Efter 4 sek → gå från splash till login
  logoutToLoginTimeoutId = window.setTimeout(() => {
    transitSections(splashSection, loginSection, 2000);
  }, 4000);
}

//-----------------------------------------------------------
//------------------ LEAVE ROOM HANDLER ---------------------
//-----------------------------------------------------------

// Körs när eventet "exit:leaveRoom" triggas
function handleLeaveRoom(): void {
  // Stoppa alla timeouts
  clearLoginFlowTimeouts();

  // Dölj headern
  hideGameHeader();

  // Hämta welcome-sidan
  const welcomeSection = document.querySelector<HTMLElement>("#welcomePage")!;

  // Hitta aktuell sida
  let fromPage = getCurrentPage();

  // Om ingen sida hittas → ta första synliga sektionen
  if (!fromPage || fromPage === welcomeSection) {
    fromPage =
      document.querySelector<HTMLElement>("main > section:not(.hidden)") ??
      welcomeSection;
  }

  // Om vi redan är på welcome → gör inget
  if (fromPage === welcomeSection) {
    showSection(welcomeSection);
    return;
  }

  // Annars fade till welcome
  transitSections(fromPage, welcomeSection, 1200);
}

//-----------------------------------------------------------
//------------------ LOGIN SUBMIT HANDLER -------------------
//-----------------------------------------------------------

// Körs när användaren skickar login-formuläret
function onLoginSubmit(e: SubmitEvent): void {
  // Stoppa formens default reload
  e.preventDefault();

  // Hämta formuläret
  const form = e.currentTarget as HTMLFormElement;

  // Hämta inputfältet
  const input = form.querySelector<HTMLInputElement>("#userName");
  if (!input) return;

  // Trimma namnet
  const name = input.value.trim();
  if (!name) return;

  // Spara användarnamnet i localStorage
  saveUserName(name);

  // Markera användaren som inloggad
  setLoggedIn(true);

  // Hämta welcome-sidan
  const welcomeSection = document.querySelector<HTMLElement>("#welcomePage")!;
  const loginSection = document.querySelector<HTMLElement>("#loginPage")!;

  // Sätt användarnamnet i welcome-sidan
  const welcomeNameEl = welcomeSection.querySelector<HTMLElement>(".userNameValue");
  if (welcomeNameEl) welcomeNameEl.textContent = name;

  // Stoppa eventuella timeouts
  clearLoginFlowTimeouts();

  // Fade från login → welcome
  transitSections(loginSection, welcomeSection, 1200);
}

//-----------------------------------------------------------
//------------------ BIND LISTENERS (ONCE) ------------------
//-----------------------------------------------------------

// Bind logout-eventet EN gång
document.addEventListener("exit:logout", handleLogout);

// Bind leaveRoom-eventet EN gång
document.addEventListener("exit:leaveRoom", handleLeaveRoom);

// Bind login-submit EN gång
const loginForm = document.querySelector<HTMLFormElement>("#loginForm");
if (loginForm) loginForm.addEventListener("submit", onLoginSubmit);

//-----------------------------------------------------------
//------------------ INIT LOGIN FLOW ------------------------
//-----------------------------------------------------------

// Körs när loginflödet ska startas (t.ex. vid sidladdning)
export function initLoginFlow(): void {
  // Stoppa gamla timeouts
  clearLoginFlowTimeouts();

  // Hämta sektionerna
  const splashSection = document.querySelector<HTMLElement>("#splashPage")!;
  const loginSection = document.querySelector<HTMLElement>("#loginPage")!;
  const welcomeSection = document.querySelector<HTMLElement>("#welcomePage")!;

  // Dölj headern
  hideGameHeader();

  // Sätt bakgrundsbilder från JSON
  splashSection.style.backgroundImage = `url("${dataJSON.splash.backgroundImg}")`;
  loginSection.style.backgroundImage = `url("${dataJSON.login.backgroundImg}")`;
  welcomeSection.style.backgroundImage = `url("${dataJSON.welcome.backgroundImg}")`;

  // Dölj alla sidor och nollställ state
  [splashSection, loginSection, welcomeSection].forEach((p) => {
    p.classList.add("hidden");
    p.classList.remove("isVisible");
  });

  // Hämta ev. sparad användare
  const savedUser = getUserName();

  // Om användaren redan är inloggad → hoppa direkt till welcome
  if (isLoggedIn() && savedUser) {
    const welcomeNameEl = welcomeSection.querySelector<HTMLElement>(".userNameValue");
    if (welcomeNameEl) welcomeNameEl.textContent = savedUser;

    showSection(welcomeSection);
    return;
  }

  // Visa splash-sidan
  showSection(splashSection);

  // Fade in splash-titeln
  revealSplashHeading(600);

  // Efter 4 sek → gå till login (om vi fortfarande är på splash)
  splashToLoginTimeoutId = window.setTimeout(() => {
    if (getCurrentPage() !== splashSection) return;
    if (isLoggedIn() && getUserName()) return;

    transitSections(splashSection, loginSection, 1200);
  }, 4000);
}
