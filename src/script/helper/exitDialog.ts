import { stopAll } from  "../../audio/index.ts";

type ExitMode = "welcome" | "room";

let exitDialogBound = false;

export function initExitDialog(): void {
  if (exitDialogBound) return;
  exitDialogBound = true;
  // find exitDialog
  const dialog = document.querySelector<HTMLDialogElement>("#exitDialog");
  if (!dialog) return;
  // find the stuff inside dialog
  const textEl = dialog.querySelector<HTMLElement>(".exitDialogText");
  // Exit btn in gameHeader
  const leaveBtn = dialog.querySelector<HTMLButtonElement>(
    '[data-action="leaveRoom"]',
  );

  // eventlistener to exitBtns in both headers
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;

    // closest element that har "openExitDialog"
    const openBtn = target.closest<HTMLElement>(
      '[data-action="openExitDialog"]',
    );
    if (!openBtn) return;

    // see what mode the button has (type ExitMode & data-set in html)
    const mode = (openBtn.dataset.exitMode as ExitMode) ?? "welcome";
    console.log("openExitDialog clicked. mode =", mode, "openBtn =", openBtn);
    // show the correct content in dialog depending on ExitMode
    if (mode === "welcome") {
      // in welcome-mode only logout option
      if (leaveBtn) leaveBtn.classList.add("hidden");
      if (textEl) textEl.textContent = "Sure you want to log out?";
    } else {
      // in room-mode show both exit room & log out option
      if (leaveBtn) leaveBtn.classList.remove("hidden");
      if (textEl) textEl.textContent = "What do you want to do?";
    }
    dialog.showModal();
  });

  // Listening to click inside dialog
  dialog.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (!(target instanceof HTMLElement)) return;
    const btn = target.closest<HTMLButtonElement>("button");
    if (!btn) return;
    //checking what action is clicked, data-action="logout" = action: logout
    const action = btn.dataset.action;
    if (action === "closeExitDialog") {
      dialog.close();
      return;
    }
    if (action === "logout") {
      dialog.close();
      document.dispatchEvent(new CustomEvent("exit:logout"));
      return;
    }

    if (action === "leaveRoom") {
      dialog.close();
      stopAll(); // Stop music when exit room
      console.log("leave room");
      document.dispatchEvent(new CustomEvent("exit:leaveRoom"));
      return;
    }
  });
  // Close dialog
  dialog.addEventListener("close", () => {
    // här kan du återställa text om du vill (valfritt)
  });
}
