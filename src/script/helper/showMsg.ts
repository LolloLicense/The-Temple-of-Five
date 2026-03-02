//-----------------------------------------------------------
//------------------------ SHOW MSG -------------------------
//-----------------------------------------------------------

/**
 * Shows a short message overlay, then removes it.
 * Used between rooms (success/fail) before transitions.
 */
export function showMsg(message: string, durationMs = 1200): void {
  // Find or create the message element
  let msgEl = document.querySelector<HTMLElement>("#gameMsg");

  if (!msgEl) {
    msgEl = document.createElement("div");
    msgEl.id = "gameMsg";
    msgEl.className = "gameMsg hidden";
    document.body.appendChild(msgEl);
  }

  // Set text
  msgEl.textContent = message;

  // Show (fade in)
  msgEl.classList.remove("hidden");
  requestAnimationFrame(() => {
    msgEl.classList.add("isVisible");
  });

  // Hide after duration (fade out)
  window.setTimeout(() => {
    msgEl.classList.remove("isVisible");

    // Remove from flow after fade
    window.setTimeout(() => {
      msgEl?.classList.add("hidden");
    }, 300);
  }, durationMs);
}
