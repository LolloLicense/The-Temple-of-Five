/**
 * transitions.ts
 *
 * Gemensam helper för att visa och byta mellan sektioner.
 *
 * Tanken:
 * - showSection() används när vi bara vill visa en sektion direkt
 * - goToSection() används när vi vill byta från nuvarande sida till nästa
 * - helpern håller själv reda på currentPage
 *
 * Då slipper varje rum själv leta upp "fromPage".
 */

//-----------------------------------------------------------
//------------------- CURRENT PAGE STATE --------------------
//-----------------------------------------------------------

// Håller reda på vilken sektion som just nu är aktiv
let currentPage: HTMLElement | null = null;

// Låser nya transitions medan en redan pågår
let isTransitioning = false;

/**
 * Sparar vilken sida som just nu är aktiv.
 */
function setCurrentPage(page: HTMLElement): void {
  currentPage = page;
}

/**
 * Returnerar aktuell aktiv sida.
 * Bra att ha kvar om något rum senare verkligen behöver läsa den.
 */
export function getCurrentPage(): HTMLElement | null {
  return currentPage;
}

//-----------------------------------------------------------
//------------------- FIND ACTIVE PAGE ----------------------
//-----------------------------------------------------------

/**
 * Försöker hitta aktiv sida.
 *
 * 1. Använd currentPage om vi redan har den
 * 2. Annars leta i DOM efter en sektion som är synlig
 */
function getActivePage(): HTMLElement | null {
  if (currentPage) return currentPage;

  return document.querySelector<HTMLElement>("main > section.page.isVisible");
}

//-----------------------------------------------------------
//------------------- SHOW SECTION DIRECT -------------------
//-----------------------------------------------------------

/**
 * Visar en sektion direkt.
 *
 * Används när:
 * - sidan laddas första gången
 * - det inte finns någon tidigare sida att fada från
 */
export function showSection(
  section: HTMLElement,
  visibleClass = "isVisible",
): void {
  // Se till att sektionen faktiskt renderas
  section.classList.remove("hidden");

  // Nästa frame -> lägg på synlighetsklass så CSS-transition kan triggas
  requestAnimationFrame(() => {
    section.classList.add(visibleClass);
  });

  // Spara sektionen som aktuell sida
  setCurrentPage(section);
}

//-----------------------------------------------------------
//------------------- HIDE SECTION DIRECT -------------------
//-----------------------------------------------------------

/**
 * Döljer en sektion med fade out.
 *
 * Den här kan vara bra att ha kvar om du vill dölja en sektion
 * utan att direkt visa en ny.
 */
export function hideSection(
  section: HTMLElement,
  durationMs = 600,
  visibleClass = "isVisible",
): void {
  // Ta bort synlighetsklass -> startar fade out i CSS
  section.classList.remove(visibleClass);

  // Efter animationen: dölj helt
  window.setTimeout(() => {
    section.classList.add("hidden");
  }, durationMs);
}

//-----------------------------------------------------------
//------------------- GO TO SECTION -------------------------
//-----------------------------------------------------------

/**
 * Byter från aktuell sida till nästa sida.
 *
 * Helpern:
 * - hittar själv "from"-sidan
 * - visar nästa sektion
 * - fadar ut föregående sektion
 * - uppdaterar currentPage
 *
 * Detta är den funktion som rummen helst ska använda framöver.
 */
export function goToSection(
  to: HTMLElement,
  durationMs = 1200,
  visibleClass = "isVisible",
): void {
  // Stoppa nya transitions medan en redan körs
  if (isTransitioning) return;

  // Hitta nuvarande aktiv sida
  const from = getActivePage();

  // Om det inte finns någon aktiv sida ännu -> visa direkt
  if (!from) {
    showSection(to, visibleClass);
    return;
  }

  // Om vi redan är på samma sida -> säkerställ bara att den syns
  if (from === to) {
    showSection(to, visibleClass);
    return;
  }

  isTransitioning = true;

  // Förbered nästa sida så att den finns i DOM innan faden startar
  to.classList.remove("hidden");

  // Tvinga nästa sida till startläge
  to.classList.remove(visibleClass);

  // Denna sida blir nu vår nya currentPage
  setCurrentPage(to);

  // Starta fade in på nästa sida
  requestAnimationFrame(() => {
    to.classList.add(visibleClass);

    // Starta fade out på föregående sida i nästa frame
    requestAnimationFrame(() => {
      from.classList.remove(visibleClass);
    });
  });

  // När transitionen är klar -> dölj gamla sidan helt
  window.setTimeout(() => {
    from.classList.add("hidden");
    isTransitioning = false;
  }, durationMs);
}

//-----------------------------------------------------------
//------------------- BACKWARD COMPAT -----------------------
//-----------------------------------------------------------

/**
 * Behåller gamla namnet transitSections tills vi hunnit uppdatera alla rum.
 *
 * Den här wrappern gör att gammal kod fortfarande fungerar,
 * men internt använder vi nu goToSection().
 */
export function transitSections(
  from: HTMLElement,
  to: HTMLElement,
  durationMs = 1200,
  visibleClass = "isVisible",
): void {
  // Vi ignorerar "from"-argumentet i nya logiken,
  // eftersom helpern själv hittar aktiv sida.
  void from;

  goToSection(to, durationMs, visibleClass);
}

//-----------------------------------------------------------
//-------------- SPLASH HEADING FADE HELPERS ----------------
//-----------------------------------------------------------

/**
 * Fade in splash-rubrik efter liten delay.
 */
export function revealSplashHeading(delayMs = 200): void {
  const splashHeading = document.querySelector<HTMLElement>(".splashHeading");
  if (!splashHeading) return;

  window.setTimeout(() => {
    splashHeading.classList.add("isVisible");
  }, delayMs);
}

/**
 * Fade out splash-rubrik.
 */
export function hideSplashHeading(delayMs = 0): void {
  const splashHeading = document.querySelector<HTMLElement>(".splashHeading");
  if (!splashHeading) return;

  window.setTimeout(() => {
    splashHeading.classList.remove("isVisible");
  }, delayMs);
}
