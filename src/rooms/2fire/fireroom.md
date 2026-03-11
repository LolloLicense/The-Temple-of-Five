# Fire Room

The **Fire Room** is the second chamber in the temple escape sequence.

The puzzle is based on the idea that **fire must be awakened, controlled and balanced**.  
Players interact with elemental symbols and must enter them in the correct order to progress through the room according to the word play (riddle).

---

## Gameplay

Players select elements from a keypad and fill slots in a sequence.

Elements used in the puzzle:

| Key | Element |
|-----|--------|
| A | Air |
| T | Timber |
| F | Flame |
| E | Ember |
| S | Stone |
| W | Water |

When the final slot is filled, the sequence is automatically validated.

- Correct sequence → progress to next level  
- Incorrect sequence → slots reset and mistakes increase

---

## Levels

The puzzle consists of **four levels**.

Level 1  

Timber → Flame → Stone → Air


Level 2 *(prefilled Flame)*  

Water → Stone


Level 3 *(prefilled Stone)*  

Timber → Air → Flame


Level 4 *(prefilled Flame)*  

Timber → Air → Stone → Ember


Each level represents a different stage in the lifecycle of fire.

---

## Controls

The puzzle supports **keyboard and mouse input**.

Keyboard:

| Key | Action |
|-----|--------|
| ← → | Move between keys |
| Enter / Space | Place element |
| Backspace | Remove element |
| A T F E S W | Direct input |

---

## Room Result

When the room finishes, the result is saved:

- `status` (completed / failed)
- `artifact`
- `mistakes`
- `roomTimeSec`

This data is used by the **progress bar, validation room and highscore system**.

---

## Summary

The Fire Room is a **sequence-based puzzle** where players must understand how different elements interact to create a balanced fire.