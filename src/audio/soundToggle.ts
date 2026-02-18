let muted = true;   // mute as default

export function isMuted(): boolean {    // returns the current state of muted
  return muted;
}

export function setMuted(nextMuted: boolean): void {   // sets the state of muted to the value of nextMuted
  muted = nextMuted;
}

export function toggleMuted(): boolean {    // toggles the state of muted and returns the new state
  muted = !muted;   // if true, set to false; if false, set to true
  return muted;   // returns the new state of muted
}

export function initSoundToggle(): void {   // initializes the sound toggle button and its function
  const toggleSoundBtn =
    document.querySelector<HTMLElement>("#toggleSoundBtn");

  const soundIconActive =
    document.querySelector<HTMLElement>("#soundIconActive");

  const soundIconInactive =
    document.querySelector<HTMLElement>("#soundIconInactive");

  if (!toggleSoundBtn) return;

  function renderSoundIcons(): void {   // if muted is true, add "hidden" class to soundIconActive; if muted is false, remove "hidden" class from soundIconActive

    soundIconActive?.classList.toggle("hidden", muted);
    soundIconInactive?.classList.toggle("hidden", !muted);
  }

  // Initial render (mute default)
  renderSoundIcons();

  toggleSoundBtn.addEventListener("click", () => {    // when the toggleSoundBtn is clicked, toggle the state of muted and log the new state to the console, then update the sound icons
    const next = toggleMuted();

    console.log(`Sound is ${next ? "off" : "on"}`);

    renderSoundIcons();
  });
}