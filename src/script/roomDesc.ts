
export interface IRoomDesc {
    text: string;
    falseSign?: string;
    trueSign?: string;
  }
  
  /**
   * Renderar desc-blocke in a room 
   * - leftIcon
   * - descText
   * - rightIcon
   */
  export function renderRoomDesc(sectionEl: HTMLElement, desc: IRoomDesc): void {
    // Find the wrapper i just this room section 
    const roomDescEl = sectionEl.querySelector<HTMLDivElement>("#roomDesc");
    if (!roomDescEl) throw new Error("Missing #roomDesc in this room section");
  
    // Clear so no duplicates
    roomDescEl.replaceChildren();
  
    // LEFT icon if exist
    if (desc.falseSign) {
      const leftIcon = document.createElement("img");
      leftIcon.className = "leftIcon"; 
      leftIcon.src = desc.falseSign;
      leftIcon.alt = "";
      roomDescEl.append(leftIcon);
    }
  
    // Text
    const p = document.createElement("p");
    p.className = "descText"; 
    p.textContent = desc.text;
    roomDescEl.append(p);
  
    // RIGHT icon (if exist
    if (desc.trueSign) {
      const rightIcon = document.createElement("img");
      rightIcon.className = "rightIcon"; 
      rightIcon.src = desc.trueSign;
      rightIcon.alt = "";
      roomDescEl.append(rightIcon);
    }
  }