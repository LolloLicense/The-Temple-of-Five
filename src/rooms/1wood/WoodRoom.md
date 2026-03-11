# Woodroom

The chamber is a number-sequence challenge built around the Fibonacci sequence, chosen because of its strong connection to growth patterns in nature. Since the Wood chamber represents growth, life, and organic balance, the Fibonacci sequence supports the room’s theme in both concept and gameplay.


![Wood chamber](/dokumentation/screenshots/WoodRoom.png)

The player can find a clue in the room description that hints at how the sequence works 

    "Start from zero, follow the pattern of growth, and remember that each new number is built from the previous two. To restore balance in the chamber, the player must enter the correct numbers in the right order"

The room is built around three levels, each containing six Fibonacci numbers. Rather than increasing through sudden difficulty spikes, the challenge grows through pattern recognition, memory, and calculation. As the numbers become larger, the player must keep track of previous values in order to work out the next one in the sequence. The player uses an on-screen keypad with both mouse and keyboard support, while mistakes are tracked and shown through the in-room progress bar. A room timer adds pressure, and if time runs out the chamber is failed and a false artifact is stored. Completing all levels successfully unlocks the next chamber.

## Short description of what happens:

- Enter the Wood chamber and read the room description.
- A room timer starts immediately.
- Use the keypad to fill 6 slots with the correct Fibonacci numbers.
- Complete 3 levels, each with a longer and more difficult Fibonacci sequence.
- Track progress through:
  - a level indicator
  - a mistake counter
  - a balance bar
- Use keyboard controls:
  - Left/Right arrows: move between keypad buttons
  - Enter / Space: press the focused keypad button
  - Backspace button: remove the latest input
- If the timer runs out, the room is failed and progression continues with a false artifact.
- If all levels are completed, the room is cleared and progression continues with a true artifact.

## Pseudocode to break down the room into functions

### When the Wood Room starts:
- Reset the wood room result.
- Get the room section and required DOM elements.
- Clean up old timers and timeouts if the room was entered before.
- Set the room background image.
- Show the room using the transition helper.
- Start the room timer.
- Start a watcher that checks if time has run out.
- Play background music.
- Show the game header.
- Render the room description.
- Create decorative firefly particles if they do not already exist.
- Set up keypad input and room state.

### While the room is active:
- The player enters numbers into the active slot.
- Each slot only accepts the correct number of digits for that Fibonacci number.
- After a slot is filled:
  - move to the next slot
  - or validate the full level if it was the last slot
- The in-room-progressbar updates continuously:
  - current level
  - number of mistakes
  - balance bar width

### When the player enters input:
- Add the digit to the current active slot.
- Prevent input if:
  - the room is transitioning
  - the room is no longer the visible page
  - the slot already contains the maximum number of digits
- If the current slot becomes full:
  - move to the next slot
  - or validate the level

### When the player uses backspacebutton:
- Remove the last digit from the current slot.
- If the current slot is empty:
  - move back to the previous slot
  - remove the last digit there instead

### When a level is validated:
- Compare the entered slot values to the expected Fibonacci sequence.

#### If the sequence is incorrect:
- Increase mistake counter by 1.
- Reset all slot input for the level.
- Update the UI.

#### If the sequence is correct:
- If more levels remain:
  - pause briefly
  - move to the next level
  - reset the input slots
- If it was the final level:
  - mark the room as completed
  - store a true artifact
  - stop the room timer
  - update the progress bar
  - show the message: "Well done — next chamber awaits"
  - continue to the Fire chamber

### When the timer runs out:
- Mark the room as failed.
- Store a false artifact.
- Stop the room timer.
- Update the progress bar.
- Show the message: "Time's up — next chamber awaits"
- Continue to the Fire chamber

### Replay mode logic:
- If the room was replayed from Game Over:
  - return to the Game Over room after success or failure
  - instead of continuing the normal room flow

### Cleanup:
- Clear the time-up watcher interval.
- Clear completion timeout.
- Clear fail timeout.
- Prevent old async logic from continuing if the room is re-entered.


## A11Y

The Wood room was reviewed with Lighthouse and Firefox Accessibility Inspector. Lighthouse reported a full accessibility result of 21/21 checks passed, alongside 4/4 Best Practices and 5/5 SEO.

The keypad interaction is built with native `<button>` elements, making the controls keyboard reachable and usable. Focus can move between the keypad buttons, and the room includes visible focus states and labeled UI elements.

A remaining note from Firefox Accessibility Inspector concerns the keypad wrapper with `role="group"`. Since the wrapper itself is not intended to be interactive, while the child buttons are fully interactive and focusable, this warning is documented as a review note rather than a confirmed blocking issue.


![Lighthouse](/dokumentation/screenshots/LighthouseSnapWood.png)
