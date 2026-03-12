# EarthRoom

The earth chamber contains a classic 15 way puzzle, Were all tiles must be placed in order in order to complete the chamber.
Only one slate can be moved at a time and the animation must finish before another move can be started.

The slates can be activated either by clicking or by using the arrow keys.
Which then "clicks" on the slate that are located at the corresponding direction of the empty slot.

![Earth chamber](/dokumentation/screenshots/EarthRoom.png)

### When the Earth Room starts:

First the room is reset in case it is being replayed.

A visual grid is created by randomly picking the numbers 1-15 from an array.
Each created slate is also assigned a corresponding coordinate added as
a class that is placed within a CSS grid based on that coordinate.

Event handlers for "click" are also added to each slate.

### When the player enters input:

When a slate is clicked the clicked slates coordinates are matched versus the empty slots coordinates.
If the clicked slate is adjacent to the empty slot the slate is set to move.

When the slate is moved one of 2 different "stone sliding" audio file is played based on a random number
getBoundingClientRect is then used to get the location both of the slate to be moved and the target empty slot
Then the animation is then calculated by comparing the difference of the left or top locations to the corresponding of the empty slot.

The clicked slate then has CSS transition added for transform and translateX
or translateY is used to move the slate depending on how the locations differ.

Once the animation comes to and end the transition is removed again to prevent the animation from animating backward.
The slates coordinates are then swapped after the animation has concluded which also moves the slate in the CSS grid.

For keyboard inputs their are further steps where the keyboard input is checked on keydown.
If the key that is pressed is an arrow key the arrow direction is converted into
a coordinate direction that is then compared to the empty slate coordinate.

If there is a slate located at the empty slate coordinate + the coordinate of the arrow input
a simulated click is then done on that slate witch then leads to the normal click logic seen above.

#### If all 15 slates are correctly placed:

The game ends with the empty slate turning into lava and then cooling with the correct sign being displayed.
The results of the room is then saved to local storage.
And the transition to the next room is initiated

### When the timer runs out:

The game end with the empty slate turning into lava and then cooling with the incorrect sign being displayed.
The results of the room is then saved to local storage.

### Replay mode logic:

- If the room was replayed from Game Over:
- return to the Game Over room after success or failure
- instead of continuing the next room

### Cleanup:

- Clear the time-up watcher interval.
- Remove keybindings for the room
- Set the room as inactive

## A11Y

The Earth chamber was reviewed with chrome Lighthouse snapshot.
Lighthouse reported a full accessibility result of 20/20 checks passed, alongside 3/4 Best Practices and 5/5 SEO.

![Lighthouse](/dokumentation/screenshots/LighthouseSnapEarth.png.png)
