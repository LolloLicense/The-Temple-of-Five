/**
 * show / hide gameHeader (not visibe in welcomepage)
 * showGameHeader = show gameHeader in all rooms
 * hideGameHeader = hide for all other pages
 */

export function showGameHeader(): void {
  const gameHeader = document.querySelector<HTMLElement>("#gameHeader");
  if (!gameHeader) return;
  gameHeader.classList.remove("hidden");
}

export function hideGameHeader(): void {
  const gameHeader = document.querySelector<HTMLElement>("#gameHeader");
  if (!gameHeader) return;

  gameHeader.classList.add("hidden");
}
