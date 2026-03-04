/* -------------------------------------------------------------------------------------------------------------------------------------------------- */
/* ---------------------------------------------------------- SHARE HIGHSCORE ----------------------------------------------------------------------- */
/* -------------------------------------------------------------------------------------------------------------------------------------------------- */

import { getHighscores } from "./highscoreStorage";
import { getUserName } from "../../script/helper/storage";

/**
 * Copies text to clipboard
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Opens a share URL in a small centered popup.
 */
function openPopup(url: string): void {
  const w = 640;
  const h = 720;
  const top = window.top ? (window.top.outerHeight - h) / 2 : 100;
  const left = window.top ? (window.top.outerWidth - w) / 2 : 100;
  window.open(url, "_blank", `noopener,noreferrer,width=${w},height=${h},left=${left},top=${top}`);
}

/**
 * Builds a share caption in English.
 * We share top score from username
 */
function buildShareText(params: { playerName: string; score: number; shareUrl: string }): string {
  return `${params.playerName} scored ${params.score} points in The Temple of the Five! Can you beat that? Play here: ${params.shareUrl}`;
}

/**
 * Returns a share caption for the CURRENT player.
 * - If player has a highscore entry: share their best score
 * - If player exists but has no score yet: share the game link
 * - If no username: fallback to Top #1 (or just share the game link)
 */
function getCurrentPlayerShareText(shareUrl: string): string {
  const highscores = getHighscores();

  // Get current player name from shared storage.ts
  const currentName = getUserName();

  // If we don't know who the player is, fallback to Top #1 (or just the link)
  if (!currentName) {
    if (highscores.length === 0) return `Can you beat The Temple of the Five? Play here: ${shareUrl}`;
    const top = highscores[0];
    return buildShareText({ playerName: top.name, score: top.score, shareUrl });
  }

  const normalizedCurrent = currentName.trim().toLowerCase();

  // Find current player's entry (best only, because storage returns normalized list)
  const mine = highscores.find((h) => h.name.trim().toLowerCase() === normalizedCurrent);

  // If player has not placed any score yet, still allow sharing the game link
  if (!mine) {
    return `${currentName} is taking on The Temple of the Five. Try it here: ${shareUrl}`;
  }

  // Share current player's best score
  return buildShareText({
    playerName: mine.name,
    score: mine.score,
    shareUrl,
  });
}

/**
 * Run Share modal UI
 * Safe to call multiple times
 */
export function initHighscoreShare(config: { shareUrl: string }): void {
  // Grab elements 
  const shareBtn = document.querySelector<HTMLButtonElement>("#shareResultBtn");
  const modal = document.querySelector<HTMLElement>("#shareModal");
  const closeBtn = document.querySelector<HTMLButtonElement>("#shareModalClose");

  const preview = document.querySelector<HTMLElement>("#sharePreview");
  const status = document.querySelector<HTMLElement>("#shareStatus");

  const copyBtn = document.querySelector<HTMLButtonElement>("#shareCopyBtn");
  const fbBtn = document.querySelector<HTMLButtonElement>("#shareFacebookBtn");
  const liBtn = document.querySelector<HTMLButtonElement>("#shareLinkedInBtn");

  // Guard: if anything is missing, do nothing
  if (
    !shareBtn ||
    !modal ||
    !closeBtn ||
    !preview ||
    !status ||
    !copyBtn ||
    !fbBtn ||
    !liBtn
  ) {
    return;
  }

  // Create a non-null "elements bundle" cause many red lines before =(
  const el = {
    shareBtn,
    modal,
    closeBtn,
    preview,
    status,
    copyBtn,
    fbBtn,
    liBtn,
  };

  // Prevent double-binding if init is called multiple times
  if (el.shareBtn.dataset.bound === "true") return;
  el.shareBtn.dataset.bound = "true";

  let currentShareText = "";

  function setStatus(msg: string): void {
    el.status.textContent = msg;
  }

  function refreshText(): void {
    currentShareText = getCurrentPlayerShareText(config.shareUrl);
    el.preview.textContent = currentShareText;
  }

  function openModal(): void {
    el.modal.classList.remove("hidden");
    el.closeBtn.focus();
  }

  function closeModal(): void {
    el.modal.classList.add("hidden");
    setStatus("");
    el.shareBtn.focus();
  }

  // Open modal
  el.shareBtn.addEventListener("click", () => {
    refreshText();
    openModal();
  });

  // Close modal
  el.closeBtn.addEventListener("click", closeModal);

  // Click outside the plate closes the modal, nice UX
  el.modal.addEventListener("click", (e) => {
    if (e.target === el.modal) closeModal();
  });

  // Escape closes the modal
  window.addEventListener("keydown", (e) => {
    if (!el.modal.classList.contains("hidden") && e.key === "Escape") closeModal();
  });

  // Copy caption (Good ux for some platforms)
  el.copyBtn.addEventListener("click", async () => {
    const ok = await copyToClipboard(currentShareText);
    setStatus(ok ? "Copied! Paste it on Instagram / anywhere." : "Could not copy");
  });

  // Facebook share
  el.fbBtn.addEventListener("click", () => {
    const u = encodeURIComponent(config.shareUrl);
    const quote = encodeURIComponent(currentShareText);
    openPopup(`https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${quote}`);
    setStatus("Opened Facebook share.");
  });

  // LinkedIn share
  el.liBtn.addEventListener("click", () => {
    const u = encodeURIComponent(config.shareUrl);
    openPopup(`https://www.linkedin.com/sharing/share-offsite/?url=${u}`);
    setStatus("Opened LinkedIn share.");
  });
}