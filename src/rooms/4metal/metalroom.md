# Metalroom

The Metalroom is a memory challenge inspired by Simon Says, where the player must observe and reproduce a sequence of color signals. The room introduces time pressure, increasing difficulty across three levels, and strict input control to ensure the player cannot interact until each sequence has fully played. Using keyboard navigation, the player selects colors in the correct order to progress, with mistakes tracked and immediate feedback provided. Completing all levels successfully unlocks the next chamber.

A11y - Firefox

![Firefox](/dokumentation/screenshots/firefoxSnapMetal.png) 

Lighthouse - Chrome 

![Lighthouse](/dokumentation/screenshots/LighthouseSnapMetal.png) 

## Short description of what happens:

- Read the room description under a 10 second time limit.
- Watch a blinking sequence of colors.
- Reproduce the sequence by filling the slots with colors in the same order.
- Progress through 3 levels, each with it's own pattern and difficulty.
- Track progress through a level indicator and a mistake counter.
- Use keyboard controls:
  - Left/Right arrows: move between slots
  - Up/Down arrows: change the color in the active slot
  - Enter: validate the chosen sequence


## Pseudocode to break down the room into functions

### When the Metal Room starts:
- Start the room timer.
- The color signal plays sequence 1 of 3.

### While the sequence is playing (any level):
- Player input is locked.
- The signal element:
  - Shows one color  
  - Pauses  
  - Shows the next color  
  - Continues until the full sequence is displayed.

### When the sequence is finished:
- Player input becomes unlocked.
- Controls:
  - Left arrow, move active slot left
  - Right arrow, move active slot right
  - Up arrow, change active slot to the next color
  - Down arrow, change active slot to the previous color
  - Enter, validate the chosen sequence

### When the player presses Enter:
- Compare the player’s chosen colors to the correct sequence for the current level.

#### If the sequence is incorrect:
- Increase mistake counter by 1.
- Display feedback: "Incorrect! Try again."
- Reset all slots.
- Replay the same sequence.

#### If the sequence is correct:
- Display feedback: "Correct!"
- Move to the next level.

### When the final level is completed correctly:
- Display the message: "Metal chamber complete"