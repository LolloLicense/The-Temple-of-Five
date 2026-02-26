import * as dataJSON from "../../data.json";
import { getUserName, saveUserName, isLoggedIn, setLoggedIn, logoutUser } from "./storage";
import { transitSections, showSection, revealSplashHeading, getCurrentPage } from "./transitions";
import { hideGameHeader } from "./gameHeader";


export function initLoginFlow(): void {

    //-----------------------------------------------------------
    //------------------------- DOM -----------------------------
    //-----------------------------------------------------------

    const splashSection: HTMLElement | null = document.querySelector("#splashPage");
    const loginSection: HTMLElement | null = document.querySelector("#loginPage")
    const welcomeSection: HTMLElement | null = document.querySelector("#welcomePage");

    if(!splashSection || !loginSection || !welcomeSection) return;

    // When user logges in : show welcome: Unsername
    const welcomeNameEl = welcomeSection.querySelector<HTMLElement>(".userNameValue");

    function renderWelcomeName(): void {
    const name = getUserName();
        if (welcomeNameEl) {
            welcomeNameEl.textContent = name ? name : "";
        }
    }


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
        let fromPage = getCurrentPage() ?? welcomeSection;
            // fade to splashpage after logging out and then the normal flow
            if (fromPage !== splashSection) {
            transitSections(fromPage, splashSection, 1200);
            } else {
            showSection(splashSection);
            }
            
        revealSplashHeading(600);
         window.setTimeout(() => {
            transitSections(splashSection, loginSection, 2000);
        }, 4000);
    });

    //-----------------------------------------------------------
    //------------------ LEAVE ROOM STUFF -----------------------
    //-----------------------------------------------------------

    document.addEventListener("exit:leaveRoom", () => {
        // Hide the in-game header when leaving a room
        hideGameHeader();

        // Find what’s currently visible
        let fromPage = getCurrentPage();
        if (!fromPage || fromPage === welcomeSection) {
          fromPage = document.querySelector<HTMLElement>("main > section:not(.hidden)") ?? welcomeSection;
        } if (fromPage === welcomeSection) { // Avoid fading welcome -> welcome
          showSection(welcomeSection);
          return;
        }
        //Always land on welcomepage
        transitSections(fromPage, welcomeSection, 1200);
      });
    //-----------------------------------------------------------
    //--------------- background img from json ------------------
    //-----------------------------------------------------------

    splashSection.style.backgroundImage = `url("${dataJSON.splash.backgroundImg}")`;
    loginSection.style.backgroundImage = `url("${dataJSON.login.backgroundImg}")`;
    welcomeSection.style.backgroundImage = `url("${dataJSON.welcome.backgroundImg}")`

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
    window.setTimeout(() => {
        transitSections(splashSection, loginSection, 2000);
    }, 4000);


    //-----------------------------------------------------------
    //------------------ LOGIN SUBMIT ---------------------------
    //-----------------------------------------------------------

    const form = document.querySelector<HTMLFormElement>("#loginForm");
    const input = document.querySelector<HTMLInputElement>("#userName")

    if (form && input) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            

            const name = input.value.trim();
            if (!name) return; 

            saveUserName(name);
            setLoggedIn(true);
            // updt to welcome: name
            renderWelcomeName();

            // When logged in -- show welcomepage
            transitSections(loginSection, welcomeSection, 1200);
        }) ;  
    }
}