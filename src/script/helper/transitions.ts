/**
 * Change section whit fade
 * remove hidden on next page
 * triger fade in function
 * remove fade-class and hide it after transition
 */

//-----------------------------------------------------------
//------------------- Current page UI -----------------------
//-----------------------------------------------------------
let currentPage: HTMLElement | null = null;

function setCurrentPage(page: HTMLElement): void {
  currentPage = page;
}

export function getCurrentPage(): HTMLElement | null {
  return currentPage;
}

//-----------------------------------------------------------
//--------------- Showing section with fade in --------------
//-----------------------------------------------------------

export function showSection(
  section: HTMLElement,
  visibleClass = "isVisible",
): void {
  // make it "render"
  section.classList.remove("hidden");
  // trigger css transition
  requestAnimationFrame(() => {
    section.classList.add(visibleClass);
  });
  // keeping track of current active page
  setCurrentPage(section);
}

//-----------------------------------------------------------
//----------- Hide section with fade out --------------------
//-----------------------------------------------------------

export function hideSection(
  section: HTMLElement,
  durationMs = 600,
  visibleClass = "isVisible",
): void {
  section.classList.remove(visibleClass);

  window.setTimeout(() => {
    section.classList.add("hidden");
  }, durationMs);
}

//-----------------------------------------------------------
//--------- Transition to next sections with fade -----------
//-----------------------------------------------------------

export function transitSections(
  from: HTMLElement,
  to: HTMLElement,
  durationMs = 1300,
  visibleClass = "isVisible",
): void {
  // Show next page
  to.classList.remove("hidden");
  setCurrentPage(to);
  // start fade-in on nex page
  requestAnimationFrame(() => {
    to.classList.add(visibleClass);
    //start fade-out on current page
    requestAnimationFrame(() => {
      from.classList.remove(visibleClass);
    });
  });

  // hide previous
  window.setTimeout(() => {
    from.classList.add("hidden");
  }, durationMs);
}

//-----------------------------------------------------------
//-------------- Splash heading fade in----------------------
//-----------------------------------------------------------

export function revealSplashHeading(delayMs = 200): void {
  const splashHeading = document.querySelector<HTMLElement>(".splashHeading");
  if (!splashHeading) return;

  window.setTimeout(() => {
    splashHeading.classList.add("isVisible");
  }, delayMs);
}

// Fade OUT splash heading
export function hideSplashHeading(delayMs = 0): void {
  const splashHeading = document.querySelector<HTMLElement>(".splashHeading");
  if (!splashHeading) return;

  window.setTimeout(() => {
    splashHeading.classList.remove("isVisible");
  }, delayMs);
}
