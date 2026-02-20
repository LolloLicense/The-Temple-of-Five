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

export function aboutTabs(): void {
  // Tabs
  const tabStory = document.querySelector<HTMLButtonElement>("#tabStory");
  const tabFeatures = document.querySelector<HTMLButtonElement>("#tabFeatures");
  const tabHowto = document.querySelector<HTMLButtonElement>("#tabHowto");
  const tabDev = document.querySelector<HTMLButtonElement>("#tabDev");

  //Panels
  const panelStory = document.querySelector<HTMLElement>("#panelStory");
  const panelFeatures = document.querySelector<HTMLElement>("#panelFeatures");
  const panelHowto = document.querySelector<HTMLElement>("#panelHowto");
  const panelDev = document.querySelector<HTMLElement>("#panelDev");

  // making sure it extist
  if (
    !tabStory ||
    !tabFeatures ||
    !tabHowto ||
    !tabDev ||
    !panelStory ||
    !panelFeatures ||
    !panelHowto ||
    !panelDev
  ) {
    return;
  }

  const tabs = [tabStory, tabFeatures, tabHowto, tabDev];
  const panels = [panelStory, panelFeatures, panelHowto, panelDev];

  // Active tab  shows active panel

  function setActiveTab(activeTab: HTMLButtonElement): void {
    tabs.forEach((tab) => {
      const isActive = tab === activeTab;
      tab.classList.toggle("currentTab", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      //
      tab.tabIndex = isActive ? 0 : -1;
    });

    panels.forEach((panel) => {
      panel.hidden = panel.id !== activeTab.getAttribute("aria-controls");
    });
  }

  // switch tab on click
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setActiveTab(tab);
      // keypad use a11y
      tab.focus();
    });
    // let keybord arrow navigate change of tab not normal tab key
    tab.addEventListener("keydown", (e) => {
      // finds out what tab in on
      const currentIndex = tabs.indexOf(tab);
      // start value
      let nextIndex = currentIndex;
      //checking what key was pressed
      if (e.key === "ArrowRight") {
        // one step forward and looping "around" whit .length
        nextIndex = (currentIndex + 1) % tabs.length;
      } else if (e.key === "ArrowLeft") {
        // one step back and looping "around" whit .length
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      } else {
        return;
      }

      // preventing scroll mode for arrow keys
      e.preventDefault();
      // change the tab and panel visually
      const nextTab = tabs[nextIndex];
      setActiveTab(nextTab);
      // moving focus to right tab
      nextTab.focus();
    });
  });

  //
  const selectedTab =
    tabs.find((t) => t.getAttribute("aria-selected") === "true") ?? tabStory;

  setActiveTab(selectedTab);
}
