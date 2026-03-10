# 💧 Water Room: The Chamber of Flow

In the **Water Room**, players are challenged with a dynamic pipe puzzle designed to test both logic and speed. The objective is to rotate pipes on a **5x5 grid** to create a continuous path for water to flow from the **Source** (top-left) to the **Sacred Vessel** (bottom-right).

> [!IMPORTANT]  
> The puzzle is algorithmically generated for every playthrough, ensuring a unique experience every time you enter the chamber.

---

## 🎮 Gameplay Mechanics

### **The Objective**

- **Connect the Flow**: Rotate individual pipe segments to bridge the gap between the start and end points.
- **Filling the Vessel**: Once a valid path is formed, the water flows, the vessel is filled, and the room is cleared.

### **Controls & Interaction**

The puzzle is fully optimized for both mouse and keyboard navigation to ensure maximum accessibility.

| Action            | Mouse / Touch | Keyboard           |
| :---------------- | :------------ | :----------------- |
| **Rotate Pipe**   | Left Click    | `Enter` or `Space` |
| **Navigate Grid** | Click Cell    | `Arrow Keys`       |
| **Reset Puzzle**  | Reset Button  | `R`                |

### **Scoring & Time Constraints**

- **Dynamic Scoring**: You start with a maximum of **1,000 points**.
- **Efficiency Bonus**: Your score decreases by **3 points every second**, rewarding quick thinking.
- **Impatient Temple**: If the puzzle is not solved within **60 seconds**, a warning appears as the temple grows impatient.
- **Failure Condition**: If the global timer expires, the room is marked as failed, and you must proceed without the artifact.

---

## ✨ Technical Features

- **Visual Feedback**: Correctly connected pipes glow with an **Active Flow** effect (`#85c1e9`) using CSS transitions.
- **Atmospheric Design**: The room features thematic background music (`bgm_water`) and procedurally generated rising bubbles for total immersion.
- **Responsive Layout**: The grid scales dynamically from desktop sizes down to **28px cells** on mobile devices to ensure playability on all screens.
- **Accessibility**: Full support for **ARIA labels** and `aria-live` announcements provides real-time updates for screen reader users.

---

## 💡 Archeologist's Tips

- **Identify Fixed Points**: The pipes at the **Source** and the **Vessel** are fixed and cannot be rotated; use them as your anchors to start the path.
- **Track the Glow**: Look for the `active-flow` highlight; it tells you exactly how far the water currently reaches through your network.
- **Strategic Resets**: If the grid becomes too complex, use the **Reset** button to scramble the pipes and generate a fresh layout.

---

_This documentation is based on the logic found in `room5water.ts` and styling in `_room5water.scss`._
