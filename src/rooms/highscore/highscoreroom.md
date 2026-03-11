# Highscore System

This folder contains the full highscore flow for the game.

The purpose of this system is to:

- calculate the player's final score
- save that score to the leaderboard
- render the leaderboard in the highscore room
- support sharing and reset tools for highscores

The score system is based on saved game data in LocalStorage, such as:

- room status
- artifacts
- mistakes
- room time
- total run time

---

## Folder overview

This folder currently contains:

- `calculateFinalScore.ts`
- `getStoredTotalTimeSec.ts`
- `highscore.ts`
- `highscoreSecret.ts`
- `highscoreShare.ts`
- `highscoreStorage.ts`
- `renderHighscoreList.ts`
- `saveFinalScoreToStorage.ts`

There is also styling and documentation:

- `_highscore.scss`
- `highscoreroom.md`

---

## Highscore flow

The intended flow is:

1. The player finishes the game
2. The final score is calculated from saved LocalStorage data
3. The final score is pushed into the leaderboard
4. The player can open the highscore room
5. The leaderboard is rendered on screen

---

## Score System

The game calculates a final score based on the player's performance in each room.

The score system rewards:

- completing rooms
- solving puzzles quickly
- making few mistakes

It also adds bonuses for fast puzzle completion and a fast total run.

The final score is calculated **only when the player wins the game**.

---

## Score calculation overview

Each elemental room contributes to the final score.

Rooms included in the score:

- Wood
- Fire
- Earth
- Metal
- Water

The **final validation room is not scored**.

---

## Base score

Every completed room starts with a fixed base score.


Base score per room = 1500

---

## Time penalty

The longer the player spends in a room, the more points are deducted.


Time penalty = 1 point per second


Example:


Room time: 200 seconds
Penalty: -200 points


---

## Mistake penalty

Each mistake made in the room reduces the score.


Mistake penalty = 15 points per mistake


Example:


Mistakes: 4
Penalty: -60 points


---

## Room speed bonus

Each room has a time threshold.

If the player solves the room faster than the threshold, they receive a bonus.

Room speed bonus = +300 points

## Total run bonus

A bonus is awarded based on the total run time.

| Total Time | Bonus |
|------------|------|
| under 19 minutes | +900 |
| under 22 minutes | +600 |
| under 25 minutes | +300 |

If the run takes longer than 25 minutes, no run bonus is given.

---

## Minimum score

Room score can never go below zero.

The total score also cannot be negative.

---

## Example calculation

Example player performance:


Room: Fire
Base score: 1500
Time: 200 seconds → -200
Mistakes: 3 → -45
Speed bonus: +0

Fire room score = 1255

Final score = sum(room scores) + run bonus


---

## When score is calculated

Score is calculated when the player reaches the **game win room**.

Flow:


player wins
↓
calculateFinalScoreFromStorage()
↓
pushHighscore()
↓
resetRunKeepHighscores()


The final score is then saved to the leaderboard.

## Highscore Reset

The highscore reset feature is a hidden developer tool used to clear the leaderboard during testing.

The reset button is not visible by default.  
It can only be revealed by typing a secret code.

This prevents normal players from accidentally resetting the leaderboard.

---

### How it works

1. The system listens for keyboard input globally.
2. When the secret code is detected, a hidden reset button becomes visible.
3. Clicking the button clears all stored highscores.
4. The button hides itself again after the reset.

---

### Secret code 
<b>resethigh</b> - Typing this sequence anywhere in the game (outside input fields) will reveal the reset button.


