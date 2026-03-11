# Final Room

The Final Room is a logic‑based placement challenge where the player must arrange the five collected artifacts from the elemental chambers in the correct order. Each artifact reflects the player’s performance in its room and can be either correct or incorrect. Using keyboard navigation, the player places the artifacts into five slots and validates the arrangement. A perfect order with all true artifacts leads to victory, while any mistake sends the player to the Game Over room to replay failed chambers.

## Short description of what happens:

- Enter the final chamber with five artifacts collected during the run.
- Each artifact represents one elemental room and can be true or false.
- Place the artifacts into five slots in the correct elemental order.
- Use keyboard controls:
  - Left/Right arrows: move between slots
  - Up/Down arrows: cycle through available artifacts
- Artifacts cannot be used more than once.
- When all slots are filled, the Validate button becomes active.
- Validation checks:
  - Are the artifacts placed in the correct order?
  - Are all artifacts true?
- Correct order + all true = Win (Highscore room)
- Correct order + any false = Game Over (replay failed rooms)
- Wrong order → Stay in the Final Room and try again

## Pseudocode to break down the room into functions

### When the Final Room starts:
- Start the room timer.
- Load stored results using `getRoomResults()`.
- Build an artifact pool from the five elemental rooms.
- Reset:
  - `slotSelections = [null x5]`
  - `activeSlotIndex = 0`
- Render empty slots and disable the Validate button.

### While the player interacts:
- Left arrow, move active slot left  
- Right arrow, move active slot right  
- Up arrow, select previous available artifact  
- Down arrow, select next available artifact  
- Prevent selecting an artifact already used in another slot.

### When all slots are filled:
- Enable the Validate button.

### When the player presses Validate:
- Build the selected artifact sequence from `slotSelections`.

#### If the order is wrong:
- Show feedback: “Wrong order, try again.”
- Stay in the Final Room.

#### If the order is correct but any artifact is false:
- Go to Game Over room.
- Mark failed rooms for replay.

#### If the order is correct and all artifacts are true:
- Proceed to the Highscore room.
- Display: “Final chamber complete.”
