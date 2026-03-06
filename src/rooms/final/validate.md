# Validering/final rummet

Användaren ska ha med sig totalt 5 artifakter från alla rum den varit i (man kan få antingen en rätt eller fel artifakt i varje rum). Vilket innebär att användaren inte vet om artifakterna kommer godkännas. De 5 artifakterna visas i ryggsäcken, men de ska importeras och ligga i rummet så användaren kan "drag & drop" till rätt plats. När alla ligger på plats ska rummet valideras antingen automatiskt eller vid knapptryck. Om det lyckas gå vidare till highscore boarden, om inte visas gameover och man kan göra om de som gick snett.

## Psuedokod

- Skickas från vattenrummet, timern startar och tickar ned.
Användaren har 5 artifakter som ska drag and drop till respektive rum.
- När artifakterna är på plats ska de vid automatiskt eller vid knapptryck valideras.
- Om det är rätt artifakter godkänns rummet och man kommer till highscore rummet
- Om det är fel artifakter nekas rummet och man kommer till gameover rummet och kan spela om de rum som gav fel artifakt


# Validate Room -- Flow & Pseudocode (Summary)

## Goal

The Validate Room is the final puzzle that determines whether the
player: - Wins the game (`gameWin`) - Or fails and goes to `gameOver`

The player must place **five collected artifacts** in the correct order.

------------------------------------------------------------------------

# Data Sources

## From `storage.ts`

Use:

-   `getRoomResults()`

This returns the current run state.

We read artifact results from:

    state.wood.artifact
    state.fire.artifact
    state.earth.artifact
    state.metal.artifact
    state.water.artifact

Artifact values can be:

    "true"
    "false"
    null

------------------------------------------------------------------------

## From `artifacts.ts`

Use:

    getArtifactIcon(roomId, kind)

Purpose:

Convert a room + artifact type into the correct icon path.

Example:

    getArtifactIcon("wood", "true")

------------------------------------------------------------------------

# Validate Room State

The room maintains three main pieces of state.

## Artifact Pool

Built from player progress.

Structure concept:

    artifactPool = [
      { roomId, kind, icon },
      { roomId, kind, icon },
      { roomId, kind, icon },
      { roomId, kind, icon },
      { roomId, kind, icon }
    ]

One artifact per elemental room.

------------------------------------------------------------------------

## Slot Selections

Represents what the player placed in each slot.

Example structure:

    slotSelections = [null, null, null, null, null]

After player interaction:

    slotSelections = [2,0,4,1,3]

Meaning:

    slot 0 shows artifactPool[2]
    slot 1 shows artifactPool[0]
    slot 2 shows artifactPool[4]
    slot 3 shows artifactPool[1]
    slot 4 shows artifactPool[3]

Artifacts **may only appear once**.

------------------------------------------------------------------------

## Active Slot

Tracks which slot is currently focused.

    activeSlotIndex = 0

------------------------------------------------------------------------

# Controls

Keyboard interaction:

    ArrowLeft  -> move focus to previous slot
    ArrowRight -> move focus to next slot

    ArrowUp    -> change artifact in current slot (previous option)
    ArrowDown  -> change artifact in current slot (next option)

Artifacts already used in another slot **cannot be selected again**.

------------------------------------------------------------------------

# Initialization Flow

When entering the Validate Room:

    enter validate room
        -> getRoomResults()
        -> build artifactPool from storage
        -> reset slotSelections to [null x5]
        -> activeSlotIndex = 0
        -> render empty slots
        -> disable validate button

------------------------------------------------------------------------

# Artifact Pool Builder

Pseudo flow:

    function buildCollectedArtifacts:

        state = getRoomResults()

        rooms = [wood, fire, earth, metal, water]

        for each room:
            kind = state[room].artifact

            if kind is null:
                continue

            icon = getArtifactIcon(room, kind)

            add to artifactPool:
                {roomId, kind, icon}

------------------------------------------------------------------------

# Slot Interaction Logic

## Changing Artifact (Up / Down)

    cycleArtifact(slotIndex, direction):

        availableArtifacts =
            all artifacts not already used in other slots

        if slot empty:
            choose first available artifact

        else:
            move to next/previous artifact in available list

        update slotSelections
        re-render slots

------------------------------------------------------------------------

## Moving Between Slots (Left / Right)

    moveSlotFocus(direction):

        if direction == right:
            activeSlotIndex +1

        if direction == left:
            activeSlotIndex -1

        clamp between 0 and 4

        update focus UI

------------------------------------------------------------------------

# Validate Button Logic

The button becomes active when:

    every slotSelections entry != null

Pseudo:

    if all slots filled:
        enable validate button
    else:
        disable validate button

------------------------------------------------------------------------

# Validate Action

When the player presses **Validate**:

    selectedArtifacts =
        artifactPool mapped using slotSelections order

------------------------------------------------------------------------

## Step 1 -- Check Order

Correct order:

    [wood, fire, earth, metal, water]

Pseudo:

    for each slot index:
        if selectedArtifacts[index].roomId != correctOrder[index]:
            show "Wrong order, try again"
            stop validation

------------------------------------------------------------------------

## Step 2 -- Check Artifact Quality

If order is correct:

    if every artifact.kind == "true":
            go to gameWin
    else:
            go to gameOver

------------------------------------------------------------------------

# Result Navigation

    Correct order + all true  -> gameWin

    Correct order + any false -> gameOver

    Wrong order               -> show error message
                                  stay in validate room

------------------------------------------------------------------------

# High-Level System Flow

    enter validate room
        ↓
    read storage (getRoomResults)
        ↓
    build artifactPool
        ↓
    player selects artifacts in slots
        ↓
    validate button activates when slots filled
        ↓
    player presses validate
        ↓
    check order
        ↓
    if wrong -> retry
        ↓
    if correct -> check artifact truth
        ↓
    true → gameWin
    false → gameOver

------------------------------------------------------------------------

# Responsibility Overview

  System          Responsibility
  --------------- --------------------------------
  storage.ts      Save / load game state
  artifacts.ts    Map artifact icons
  validate room   Slot puzzle + validation logic
