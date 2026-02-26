import * as dataJSON from "../../data.json";

import { getUserName, saveUserName, isLoggedIn, setLoggedIn, logoutUser } from "./storage";

import { transitSections, showSection, revealSplashHeading } from "./transitions";

export function initLoginFlow(): void {

    //-----------------------------------------------------------
    //------------------------- DOM -----------------------------
    //-----------------------------------------------------------

    const splashSection: HTMLElement | null = document.querySelector("#splashPage");
    const loginSection: HTMLElement | null = document.querySelector("#loginPage")
    const welcomeSection: HTMLElement | null = document.querySelector("#welcomePage");

    if(!splashSection || !loginSection || !welcomeSection) return;

    //-----------------------------------------------------------
    //--------------- background img from json ------------------
    //-----------------------------------------------------------

    splashSection.style.backgroundImage = `url("${dataJSON.splash.backgroundImg}")`;
    loginSection.style.backgroundImage = `url("${dataJSON.login.backgroundImg}")`;
    welcomeSection.style.backgroundImage = `url("${dataJSON.welcome.backgroundImg}")`

    // --- RESET START STATE 
    const pages = [loginSection, welcomeSection];
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

            // When logged in -- show welcomepage
            transitSections(loginSection, welcomeSection, 1200);
        }) ;  
    }
}