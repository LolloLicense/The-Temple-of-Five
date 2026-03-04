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

// Holds the timeout id for splash - loginloop so we can cancel
let splashToLoginTimeoutId: number | null = null;
// Holds the timeout id for "logout + splash + login-loop so we can cancel
let logoutToLoginTimeoutId: number | null = null;
// Prevents double listeners if initLoginFlow runs again (HMR etc.)
let loginFlowListenersBound = false;

let onLoginSubmitHandler: ((e: SubmitEvent) => void) | null = null;

//-----------------------------------------------------------
//-------------- Transitions "loop" CLEANUP-----------------
//-----------------------------------------------------------

function clearLoginFlowTimeouts(): void {
  // local function
  // Cancel the splash + login loop /timer if it's running
  if (splashToLoginTimeoutId !== null) {
    window.clearTimeout(splashToLoginTimeoutId);
    splashToLoginTimeoutId = null;
  } // Cancel the logout + splash + login- loop / timer -if it's running
  if (logoutToLoginTimeoutId !== null) {
    window.clearTimeout(logoutToLoginTimeoutId);
    logoutToLoginTimeoutId = null;
  }
}

export function initLoginFlow(): void {
  clearLoginFlowTimeouts();

  //-----------------------------------------------------------
  //------------------------- DOM -----------------------------
  //-----------------------------------------------------------

  const splashSection: HTMLElement | null =
    document.querySelector("#splashPage");
  const loginSection: HTMLElement | null = document.querySelector("#loginPage");
  const welcomeSection: HTMLElement | null =
    document.querySelector("#welcomePage");

  if (!splashSection || !loginSection || !welcomeSection) return;
  hideGameHeader();

  // When user logges in : show welcome: Unsername
  const welcomeNameEl =
    welcomeSection.querySelector<HTMLElement>(".userNameValue");

  function renderWelcomeName(): void {
    const name = getUserName();
    if (welcomeNameEl) {
      welcomeNameEl.textContent = name ? name : "";
    }
  }

  //-----------------------------------------------------------
  //---STOP Listeners to run x2 if initLoginFlow runs again----
  //-----------------------------------------------------------

  if (!loginFlowListenersBound) {
    loginFlowListenersBound = true;

    //-----------------------------------------------------------
    //------------------ LOGOUT STUFF ---------------------------
    //-----------------------------------------------------------

    document.addEventListener("exit:logout", () => {
      clearLoginFlowTimeouts();
      // Login state is false now
      logoutUser();

      // return to spalshpage after logout and clear inputs i exitdialog
      const input = document.querySelector<HTMLInputElement>("#userName");
      if (input) input.value = "";

      hideGameHeader();
      // change page
      const fromPage = getCurrentPage() ?? welcomeSection;
      // fade to splashpage after logging out and then the normal flow
      if (fromPage !== splashSection) {
        transitSections(fromPage, splashSection, 1200);
      } else {
        showSection(splashSection);
      }

      revealSplashHeading(600);
      logoutToLoginTimeoutId = window.setTimeout(() => {
        transitSections(splashSection, loginSection, 2000);
      }, 4000);
    });

    //-----------------------------------------------------------
    //------------------ LEAVE ROOM STUFF -----------------------
    //-----------------------------------------------------------

    document.addEventListener("exit:leaveRoom", () => {
      // Stops the splash & login from popping up when leaving room
      clearLoginFlowTimeouts();
      // Hide the in-game header when leaving a room
      hideGameHeader();

      // Find what’s currently visible
      let fromPage = getCurrentPage();
      if (!fromPage || fromPage === welcomeSection) {
        fromPage =
          document.querySelector<HTMLElement>("main > section:not(.hidden)") ??
          welcomeSection;
      }
      if (fromPage === welcomeSection) {
        // Avoid fading welcome -> welcome
        showSection(welcomeSection);
        return;
      }
      //Always land on welcomepage
      transitSections(fromPage, welcomeSection, 1200);
    });
  }
  //-----------------------------------------------------------
  //--------------- background img from json ------------------
  //-----------------------------------------------------------

  splashSection.style.backgroundImage = `url("${dataJSON.splash.backgroundImg}")`;
  loginSection.style.backgroundImage = `url("${dataJSON.login.backgroundImg}")`;
  welcomeSection.style.backgroundImage = `url("${dataJSON.welcome.backgroundImg}")`;

  // --- RESET START STATE
  const pages = [splashSection, loginSection, welcomeSection];
  pages.forEach((p) => {
    p.classList.add("hidden");
    p.classList.remove("isVisible");
  });
  // show splash directly
  splashSection.classList.remove("hidden");

  //-----------------------------------------------------------
  //------------------ Skip login if saved --------------------
  //-----------------------------------------------------------

  const savedUser = getUserName();
  // if user has logged in befor and not logged out
  if (isLoggedIn() && savedUser) {
    renderWelcomeName();
    showSection(welcomeSection);
    return;
  }

  //-----------------------------------------------------------
  //------------------ SPLASH + LOGIN -------------------------
  //-----------------------------------------------------------

  // show splash
  showSection(splashSection);
  // fade in title on splash after 600ms
  revealSplashHeading(600);

  // after ... ms - hide splash and show login
  splashToLoginTimeoutId = window.setTimeout(() => {
    transitSections(splashSection, loginSection, 2000);
    splashToLoginTimeoutId = null; // reset id arfter it runs
  }, 4000);

  //-----------------------------------------------------------
  //------------------ LOGIN SUBMIT ---------------------------
  //-----------------------------------------------------------

  // Find the login form in the DOM
  const form = document.querySelector<HTMLFormElement>("#loginForm");
  if (!form) return;
  if (form) {
    // Create ONE submit (login) handler function
    if (!onLoginSubmitHandler) {
      onLoginSubmitHandler = onLoginSubmitFactory(
        loginSection,
        welcomeSection,
        renderWelcomeName,
      );
    }

    form.removeEventListener("submit", onLoginSubmitHandler as EventListener);
    form.addEventListener("submit", onLoginSubmitHandler);
  }
}

//-----------------------------------------------------------
//------------------ LOGIN SUBMIT Local function ------------
//-----------------------------------------------------------

// This function creates the submit function.
//reuses the same submit function, and avoid duplicates.
function onLoginSubmitFactory(
  // the sections and functions thats used for login
  loginSection: HTMLElement,
  welcomeSection: HTMLElement,
  renderWelcomeName: () => void,
) {
  console.count("LOGIN SUBMIT fired");
  // Return the submit function inside initLoginFlow
  return function onLoginSubmit(e: SubmitEvent): void {
    e.preventDefault(); // stop the page from reloading
    //login form
    const form = e.currentTarget;
    if (!(form instanceof HTMLFormElement)) return;
    // loginform input
    const input = form.querySelector<HTMLInputElement>("#userName");
    if (!input) return;

    const name = input.value.trim();
    if (!name) return;
    //saving the user that logged in
    saveUserName(name);
    // Logged in user ---> localstorage
    setLoggedIn(true);

    renderWelcomeName(); // updt welcome page with correct username
    clearLoginFlowTimeouts(); // Stop old flow so so doubble login
    transitSections(loginSection, welcomeSection, 1200); // trigger trasit
  };
}
