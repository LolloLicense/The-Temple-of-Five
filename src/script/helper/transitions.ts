// import { playSfx } from "../../audio/index.ts"; TODO

/**
 * transitions.ts
 *
 * Gemensam helper för att visa och byta mellan sektioner.
 *
 * Tanke:
 * - showSection() används när vi bara vill visa en sektion direkt
 * - goToSection() används när vi vill byta från nuvarande sida till nästa
 * - helpern håller själv reda på currentPage
 *
 * Då slipper varje rum själv leta upp "fromPage".
 */

//-----------------------------------------------------------
//------------------- CURRENT PAGE STATE --------------------
//-----------------------------------------------------------

// keeps in mid what sections is current
let currentPage: HTMLElement | null = null;

// Lock trasition while ongoing
let isTransitioning = false;

/**
 * Saves the active/ current page
 */
function setCurrentPage(page: HTMLElement): void {
  currentPage = page;
}

// Returns currentpage
export function getCurrentPage(): HTMLElement | null {
  return currentPage;
}

//-----------------------------------------------------------
//------------------- FIND ACTIVE PAGE ----------------------
//-----------------------------------------------------------

// finds out what section currently has .isVisible
function getActivePage(): HTMLElement | null {
  if (currentPage) return currentPage;

  return document.querySelector<HTMLElement>("main > section.page.isVisible");
}

//-----------------------------------------------------------
//------------------- SHOW SECTION DIRECT -------------------
//-----------------------------------------------------------

//showSection directly
export function showSection(
  section: HTMLElement,
  visibleClass = "isVisible",
): void {
  // make sure sections removes hidden
  section.classList.remove("hidden");

  // conects the page.isVisible opactiy scss
  requestAnimationFrame(() => {
    section.classList.add(visibleClass);
  });

  // makes section current
  setCurrentPage(section);
}

//-----------------------------------------------------------
//------------------- HIDE SECTION DIRECT -------------------
//-----------------------------------------------------------

// Hides section with fade out
export function hideSection(
  section: HTMLElement,
  durationMs = 600,
  visibleClass = "isVisible",
): void {
  // removes opacity 0 and trigger opacity 1 scss
  section.classList.remove(visibleClass);

  // after animation add hidden
  window.setTimeout(() => {
    section.classList.add("hidden");
  }, durationMs);
}

//-----------------------------------------------------------
//------------------- GO TO SECTION -------------------------
//-----------------------------------------------------------

// makes the switch from currentpage to next page
export function goToSection(
  to: HTMLElement,
  durationMs = 1200,
  visibleClass = "isVisible",
): void {
  if (isTransitioning) return;

  // find / get current page/section
  const from = getActivePage();

  // if no page is active / current - show right away
  if (!from) {
    showSection(to, visibleClass);
    return;
  }

  // make sure section is showed
  if (from === to) {
    showSection(to, visibleClass);
    return;
  }

  isTransitioning = true;
  // void playSfx("sfx_transition"); TODO

  // prepp next page by removing display none
  to.classList.remove("hidden");

  // trigger next page to transition
  to.classList.remove(visibleClass);

  // and then set the next page as currentPage
  setCurrentPage(to);

  // Staring fade-in
  requestAnimationFrame(() => {
    to.classList.add(visibleClass);

    // start fade out on previous page
    requestAnimationFrame(() => {
      from.classList.remove(visibleClass);
    });
  });

  // when trasition is done - add display:none to previous page
  window.setTimeout(() => {
    from.classList.add("hidden");
    isTransitioning = false;
  }, durationMs);
}

//-----------------------------------------------------------
//-------------- SPLASH HEADING FADE HELPERS ----------------
//-----------------------------------------------------------

// SPLASHPAGE FADE-IN
export function revealSplashHeading(delayMs = 200): void {
  const splashHeading = document.querySelector<HTMLElement>(".splashHeading");
  if (!splashHeading) return;

  window.setTimeout(() => {
    splashHeading.classList.add("isVisible");
  }, delayMs);
}

// FADE OUT SPLASH
export function hideSplashHeading(delayMs = 0): void {
  const splashHeading = document.querySelector<HTMLElement>(".splashHeading");
  if (!splashHeading) return;

  window.setTimeout(() => {
    splashHeading.classList.remove("isVisible");
  }, delayMs);
}
