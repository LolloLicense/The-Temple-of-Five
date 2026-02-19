import { syncMutedFromToggle } from "./audioManager"

let muted = true;   // mute as default

export function isMuted(): boolean {    // returns the current state of muted
  return muted;
}

export function toggleMuted(): boolean {    // toggles the state of muted and returns the new state
  muted = !muted;   // if true, set to false; if false, set to true
  return muted;   // returns the new state of muted
}

export function initSoundToggle(): void {   // initializes the sound toggle button and its function
  const toggleSoundBtn =
    document.querySelector<HTMLButtonElement>("#toggleSoundBtn");

  const soundIconActive =
    document.querySelector<SVGElement>("#soundIconActive");

  const soundIconInactive =
    document.querySelector<SVGElement>("#soundIconInactive");

  if (!toggleSoundBtn) return;

  const btn = toggleSoundBtn;

  function renderSoundIcons(): void {   // if muted is true, add "hidden" class to soundIconActive; if muted is false, remove "hidden" class from soundIconActive

    soundIconActive?.classList.toggle("hidden", muted);
    soundIconInactive?.classList.toggle("hidden", !muted);

    btn.setAttribute("aria-pressed", String(muted));
    btn.setAttribute("aria-label", muted ? "Sound on" : "Sound off");
  }

  // Initial render (mute default)
  renderSoundIcons();

  toggleSoundBtn.addEventListener("click", async () => {    // when the toggleSoundBtn is clicked, toggle the state of muted and log the new state to the console, then update the sound icons
    const nextMuted = toggleMuted();

    console.log(`Sound is ${nextMuted ? "off" : "on"}`);

    await syncMutedFromToggle();   // sync the muted state with the audio manager

    renderSoundIcons();
  });
}