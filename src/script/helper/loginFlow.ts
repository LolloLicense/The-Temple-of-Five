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

  const form = document.querySelector<HTMLFormElement>("#loginForm");
  const input = document.querySelector<HTMLInputElement>("#userName");
  // Submitting username , saving
  if (form && input) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = input.value.trim();
      if (!name) return;

      saveUserName(name);
      setLoggedIn(true);
      // updt to welcome: name
      renderWelcomeName();
      // Stop any pending splash/logout transitions from firing later
      clearLoginFlowTimeouts();
      // When logged in -- show welcomepage
      transitSections(loginSection, welcomeSection, 1200);
    });
  }
}
