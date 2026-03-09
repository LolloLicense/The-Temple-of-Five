import { updateProgressBar } from "./progressbar";
import { resetRunKeepHighscores } from "./storage";
import { getCurrentPage, goToSection, showSection } from "./transitions";

// preventin listerners to multiply
let resetBound = false;

export function initResetButtons(): void {
  // If listeners are already bound, do nothing.
  if (resetBound) return;
  // Mark as bound so we don’t bind twice.
  resetBound = true;

  document.addEventListener("click", (e) => {
    // e.target - saftey so click always takes
    const target = e.target as HTMLElement | null;
    const btn = target?.closest<HTMLButtonElement>(".resetBtn");
    if (!btn) return;

    // only reset current run-state on clickBTN
    resetRunKeepHighscores();
    updateProgressBar();
    // Back to welcome after resetclick - trasiteffect
    const welcome = document.querySelector<HTMLElement>("#welcomePage");
    // Figure out what page is currently visible
    const fromPage =
      getCurrentPage() ??
      document.querySelector<HTMLElement>("main > section.page.isVisible");

    if (welcome && fromPage && fromPage !== welcome) {
      goToSection(welcome, 1200);
    } else if (welcome) {
      showSection(welcome);
    }
  });
}
