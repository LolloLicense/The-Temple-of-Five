
export function initAboutDialog(): void {
    const openBtn = document.querySelector<HTMLButtonElement>("#aboutBtn");
    const dialog = document.querySelector<HTMLDialogElement>("#aboutDialog");
    const closeBtn = document.querySelector<HTMLButtonElement>("#closeAbout");

    if (!openBtn || !dialog || !closeBtn) return;

    openBtn.addEventListener("click", () => dialog.showModal());
    closeBtn.addEventListener("click", () => dialog.close());

    dialog.addEventListener("click", (e) => {
        if (e.target === dialog) dialog.close();
    });
}